// ============================================================
// NEXBOOK — js/insights.js  v2
// Insights reais do Firestore + Contadores + Painel Lembretes
// ============================================================

// ── Contadores Animados ──────────────────────────────────────
function animateCounter(el, target, prefix, suffix, duration) {
    if (!el) return;
    const startTime = performance.now();
    function update(currentTime) {
        const elapsed = currentTime - startTime;
        const progress = Math.min(elapsed / duration, 1);
        const ease = 1 - Math.pow(1 - progress, 3);
        const current = Math.floor(ease * target);
        el.textContent = prefix + current.toLocaleString('pt-BR') + suffix;
        if (progress < 1) requestAnimationFrame(update);
        else el.textContent = prefix + target.toLocaleString('pt-BR') + suffix;
    }
    requestAnimationFrame(update);
}
function animateCurrency(el, target, duration) {
    if (!el) return;
    const startTime = performance.now();
    function update(currentTime) {
        const elapsed = currentTime - startTime;
        const progress = Math.min(elapsed / duration, 1);
        const ease = 1 - Math.pow(1 - progress, 3);
        const current = ease * target;
        el.textContent = 'R$ ' + current.toLocaleString('pt-BR', { minimumFractionDigits: 0, maximumFractionDigits: 0 });
        if (progress < 1) requestAnimationFrame(update);
    }
    requestAnimationFrame(update);
}
window.triggerStatAnimations = function() {
    const todayEl = document.getElementById('todayCount');
    const revenueEl = document.getElementById('revenueValue');
    const attendanceEl = document.getElementById('attendanceValue');
    const clientsEl = document.getElementById('clientsValue');
    if (todayEl) { const v = parseInt(todayEl.textContent) || 0; animateCounter(todayEl, v, '', '', 900); }
    if (attendanceEl) { const v = parseInt(attendanceEl.textContent) || 0; animateCounter(attendanceEl, v, '', '', 900); }
    if (clientsEl) { const v = parseInt(clientsEl.textContent) || 0; animateCounter(clientsEl, v, '', '', 900); }
    if (revenueEl) { const raw = revenueEl.textContent.replace(/[^\d]/g, ''); const v = parseInt(raw) || 0; animateCurrency(revenueEl, v, 900); }
};

// ── Notification Badge ───────────────────────────────────────
function updateNotificationBadge(count) {
    const notifEl = document.querySelector('.notification');
    if (!notifEl) return;
    let badge = notifEl.querySelector('.notif-badge');
    if (count > 0) {
        if (!badge) { badge = document.createElement('span'); badge.className = 'notif-badge'; notifEl.appendChild(badge); }
        badge.textContent = count > 9 ? '9+' : count;
    } else if (badge) { badge.remove(); }
}

// ── Métricas Reais do Firestore ──────────────────────────────
window.loadRealInsights = async function() {
    if (!window.currentUserId) return;

    const now = new Date();
    const todayStr = toStr(now);

    // Datas de referência
    const weekAgo = new Date(now); weekAgo.setDate(weekAgo.getDate() - 7);
    const monthAgo = new Date(now); monthAgo.setDate(monthAgo.getDate() - 30);
    const prevMonthStart = new Date(now); prevMonthStart.setDate(prevMonthStart.getDate() - 60);

    try {
        // Buscar agendamentos dos últimos 60 dias
        const [aptsSnap, clientsSnap] = await Promise.all([
            firebase.firestore().collection('appointments')
                .where('userId', '==', window.currentUserId)
                .where('date', '>=', toStr(prevMonthStart))
                .get(),
            firebase.firestore().collection('clients')
                .where('userId', '==', window.currentUserId)
                .get()
        ]);

        const allApts = aptsSnap.docs.map(d => ({ id: d.id, ...d.data() }));
        const prevMonthStr = toStr(prevMonthStart);
        const apts = allApts.filter(a => a.date >= prevMonthStr);
        const clients = clientsSnap.docs.map(d => ({ id: d.id, ...d.data() }));

        // ── Taxa de comparecimento ──────────────────────────
        const thisMonthApts = apts.filter(a => a.date >= toStr(monthAgo) && a.date <= todayStr);
        const prevMonthApts = apts.filter(a => a.date >= toStr(prevMonthStart) && a.date < toStr(monthAgo));

        const attendRate = thisMonthApts.length > 0
            ? Math.round((thisMonthApts.filter(a => a.status === 'attended' || a.status === 'confirmed').length / thisMonthApts.length) * 100)
            : null;
        const prevAttendRate = prevMonthApts.length > 0
            ? Math.round((prevMonthApts.filter(a => a.status === 'attended' || a.status === 'confirmed').length / prevMonthApts.length) * 100)
            : null;
        const attendDelta = (attendRate !== null && prevAttendRate !== null) ? attendRate - prevAttendRate : null;

        // ── Clientes não retornaram essa semana ──────────────
        const activeClients = clients.filter(c => c.status === 'active');
        const weekAgoStr = toStr(weekAgo);
        const clientsThisWeek = new Set(apts.filter(a => a.date >= weekAgoStr).map(a => a.clientId || a.clientName));
        const lostThisWeek = activeClients.filter(c => !clientsThisWeek.has(c.id) && !clientsThisWeek.has(c.name)).length;

        // ── Clientes sem retorno há 15+ dias ─────────────────
        const fifteenAgo = new Date(now); fifteenAgo.setDate(fifteenAgo.getDate() - 15);
        const fifteenStr = toStr(fifteenAgo);
        const recentClientIds = new Set(apts.filter(a => a.date >= fifteenStr).map(a => a.clientId).filter(Boolean));
        const overdue = activeClients.filter(c => !recentClientIds.has(c.id));

        // ── Horário de pico ──────────────────────────────────
        const slotCount = {};
        thisMonthApts.forEach(a => { if (a.time) slotCount[a.time] = (slotCount[a.time] || 0) + 1; });
        const peakSlot = Object.entries(slotCount).sort((a,b) => b[1]-a[1])[0];

        // ── Serviço mais rentável ─────────────────────────────
        const serviceRevenue = {};
        thisMonthApts.forEach(a => {
            if (a.serviceName && a.servicePrice) {
                serviceRevenue[a.serviceName] = (serviceRevenue[a.serviceName] || 0) + Number(a.servicePrice);
            }
        });
        const totalRev = Object.values(serviceRevenue).reduce((s,v) => s+v, 0);
        const topService = Object.entries(serviceRevenue).sort((a,b) => b[1]-a[1])[0];

        // ── Gera insights ────────────────────────────────────
        const insights = [];
        let notifCount = 0;

        if (lostThisWeek > 0) {
            insights.push({ type: 'warning', text: `<strong>${lostThisWeek} cliente${lostThisWeek>1?'s':''}</strong> não voltaram essa semana`, action: 'Ver clientes', view: 'clients' });
            if (lostThisWeek > 2) notifCount++;
        }
        if (attendDelta !== null && attendDelta < -5) {
            insights.push({ type: 'danger', text: `Taxa de comparecimento <strong>${attendRate}%</strong> (↓ ${Math.abs(attendDelta)}% vs mês anterior)`, action: 'Ver relatórios', view: 'reports' });
            notifCount++;
        } else if (attendRate !== null && attendRate > 0) {
            insights.push({ type: 'success', text: `Taxa de comparecimento este mês: <strong>${attendRate}%</strong>${attendDelta !== null ? ` (${attendDelta >= 0 ? '↑' : '↓'} ${Math.abs(attendDelta)}%)` : ''}` });
        }
        if (peakSlot && peakSlot[1] > 1) {
            insights.push({ type: 'info', text: `Seu horário mais movimentado é às <strong>${peakSlot[0]}</strong> (${peakSlot[1]} agendamentos)` });
        }
        if (topService && totalRev > 0) {
            const pct = Math.round((topService[1]/totalRev)*100);
            insights.push({ type: 'tip', text: `<strong>"${topService[0]}"</strong> representa <strong>${pct}%</strong> da sua receita do mês` });
        }
        if (overdue.length > 0) {
            insights.push({ type: 'warning', text: `<strong>${overdue.length} cliente${overdue.length>1?'s':''}</strong> sem agendamento há mais de 15 dias`, action: 'Ver clientes', view: 'clients' });
            if (overdue.length > 3) notifCount++;
        }
        if (insights.length === 0) {
            insights.push({ type: 'success', text: 'Tudo em ordem! Seu negócio está saudável.' });
        }

        // ── Próximas Ações ───────────────────────────────────
        const actions = [];
        if (overdue.length > 0) actions.push({ icon: 'user-clock', text: `Contatar ${overdue.length} cliente${overdue.length>1?'s':''} sem retorno`, view: 'clients' });
        if (lostThisWeek > 0) actions.push({ icon: 'comments', text: 'Enviar lembrete para clientes da semana', onclick: 'openWhatsAppSelectModal()' });
        actions.push({ icon: 'chart-bar', text: 'Gerar relatório do período', view: 'reports' });
        actions.push({ icon: 'plus-circle', text: 'Criar novo agendamento', onclick: "openModal('appointment')" });

        renderInsights(insights);
        renderActions(actions);
        updateNotificationBadge(notifCount);

    } catch(e) {
        console.error('Insights error:', e);
        renderInsights([{ type: 'info', text: 'Carregue mais dados para ver insights personalizados.' }]);
    }
};

function toStr(d) {
    return d.getFullYear() + '-' + String(d.getMonth()+1).padStart(2,'0') + '-' + String(d.getDate()).padStart(2,'0');
}

const iconMap = { success:'check-circle', warning:'exclamation-triangle', danger:'times-circle', info:'info-circle', tip:'lightbulb' };
const colorMap = { success:'var(--success)', warning:'var(--warning)', danger:'var(--danger)', info:'var(--info)', tip:'#f59e0b' };

function renderInsights(insights) {
    const list = document.getElementById('insightsList');
    if (!list) return;
    list.innerHTML = insights.map(ins =>
        `<div class="insight-item insight-${ins.type}">
            <div class="insight-left">
                <i class="fas fa-${iconMap[ins.type]}" style="color:${colorMap[ins.type]}"></i>
                <span>${ins.text}</span>
            </div>
            ${ins.action ? `<button class="insight-action-btn" onclick="navigateTo('${ins.view}')">${ins.action}</button>` : ''}
        </div>`
    ).join('');
}

function renderActions(actions) {
    const list = document.getElementById('actionsList');
    if (!list) return;
    list.innerHTML = actions.map(act =>
        `<div class="action-item" onclick="${act.onclick ? act.onclick : `navigateTo('${act.view}')`}">
            <span class="action-icon-fa"><i class="fas fa-${act.icon}"></i></span>
            <span class="action-text">${act.text}</span>
            <i class="fas fa-chevron-right action-arrow"></i>
        </div>`
    ).join('');
}

function navigateTo(view) {
    const item = document.querySelector('[data-view="' + view + '"]');
    if (item) item.click();
}

// ── Injeção dos painéis no DOM ───────────────────────────────


function updateStatCardColors() {
    document.querySelectorAll('.stat-comparison').forEach(el => {
        const text = el.textContent;
        el.classList.remove('stat-comp-positive','stat-comp-negative');
        if (text.includes('+')) el.classList.add('stat-comp-positive');
        else if (text.includes('-')) el.classList.add('stat-comp-negative');
    });
}
