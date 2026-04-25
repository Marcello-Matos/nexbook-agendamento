// ============================================================
// NEXBOOK — js/whatsapp-history.js
// Registro de envios WhatsApp + Painel de Lembretes 24h
// ============================================================

window.NEXWhatsApp = {

    // Registra no Firestore e abre wa.me
    send: async function(phone, message, type, clientId, appointmentId) {
        const rawPhone = phone.replace(/\D/g,'');
        const url = 'https://wa.me/55' + rawPhone + '?text=' + encodeURIComponent(message);
        window.open(url, '_blank');

        // Registrar log
        try {
            if (window.currentUserId) {
                await firebase.firestore().collection('whatsappLogs').add({
                    userId: window.currentUserId,
                    clientId: clientId || null,
                    appointmentId: appointmentId || null,
                    type: type || 'manual',
                    phone: rawPhone,
                    sentAt: firebase.firestore.FieldValue.serverTimestamp()
                });
            }
        } catch(e) { console.warn('WhatsApp log error:', e); }
    },

    // Formata mensagem de lembrete 24h
    reminderMessage: function(clientName, serviceName, date, time, businessName, appointmentId) {
        const d = new Date(date + 'T00:00:00');
        const dateLabel = d.getDate() + '/' + (d.getMonth()+1) + '/' + d.getFullYear();
        const confirmUrl = 'https://nexbook-14d69.web.app/confirmar.html?id=' + appointmentId;
        return (
            'Olá *' + clientName + '*! 👋\n\n' +
            '🗓️ Lembrando seu agendamento *amanhã*:\n\n' +
            '💆 Serviço: *' + serviceName + '*\n' +
            '🕐 Horário: *' + time + '*\n' +
            '📍 Local: *' + businessName + '*\n\n' +
            'Para confirmar sua presença, acesse:\n' + confirmUrl + '\n\n' +
            '_Responda SIM para confirmar ou NÃO para cancelar._'
        );
    }
};

// ── Painel de Lembretes de Amanhã ─────────────────────────
async function loadTomorrowReminders() {
    if (!window.currentUserId) return;

    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const tomorrowStr = tomorrow.getFullYear() + '-' +
        String(tomorrow.getMonth()+1).padStart(2,'0') + '-' +
        String(tomorrow.getDate()).padStart(2,'0');

    const panel = document.getElementById('remindersCard');
    if (!panel) return;

    try {
        const snap = await firebase.firestore().collection('appointments')
            .where('userId', '==', window.currentUserId)
            .where('date', '==', tomorrowStr)
            .get();

        const appointments = snap.docs.map(d => ({ id: d.id, ...d.data() })).filter(a => a.status !== 'cancelled');

        // Atualiza badge
        const badge = document.getElementById('remindersBadge');
        if (badge) {
            badge.textContent = appointments.length;
            badge.style.display = appointments.length > 0 ? 'flex' : 'none';
        }

        // Atualiza notif badge no sino
        if (typeof updateNotificationBadge === 'function') {
            updateNotificationBadge(appointments.length);
        }

        const list = document.getElementById('remindersList');
        if (!list) return;

        if (appointments.length === 0) {
            list.innerHTML = '<div class="reminders-empty"><i class="fas fa-moon"></i><p>Nenhum agendamento para amanhã</p></div>';
            return;
        }

        // Carregar dados de clientes para pegar telefones
        const clientSnaps = await Promise.all(
            [...new Set(appointments.map(a => a.clientId).filter(Boolean))].map(id =>
                firebase.firestore().collection('clients').doc(id).get().catch(() => null)
            )
        );
        const clientMap = {};
        clientSnaps.forEach(d => { if (d && d.exists) clientMap[d.id] = d.data(); });

        const businessName = document.getElementById('companyNameField')?.textContent || 'NEXBOOK';

        list.innerHTML = appointments
            .sort((a,b) => (a.time||'').localeCompare(b.time||''))
            .map(apt => {
                const client = clientMap[apt.clientId] || {};
                const phone = client.phone || apt.clientPhone || '';
                const clientName = apt.clientName || client.name || 'Cliente';
                const statusIcon = apt.status === 'confirmed' ? '✅' : '⏳';
                const hasPhone = phone.replace(/\D/g,'').length >= 10;

                return `<div class="reminder-item">
                    <div class="reminder-time">${apt.time || '--:--'}</div>
                    <div class="reminder-info">
                        <div class="reminder-name">${statusIcon} ${clientName}</div>
                        <div class="reminder-service">${apt.serviceName || apt.service || '-'}</div>
                        ${hasPhone ? `<div class="reminder-phone"><i class="fab fa-whatsapp"></i> ${formatPhone(phone)}</div>` : ''}
                    </div>
                    ${hasPhone ? `
                    <button class="reminder-wa-btn" onclick="sendReminderWhatsApp('${apt.id}','${clientName}','${apt.serviceName||''}','${tomorrowStr}','${apt.time||''}','${phone}','${businessName}')">
                        <i class="fab fa-whatsapp"></i>
                    </button>` : '<div style="width:36px"></div>'}
                </div>`;
            }).join('');

        // Botão "Enviar para todos"
        const hasPhones = appointments.some(a => {
            const c = clientMap[a.clientId] || {};
            return (c.phone || a.clientPhone || '').replace(/\D/g,'').length >= 10;
        });
        if (hasPhones) {
            list.innerHTML += `<div style="text-align:center;margin-top:10px"><button class="reminder-send-all" onclick="sendAllReminders('${tomorrowStr}','${businessName}')" style="width:auto;padding:10px 24px;border-radius:50px;display:inline-flex;align-items:center;gap:8px"><i class="fab fa-whatsapp"></i> Enviar para todos (${appointments.length})</button></div>`;
        }

        // Guardar para uso no sendAll
        window._tomorrowAppointments = appointments;
        window._tomorrowClientMap = clientMap;

    } catch(e) {
        console.error('Reminders error:', e);
        document.getElementById('remindersList').innerHTML = '<div class="reminders-empty"><i class="fas fa-exclamation-circle"></i><p>Erro ao carregar lembretes</p></div>';
    }
}

function sendReminderWhatsApp(aptId, clientName, serviceName, date, time, phone, businessName) {
    const msg = window.NEXWhatsApp.reminderMessage(clientName, serviceName, date, time, businessName, aptId);
    window.NEXWhatsApp.send(phone, msg, 'reminder', null, aptId);
}

async function sendAllReminders(date, businessName) {
    const apts = window._tomorrowAppointments || [];
    const clientMap = window._tomorrowClientMap || {};
    let count = 0;

    for (const apt of apts) {
        const client = clientMap[apt.clientId] || {};
        const phone = (client.phone || apt.clientPhone || '').replace(/\D/g,'');
        if (phone.length < 10) continue;

        const clientName = apt.clientName || client.name || 'Cliente';
        const msg = window.NEXWhatsApp.reminderMessage(clientName, apt.serviceName || '', date, apt.time || '', businessName, apt.id);

        setTimeout(() => {
            window.NEXWhatsApp.send(phone, msg, 'reminder', apt.clientId, apt.id);
        }, count * 1800);
        count++;
    }

    if (typeof showNotification === 'function') {
        showNotification(count + ' lembretes sendo enviados...', 'success');
    }
}

function formatPhone(phone) {
    const n = phone.replace(/\D/g,'');
    if (n.length === 11) return '(' + n.slice(0,2) + ') ' + n.slice(2,7) + '-' + n.slice(7);
    if (n.length === 10) return '(' + n.slice(0,2) + ') ' + n.slice(2,6) + '-' + n.slice(6);
    return phone;
}

// Inicializa via Firebase Auth (não depende de window.currentUserId)
document.addEventListener('DOMContentLoaded', function() {
    firebase.auth().onAuthStateChanged(function(user) {
        if (user) {
            window.currentUserId = user.uid;
            // Pequeno delay para garantir que o DOM do dashboard esteja renderizado
            setTimeout(loadTomorrowReminders, 1500);
        }
    });
});