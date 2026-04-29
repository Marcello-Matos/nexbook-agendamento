(function () {
  var db = firebase.firestore();
  var fn = firebase.app().functions("southamerica-east1");
  var logado = null;

  function esc(v) {
    return String(v || "").replace(/[&<>"]/g, function (c) {
      return {"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;"}[c];
    });
  }

  function msg(texto, tipo) {
    var el = document.getElementById("auMsg");
    if (!el) { alert(texto); return; }
    el.textContent = texto;
    el.className = "users-msg " + (tipo || "info");
  }

  function val(id) {
    var el = document.getElementById(id);
    return el ? el.value.trim() : "";
  }

  function montar() {
    var view = document.getElementById("usersView");
    if (!view) return;
    view.innerHTML = [
      '<style>',
      '.up{padding:28px;background:radial-gradient(circle at 80% 0,rgba(79,70,229,.13),transparent 35%),radial-gradient(circle at 10% 100%,rgba(20,184,166,.10),transparent 30%)}',
      '.uhero{border-radius:24px;padding:28px 32px;margin-bottom:22px;background:linear-gradient(135deg,#111827 0%,#312e81 55%,#4f46e5 100%);color:#fff;box-shadow:0 20px 50px rgba(15,23,42,.22);display:flex;justify-content:space-between;align-items:center;gap:20px;flex-wrap:wrap}',
      '.uhero h1{margin:0;font-size:clamp(26px,4vw,40px);letter-spacing:-.04em}',
      '.uhero p{margin:8px 0 0;color:rgba(255,255,255,.75);font-size:14px;max-width:600px;line-height:1.6}',
      '.uhero-kicker{display:inline-flex;gap:8px;align-items:center;padding:7px 13px;border:1px solid rgba(255,255,255,.2);background:rgba(255,255,255,.1);border-radius:999px;font-size:11px;font-weight:900;letter-spacing:.08em;text-transform:uppercase;margin-bottom:12px}',
      '.uhero-stat{min-width:160px;padding:16px 22px;border-radius:20px;background:rgba(255,255,255,.12);border:1px solid rgba(255,255,255,.18);text-align:center}',
      '.uhero-stat strong{display:block;font-size:32px;line-height:1;color:#fff}',
      '.uhero-stat span{color:rgba(255,255,255,.7);font-size:12px;font-weight:700}',
      '.ugrid{display:grid;grid-template-columns:minmax(300px,400px) 1fr;gap:20px;align-items:start}',
      '.ucard{background:#fff;border:1px solid #e8edf5;box-shadow:0 12px 36px rgba(15,23,42,.07);border-radius:22px;overflow:hidden}',
      '.ucard-head{padding:22px 24px 0}',
      '.ucard-head h2{margin:0;font-size:19px;letter-spacing:-.02em;color:#0f172a}',
      '.ucard-head p{margin:6px 0 0;color:#64748b;font-size:13px}',
      '.uform{padding:20px 24px 24px}',
      '.ufld{margin-bottom:14px}',
      '.ufld label{display:block;margin-bottom:7px;color:#334155;font-size:12px;font-weight:900;letter-spacing:.04em;text-transform:uppercase}',
      '.uwrap{position:relative}',
      '.uwrap i{position:absolute;left:13px;top:50%;transform:translateY(-50%);color:#818cf8;font-size:13px}',
      '.ufld input{width:100%;height:46px;padding:0 12px 0 38px;border:1.5px solid #dce3f0;border-radius:13px;outline:none;color:#0f172a;font-size:14px;transition:.2s;box-sizing:border-box;background:#f9faff}',
      '.ufld input:focus{border-color:#6366f1;background:#fff;box-shadow:0 0 0 3px rgba(99,102,241,.12)}',
      '.uperm-grid{display:grid;grid-template-columns:1fr;gap:8px;margin:14px 0 18px}',
      '.uperm{display:flex;align-items:center;gap:10px;padding:11px 14px;border:1.5px solid #e8edf5;border-radius:13px;background:#f9faff;color:#334155;font-size:13px;font-weight:700;cursor:pointer;transition:.18s ease}',
      '.uperm:hover{border-color:#c7d2fe;background:#eef2ff;transform:translateY(-1px)}',
      '.uperm input{width:15px;height:15px;accent-color:#4f46e5}',
      '.ubtn{width:100%;height:48px;border:none;border-radius:14px;background:linear-gradient(135deg,#4f46e5,#7c3aed);color:#fff;font-weight:900;font-size:14px;cursor:pointer;box-shadow:0 12px 24px rgba(79,70,229,.28);transition:.2s;display:flex;align-items:center;justify-content:center;gap:9px}',
      '.ubtn:hover{transform:translateY(-2px);box-shadow:0 16px 32px rgba(79,70,229,.35)}',
      '.ubtn:disabled{opacity:.6;cursor:not-allowed;transform:none}',
      '.users-msg{display:none;margin-bottom:14px;padding:13px 15px;border-radius:13px;font-weight:800;font-size:13px}',
      '.users-msg.success{display:block;background:#dcfce7;color:#166534;border:1px solid #bbf7d0}',
      '.users-msg.error{display:block;background:#fee2e2;color:#991b1b;border:1px solid #fecaca}',
      '.users-msg.info{display:block;background:#dbeafe;color:#1e40af;border:1px solid #bfdbfe}',
      '.utbar{padding:0 24px 16px;display:flex;justify-content:space-between;gap:12px;align-items:center}',
      '.usearch{position:relative;flex:1;max-width:340px}',
      '.usearch i{position:absolute;left:12px;top:50%;transform:translateY(-50%);color:#94a3b8;font-size:13px}',
      '.usearch input{width:100%;height:42px;padding:0 12px 0 36px;border:1.5px solid #dce3f0;border-radius:13px;outline:none;background:#f9faff;box-sizing:border-box;font-size:13px}',
      '.ughost{height:42px;border:1.5px solid #dce3f0;background:#fff;color:#334155;border-radius:13px;padding:0 14px;font-weight:800;font-size:13px;cursor:pointer;display:flex;align-items:center;gap:7px;transition:.18s ease}',
      '.ughost:hover{border-color:#818cf8;color:#4f46e5;transform:translateY(-1px)}',
      '.utable-wrap{padding:0 16px 20px;overflow-x:auto}',
      '.utable{width:100%;border-collapse:separate;border-spacing:0 8px;min-width:540px}',
      '.utable th{text-align:left;padding:0 14px 6px;color:#94a3b8;font-size:11px;letter-spacing:.08em;text-transform:uppercase;font-weight:900}',
      '.utable td{padding:14px;background:#fff;border-top:1px solid #f1f5f9;border-bottom:1px solid #f1f5f9;font-size:13px;color:#0f172a;transition:.15s}',
      '.utable tr:hover td{background:#f8faff}',
      '.utable td:first-child{border-left:1px solid #f1f5f9;border-radius:14px 0 0 14px}',
      '.utable td:last-child{border-right:1px solid #f1f5f9;border-radius:0 14px 14px 0}',
      '.ucell{display:flex;align-items:center;gap:10px}',
      '.uavatar{width:36px;height:36px;border-radius:12px;background:linear-gradient(135deg,#4f46e5,#14b8a6);color:#fff;display:flex;align-items:center;justify-content:center;font-weight:900;font-size:14px;flex-shrink:0;box-shadow:0 6px 16px rgba(79,70,229,.22)}',
      '.uname{font-weight:900;color:#0f172a;font-size:13px}',
      '.uemail{color:#64748b;font-size:11px;margin-top:2px}',
      '.upill{display:inline-flex;align-items:center;gap:6px;padding:6px 10px;border-radius:999px;font-weight:900;font-size:11px;text-transform:capitalize}',
      '.upill-role{background:#eef2ff;color:#4338ca}',
      '.upill-ok{background:#dcfce7;color:#166534}',
      '.uempty{padding:28px;text-align:center;color:#64748b;background:#f8fafc;border-radius:16px;border:1px dashed #cbd5e1;font-size:14px}',
      '@media(max-width:1050px){.ugrid{grid-template-columns:1fr}}',
      '@media(max-width:640px){.up{padding:16px}.uhero{flex-direction:column;padding:20px}.utbar{flex-direction:column;align-items:stretch}.usearch{max-width:none}}',
      '</style>',
      '<div class="up">',
        '<div class="uhero">',
          '<div>',
            '<div class="uhero-kicker"><i class="fas fa-shield-alt"></i> Gestao de acesso</div>',
            '<h1>Usuarios da equipe</h1>',
            '<p>Cadastre funcionarios, defina permissoes e acompanhe todos os acessos do sistema em uma tela profissional.</p>',
          '</div>',
          '<div class="uhero-stat"><strong id="auTotal">0</strong><span>usuarios cadastrados</span></div>',
        '</div>',
        '<div class="ugrid">',
          '<section class="ucard">',
            '<div class="ucard-head"><h2>Novo usuario</h2><p>Crie um acesso com senha e permissoes.</p></div>',
            '<div class="uform">',
              '<div id="auMsg" class="users-msg"></div>',
              '<div class="ufld"><label>Nome completo</label><div class="uwrap"><i class="fas fa-user"></i><input type="text" id="auName" placeholder="Ex: Ana Souza"></div></div>',
              '<div class="ufld"><label>E-mail</label><div class="uwrap"><i class="fas fa-envelope"></i><input type="email" id="auEmail" placeholder="usuario@empresa.com"></div></div>',
              '<div class="ufld"><label>Senha</label><div class="uwrap"><i class="fas fa-lock"></i><input type="password" id="auPassword" placeholder="Minimo 6 caracteres"></div></div>',
              '<label style="display:block;margin:16px 0 8px;color:#334155;font-size:12px;font-weight:900;text-transform:uppercase;letter-spacing:.04em">Permissoes</label>',
              '<div class="uperm-grid">',
                '<label class="uperm"><input type="checkbox" id="pEditarAgenda" checked> Editar agenda</label>',
                '<label class="uperm"><input type="checkbox" id="pVerClientes" checked> Ver clientes</label>',
                '<label class="uperm"><input type="checkbox" id="pVerFinanceiro"> Ver financeiro</label>',
                '<label class="uperm"><input type="checkbox" id="pGerenciarServicos"> Gerenciar servicos</label>',
                '<label class="uperm"><input type="checkbox" id="pGerenciarProfissionais"> Gerenciar profissionais</label>',
                '<label class="uperm"><input type="checkbox" id="pVerRelatorios"> Ver relatorios</label>',
              '</div>',
              '<button class="ubtn" id="auCreateBtn" type="button"><i class="fas fa-user-plus"></i> Criar usuario</button>',
            '</div>',
          '</section>',
          '<section class="ucard">',
            '<div class="ucard-head"><h2>Usuarios cadastrados</h2><p>Consulte rapidamente quem ja possui acesso.</p></div>',
            '<div class="utbar">',
              '<div class="usearch"><i class="fas fa-search"></i><input id="auSearch" type="text" placeholder="Buscar por nome ou e-mail"></div>',
              '<button class="ughost" id="auRefreshBtn" type="button"><i class="fas fa-sync-alt"></i> Atualizar</button>',
            '</div>',
            '<div id="auLista" class="utable-wrap"><div class="uempty">Carregando...</div></div>',
          '</section>',
        '</div>',
      '</div>'
    ].join("");

    document.getElementById("auCreateBtn").addEventListener("click", criar);
    document.getElementById("auRefreshBtn").addEventListener("click", listar);
    document.getElementById("auSearch").addEventListener("input", filtrar);
    listar();
  }

  var cache = [];

  async function listar() {
    var el = document.getElementById("auLista");
    if (!el || !logado) return;
    el.innerHTML = '<div class="uempty">Carregando...</div>';
    try {
      var snap = await db.collection("users").where("createdBy", "==", logado.uid).get();
      cache = [];
      snap.forEach(function (doc) {
        var u = doc.data() || {};
        cache.push({ id: doc.id, name: u.name || "", email: u.email || "", role: u.role || "funcionario", createdAt: u.createdAt });
      });
      cache.sort(function (a, b) {
        var da = a.createdAt && a.createdAt.toMillis ? a.createdAt.toMillis() : 0;
        var db2 = b.createdAt && b.createdAt.toMillis ? b.createdAt.toMillis() : 0;
        return db2 - da;
      });
      render(cache);
    } catch (e) {
      console.error(e);
      el.innerHTML = '<div class="uempty" style="color:#991b1b">Erro ao carregar: ' + esc(e.message) + '</div>';
    }
  }

  function filtrar() {
    var t = val("auSearch").toLowerCase();
    render(cache.filter(function (u) { return u.name.toLowerCase().indexOf(t) > -1 || u.email.toLowerCase().indexOf(t) > -1; }));
  }

  function render(list) {
    var el = document.getElementById("auLista");
    var tot = document.getElementById("auTotal");
    if (tot) tot.textContent = cache.length;
    if (!el) return;
    if (!list.length) { el.innerHTML = '<div class="uempty">Nenhum usuario encontrado.</div>'; return; }
    var h = '<table class="utable"><thead><tr><th>Usuario</th><th>Perfil</th><th>Criado em</th><th>Acoes</th></tr></thead><tbody>';
    list.forEach(function (u) {
      var ini = u.name.trim().charAt(0).toUpperCase() || "U";
      var dt = u.createdAt && u.createdAt.toDate ? u.createdAt.toDate().toLocaleDateString("pt-BR") : "-";
      h += '<tr>';
      h += '<td><div class="ucell"><div class="uavatar">' + esc(ini) + '</div><div><div class="uname">' + esc(u.name || "Sem nome") + '</div><div class="uemail">' + esc(u.email || "-") + '</div></div></div></td>';
      h += '<td><span class="upill upill-role"><i class="fas fa-id-badge"></i>' + esc(u.role) + '</span></td>';
      h += '<td style="color:#64748b;font-size:12px">' + dt + '</td>';
      h += '<td><div style="display:flex;gap:7px;">'
         + '<button onclick="auEditar(\'' + u.id + '\')" style="height:34px;padding:0 13px;border:1.5px solid #c7d2fe;background:#eef2ff;color:#4338ca;border-radius:10px;font-weight:900;font-size:12px;cursor:pointer;" title="Editar"><i class="fas fa-pen"></i></button>'
         + '<button onclick="auExcluir(\'' + u.id + '\',\'' + esc(u.name) + '\')" style="height:34px;padding:0 13px;border:1.5px solid #fecaca;background:#fff5f5;color:#dc2626;border-radius:10px;font-weight:900;font-size:12px;cursor:pointer;" title="Excluir"><i class="fas fa-trash"></i></button>'
         + '</div></td>';
      h += '</tr>';
    });
    h += '</tbody></table>';
    h += '<div id="auModal" style="display:none;position:fixed;inset:0;background:rgba(0,0,0,.45);z-index:9999;display:none;align-items:center;justify-content:center;">'
      + '<div style="background:#fff;border-radius:22px;padding:28px;width:100%;max-width:480px;box-shadow:0 30px 70px rgba(15,23,42,.22);margin:16px;">'
      + '<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:20px;">'
      + '<h2 id="auModalTitle" style="margin:0;font-size:20px;color:#0f172a;">Editar usuario</h2>'
      + '<button onclick="auFecharModal()" style="background:none;border:none;font-size:20px;cursor:pointer;color:#64748b;">&times;</button>'
      + '</div>'
      + '<div id="auModalBody"></div>'
      + '</div></div>';
    el.innerHTML = h;
    document.getElementById("auModal").style.display = "none";
  }

  function auFecharModal() {
    var m = document.getElementById("auModal");
    if (m) m.style.display = "none";
  }

  function auEditar(uid) {
    var u = cache.find(function(x){ return x.id === uid; });
    if (!u) return;
    var m = document.getElementById("auModal");
    var body = document.getElementById("auModalBody");
    if (!m || !body) return;
    var perms = u.permissions || {};
    body.innerHTML = '<div class="ufld"><label>Nome</label><div class="uwrap"><i class="fas fa-user"></i><input id="meNome" type="text" value="' + esc(u.name) + '" style="width:100%;height:46px;padding:0 12px 0 38px;border:1.5px solid #dce3f0;border-radius:13px;outline:none;font-size:14px;box-sizing:border-box;"></div></div>'
      + '<label style="display:block;margin:14px 0 8px;font-size:12px;font-weight:900;text-transform:uppercase;color:#334155;">Permissoes</label>'
      + '<div style="display:grid;gap:8px;margin-bottom:20px;">'
      + '<label style="display:flex;align-items:center;gap:10px;padding:10px 14px;border:1.5px solid #e8edf5;border-radius:12px;background:#f9faff;font-size:13px;font-weight:700;cursor:pointer;"><input type="checkbox" id="mePa" ' + (perms.editarAgenda ? 'checked' : '') + '> Editar agenda</label>'
      + '<label style="display:flex;align-items:center;gap:10px;padding:10px 14px;border:1.5px solid #e8edf5;border-radius:12px;background:#f9faff;font-size:13px;font-weight:700;cursor:pointer;"><input type="checkbox" id="mePc" ' + (perms.verClientes ? 'checked' : '') + '> Ver clientes</label>'
      + '<label style="display:flex;align-items:center;gap:10px;padding:10px 14px;border:1.5px solid #e8edf5;border-radius:12px;background:#f9faff;font-size:13px;font-weight:700;cursor:pointer;"><input type="checkbox" id="mePf" ' + (perms.verFinanceiro ? 'checked' : '') + '> Ver financeiro</label>'
      + '<label style="display:flex;align-items:center;gap:10px;padding:10px 14px;border:1.5px solid #e8edf5;border-radius:12px;background:#f9faff;font-size:13px;font-weight:700;cursor:pointer;"><input type="checkbox" id="mePs" ' + (perms.gerenciarServicos ? 'checked' : '') + '> Gerenciar servicos</label>'
      + '<label style="display:flex;align-items:center;gap:10px;padding:10px 14px;border:1.5px solid #e8edf5;border-radius:12px;background:#f9faff;font-size:13px;font-weight:700;cursor:pointer;"><input type="checkbox" id="mePp" ' + (perms.gerenciarProfissionais ? 'checked' : '') + '> Gerenciar profissionais</label>'
      + '<label style="display:flex;align-items:center;gap:10px;padding:10px 14px;border:1.5px solid #e8edf5;border-radius:12px;background:#f9faff;font-size:13px;font-weight:700;cursor:pointer;"><input type="checkbox" id="mePr" ' + (perms.verRelatorios ? 'checked' : '') + '> Ver relatorios</label>'
      + '</div>'
      + '<div style="display:flex;gap:10px;">'
      + '<button onclick="auSalvar(\'' + uid + '\')" style="flex:1;height:46px;border:none;border-radius:13px;background:linear-gradient(135deg,#4f46e5,#7c3aed);color:#fff;font-weight:900;cursor:pointer;"><i class="fas fa-save"></i> Salvar</button>'
      + '<button onclick="auFecharModal()" style="height:46px;padding:0 18px;border:1.5px solid #dce3f0;border-radius:13px;background:#fff;color:#334155;font-weight:900;cursor:pointer;">Cancelar</button>'
      + '</div>';
    m.style.display = "flex";
  }

  async function auSalvar(uid) {
    var nome = document.getElementById("meNome") ? document.getElementById("meNome").value.trim() : "";
    if (!nome) { alert("Nome obrigatorio"); return; }
    var newPerms = {
      editarAgenda: document.getElementById("mePa").checked,
      verClientes: document.getElementById("mePc").checked,
      verFinanceiro: document.getElementById("mePf").checked,
      gerenciarServicos: document.getElementById("mePs").checked,
      gerenciarProfissionais: document.getElementById("mePp").checked,
      verRelatorios: document.getElementById("mePr").checked
    };
    try {
      await db.collection("users").doc(uid).update({ name: nome, permissions: newPerms, canViewSensitiveData: newPerms.verFinanceiro });
      auFecharModal();
      listar();
    } catch(e) { alert("Erro ao salvar: " + e.message); }
  }

  async function auExcluir(uid, nome) {
    if (!confirm("Excluir o usuario " + nome + "? Esta acao nao pode ser desfeita.")) return;
    try {
      await db.collection("users").doc(uid).delete();
      listar();
    } catch(e) { alert("Erro ao excluir: " + e.message); }
  }
  async function criar() {
    var name = val("auName"), email = val("auEmail"), password = val("auPassword");
    var btn = document.getElementById("auCreateBtn");
    if (!name || !email || !password) { msg("Preencha nome, e-mail e senha.", "error"); return; }
    if (password.length < 6) { msg("Senha minima: 6 caracteres.", "error"); return; }
    var perms = { editarAgenda: document.getElementById("pEditarAgenda").checked, verClientes: document.getElementById("pVerClientes").checked, verFinanceiro: document.getElementById("pVerFinanceiro").checked, gerenciarServicos: document.getElementById("pGerenciarServicos").checked, gerenciarProfissionais: document.getElementById("pGerenciarProfissionais").checked, verRelatorios: document.getElementById("pVerRelatorios").checked };
    try {
      btn.disabled = true;
      btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Criando...';
      await fn.httpsCallable("createUser")({ name: name, email: email, password: password, permissions: perms });
      msg("Usuario cadastrado com sucesso.", "success");
      document.getElementById("auName").value = "";
      document.getElementById("auEmail").value = "";
      document.getElementById("auPassword").value = "";
      listar();
    } catch (e) {
      console.error(e);
      var m = String(e.message || "").toLowerCase();
      if (m.indexOf("already") > -1 || m.indexOf("exists") > -1 || m.indexOf("cadastrado") > -1) {
        msg("USUARIO JA CADASTRADO", "error");
      } else {
        msg("Erro: " + (e.message || "verifique o console"), "error");
      }
    } finally {
      btn.disabled = false;
      btn.innerHTML = '<i class="fas fa-user-plus"></i> Criar usuario';
    }
  }

  document.addEventListener("DOMContentLoaded", function () {
    firebase.auth().onAuthStateChanged(function (user) {
      if (user) { logado = user; montar(); }
    });
  });

  window.listarUsuarios = listar;
  window.montarTelaUsuarios = montar;
  window.auEditar = auEditar;
  window.auExcluir = auExcluir;
  window.auSalvar = auSalvar;
  window.auFecharModal = auFecharModal;
})();