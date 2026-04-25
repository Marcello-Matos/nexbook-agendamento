const { onDocumentCreated } = require("firebase-functions/v2/firestore");
const { onSchedule } = require("firebase-functions/v2/scheduler");
const { onRequest, onCall } = require("firebase-functions/v2/https");
const { defineSecret } = require("firebase-functions/params");
const admin = require("firebase-admin");
const sgMail = require("@sendgrid/mail");

admin.initializeApp();
const db = admin.firestore();

const SENDGRID_API_KEY = defineSecret("SENDGRID_API_KEY");
const MP_ACCESS_TOKEN  = defineSecret("MP_ACCESS_TOKEN");
const SENDER_EMAIL = "marcellomatosxads@gmail.com";
const ADMIN_UIDS   = ["Nrq4TYVDGsfboHOPDx7csCF0QSi2","O525l43Yzxatu5ckI7k8J1VLfjU2","SpygmGopNAXhban8lTi8JaBvAoG2","pZQbVSQkaid4lYSTDcNarjZTUHl1"];
const PLAN_PRICE   = 99.90;
const BASE_URL     = "https://nexbook-14d69.web.app";

// ── Helpers Email ──────────────────────────────────────────
function tomorrowStr() {
  const d = new Date(); d.setDate(d.getDate() + 1);
  return d.getFullYear() + "-" + String(d.getMonth()+1).padStart(2,"0") + "-" + String(d.getDate()).padStart(2,"0");
}
const MONTHS = ["Janeiro","Fevereiro","Marco","Abril","Maio","Junho","Julho","Agosto","Setembro","Outubro","Novembro","Dezembro"];
const DAYS   = ["Domingo","Segunda","Terca","Quarta","Quinta","Sexta","Sabado"];
function fmtDate(s) {
  if (!s) return "";
  const [y,m,d] = s.split("-").map(Number);
  const dt = new Date(y, m-1, d);
  return DAYS[dt.getDay()] + ", " + d + " de " + MONTHS[m-1] + " de " + y;
}
function htmlConfirm(o) {
  const url = BASE_URL + "/confirmar.html?id=" + o.id;
  return `<!DOCTYPE html><html><head><meta charset="UTF-8"><style>body{margin:0;background:#f1f5f9;font-family:sans-serif}.w{max-width:520px;margin:32px auto;background:#fff;border-radius:20px;overflow:hidden}.h{background:linear-gradient(135deg,#4f46e5,#7c3aed);padding:28px;text-align:center;color:#fff}.logo{font-size:32px}.brand{font-size:20px;font-weight:800;margin-top:6px}.badge{background:rgba(255,255,255,.2);border-radius:50px;padding:5px 16px;font-size:12px;display:inline-block;margin-top:8px}.b{padding:28px}.row{display:flex;gap:10px;padding:8px 0;border-bottom:1px solid #f1f5f9;font-size:14px}.row:last-child{border-bottom:none}.ic{width:30px;height:30px;border-radius:8px;background:linear-gradient(135deg,#4f46e5,#7c3aed);color:#fff;text-align:center;line-height:30px;flex-shrink:0}.lbl{font-size:11px;color:#94a3b8}.val{font-weight:600;color:#0f172a}.box{background:#f8fafc;border:1px solid #e2e8f0;border-radius:14px;padding:18px;margin-bottom:20px}.btn{display:block;width:fit-content;margin:0 auto;padding:14px 28px;background:linear-gradient(135deg,#4f46e5,#7c3aed);color:#fff;text-decoration:none;border-radius:12px;font-size:14px;font-weight:700}.ft{text-align:center;padding:18px;color:#94a3b8;font-size:11px;background:#f8fafc}</style></head><body><div class="w"><div class="h"><div class="logo">📅</div><div class="brand">NEXBOOK</div><div class="badge">Agendamento Confirmado</div></div><div class="b"><p style="margin:0 0 16px;font-size:15px;color:#0f172a">Ola <strong>${o.clientName}</strong>, seu agendamento foi realizado!</p><div class="box"><div class="row"><div class="ic">👤</div><div><div class="lbl">Profissional</div><div class="val">${o.professionalName||"-"}</div></div></div><div class="row"><div class="ic">💆</div><div><div class="lbl">Servico</div><div class="val">${o.serviceName||"-"}</div></div></div><div class="row"><div class="ic">📅</div><div><div class="lbl">Data</div><div class="val">${fmtDate(o.date)}</div></div></div><div class="row"><div class="ic">🕐</div><div><div class="lbl">Horario</div><div class="val">${o.time}</div></div></div></div><a href="${url}" class="btn">Confirmar minha presenca</a></div><div class="ft">Powered by <strong>NEXBOOK</strong></div></div></body></html>`;
}
function htmlReminder(o) {
  const url = BASE_URL + "/confirmar.html?id=" + o.id;
  return `<!DOCTYPE html><html><head><meta charset="UTF-8"><style>body{margin:0;background:#f1f5f9;font-family:sans-serif}.w{max-width:520px;margin:32px auto;background:#fff;border-radius:20px;overflow:hidden}.h{background:linear-gradient(135deg,#f59e0b,#d97706);padding:28px;text-align:center;color:#fff}.logo{font-size:32px}.brand{font-size:20px;font-weight:800;margin-top:6px}.badge{background:rgba(255,255,255,.2);border-radius:50px;padding:5px 16px;font-size:12px;display:inline-block;margin-top:8px}.b{padding:28px}.row{display:flex;gap:10px;padding:8px 0;border-bottom:1px solid #f1f5f9;font-size:14px}.row:last-child{border-bottom:none}.ic{width:30px;height:30px;border-radius:8px;background:linear-gradient(135deg,#f59e0b,#d97706);color:#fff;text-align:center;line-height:30px;flex-shrink:0}.lbl{font-size:11px;color:#94a3b8}.val{font-weight:600;color:#0f172a}.box{background:#f8fafc;border:1px solid #e2e8f0;border-radius:14px;padding:18px;margin-bottom:20px}.hl{background:#fef3c7;border:1px solid #f59e0b;border-radius:10px;padding:12px;text-align:center;color:#92400e;font-weight:700;margin-bottom:16px}.btn{display:block;width:fit-content;margin:0 auto 10px;padding:14px 28px;background:linear-gradient(135deg,#22c55e,#16a34a);color:#fff;text-decoration:none;border-radius:12px;font-size:14px;font-weight:700}.ft{text-align:center;padding:18px;color:#94a3b8;font-size:11px;background:#f8fafc}</style></head><body><div class="w"><div class="h"><div class="logo">🗓️</div><div class="brand">NEXBOOK</div><div class="badge">Lembrete - Amanha</div></div><div class="b"><p style="margin:0 0 12px;font-size:15px;color:#0f172a">Ola <strong>${o.clientName}</strong>!</p><div class="hl">Seu agendamento e amanha as ${o.time}</div><div class="box"><div class="row"><div class="ic">👤</div><div><div class="lbl">Profissional</div><div class="val">${o.professionalName||"-"}</div></div></div><div class="row"><div class="ic">💆</div><div><div class="lbl">Servico</div><div class="val">${o.serviceName||"-"}</div></div></div><div class="row"><div class="ic">📅</div><div><div class="lbl">Data</div><div class="val">${fmtDate(o.date)}</div></div></div><div class="row"><div class="ic">🕐</div><div><div class="lbl">Horario</div><div class="val">${o.time}</div></div></div></div><a href="${url}" class="btn">Confirmar presenca</a></div><div class="ft">Powered by <strong>NEXBOOK</strong></div></div></body></html>`;
}

// ── Cloud Function 1: Email confirmacao agendamento ────────
exports.onAppointmentCreated = onDocumentCreated(
  { document: "appointments/{docId}", secrets: [SENDGRID_API_KEY], region: "southamerica-east1" },
  async (event) => {
    const data = event.data.data();
    if (!data.clientEmail) { console.log("No email, skipping."); return; }
    sgMail.setApiKey(SENDGRID_API_KEY.value().trim());
    try {
      await sgMail.send({ to: data.clientEmail, from: { email: SENDER_EMAIL, name: "NEXBOOK" }, subject: "Agendamento confirmado - NEXBOOK", html: htmlConfirm({ id: event.params.docId, clientName: data.clientName||"Cliente", professionalName: data.professionalName||"", serviceName: data.serviceName||"", date: data.date||"", time: data.time||"" }) });
      console.log("Confirmation sent to " + data.clientEmail);
    } catch (e) { console.error("SendGrid error:", JSON.stringify(e.response&&e.response.body||e.message)); }
  }
);

// ── Cloud Function 2: Lembrete diario 8h ──────────────────
exports.sendDailyReminders = onSchedule(
  { schedule: "0 8 * * *", timeZone: "America/Sao_Paulo", secrets: [SENDGRID_API_KEY], region: "southamerica-east1" },
  async () => {
    const tomorrow = tomorrowStr();
    const snap = await db.collection("appointments").where("date","==",tomorrow).get();
    const apts = snap.docs.map(d=>({id:d.id,...d.data()})).filter(a=>a.status!=="cancelled"&&a.clientEmail);
    if (!apts.length) { console.log("No reminders."); return; }
    sgMail.setApiKey(SENDGRID_API_KEY.value().trim());
    await Promise.all(apts.map(async apt => {
      try {
        await sgMail.send({ to: apt.clientEmail, from: { email: SENDER_EMAIL, name: "NEXBOOK" }, subject: "Lembrete: seu agendamento e amanha - NEXBOOK", html: htmlReminder({ id: apt.id, clientName: apt.clientName||"Cliente", professionalName: apt.professionalName||"", serviceName: apt.serviceName||"", date: apt.date||"", time: apt.time||"" }) });
        console.log("Reminder sent to " + apt.clientEmail);
      } catch(e) { console.error("Reminder error:", apt.clientEmail, JSON.stringify(e.response&&e.response.body||e.message)); }
    }));
  }
);

// ── Cloud Function 3: Criar preferencia Mercado Pago ──────
exports.createPayment = onCall(
  { secrets: [MP_ACCESS_TOKEN], region: "southamerica-east1" },
  async (request) => {
    const { userId, userEmail, userName } = request.data;
    if (!userId) throw new Error("userId required");

    const axios = require("axios");
    const token = MP_ACCESS_TOKEN.value().trim();

    const webhookUrl = "https://southamerica-east1-nexbook-14d69.cloudfunctions.net/mpWebhook";
    const preference = {
      items: [{ title: "NEXBOOK - Assinatura Mensal", quantity: 1, currency_id: "BRL", unit_price: PLAN_PRICE }],
      payer: { email: userEmail || "cliente@nexbook.app", name: userName || "Cliente" },
      back_urls: {
        success: BASE_URL + "/pagamento.html?success=true&uid=" + userId,
        failure: BASE_URL + "/pagamento.html?failed=true&uid=" + userId,
        pending: BASE_URL + "/pagamento.html?pending=true&uid=" + userId,
      },
      auto_return: "approved",
      external_reference: userId,
      notification_url: webhookUrl,
      statement_descriptor: "NEXBOOK",
    };

    try {
      const resp = await axios.post("https://api.mercadopago.com/checkout/preferences", preference, {
        headers: { Authorization: "Bearer " + token, "Content-Type": "application/json" }
      });
      console.log("Preference created:", resp.data.id, "for user:", userId);
      return { initPoint: resp.data.init_point };
    } catch (e) {
      console.error("MP error:", JSON.stringify(e.response&&e.response.data||e.message));
      throw new Error("Erro ao criar pagamento: " + (e.response&&e.response.data&&e.response.data.message||e.message));
    }
  }
);

// ── Cloud Function 4: Webhook Mercado Pago ─────────────────
exports.mpWebhook = onRequest(
  { secrets: [MP_ACCESS_TOKEN], region: "southamerica-east1" },
  async (req, res) => {
    if (req.method !== "POST") { res.status(200).send("OK"); return; }

    const topic = req.query.topic || req.body.type;
    const id    = req.query.id    || (req.body.data && req.body.data.id);

    if (!id || (topic !== "payment" && topic !== "merchant_order")) {
      res.status(200).send("OK"); return;
    }

    try {
      const axios = require("axios");
      const token = MP_ACCESS_TOKEN.value().trim();

      // Consultar pagamento na API do MP
      const paymentResp = await axios.get("https://api.mercadopago.com/v1/payments/" + id, {
        headers: { Authorization: "Bearer " + token }
      });
      const payment = paymentResp.data;
      const userId  = payment.external_reference;
      const status  = payment.status; // approved / rejected / pending / cancelled

      if (!userId) { res.status(200).send("OK"); return; }

      const now     = admin.firestore.Timestamp.now();
      const expires = admin.firestore.Timestamp.fromDate(new Date(Date.now() + 30 * 24 * 60 * 60 * 1000));

      if (status === "approved") {
        await db.collection("subscriptions").doc(userId).set({
          status: "active", plan: "monthly", price: PLAN_PRICE,
          paymentId: String(id), startDate: now, expiresAt: expires,
          email: payment.payer && payment.payer.email || "",
          updatedAt: now,
        }, { merge: true });
        console.log("Subscription activated for user:", userId);
      } else if (status === "rejected" || status === "cancelled") {
        await db.collection("subscriptions").doc(userId).set({ status: "expired", updatedAt: now }, { merge: true });
        console.log("Subscription expired for user:", userId, "status:", status);
      } else {
        await db.collection("subscriptions").doc(userId).set({ status: "pending", updatedAt: now }, { merge: true });
        console.log("Subscription pending for user:", userId);
      }
    } catch (e) {
      console.error("Webhook error:", e.message);
    }
    res.status(200).send("OK");
  }
);
// ── Cloud Function 5: Obter permissoes do usuario ─────────
exports.getUserPermissions = onCall(
  { region: "southamerica-east1" },
  async (request) => {
    const uid = request.auth && request.auth.uid;
    if (!uid) throw new Error("Nao autenticado");
    const doc = await db.collection("users").doc(uid).get();
    const data = doc.exists ? doc.data() : {};
    const role = data.role || "funcionario";
    const defaultPerms = role === "admin"
      ? { verFinanceiro: true, editarAgenda: true, verClientes: true, gerenciarServicos: true, gerenciarProfissionais: true, verRelatorios: true }
      : { verFinanceiro: false, editarAgenda: true, verClientes: true, gerenciarServicos: false, gerenciarProfissionais: false, verRelatorios: false };
    const permissions = Object.assign({}, defaultPerms, data.permissions || {});
    if (role !== "admin") {
      permissions.verFinanceiro = false;
      permissions.verRelatorios = false;
    }
    return { role, permissions };
  }
);

// ── Cloud Function 6: Definir role de usuario (admin only) ─
exports.setUserRole = onCall(
  { region: "southamerica-east1" },
  async (request) => {
    const callerUid = request.auth && request.auth.uid;
    if (!callerUid) throw new Error("Nao autenticado");
    const callerDoc = await db.collection("users").doc(callerUid).get();
    if (!callerDoc.exists || callerDoc.data().role !== "admin") throw new Error("Sem permissao");
    const { targetUid, role, permissions } = request.data;
    if (!targetUid || !role) throw new Error("Dados invalidos");
    const defaultPerms = role === "admin"
      ? { verFinanceiro: true, editarAgenda: true, verClientes: true, gerenciarServicos: true, gerenciarProfissionais: true, verRelatorios: true }
      : { verFinanceiro: false, editarAgenda: true, verClientes: true, gerenciarServicos: false, gerenciarProfissionais: false, verRelatorios: false };
    await db.collection("users").doc(targetUid).set({
      role, permissions: Object.assign({}, defaultPerms, permissions || {}), updatedAt: admin.firestore.Timestamp.now()
    }, { merge: true });
    console.log("Role updated:", targetUid, role);
    return { success: true };
  }
);

// ── Cloud Function 7: Criar usuario (admin only) ───────────
exports.createUser = onCall(
  { secrets: [SENDGRID_API_KEY], region: "southamerica-east1" },
  async (request) => {
    const callerUid = request.auth && request.auth.uid;
    if (!callerUid) throw new Error("Nao autenticado");

    // Verifica se quem chamou e admin
    const isAdminUid = ADMIN_UIDS.includes(callerUid);
    if (!isAdminUid) {
      const callerDoc = await db.collection("users").doc(callerUid).get();
      if (!callerDoc.exists || callerDoc.data().role !== "admin") throw new Error("Sem permissao");
    }

    const { name, email, password, permissions } = request.data;
    if (!email || !password || !name) throw new Error("Nome, email e senha sao obrigatorios");

    // Criar usuario no Firebase Auth
    let userRecord;
    try {
      userRecord = await admin.auth().createUser({ email, password, displayName: name });
    } catch (e) {
      if (e.code === "auth/email-already-exists") throw new Error("Este email ja esta cadastrado");
      throw new Error("Erro ao criar usuario: " + e.message);
    }

    const uid = userRecord.uid;
    const defaultPerms = {
      verFinanceiro: false, editarAgenda: true, verClientes: true,
      gerenciarServicos: false, gerenciarProfissionais: false, verRelatorios: false
    };
    const finalPerms = Object.assign({}, defaultPerms, permissions || {});

    // Salvar no Firestore
    await db.collection("users").doc(uid).set({
      name, email, role: "funcionario",
      permissions: finalPerms,
      canViewSensitiveData: finalPerms.verFinanceiro === true,
      createdAt: admin.firestore.Timestamp.now(),
      createdBy: callerUid
    });

    // Enviar email de boas-vindas
    try {
      sgMail.setApiKey(SENDGRID_API_KEY.value().trim());
      await sgMail.send({
        to: email,
        from: { email: SENDER_EMAIL, name: "NEXBOOK" },
        subject: "Seu acesso ao NEXBOOK foi criado!",
        html: `<!DOCTYPE html><html><head><meta charset="UTF-8"><style>body{margin:0;background:#f1f5f9;font-family:sans-serif}.w{max-width:520px;margin:32px auto;background:#fff;border-radius:20px;overflow:hidden}.h{background:linear-gradient(135deg,#4f46e5,#7c3aed);padding:28px;text-align:center;color:#fff}.b{padding:28px}.ft{text-align:center;padding:18px;color:#94a3b8;font-size:11px;background:#f8fafc}</style></head><body><div class="w"><div class="h"><div style="font-size:32px">🎉</div><div style="font-size:20px;font-weight:800;margin-top:6px">NEXBOOK</div><div style="background:rgba(255,255,255,.2);border-radius:50px;padding:5px 16px;font-size:12px;display:inline-block;margin-top:8px">Acesso Criado</div></div><div class="b"><p style="font-size:15px;color:#0f172a">Olá <strong>${name}</strong>!</p><p style="color:#475569">Seu acesso ao sistema NEXBOOK foi criado com sucesso.</p><div style="background:#f8fafc;border:1px solid #e2e8f0;border-radius:14px;padding:18px;margin:20px 0"><div style="font-size:13px;color:#64748b;margin-bottom:6px">Seus dados de acesso:</div><div style="font-weight:700;color:#1e293b">Email: ${email}</div><div style="font-weight:700;color:#1e293b">Senha: (a que foi definida pelo administrador)</div></div><a href="${BASE_URL}" style="display:block;width:fit-content;margin:0 auto;padding:14px 28px;background:linear-gradient(135deg,#4f46e5,#7c3aed);color:#fff;text-decoration:none;border-radius:12px;font-size:14px;font-weight:700">Acessar o sistema</a></div><div class="ft">Powered by <strong>NEXBOOK</strong></div></div></body></html>`
      });
    } catch(e) { console.warn("Welcome email failed:", e.message); }

    console.log("User created:", uid, email);
    return { uid, email, name };
  }
);

// ── Cloud Function: Liberar acesso trial manual (admin only) ─────────────
exports.grantTrialAccess = onCall(
  { region: "southamerica-east1" },
  async (request) => {
    const callerUid = request.auth && request.auth.uid;
    if (!callerUid) throw new Error("Nao autenticado");
    if (!ADMIN_UIDS.includes(callerUid)) throw new Error("Sem permissao");

    const { targetUid, days, email } = request.data || {};
    if (!targetUid) throw new Error("targetUid obrigatorio");

    const trialDays = Number(days || 7);
    const now = admin.firestore.Timestamp.now();
    const expires = admin.firestore.Timestamp.fromDate(new Date(Date.now() + trialDays * 24 * 60 * 60 * 1000));

    await db.collection("subscriptions").doc(String(targetUid)).set({
      status: "active",
      plan: "trial",
      startDate: now,
      expiresAt: expires,
      updatedAt: now,
      grantedBy: callerUid,
      trialDays: trialDays,
      email: email || ""
    }, { merge: true });

    return { success: true, targetUid, trialDays };
  }
);

// ── Cloud Function: Garantir trial automático no primeiro acesso ──────────
exports.ensureTrialAccess = onCall(
  { region: "southamerica-east1" },
  async (request) => {
    const uid = request.auth && request.auth.uid;
    if (!uid) throw new Error("Nao autenticado");

    if (ADMIN_UIDS.includes(uid)) {
      return { success: true, admin: true, trialCreated: false };
    }

    const userDoc = await db.collection("users").doc(uid).get();
    if (userDoc.exists && userDoc.data().createdBy) {
      return { success: true, employee: true, trialCreated: false };
    }

    const subRef = db.collection("subscriptions").doc(uid);
    const subDoc = await subRef.get();

    if (subDoc.exists) {
      const sub = subDoc.data() || {};
      if (sub.status && sub.expiresAt) {
        return { success: true, trialCreated: false, alreadyExists: true };
      }
    }

    const now = admin.firestore.Timestamp.now();
    const expires = admin.firestore.Timestamp.fromDate(new Date(Date.now() + 7 * 24 * 60 * 60 * 1000));

    await subRef.set({
      status: "active",
      plan: "trial",
      startDate: now,
      expiresAt: expires,
      updatedAt: now,
      trialDays: 7,
      automaticTrial: true,
      email: (request.auth.token && request.auth.token.email) || ""
    }, { merge: true });

    return { success: true, trialCreated: true, trialDays: 7 };
  }
);
