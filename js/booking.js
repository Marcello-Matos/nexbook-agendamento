// ============================================================
// NEXBOOK — js/booking.js
// Lógica completa do fluxo público de agendamento
// ============================================================

const firebaseConfig = {
    apiKey: "AIzaSyCCvnw5eBBjUAa0piQ7Njy2t_W4TVZSIwk",
    authDomain: "nexbook-14d69.firebaseapp.com",
    projectId: "nexbook-14d69",
    storageBucket: "nexbook-14d69.firebasestorage.app",
    messagingSenderId: "445301731220",
    appId: "1:445301731220:web:500608bc6903aa8a40e981"
};

if (!firebase.apps.length) firebase.initializeApp(firebaseConfig);
const db = firebase.firestore();

// Estado global
const state = {
    uid: null,
    businessName: 'NEXBOOK',
    businessPhone: '',
    workingHours: { weekday: '09:00-18:00', saturday: '09:00-13:00', sunday: '' },
    professionals: [],
    services: [],
    selectedProfessional: null,
    selectedService: null,
    selectedDate: null,
    selectedSlot: null,
    bookedAppointments: [],
    currentStep: 1,
    calYear: new Date().getFullYear(),
    calMonth: new Date().getMonth(),
    savedAppointmentId: null
};

const MONTH_NAMES = ['Janeiro','Fevereiro','Março','Abril','Maio','Junho','Julho','Agosto','Setembro','Outubro','Novembro','Dezembro'];
const DAY_NAMES = ['Dom','Seg','Ter','Qua','Qui','Sex','Sáb'];

// ── Inicialização ──────────────────────────────────────────
window.addEventListener('DOMContentLoaded', async () => {
    const params = new URLSearchParams(window.location.search);
    state.uid = params.get('uid');

    if (!state.uid) {
        showError('Link de agendamento inválido. Verifique o link e tente novamente.');
        hideLoading();
        return;
    }

    try {
        await loadBusinessSettings();
        await loadProfessionals();
        renderCalendar();
        hideLoading();
    } catch (e) {
        console.error(e);
        showError('Erro ao carregar dados. Tente novamente.');
        hideLoading();
    }
});

async function loadBusinessSettings() {
    try {
        const doc = await db.collection('settings').doc(state.uid).get();
        if (doc.exists) {
            const d = doc.data();
            state.businessName = d.companyName || 'NEXBOOK';
            state.businessPhone = d.whatsappBusinessNumber || d.companyPhone || '';
            state.businessLink = d.whatsappBusinessLink || ''; 
            if (d.weekdayHours) state.workingHours.weekday = d.weekdayHours;
            if (d.saturdayHours) state.workingHours.saturday = d.saturdayHours;
            if (d.sundayHours) state.workingHours.sunday = d.sundayHours;
        }
        document.getElementById('businessName').textContent = state.businessName;
        document.title = 'Agendar — ' + state.businessName;
    } catch(e) { console.warn('Settings not found, using defaults'); }
}

async function loadProfessionals() {
    const snap = await db.collection('professionals')
        .where('userId', '==', state.uid)
        .where('active', '==', true)
        .get();
    state.professionals = snap.docs.map(d => ({ id: d.id, ...d.data() }));
    renderProfessionals();
}

function renderProfessionals() {
    const grid = document.getElementById('professionalsList');
    if (state.professionals.length === 0) {
        grid.innerHTML = '<div style="text-align:center;color:#94a3b8;padding:32px;grid-column:1/-1"><i class="fas fa-user-slash" style="font-size:32px;margin-bottom:8px;display:block"></i>Nenhum profissional disponível no momento.</div>';
        return;
    }
    grid.innerHTML = state.professionals.map(p => {
        const initials = (p.name || 'P').split(' ').map(w=>w[0]).join('').toUpperCase().slice(0,2);
        const avatarInner = p.photoURL
            ? `<img src="${p.photoURL}" alt="${p.name}">`
            : initials;
        return `<div class="prof-card" onclick="selectProfessional('${p.id}')">
            <div class="prof-avatar">${avatarInner}</div>
            <div class="prof-name">${p.name || 'Profissional'}</div>
            <div class="prof-specialty">${p.specialty || p.specialization || ''}</div>
        </div>`;
    }).join('');
}

async function selectProfessional(id) {
    state.selectedProfessional = state.professionals.find(p => p.id === id);
    document.querySelectorAll('.prof-card').forEach(c => c.classList.remove('selected'));
    document.querySelector(`.prof-card[onclick*="${id}"]`)?.classList.add('selected');

    await loadServices(id);
    goToStep(2);
}

async function loadServices(professionalId) {
    document.getElementById('servicesList').innerHTML = '<div class="skeleton-card"></div><div class="skeleton-card"></div>';
    const snap = await db.collection('services')
        .where('userId', '==', state.uid)
        .where('active', '==', true)
        .get();
    state.services = snap.docs.map(d => ({ id: d.id, ...d.data() }));
    renderServices();
}

function renderServices() {
    const list = document.getElementById('servicesList');
    if (state.services.length === 0) {
        list.innerHTML = '<div style="text-align:center;color:#94a3b8;padding:32px"><i class="fas fa-concierge-bell" style="font-size:32px;margin-bottom:8px;display:block"></i>Nenhum serviço disponível.</div>';
        return;
    }
    list.innerHTML = state.services.map(s => {
        const price = s.price ? 'R$ ' + Number(s.price).toLocaleString('pt-BR', {minimumFractionDigits:2}) : 'A consultar';
        const duration = s.duration ? s.duration + ' min' : '';
        return `<div class="service-card" onclick="selectService('${s.id}')">
            <div class="service-info">
                <div class="service-name">${s.name}</div>
                <div class="service-meta">
                    ${duration ? `<span><i class="fas fa-clock"></i>${duration}</span>` : ''}
                    ${s.description ? `<span><i class="fas fa-info-circle"></i>${s.description.slice(0,40)}</span>` : ''}
                </div>
            </div>
            <div class="service-price">${price}</div>
        </div>`;
    }).join('');
}

function selectService(id) {
    state.selectedService = state.services.find(s => s.id === id);
    document.querySelectorAll('.service-card').forEach(c => c.classList.remove('selected'));
    document.querySelector(`.service-card[onclick*="${id}"]`)?.classList.add('selected');
    loadMonthAppointments();
    goToStep(3);
}

// ── Calendário ─────────────────────────────────────────────
async function loadMonthAppointments() {
    const y = state.calYear, m = state.calMonth;
    const firstDay = `${y}-${String(m+1).padStart(2,'0')}-01`;
    const lastDay  = `${y}-${String(m+1).padStart(2,'0')}-${new Date(y,m+1,0).getDate()}`;
    try {
        const snap = await db.collection('appointments')
            .where('userId', '==', state.uid)
            .where('date', '>=', firstDay)
            .where('date', '<=', lastDay)
            .get();
        state.bookedAppointments = snap.docs.map(d => d.data());
    } catch(e) { state.bookedAppointments = []; }
    renderCalendar();
}

function renderCalendar() {
    const { calYear: y, calMonth: m } = state;
    document.getElementById('calMonthLabel').textContent = MONTH_NAMES[m] + ' ' + y;

    const firstWeekday = new Date(y, m, 1).getDay();
    const daysInMonth = new Date(y, m+1, 0).getDate();
    const today = new Date();
    const todayStr = toDateStr(today);

    let html = '';
    for (let i = 0; i < firstWeekday; i++) html += '<div class="cal-day empty"></div>';

    for (let d = 1; d <= daysInMonth; d++) {
        const date = new Date(y, m, d);
        const dateStr = toDateStr(date);
        const isPast = date < new Date(today.getFullYear(), today.getMonth(), today.getDate());
        const isToday = dateStr === todayStr;
        const dow = date.getDay();
        const hours = getWorkingHoursForDay(dow);
        const hasSlots = !isPast && hours;
        let cls = 'cal-day';
        if (isPast || !hours) cls += ' disabled';
        if (isToday) cls += ' today';
        if (dateStr === state.selectedDate) cls += ' selected';
        if (hasSlots) cls += ' has-slots';
        html += `<div class="${cls}" ${hasSlots ? `onclick="selectDate('${dateStr}')"` : ''}>${d}</div>`;
    }
    document.getElementById('calendarDays').innerHTML = html;
}

function getWorkingHoursForDay(dow) {
    if (dow === 0) return state.workingHours.sunday || null;
    if (dow === 6) return state.workingHours.saturday || null;
    return state.workingHours.weekday || '09:00-18:00';
}

function selectDate(dateStr) {
    state.selectedDate = dateStr;
    state.selectedSlot = null;
    renderCalendar();
    renderSlots(dateStr);

    const d = new Date(dateStr + 'T00:00:00');
    document.getElementById('slotsTitle').textContent =
        DAY_NAMES[d.getDay()] + ', ' + d.getDate() + ' de ' + MONTH_NAMES[d.getMonth()];
}

function renderSlots(dateStr) {
    const date = new Date(dateStr + 'T00:00:00');
    const dow = date.getDay();
    const hours = getWorkingHoursForDay(dow);
    if (!hours) { document.getElementById('slotsGrid').innerHTML = '<div class="slots-placeholder"><i class="fas fa-ban"></i><p>Fechado neste dia</p></div>'; return; }

    const [startH, endH] = hours.split('-').map(t => {
        const [h, m] = t.trim().split(':').map(Number);
        return h * 60 + m;
    });
    const duration = (state.selectedService?.duration ? parseInt(state.selectedService.duration) : 60);
    const bookedSlots = state.bookedAppointments
        .filter(a => a.date === dateStr && a.status !== 'cancelled')
        .map(a => a.time);

    let html = '';
    for (let t = startH; t + duration <= endH; t += duration) {
        const hh = String(Math.floor(t/60)).padStart(2,'0');
        const mm = String(t%60).padStart(2,'0');
        const slot = `${hh}:${mm}`;
        const occupied = bookedSlots.includes(slot);
        const selected = slot === state.selectedSlot;
        html += `<button class="slot-btn${occupied?' occupied':''}${selected?' selected':''}"
            ${occupied ? 'disabled' : `onclick="selectSlot('${slot}')"`}>${slot}</button>`;
    }
    document.getElementById('slotsGrid').innerHTML = html || '<div class="slots-placeholder"><i class="fas fa-clock"></i><p>Sem horários disponíveis</p></div>';
}

function selectSlot(slot) {
    state.selectedSlot = slot;
    document.querySelectorAll('.slot-btn').forEach(b => b.classList.remove('selected'));
    document.querySelectorAll('.slot-btn').forEach(b => {
        if (b.textContent === slot) b.classList.add('selected');
    });
    setTimeout(() => goToStep(4), 300);
}

function prevMonth() {
    if (state.calMonth === 0) { state.calMonth = 11; state.calYear--; }
    else state.calMonth--;
    loadMonthAppointments();
}
function nextMonth() {
    if (state.calMonth === 11) { state.calMonth = 0; state.calYear++; }
    else state.calMonth++;
    loadMonthAppointments();
}

// ── Step 4: Dados do cliente ───────────────────────────────
function renderSummaryMini() {
    const d = new Date(state.selectedDate + 'T00:00:00');
    const dateLabel = DAY_NAMES[d.getDay()] + ', ' + d.getDate() + '/' + (d.getMonth()+1) + '/' + d.getFullYear();
    document.getElementById('summaryMini').innerHTML = `
        <div class="summary-item"><i class="fas fa-user"></i><span><strong>${state.selectedProfessional?.name || ''}</strong></span></div>
        <div class="summary-item"><i class="fas fa-concierge-bell"></i><span><strong>${state.selectedService?.name || ''}</strong></span></div>
        <div class="summary-item"><i class="fas fa-calendar-alt"></i><span><strong>${dateLabel}</strong></span></div>
        <div class="summary-item"><i class="fas fa-clock"></i><span><strong>${state.selectedSlot}</strong></span></div>`;
}

function maskPhone(el) {
    let v = el.value.replace(/\D/g,'').slice(0,11);
    if (v.length > 10) v = v.replace(/(\d{2})(\d{5})(\d{4})/,'($1) $2-$3');
    else if (v.length > 6) v = v.replace(/(\d{2})(\d{4})(\d*)/,'($1) $2-$3');
    else if (v.length > 2) v = v.replace(/(\d{2})(\d*)/,'($1) $2');
    el.value = v;
}

// ── Submeter agendamento ───────────────────────────────────
async function submitBooking() {
    const name = document.getElementById('clientName').value.trim();
    const phone = document.getElementById('clientPhone').value.trim();
    const notes = document.getElementById('clientNotes').value.trim();

    let valid = true;
    if (!name) { showFieldError('nameError', 'Informe seu nome'); valid = false; } else hideFieldError('nameError');
    if (!phone || phone.replace(/\D/g,'').length < 10) { showFieldError('phoneError', 'Informe um WhatsApp válido'); valid = false; } else hideFieldError('phoneError');
    if (!valid) return;

    if (!state.selectedDate || !state.selectedSlot) { showToast('Selecione data e horário', 'error'); return; }

    const btn = document.querySelector('.btn-confirm');
    btn.disabled = true;
    btn.innerHTML = '<i class="fas fa-circle-notch fa-spin"></i> Salvando...';

    try {
        const clientEmail = (document.getElementById('clientEmail')?.value || '').trim() || null;
        const docRef = await db.collection('appointments').add({
            userId: state.uid,
            clientName: name,
            clientPhone: phone.replace(/\D/g,''),
            notes: notes,
            professionalId: state.selectedProfessional?.id || '',
            professionalName: state.selectedProfessional?.name || '',
            serviceId: state.selectedService?.id || '',
            serviceName: state.selectedService?.name || '',
            servicePrice: state.selectedService?.price || 0,
            date: state.selectedDate,
            time: state.selectedSlot,
            status: 'pending',
            clientEmail: clientEmail,
            source: 'online_booking',
            createdAt: firebase.firestore.FieldValue.serverTimestamp()
        });

        state.savedAppointmentId = docRef.id;
        renderConfirmation(name, phone);
        goToStep(5);
    } catch(e) {
        console.error(e);
        showToast('Erro ao salvar. Tente novamente.', 'error');
        btn.disabled = false;
        btn.innerHTML = '<i class="fas fa-check-circle"></i> Confirmar Agendamento';
    }
}

function renderConfirmation(name, phone) {
    const d = new Date(state.selectedDate + 'T00:00:00');
    const dateLabel = DAY_NAMES[d.getDay()] + ', ' + d.getDate() + ' de ' + MONTH_NAMES[d.getMonth()] + ' de ' + d.getFullYear();
    const price = state.selectedService?.price
        ? 'R$ ' + Number(state.selectedService.price).toLocaleString('pt-BR', {minimumFractionDigits:2})
        : 'A consultar';

    document.getElementById('bookingSummary').innerHTML = `
        <div class="summary-row"><i class="fas fa-user"></i><div><div class="summary-row-label">Cliente</div><div class="summary-row-value">${name}</div></div></div>
        <div class="summary-row"><i class="fas fa-user-md"></i><div><div class="summary-row-label">Profissional</div><div class="summary-row-value">${state.selectedProfessional?.name || '-'}</div></div></div>
        <div class="summary-row"><i class="fas fa-concierge-bell"></i><div><div class="summary-row-label">Serviço</div><div class="summary-row-value">${state.selectedService?.name || '-'}</div></div></div>
        <div class="summary-row"><i class="fas fa-calendar-alt"></i><div><div class="summary-row-label">Data</div><div class="summary-row-value">${dateLabel}</div></div></div>
        <div class="summary-row"><i class="fas fa-clock"></i><div><div class="summary-row-label">Horário</div><div class="summary-row-value">${state.selectedSlot}</div></div></div>
        <div class="summary-row"><i class="fas fa-dollar-sign"></i><div><div class="summary-row-label">Valor</div><div class="summary-row-value">${price}</div></div></div>`;
}

function openWhatsAppConfirm() {
    const phone = state.businessPhone.replace(/\D/g,'');
    const target = phone ? '55' + phone : '';
    const name = document.getElementById('clientName')?.value || '';
    const d = new Date(state.selectedDate + 'T00:00:00');
    const dateLabel = d.getDate() + '/' + (d.getMonth()+1) + '/' + d.getFullYear();
    const confirmUrl = `https://nexbook-14d69.web.app/confirmar.html?id=${state.savedAppointmentId}`;

    const msg = encodeURIComponent(
        `Olá! Acabei de agendar pelo sistema NEXBOOK.\n\n` +
        `👤 Nome: *${name}*\n` +
        `💆 Serviço: *${state.selectedService?.name || ''}*\n` +
        `👨⚕️ Profissional: *${state.selectedProfessional?.name || ''}*\n` +
        `📅 Data: *${dateLabel}*\n` +
        `🕐 Horário: *${state.selectedSlot}*\n\n` +
        `Para confirmar minha presença: ${confirmUrl}`
    );

    const url = state.businessLink
        ? `${state.businessLink}${state.businessLink.includes('?') ? '&' : '?'}text=${msg}`
        : (target ? `https://wa.me/${target}?text=${msg}` : `https://wa.me/?text=${msg}`);
    window.open(url, '_blank');
}

function resetBooking() {
    state.selectedProfessional = null;
    state.selectedService = null;
    state.selectedDate = null;
    state.selectedSlot = null;
    state.savedAppointmentId = null;
    document.getElementById('clientName').value = '';
    document.getElementById('clientPhone').value = '';
    document.getElementById('clientNotes').value = '';
    const btn = document.querySelector('.btn-confirm');
    if (btn) { btn.disabled = false; btn.innerHTML = '<i class="fas fa-check-circle"></i> Confirmar Agendamento'; }
    goToStep(1);
}

// ── Navegação de steps ─────────────────────────────────────
function goToStep(n) {
    if (n === 3 && (!state.selectedProfessional || !state.selectedService)) return;
    if (n === 4 && (!state.selectedDate || !state.selectedSlot)) { showToast('Selecione data e horário', 'error'); return; }

    document.querySelectorAll('.step-content').forEach(el => el.classList.remove('active'));
    document.getElementById('step' + n).classList.add('active');

    document.querySelectorAll('.step-item').forEach((el, i) => {
        el.classList.remove('active','done');
        if (i + 1 < n) el.classList.add('done');
        if (i + 1 === n) el.classList.add('active');
    });
    document.querySelectorAll('.step-line').forEach((el, i) => {
        el.classList.toggle('done', i < n - 1);
    });

    state.currentStep = n;
    if (n === 4) renderSummaryMini();
    window.scrollTo({ top: 0, behavior: 'smooth' });
}

// ── Helpers ────────────────────────────────────────────────
function toDateStr(d) {
    return d.getFullYear() + '-' + String(d.getMonth()+1).padStart(2,'0') + '-' + String(d.getDate()).padStart(2,'0');
}
function hideLoading() {
    document.getElementById('loadingOverlay').classList.add('hidden');
}
function showError(msg) {
    document.querySelector('.booking-card').innerHTML = `<div style="text-align:center;padding:60px 24px;color:#475569"><i class="fas fa-exclamation-circle" style="font-size:48px;color:#ef4444;margin-bottom:16px;display:block"></i><h3 style="margin-bottom:8px">${msg}</h3></div>`;
}
function showToast(msg, type='info') {
    const c = document.getElementById('toastContainer');
    const t = document.createElement('div');
    t.className = 'toast ' + type;
    t.textContent = msg;
    c.appendChild(t);
    setTimeout(() => t.remove(), 3500);
}
function showFieldError(id, msg) {
    const el = document.getElementById(id);
    el.textContent = msg; el.classList.add('visible');
}
function hideFieldError(id) {
    const el = document.getElementById(id);
    el.textContent = ''; el.classList.remove('visible');
}

