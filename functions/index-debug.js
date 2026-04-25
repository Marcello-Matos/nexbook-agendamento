// ============================================================
// NEXBOOK - Cloud Functions (DEBUG VERSION)
// Versão temporária para teste sem depender de Secret Manager
// ============================================================

const { onDocumentCreated } = require("firebase-functions/v2/firestore");
const { onSchedule }        = require("firebase-functions/v2/scheduler");
const admin                 = require("firebase-admin");

admin.initializeApp();
const db = admin.firestore();

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

// Template confirmação (simplificado)
function confirmationHtml(data) {
    const { clientName, businessName, professionalName, serviceName, date, time, appointmentId } = data;
    const confirmUrl = "https://nexbook-14d69.web.app/confirmar.html?id=" + appointmentId;
    const dateLabel  = formatDate(date);
    return `
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <title>Agendamento Confirmado - ${businessName}</title>
    <style>
        body { font-family: Arial, sans-serif; margin: 0; padding: 20px; background: #f5f5f5; }
        .container { max-width: 600px; margin: 0 auto; background: white; border-radius: 10px; padding: 30px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); }
        .header { text-align: center; border-bottom: 2px solid #4f46e5; padding-bottom: 20px; margin-bottom: 20px; }
        .logo { font-size: 24px; color: #4f46e5; font-weight: bold; }
        .content { line-height: 1.6; }
        .info-box { background: #f8f9fa; border-left: 4px solid #4f46e5; padding: 15px; margin: 20px 0; }
        .btn { display: inline-block; background: #4f46e5; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; margin-top: 20px; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <div class="logo">📅 ${businessName}</div>
            <h2>Agendamento Confirmado!</h2>
        </div>
        <div class="content">
            <p>Olá <strong>${clientName}</strong>,</p>
            <p>Seu agendamento foi realizado com sucesso:</p>
            <div class="info-box">
                <p><strong>Profissional:</strong> ${professionalName || "-"}</p>
                <p><strong>Serviço:</strong> ${serviceName || "-"}</p>
                <p><strong>Data:</strong> ${dateLabel}</p>
                <p><strong>Horário:</strong> ${time}</p>
            </div>
            <p><a href="${confirmUrl}" class="btn">Confirmar minha presença</a></p>
        </div>
    </div>
</body>
</html>`;
}

// Cloud Function temporária - apenas loga dados
exports.onAppointmentCreatedDebug = onDocumentCreated(
    { document: "appointments/{docId}", region: "southamerica-east1" },
    async (event) => {
        const snap = event.data;
        if (!snap) return;
        const data = snap.data();
        const clientEmail = data.clientEmail;
        
        console.log("=== DEBUG: Agendamento Criado ===");
        console.log("ID:", event.params.docId);
        console.log("Email:", clientEmail);
        console.log("Cliente:", data.clientName);
        console.log("Serviço:", data.serviceName);
        console.log("Data:", data.date);
        console.log("Horário:", data.time);
        
        // Salvar log detalhado
        await db.collection("email_debug_logs").add({
            type: "appointment_created",
            appointmentId: event.params.docId,
            clientEmail: clientEmail,
            clientName: data.clientName,
            serviceName: data.serviceName,
            professionalName: data.professionalName,
            date: data.date,
            time: data.time,
            status: "logged_for_debug",
            timestamp: admin.firestore.FieldValue.serverTimestamp(),
            appointmentData: data
        });
        
        if (!clientEmail) {
            console.log("Sem email cliente - ignorando envio");
            return;
        }
        
        // Simular envio (sem SendGrid)
        console.log("=== SIMULAÇÃO: Email seria enviado para ===");
        console.log("Para:", clientEmail);
        console.log("Assunto: Agendamento confirmado");
        console.log("Conteúdo gerado com sucesso");
        
        // Salvar log de simulação
        await db.collection("email_debug_logs").add({
            type: "email_simulation",
            appointmentId: event.params.docId,
            to: clientEmail,
            subject: "Agendamento confirmado",
            status: "simulated",
            htmlContent: confirmationHtml({
                clientName: data.clientName || "Cliente", 
                businessName: "NEXBOOK", 
                professionalName: data.professionalName || "", 
                serviceName: data.serviceName || "", 
                date: data.date || "", 
                time: data.time || "", 
                appointmentId: event.params.docId 
            }),
            timestamp: admin.firestore.FieldValue.serverTimestamp()
        });
        
        console.log("=== DEBUG: Processo concluído ===");
    }
);
