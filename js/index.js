/* ============================================================
       FIREBASE CONFIGURATION
       ============================================================ */
   
    const firebaseConfig = {
        apiKey: "AIzaSyCCvnw5eBBjUAa0piQ7Njy2t_W4TVZSIwk",
        authDomain: "nexbook-14d69.firebaseapp.com",
        projectId: "nexbook-14d69",
        storageBucket: "nexbook-14d69.firebasestorage.app",
        messagingSenderId: "445301731220",
        appId: "1:445301731220:web:500608bc6903aa8a40e981",
        measurementId: "G-VYH8GSRLZD"
    };

    let auth, db;
    let firebaseReady = false;

    try {
        firebase.initializeApp(firebaseConfig);
// -- Controle de Acesso / Paywall --------------------------------
const ADMIN_UIDS = ["Nrq4TYVDGsfboHOPDx7csCF0QSi2","O525l43Yzxatu5ckI7k8J1VLfjU2","SpygmGopNAXhban8lTi8JaBvAoG2","pZQbVSQkaid4lYSTDcNarjZTUHl1","tx3jN29YGcUzDu2kLGlErI86CgW2"];

async function checkSubscriptionAndRedirect(user) {
    if (!user) { window.location.href = 'index.html'; return; }
    if (ADMIN_UIDS.includes(user.uid)) { window.location.href = 'boas-vindas.html'; return; }
    try {
        const db = firebase.firestore();
        // Verificar se eh funcionario criado pelo admin (tem createdBy)
        const userDoc = await db.collection('users').doc(user.uid).get();
        if (userDoc.exists && userDoc.data().createdBy) {
            window.location.href = 'boas-vindas.html'; return;
        }

        // CORRECAO: Criar trial localmente se a funcao falhar
        let trialCreated = false;
        try {
            const fn = firebase.app().functions('southamerica-east1');
            const result = await fn.httpsCallable('ensureTrialAccess')({});
            trialCreated = result.data && result.data.trialCreated;
        } catch (trialError) {
            console.warn('ensureTrialAccess falhou, criando trial localmente:', trialError);
            // CORRECAO: Criar trial diretamente no Firestore
            const subRef = db.collection('subscriptions').doc(user.uid);
            const subDoc = await subRef.get();
            if (!subDoc.exists) {
                const now = firebase.firestore.Timestamp.now();
                const expires = firebase.firestore.Timestamp.fromDate(new Date(Date.now() + 7 * 24 * 60 * 60 * 1000));
                await subRef.set({
                    status: 'active',
                    plan: 'trial',
                    startDate: now,
                    expiresAt: expires,
                    updatedAt: now,
                    trialDays: 7,
                    automaticTrial: true,
                    email: user.email || ''
                });
                trialCreated = true;
                console.log('Trial criado localmente com sucesso!');
            }
        }

        // Se o trial foi criado agora, vai direto pro dashboard
        if (trialCreated) {
            window.location.href = 'boas-vindas.html';
            return;
        }

        const doc = await db.collection('subscriptions').doc(user.uid).get();
        if (doc.exists) {
            const sub = doc.data();
            const now = new Date();
            const exp = sub.expiresAt && sub.expiresAt.toDate ? sub.expiresAt.toDate() : new Date(0);
            if (sub.status === 'active' && exp > now) {
                window.location.href = 'boas-vindas.html'; return;
            }
        }
        window.location.href = 'pagamento.html?uid=' + user.uid + '&email=' + encodeURIComponent(user.email || '');
    } catch(e) {
        console.error('checkSubscription error:', e);
        window.location.href = 'boas-vindas.html';
    }
}
        auth = firebase.auth();
        db   = firebase.firestore();
        firebaseReady = true;
        console.log('Firebase Auth inicializado');

        // Persistence: remember me
        auth.setPersistence(
            firebase.auth.Auth.Persistence.LOCAL
        ).catch(console.error);

        // Auth state observer
        // FIX #1: Adicionado guard para evitar loop de redirect no dashboard
        auth.onAuthStateChanged(async (user) => {
            if (user && !window.location.pathname.includes('dashboard')) {
                console.log('Usuario autenticado:', user.displayName || user.email);
                showToast('success', 'Autenticado!', `Bem-vindo, ${user.displayName || user.email}`);
                checkSubscriptionAndRedirect(user);


            }
        });

    } catch (e) {
        console.warn('Firebase nao configurado - modo demonstracao ativo.');
        firebaseReady = false;
    }

    /* ============================================================
       THEME
       ============================================================ */
    function toggleTheme() {
        document.body.classList.toggle('dark');
        const icon = document.getElementById('themeIcon');
        const isDark = document.body.classList.contains('dark');
        icon.className = isDark ? 'fas fa-sun' : 'fas fa-moon';
        localStorage.setItem('nexbook_theme', isDark ? 'dark' : 'light');
    }

    (function initTheme() {
        const saved = localStorage.getItem('nexbook_theme');
        if (saved === 'dark') {
            document.body.classList.add('dark');
            document.getElementById('themeIcon').className = 'fas fa-sun';
        }
    })();

    /* ============================================================
       TAB SWITCHER
       ============================================================ */
    function switchTab(tab) {
        const tabs = document.querySelectorAll('.tab');
        tabs.forEach((t, i) => {
            t.classList.toggle('active', (tab === 'login' ? i === 0 : i === 1));
        });
        document.getElementById('loginForm').style.display    = tab === 'login'    ? 'block' : 'none';
        document.getElementById('registerForm').style.display = tab === 'register' ? 'block' : 'none';
        document.getElementById('forgotPanel').classList.remove('show');
        document.getElementById('loginPanel').style.display = 'block';
    }

    /* ============================================================
       FORGOT PASSWORD PANEL
       ============================================================ */
    function showForgot() {
        document.getElementById('loginPanel').style.display = 'none';
        const fp = document.getElementById('forgotPanel');
        fp.classList.add('show');
        fp.style.display = 'block';
    }
    function hideForgot() {
        document.getElementById('forgotPanel').classList.remove('show');
        document.getElementById('forgotPanel').style.display = 'none';
        document.getElementById('loginPanel').style.display  = 'block';
    }

    /* ============================================================
       VALIDATION HELPERS
       ============================================================ */
    function setValidIcon(iconId, state) {
        const el = document.getElementById(iconId);
        if (!el) return;
        el.className = 'input-valid-icon';
        if (state === 'ok')  { el.innerHTML = '<i class="fas fa-check-circle"></i>'; el.classList.add('show','ok'); }
        if (state === 'bad') { el.innerHTML = '<i class="fas fa-times-circle"></i>'; el.classList.add('show','bad'); }
        if (!state)          { el.classList.remove('show','ok','bad'); }
    }

    function showFieldError(errId, msg, inputEl) {
        const err = document.getElementById(errId);
        if (err) { err.textContent = msg; err.classList.toggle('show', !!msg); }
        if (inputEl) { inputEl.classList.toggle('error', !!msg); inputEl.classList.toggle('success', !msg && inputEl.value); }
    }

    function isValidEmail(v) {
        return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v.trim());
    }

    function validateLoginEmail(inp) {
        if (!inp.value) { showFieldError('loginEmailErr','',inp); setValidIcon('loginEmailIcon'); return; }
        const ok = isValidEmail(inp.value);
        showFieldError('loginEmailErr', ok ? '' : 'Email invalido.', inp);
        setValidIcon('loginEmailIcon', ok ? 'ok' : 'bad');
    }

    function validateLoginPassword(inp) {
        if (!inp.value) { showFieldError('loginPasswordErr','',inp); return; }
        const ok = inp.value.length >= 6;
        showFieldError('loginPasswordErr', ok ? '' : 'Minimo 6 caracteres.', inp);
    }

    function validateRegName(inp) {
        updateAvatar(inp.value);
        if (!inp.value) { showFieldError('regNameErr','',inp); setValidIcon('regNameIcon'); return; }
        const ok = inp.value.trim().split(' ').length >= 2 && inp.value.trim().length >= 3;
        showFieldError('regNameErr', ok ? '' : 'Informe nome e sobrenome.', inp);
        setValidIcon('regNameIcon', ok ? 'ok' : 'bad');
    }

    function validateRegEmail(inp) {
        if (!inp.value) { showFieldError('regEmailErr','',inp); setValidIcon('regEmailIcon'); return; }
        const ok = isValidEmail(inp.value);
        showFieldError('regEmailErr', ok ? '' : 'Email invalido.', inp);
        setValidIcon('regEmailIcon', ok ? 'ok' : 'bad');
    }

    function validateConfirm(inp) {
        const pw = document.getElementById('regPassword').value;
        if (!inp.value) { showFieldError('regConfirmErr','',inp); setValidIcon('regConfirmIcon'); return; }
        const ok = inp.value === pw;
        showFieldError('regConfirmErr', ok ? '' : 'As senhas nao coincidem.', inp);
        setValidIcon('regConfirmIcon', ok ? 'ok' : 'bad');
    }

    /* Password strength */
    function checkPasswordStrength(inp) {
        const pw = inp.value;
        const bar = document.getElementById('pwStrength');
        const fill = document.getElementById('strengthFill');
        const label = document.getElementById('strengthLabel');

        if (!pw) { bar.classList.remove('show'); return; }
        bar.classList.add('show');

        let score = 0;
        if (pw.length >= 8)  score++;
        if (pw.length >= 12) score++;
        if (/[A-Z]/.test(pw)) score++;
        if (/[0-9]/.test(pw)) score++;
        if (/[^A-Za-z0-9]/.test(pw)) score++;

        const levels = [
            { pct:'20%', color:'#ef4444', text:'Muito fraca' },
            { pct:'40%', color:'#f97316', text:'Fraca' },
            { pct:'60%', color:'#f59e0b', text:'Moderada' },
            { pct:'80%', color:'#22c55e', text:'Forte' },
            { pct:'100%',color:'#10b981', text:'Muito forte' },
        ];
        const l = levels[Math.min(score, 4)];
        fill.style.width = l.pct;
        fill.style.background = l.color;
        label.textContent = l.text;
        label.style.color = l.color;

        showFieldError('regPasswordErr', pw.length < 8 ? 'Minimo 8 caracteres.' : '', inp);
    }

    /* Avatar preview */
    function updateAvatar(name) {
        const av = document.getElementById('regAvatar');
        if (!name.trim()) { av.textContent = '?'; return; }
        const parts = name.trim().split(' ');
        av.textContent = parts.length >= 2
            ? (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
            : name.trim()[0].toUpperCase();
    }

    /* Toggle password visibility */
    function togglePw(id, btn) {
        const inp = document.getElementById(id);
        const icon = btn.querySelector('i');
        if (inp.type === 'password') {
            inp.type = 'text';
            icon.className = 'fas fa-eye-slash';
        } else {
            inp.type = 'password';
            icon.className = 'fas fa-eye';
        }
    }

    /* Enter key on login */
    function handleLoginEnter(e) {
        if (e.key === 'Enter') handleLogin();
    }

    /* ============================================================
       DEMO FALLBACK (no Firebase configured)
       ============================================================ */
    function demoLogin(displayName) {
        showToast('success', 'Modo demonstracao', `Bem-vindo, ${displayName || 'Usuario'}!`);
        setTimeout(async () => {
            await checkSubscriptionAndRedirect(user);
        }, 1400);
    }

    /* ============================================================
       EMAIL / PASSWORD LOGIN
       ============================================================ */
    async function handleLogin() {
        const email    = document.getElementById('loginEmail').value.trim();
        const password = document.getElementById('loginPassword').value;
        const btn      = document.getElementById('loginBtn');

        // Basic validation
        let hasErr = false;
        if (!isValidEmail(email)) {
            showFieldError('loginEmailErr', 'Informe um email valido.', document.getElementById('loginEmail'));
            hasErr = true;
        }
        if (password.length < 6) {
            showFieldError('loginPasswordErr', 'Senha muito curta.', document.getElementById('loginPassword'));
            hasErr = true;
        }
        if (hasErr) return;

        // Persistence
        const persist = document.getElementById('rememberMe').checked
            ? firebase.auth.Auth.Persistence.LOCAL
            : firebase.auth.Auth.Persistence.SESSION;

        setLoading(btn, true);

        if (!firebaseReady) { setTimeout(() => { setLoading(btn,false); demoLogin(email.split('@')[0]); }, 1200); return; }

        try {
            await auth.setPersistence(persist);
            await auth.signInWithEmailAndPassword(email, password);
            // onAuthStateChanged handles redirect
        } catch (err) {
            setLoading(btn, false);
            handleAuthError(err);
        }
    }

    /* ============================================================
       REGISTER
       ============================================================ */
    async function handleRegister() {
        const name     = document.getElementById('regName').value.trim();
        const email    = document.getElementById('regEmail').value.trim();
        const password = document.getElementById('regPassword').value;
        const confirm  = document.getElementById('regConfirm').value;
        const agreed   = document.getElementById('agreeTerms').checked;
        const btn      = document.getElementById('registerBtn');

        let hasErr = false;
        if (!name || name.split(' ').length < 2) {
            showFieldError('regNameErr', 'Informe nome e sobrenome.', document.getElementById('regName'));
            hasErr = true;
        }
        if (!isValidEmail(email)) {
            showFieldError('regEmailErr', 'Email invalido.', document.getElementById('regEmail'));
            hasErr = true;
        }
        if (password.length < 8) {
            showFieldError('regPasswordErr', 'Minimo 8 caracteres.', document.getElementById('regPassword'));
            hasErr = true;
        }
        if (password !== confirm) {
            showFieldError('regConfirmErr', 'Senhas nao coincidem.', document.getElementById('regConfirm'));
            hasErr = true;
        }
        if (!agreed) {
            showToast('warn', 'Atencao', 'Voce precisa aceitar os Termos de Uso.');
            hasErr = true;
        }
        if (hasErr) return;

        setLoading(btn, true);

        if (!firebaseReady) {
            setTimeout(() => { setLoading(btn,false); demoLogin(name); }, 1400);
            return;
        }

        try {
            const cred = await auth.createUserWithEmailAndPassword(email, password);
            await cred.user.updateProfile({ displayName: name });
            // Save profile to Firestore
            if (db) {
                await db.collection('users').doc(cred.user.uid).set({
                    displayName: name,
                    email,
                    plan: 'free',
                    createdAt: firebase.firestore.FieldValue.serverTimestamp()
                });
            }
            showToast('success', 'Conta criada!', 'Bem-vindo ao NEXBOOK');
            // onAuthStateChanged handles redirect
        } catch (err) {
            setLoading(btn, false);
            handleAuthError(err);
        }
    }

    /* ============================================================
       FORGOT PASSWORD
       ============================================================ */
    async function handleForgotPassword() {
        const email = document.getElementById('forgotEmail').value.trim();
        const btn   = document.getElementById('forgotBtn');

        if (!isValidEmail(email)) {
            showFieldError('forgotEmailErr', 'Informe um email valido.', document.getElementById('forgotEmail'));
            return;
        }

        setLoading(btn, true);

        if (!firebaseReady) {
            setTimeout(() => {
                setLoading(btn, false);
                showToast('info', 'Demo', 'Link de redefinicao enviado (simulacao).');
                hideForgot();
            }, 1200);
            return;
        }

        try {
            await auth.sendPasswordResetEmail(email);
            setLoading(btn, false);
            showToast('success', 'Email enviado!', `Verifique a caixa de ${email}`);
            setTimeout(hideForgot, 2500);
        } catch (err) {
            setLoading(btn, false);
            handleAuthError(err);
        }
    }

    /* ============================================================
       SOCIAL PROVIDERS - APENAS GOOGLE E GITHUB
       ============================================================ */
    async function signInWithGoogle() {
        if (!firebaseReady) { demoLogin('Usuario Google'); return; }
        const provider = new firebase.auth.GoogleAuthProvider();
        provider.addScope('profile');
        provider.addScope('email');
        try {
            await auth.signInWithPopup(provider);
        } catch (err) { handleAuthError(err); }
    }

    async function signInWithGitHub() {
        if (!firebaseReady) { demoLogin('Usuario GitHub'); return; }
        const provider = new firebase.auth.GithubAuthProvider();
        provider.addScope('user:email');
        try {
            await auth.signInWithPopup(provider);
        } catch (err) { handleAuthError(err); }
    }

    /* ============================================================
       ERROR HANDLER
       ============================================================ */
    function handleAuthError(err) {
        const map = {
            'auth/user-not-found':         'Usuario nao encontrado.',
            'auth/wrong-password':         'Senha incorreta.',
            'auth/invalid-email':          'Email invalido.',
            'auth/email-already-in-use':   'Este email ja esta em uso.',
            'auth/weak-password':          'Senha muito fraca (min. 6 caracteres).',
            'auth/too-many-requests':      'Muitas tentativas. Aguarde e tente novamente.',
            'auth/network-request-failed': 'Sem conexao. Verifique sua internet.',
            'auth/popup-closed-by-user':   'Login cancelado.',
            'auth/account-exists-with-different-credential':
                                           'Email ja cadastrado com outro metodo de login.',
            'auth/invalid-credential':     'Credencial invalida. Tente novamente.',
        };
        const msg = map[err.code] || `Erro: ${err.message}`;
        showToast('error', 'Falha no acesso', msg);
        console.error(err);
    }

    /* ============================================================
       LOADING STATE
       ============================================================ */
    function setLoading(btn, state) {
        btn.classList.toggle('loading', state);
        btn.disabled = state;
    }

    /* ============================================================
       TOAST SYSTEM
       ============================================================ */
    function showToast(type, title, message, duration = 4500) {
        const icons = { success:'fa-check-circle', error:'fa-times-circle', warn:'fa-exclamation-triangle', info:'fa-info-circle' };
        const container = document.getElementById('toastContainer');
        const toast = document.createElement('div');
        toast.className = `toast ${type}`;
        toast.innerHTML = `
            <span class="toast-icon"><i class="fas ${icons[type] || icons.info}"></i></span>
            <div class="toast-body">
                <strong>${title}</strong>
                <span>${message}</span>
            </div>
            <button class="toast-close" onclick="this.parentElement.remove()">X</button>
        `;
        container.appendChild(toast);
        setTimeout(() => {
            toast.style.transition = 'opacity .4s, transform .4s';
            toast.style.opacity = '0';
            toast.style.transform = 'translateX(24px)';
            setTimeout(() => toast.remove(), 400);
        }, duration);
    }

    /* ============================================================
       KEYBOARD SHORTCUTS
       ============================================================ */
    document.addEventListener('keydown', e => {
        if (e.key === 'Enter' && !e.shiftKey) {
            const active = document.activeElement;
            if (active && active.id === 'forgotEmail') handleForgotPassword();
        }
    });

    /* ============================================================
       TEST NOTIFICATION
       ============================================================ */
    async function testNotification() {
        const currentUserId = auth && auth.currentUser ? auth.currentUser.uid : null;

        if (!currentUserId) {
            showToast('warn', 'Atencao', 'Voce precisa estar logado para testar notificacoes.');
            return;
        }

        let snapshot;
        try {
            snapshot = await db.collection('appointments')
                .where('userId', '==', currentUserId)
                .orderBy('createdAt', 'desc')
                .limit(1)
                .get();
        } catch (err) {
            showToast('error', 'Erro', 'Falha ao buscar agendamentos: ' + err.message);
            return;
        }

        if (snapshot.empty) {
            showToast('warn', 'Atencao', 'Crie um agendamento primeiro.');
            return;
        }

        const appointment = snapshot.docs[0];

        try {
            const response = await fetch('https://us-central1-nexbook-14d69.cloudfunctions.net/testEmail', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    appointmentId: appointment.id
                })
            });

            const result = await response.json();

            if (result.success) {
                showToast('success', 'Sucesso', 'Notificacao de teste simulada com sucesso!');
            } else {
                showToast('error', 'Erro', result.error || 'Erro desconhecido.');
            }
        } catch (error) {
            console.error('Erro:', error);
            showToast('error', 'Erro', 'Falha ao testar notificacao: ' + error.message);
        }
    }
