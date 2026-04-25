// ============================================================
// NEXBOOK - Cloud Functions
// 1. onAppointmentCreated  → email de confirmação ao cliente
// 2. sendDailyReminders    → email de lembrete 24h antes (8h BRT)
// ============================================================

const { onDocumentCreated } = require("firebase-functions/v2/firestore");
const { onSchedule }        = require("firebase-functions/v2/scheduler");
const { defineSecret }      = require("firebase-functions/params");
const admin                 = require("firebase-admin");
const sgMail                = require("@sendgrid/mail");

admin.initializeApp();
const db = admin.firestore();

// Configuração da chave API do SendGrid
const SENDGRID_API_KEY = defineSecret("SENDGRID_API_KEY");

// Helpers
const MONTH_NAMES = ["Janeiro","Fevereiro","Marco","Abril","Maio","Junho","Julho","Agosto","Setembro","Outubro","Novembro","Dezembro"];
const DAY_NAMES   = ["Domingo","Segunda","Terca","Quarta","Quinta","Sexta","Sabado"];

function formatDate(str) {
    if (!str) return "";
    const [y, m, d] = str.split("-").map(Number);
    const date = new Date(y, m - 1, d);
    return DAY_NAMES[date.getDay()] + ", " + d + " de " + MONTH_NAMES[m - 1] + " de " + y;
}

function tomorrowStr() {
    const d = new Date();
    d.setDate(d.getDate() + 1);
    return d.getFullYear() + "-" + String(d.getMonth() + 1).padStart(2, "0") + "-" + String(d.getDate()).padStart(2, "0");
}

// Template confirmacao
function confirmationHtml(data) {
    const { clientName, businessName, professionalName, serviceName, date, time, appointmentId } = data;
    const confirmUrl = "https://nexbook-14d69.web.app/confirmar.html?id=" + appointmentId;
    const dateLabel  = formatDate(date);
    return `<!DOCTYPE html><html lang="pt-BR"><head><meta charset="UTF-8"><style>
body{margin:0;padding:0;background:#f1f5f9;font-family:"Segoe UI",sans-serif}
.wrap{max-width:560px;margin:32px auto;background:#fff;border-radius:20px;overflow:hidden;box-shadow:0 4px 24px rgba(79,70,229,.1)}
.header{background:linear-gradient(135deg,#4f46e5,#7c3aed);padding:32px;text-align:center;color:#fff}
.logo{font-size:36px;margin-bottom:8px}
.brand{font-size:22px;font-weight:800}
.badge{display:inline-block;background:rgba(255,255,255,.2);border-radius:50px;padding:6px 18px;font-size:13px;margin-top:10px}
.body{padding:32px}
h2{margin:0 0 6px;font-size:20px;color:#0f172a}
.sub{color:#64748b;font-size:14px;margin-bottom:24px}
.info-box{background:#f8fafc;border:1px solid #e2e8f0;border-radius:14px;padding:20px;margin-bottom:24px}
.info-row{display:flex;align-items:center;gap:12px;padding:8px 0;border-bottom:1px solid #f1f5f9;font-size:14px}
.info-row:last-child{border-bottom:none}
.info-icon{width:32px;height:32px;border-radius:8px;background:linear-gradient(135deg,#4f46e5,#7c3aed);color:#fff;font-size:13px;text-align:center;line-height:32px;flex-shrink:0}
.info-label{color:#94a3b8;font-size:12px}
.info-value{color:#0f172a;font-weight:600}
.btn{display:block;width:fit-content;margin:0 auto;padding:16px 32px;background:linear-gradient(135deg,#4f46e5,#7c3aed);color:#fff;text-decoration:none;border-radius:14px;font-size:15px;font-weight:700;text-align:center}
.footer{text-align:center;padding:20px;color:#94a3b8;font-size:12px;background:#f8fafc}
</style></head><body>
<div class="wrap">
<div class="header"><div class="logo">📅</div><div class="brand">NEXBOOK</div><div class="badge">Agendamento Confirmado</div></div>
<div class="body">
<h2>Ola, ${clientName}!</h2>
<p class="sub">Seu agendamento foi realizado com sucesso:</p>
<div class="info-box">
<div class="info-row"><div class="info-icon">🏢</div><div><div class="info-label">Estabelecimento</div><div class="info-value">${businessName}</div></div></div>
<div class="info-row"><div class="info-icon">👤</div><div><div class="info-label">Profissional</div><div class="info-value">${professionalName || "-"}</div></div></div>
<div class="info-row"><div class="info-icon">💆</div><div><div class="info-label">Servico</div><div class="info-value">${serviceName || "-"}</div></div></div>
<div class="info-row"><div class="info-icon">📅</div><div><div class="info-label">Data</div><div class="info-value">${dateLabel}</div></div></div>
<div class="info-row"><div class="info-icon">🕐</div><div><div class="info-label">Horario</div><div class="info-value">${time}</div></div></div>
</div>
<a href="${confirmUrl}" class="btn">Confirmar minha presenca</a>
</div>
<div class="footer">Powered by <strong>NEXBOOK</strong></div>
</div></body></html>`;
}

// Template lembrete
function reminderHtml(data) {
    const { clientName, businessName, professionalName, serviceName, date, time, appointmentId } = data;
    const confirmUrl = "https://nexbook-14d69.web.app/confirmar.html?id=" + appointmentId;
    const dateLabel  = formatDate(date);
    return `<!DOCTYPE html><html lang="pt-BR"><head><meta charset="UTF-8"><style>
body{margin:0;padding:0;background:#f1f5f9;font-family:"Segoe UI",sans-serif}
.wrap{max-width:560px;margin:32px auto;background:#fff;border-radius:20px;overflow:hidden;box-shadow:0 4px 24px rgba(245,158,11,.1)}
.header{background:linear-gradient(135deg,#f59e0b,#d97706);padding:32px;text-align:center;color:#fff}
.logo{font-size:36px;margin-bottom:8px}
.brand{font-size:22px;font-weight:800}
.badge{display:inline-block;background:rgba(255,255,255,.2);border-radius:50px;padding:6px 18px;font-size:13px;margin-top:10px}
.body{padding:32px}
h2{margin:0 0 6px;font-size:20px;color:#0f172a}
.sub{color:#64748b;font-size:14px;margin-bottom:20px}
.highlight{background:#fef3c7;border:1px solid #f59e0b;border-radius:12px;padding:14px 20px;margin-bottom:20px;text-align:center;color:#92400e;font-weight:700;font-size:15px}
.info-box{background:#f8fafc;border:1px solid #e2e8f0;border-radius:14px;padding:20px;margin-bottom:24px}
.info-row{display:flex;align-items:center;gap:12px;padding:8px 0;border-bottom:1px solid #f1f5f9;font-size:14px}
.info-row:last-child{border-bottom:none}
.info-icon{width:32px;height:32px;border-radius:8px;background:linear-gradient(135deg,#f59e0b,#d97706);color:#fff;font-size:13px;text-align:center;line-height:32px;flex-shrink:0}
.info-label{color:#94a3b8;font-size:12px}
.info-value{color:#0f172a;font-weight:600}
.btn-confirm{display:block;width:fit-content;margin:0 auto 12px;padding:16px 32px;background:linear-gradient(135deg,#22c55e,#16a34a);color:#fff;text-decoration:none;border-radius:14px;font-size:15px;font-weight:700;text-align:center}
.btn-cancel{display:block;width:fit-content;margin:0 auto;padding:14px 32px;background:#fff;color:#dc2626;border:1.5px solid rgba(220,38,38,.3);text-decoration:none;border-radius:14px;font-size:14px;font-weight:600;text-align:center}
.footer{text-align:center;padding:20px;color:#94a3b8;font-size:12px;background:#f8fafc}
</style></head><body>
<div class="wrap">
<div class="header"><div class="logo">🗓️</div><div class="brand">NEXBOOK</div><div class="badge">Lembrete - Amanha</div></div>
<div class="body">
<h2>Ola, ${clientName}!</h2>
<p class="sub">Este e um lembrete automatico do seu agendamento de <strong>amanha</strong>.</p>
<div class="highlight">Seu agendamento e amanha as ${time}!</div>
<div class="info-box">
<div class="info-row"><div class="info-icon">🏢</div><div><div class="info-label">Estabelecimento</div><div class="info-value">${businessName}</div></div></div>
<div class="info-row"><div class="info-icon">👤</div><div><div class="info-label">Profissional</div><div class="info-value">${professionalName || "-"}</div></div></div>
<div class="info-row"><div class="info-icon">💆</div><div><div class="info-label">Servico</div><div class="info-value">${serviceName || "-"}</div></div></div>
<div class="info-row"><div class="info-icon">📅</div><div><div class="info-label">Data</div><div class="info-value">${dateLabel}</div></div></div>
<div class="info-row"><div class="info-icon">🕐</div><div><div class="info-label">Horario</div><div class="info-value">${time}</div></div></div>
</div>
<a href="${confirmUrl}" class="btn-confirm">Confirmar presenca</a>
<br>
<a href="${confirmUrl}" class="btn-cancel">Cancelar agendamento</a>
</div>
<div class="footer">Powered by <strong>NEXBOOK</strong></div>
</div></body></html>`;
}

// Cloud Function 1: Trigger ao criar agendamento
exports.onAppointmentCreated = onDocumentCreated(
    { document: "appointments/{docId}", secrets: [SENDGRID_API_KEY], region: "southamerica-east1" },
    async (event) => {
        const snap = event.data;
        if (!snap) return;
        const data = snap.data();
        const clientEmail = data.clientEmail;
        if (!clientEmail) return;

        let businessName = "NEXBOOK";
        let senderEmail  = "marcellomatosxads@gmail.com";
        try {
            const settingsDoc = await db.collection("settings").doc(data.userId).get();
            if (settingsDoc.exists) {
                const s = settingsDoc.data();
                businessName = s.companyName || businessName;
                senderEmail  = s.companyEmail || senderEmail;
            }
        } catch (_) {}

        try {
            // Tentar usar SendGrid se a chave estiver configurada
            sgMail.setApiKey(SENDGRID_API_KEY.value());
            await sgMail.send({
                to:      clientEmail,
                from:    senderEmail,
                subject: "Agendamento confirmado - " + businessName,
                html:    confirmationHtml({ clientName: data.clientName || "Cliente", businessName, professionalName: data.professionalName || "", serviceName: data.serviceName || "", date: data.date || "", time: data.time || "", appointmentId: event.params.docId }),
            });
            console.log("Confirmation email sent to " + clientEmail);
        } catch (error) {
            console.warn("SendGrid not configured, logging email details:", error.message);
            // Salvar log do email para debug (sem enviar email real)
            await db.collection("email_logs").add({
                type: "confirmation",
                to: clientEmail,
                from: senderEmail,
                subject: "Agendamento confirmado - " + businessName,
                appointmentId: event.params.docId,
                status: "not_sent",
                reason: "SendGrid API key not configured",
                timestamp: admin.firestore.FieldValue.serverTimestamp(),
                appointmentData: data
            });
            console.log("Email logged (not sent) - SendGrid not configured");
        }
    }
);

// Cloud Function 2: Lembrete diario as 8h (Brasilia)
exports.sendDailyReminders = onSchedule(
    { schedule: "0 8 * * *", timeZone: "America/Sao_Paulo", secrets: [SENDGRID_API_KEY], region: "southamerica-east1" },
    async () => {
        const tomorrow = tomorrowStr();
        console.log("Sending reminders for: " + tomorrow);

        const snap = await db.collection("appointments").where("date", "==", tomorrow).get();
        const appointments = snap.docs.map(d => ({ id: d.id, ...d.data() })).filter(a => a.status !== "cancelled" && a.clientEmail);

        if (!appointments.length) { console.log("No reminders to send."); return; }

        const userIds = [...new Set(appointments.map(a => a.userId).filter(Boolean))];
        const settingsMap = {};
        await Promise.all(userIds.map(async uid => {
            try { const doc = await db.collection("settings").doc(uid).get(); settingsMap[uid] = doc.exists ? doc.data() : {}; } catch (_) { settingsMap[uid] = {}; }
        }));

        await Promise.all(appointments.map(async apt => {
            const s = settingsMap[apt.userId] || {};
            const businessName = s.companyName || "NEXBOOK";
            const senderEmail  = s.companyEmail || "marcellomatosxads@gmail.com";
            try {
                // Tentar usar SendGrid se a chave estiver configurada
                sgMail.setApiKey(SENDGRID_API_KEY.value());
                await sgMail.send({
                    to:      apt.clientEmail,
                    from:    senderEmail,
                    subject: "Lembrete: seu agendamento e amanha - " + businessName,
                    html:    reminderHtml({ clientName: apt.clientName || "Cliente", businessName, professionalName: apt.professionalName || "", serviceName: apt.serviceName || "", date: apt.date || "", time: apt.time || "", appointmentId: apt.id }),
                });
                console.log("Reminder sent to " + apt.clientEmail);
            } catch (err) {
                console.warn("SendGrid not configured for reminder, logging:", err.message);
                // Salvar log do lembrete (sem enviar email real)
                await db.collection("email_logs").add({
                    type: "reminder",
                    to: apt.clientEmail,
                    from: senderEmail,
                    subject: "Lembrete: seu agendamento e amanha - " + businessName,
                    appointmentId: apt.id,
                    status: "not_sent",
                    reason: "SendGrid API key not configured",
                    timestamp: admin.firestore.FieldValue.serverTimestamp(),
                    appointmentData: apt
                });
                console.log("Reminder logged (not sent) - SendGrid not configured");
            }
        }));
    }
);