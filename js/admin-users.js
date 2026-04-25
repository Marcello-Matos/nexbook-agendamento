// admin-users.js

const AU_PERMS = [
  { key: 'verFinanceiro',          label: 'Faturamento',      icon: 'fa-dollar-sign',  color: '#f59e0b' },
  { key: 'verRelatorios',          label: 'Relatórios',       icon: 'fa-chart-bar',    color: '#8b5cf6' },
  { key: 'editarAgenda',           label: 'Agenda',           icon: 'fa-calendar-alt', color: '#3b82f6' },
  { key: 'verClientes',            label: 'Clientes',         icon: 'fa-users',        color: '#10b981' },
  { key: 'gerenciarServicos',      label: 'Serviços',         icon: 'fa-cut',          color: '#ec4899' },
  { key: 'gerenciarProfissionais', label: 'Profissionais',    icon: 'fa-user-tie',     color: '#6366f1' }
];

async function loadUsersView() {
  var view = document.getElementById('usersView');
  if (!view) return;

  view.innerHTML = `
<div style="max-width:680px;margin:0 auto;padding:8px 0">

  <div style="background:#fff;border-radius:24px;padding:36px;box-shadow:0 8px 32px rgba(0,0,0,.08);border:1px solid #e2e8f0">

    <!-- Titulo -->
    <div style="display:flex;align-items:center;gap:14px;margin-bottom:32px">
      <div style="width:48px;height:48px;background:linear-gradient(135deg,#4f46e5,#7c3aed);border-radius:14px;display:flex;align-items:center;justify-content:center;flex-shrink:0">
        <i class="fas fa-user-plus" style="color:#fff;font-size:1.1rem"></i>
      </div>
      <div>
        <h2 style="font-size:1.3rem;font-weight:800;color:#0f172a;margin:0 0 2px">Criar Novo Usuário</h2>
        <p style="font-size:.8rem;color:#94a3b8;margin:0">Defina as permissões de acesso ao sistema</p>
      </div>
    </div>

    <!-- Campos -->
    <div style="display:grid;grid-template-columns:1fr 1fr;gap:16px;margin-bottom:16px">
      <div>
        <label style="font-size:.7rem;font-weight:800;color:#64748b;letter-spacing:.08em;text-transform:uppercase;display:block;margin-bottom:6px">Nome Completo</label>
        <input id="auName" type="text" placeholder="Ex: Maria Silva"
          style="width:100%;padding:12px 14px;border:2px solid #e2e8f0;border-radius:12px;font-size:.9rem;color:#0f172a;background:#f8fafc;box-sizing:border-box;outline:none;transition:all .2s"
          onfocus="this.style.borderColor='#4f46e5';this.style.background='#fff';this.style.boxShadow='0 0 0 4px rgba(79,70,229,.08)'"
          onblur="this.style.borderColor='#e2e8f0';this.style.background='#f8fafc';this.style.boxShadow='none'">
      </div>
      <div>
        <label style="font-size:.7rem;font-weight:800;color:#64748b;letter-spacing:.08em;text-transform:uppercase;display:block;margin-bottom:6px">Email</label>
        <input id="auEmail" type="email" placeholder="maria@exemplo.com"
          style="width:100%;padding:12px 14px;border:2px solid #e2e8f0;border-radius:12px;font-size:.9rem;color:#0f172a;background:#f8fafc;box-sizing:border-box;outline:none;transition:all .2s"
          onfocus="this.style.borderColor='#4f46e5';this.style.background='#fff';this.style.boxShadow='0 0 0 4px rgba(79,70,229,.08)'"
          onblur="this.style.borderColor='#e2e8f0';this.style.background='#f8fafc';this.style.boxShadow='none'">
      </div>
    </div>

    <div style="margin-bottom:28px">
      <label style="font-size:.7rem;font-weight:800;color:#64748b;letter-spacing:.08em;text-transform:uppercase;display:block;margin-bottom:6px">Senha Inicial</label>
      <input id="auPassword" type="password" placeholder="Mínimo 6 caracteres"
        style="width:280px;padding:12px 14px;border:2px solid #e2e8f0;border-radius:12px;font-size:.9rem;color:#0f172a;background:#f8fafc;outline:none;transition:all .2s"
        onfocus="this.style.borderColor='#4f46e5';this.style.background='#fff';this.style.boxShadow='0 0 0 4px rgba(79,70,229,.08)'"
        onblur="this.style.borderColor='#e2e8f0';this.style.background='#f8fafc';this.style.boxShadow='none'">
    </div>

    <!-- Permissoes -->
    <div style="margin-bottom:32px">
      <label style="font-size:.7rem;font-weight:800;color:#64748b;letter-spacing:.08em;text-transform:uppercase;display:block;margin-bottom:12px">Permissões de Acesso</label>
      <div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:10px">
        ${AU_PERMS.map(p => `
        <label id="auLabel_${p.key}" style="display:flex;align-items:center;gap:10px;padding:13px 14px;border:2px solid #e2e8f0;border-radius:12px;cursor:pointer;background:#f8fafc;transition:all .2s;user-select:none">
          <input type="checkbox" id="auperm_${p.key}" onchange="auStylePerm('${p.key}','${p.color}')" style="display:none"
            ${(p.key==='editarAgenda'||p.key==='verClientes')?'checked':''}>
          <span style="width:32px;height:32px;border-radius:8px;background:${p.color}20;display:inline-flex;align-items:center;justify-content:center;flex-shrink:0">
            <i class="fas ${p.icon}" style="font-size:.8rem;color:${p.color}"></i>
          </span>
          <span style="font-size:.82rem;font-weight:600;color:#374151">${p.label}</span>
          <i class="fas fa-check-circle" id="auCheck_${p.key}" style="margin-left:auto;font-size:.9rem;color:${p.color};display:${(p.key==='editarAgenda'||p.key==='verClientes')?'block':'none'}"></i>
        </label>`).join('')}
      </div>
    </div>

    <!-- Botoes -->
    <div style="display:flex;gap:12px;padding-top:24px;border-top:1px solid #f1f5f9">
      <button id="auCreateBtn" onclick="auCreateUser()"
        style="display:inline-flex;align-items:center;gap:8px;padding:13px 32px;background:linear-gradient(135deg,#4f46e5,#7c3aed);color:#fff;border:none;border-radius:12px;font-size:.9rem;font-weight:700;cursor:pointer;box-shadow:0 4px 16px rgba(79,70,229,.35);transition:opacity .2s">
        <i class="fas fa-user-plus"></i> Criar Usuário
      </button>
      <button onclick="auLimpar()" style="padding:13px 22px;background:#f1f5f9;color:#64748b;border:none;border-radius:12px;font-size:.9rem;font-weight:600;cursor:pointer">
        Limpar
      </button>
    </div>

  </div>
</div>`;

  // Estilizar os que ja estao marcados
  AU_PERMS.forEach(function(p) {
    if (document.getElementById('auperm_' + p.key) && document.getElementById('auperm_' + p.key).checked) {
      auStylePerm(p.key, p.color);
    }
  });
}

function auStylePerm(key, color) {
  var cb = document.getElementById('auperm_' + key);
  var label = document.getElementById('auLabel_' + key);
  var check = document.getElementById('auCheck_' + key);
  if (!cb || !label) return;
  if (cb.checked) {
    label.style.borderColor = color;
    label.style.background = color + '10';
    if (check) check.style.display = 'block';
  } else {
    label.style.borderColor = '#e2e8f0';
    label.style.background = '#f8fafc';
    if (check) check.style.display = 'none';
  }
}

function auLimpar() {
  var fields = ['auName','auEmail','auPassword'];
  fields.forEach(function(id) { var el=document.getElementById(id); if(el) el.value=''; });
  AU_PERMS.forEach(function(p) {
    var cb = document.getElementById('auperm_' + p.key);
    if (cb) { cb.checked = (p.key==='editarAgenda'||p.key==='verClientes'); auStylePerm(p.key, p.color); }
  });
}

async function auCreateUser() {
  var name = (document.getElementById('auName').value||'').trim();
  var email = (document.getElementById('auEmail').value||'').trim();
  var password = document.getElementById('auPassword').value||'';
  if (!name||!email||!password) { alert('Preencha nome, email e senha!'); return; }
  if (password.length < 6) { alert('A senha precisa ter no mínimo 6 caracteres!'); return; }
  var permissions = {};
  AU_PERMS.forEach(function(p) {
    var cb = document.getElementById('auperm_' + p.key);
    permissions[p.key] = cb ? cb.checked : false;
  });
  var btn = document.getElementById('auCreateBtn');
  btn.disabled=true; btn.innerHTML='<i class="fas fa-spinner fa-spin"></i> Criando...';
  try {
    var fn = firebase.app().functions('southamerica-east1');
    await fn.httpsCallable('createUser')({ name:name, email:email, password:password, permissions:permissions });
    if (typeof showNotification==='function') showNotification('Usuário ' + name + ' criado com sucesso!', 'success');
    auLimpar();
  } catch(e) {
    alert('Erro ao criar usuário: ' + (e.message||e));
  }
  btn.disabled=false; btn.innerHTML='<i class="fas fa-user-plus"></i> Criar Usuário';
}
async function auFindUserByEmail() {
  var email = (document.getElementById('auEmail').value || '').trim().toLowerCase();
  if (!email) { alert('Digite o e-mail do usuário.'); return null; }
  const snap = await firebase.firestore().collection('users').where('email','==',email).limit(1).get();
  if (snap.empty) { alert('Usuário não encontrado com esse e-mail.'); return null; }
  const doc = snap.docs[0];
  return { id: doc.id, data: doc.data() };
}

async function auGrantTrial(days) {
  try {
    var found = await auFindUserByEmail();
    if (!found) return;
    var btn = document.getElementById('auTrialBtn');
    if (btn) { btn.disabled = true; btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Liberando...'; }
    var fn = firebase.app().functions('southamerica-east1');
    await fn.httpsCallable('grantTrialAccess')({ targetUid: found.id, days: days || 7, email: found.data.email || '' });
    if (typeof showNotification==='function') showNotification('Acesso liberado por ' + (days||7) + ' dias para ' + (found.data.email || found.id), 'success');
    else alert('Acesso liberado com sucesso!');
  } catch(e) {
    alert('Erro ao liberar acesso: ' + (e.message || e));
  } finally {
    var btn = document.getElementById('auTrialBtn');
    if (btn) { btn.disabled = false; btn.innerHTML = '<i class="fas fa-bolt"></i> Liberar 7 dias'; }
  }
}



