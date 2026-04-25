// ============================================
// 🔥 VERIFICAÇÃO DE DUPLICAÇÃO
// ============================================
if (window.firebaseInitialized) {
    console.warn('Firebase já foi inicializado, ignorando...');
} else {
    window.firebaseInitialized = true;
    
    // Seu código de inicialização aqui
}


// ============================================
// FIREBASE CONFIG E CONSTANTES DE SEGURANÇA
// ============================================
const firebaseConfig = {
    apiKey: "AIzaSyCCvnw5eBBjUAa0piQ7Njy2t_W4TVZSIwk",
    authDomain: "nexbook-14d69.firebaseapp.com",
    projectId: "nexbook-14d69",
    storageBucket: "nexbook-14d69.firebasestorage.app",
    messagingSenderId: "445301731220",
    appId: "1:445301731220:web:500608bc6903aa8a40e981",
    measurementId: "G-VYH8GSRLZD"
};

// ============================================
// CONSTANTES DE SEGURANÇA
// ============================================
const IS_DEVELOPMENT = window.location.hostname === 'localhost' || 
                       window.location.hostname.includes('vercel.app') ||
                       window.location.hostname.includes('127.0.0.1');

const MAX_IMAGE_SIZE = 5 * 1024 * 1024; // 5MB
const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
const CACHE_TTL = 5 * 60 * 1000; // 5 minutos

// ============================================
// 🔥 CONSTANTES DE PROTEÇÃO AVANÇADA
// ============================================
const SECURITY_LEVEL = 'MAXIMUM';
const DISABLE_DEVTOOLS = true;
const MAX_REQUEST_RETRY = 3;
const REQUEST_TIMEOUT = 10000; // 10 segundos
const SESSION_CHECK_INTERVAL = 30000; // 30 segundos
const MAX_INACTIVITY_TIME = 30 * 60 * 1000; // 30 minutos
const ALLOWED_PAGES = ['index.html', 'login.html', 'register.html', 'recuperar-senha.html'];
const PROTECTED_PAGES = ['dashboard.html', 'dashboard', ''];

// 🔥 Constantes para proteção adicional
const CSRF_TOKEN_KEY = 'nexbook_csrf';
const MAX_REQUESTS_PER_MINUTE = 100;

// ============================================
// VARIÁVEIS GLOBAIS
// ============================================
let auth, db, storage;
let currentUser = null;
let currentUserId = null;
let appointmentsChart, servicesChart, calendar;
let reportsLineChart, reportsPieChart, reportsBarChart;
let editingId = null;
let currentModalType = null;
let currentPhotoBase64 = null;
let isMobileSidebarOpen = false;
let globalSearchTerm = '';

// Variáveis para os color pickers
let primaryPicker, secondaryPicker, backgroundPicker, successPicker;

// 🔥 VARIÁVEIS DE SEGURANÇA
let securityCheckPassed = false;
let devToolsDetected = false;
let requestCount = 0;
let lastRequestTime = Date.now();
let sessionCheckTimer = null;
let lastActivityTime = Date.now();
let csrfToken = null;

// 🔥 Cache com tempo de expiração
const cache = {
    clients: { data: new Map(), timestamp: 0 },
    services: { data: new Map(), timestamp: 0 },
    professionals: { data: new Map(), timestamp: 0 },
    appointments: { data: new Map(), timestamp: 0 },
    
    isExpired(type) {
        const item = this[type];
        return Date.now() - item.timestamp > CACHE_TTL;
    },
    
    set(type, data) {
        if (this[type]) {
            this[type].data = data;
            this[type].timestamp = Date.now();
        }
    },
    
    get(type) {
        if (this.isExpired(type)) {
            return null;
        }
        return this[type].data;
    },
    
    clear() {
        this.clients.data.clear();
        this.services.data.clear();
        this.professionals.data.clear();
        this.appointments.data.clear();
        this.clients.timestamp = 0;
        this.services.timestamp = 0;
        this.professionals.timestamp = 0;
        this.appointments.timestamp = 0;
    },
    
    clearType(type) {
        if (this[type]) {
            this[type].data.clear();
            this[type].timestamp = 0;
        }
    }
};

// ============================================
// INICIALIZAÇÃO DO FIREBASE
// ============================================
try {
    firebase.initializeApp(firebaseConfig);
    auth = firebase.auth();
    db = firebase.firestore();
    storage = firebase.storage();
    
    // Configurar Firestore para usar cache (substitui enablePersistence)
    db.settings({
        cacheSizeBytes: firebase.firestore.CACHE_SIZE_UNLIMITED,
        ignoreUndefinedProperties: true
    });
    
    // Habilitar persistência offline (nova forma)
    firebase.firestore().enablePersistence()
        .catch(err => {
            if (err.code === 'failed-precondition') {
                console.warn('Persistência offline falhou - múltiplas abas abertas');
            } else if (err.code === 'unimplemented') {
                console.warn('Navegador não suporta persistência offline');
            }
        });
    
    secureLog('🔥 Firebase conectado com segurança');
} catch (e) {
    console.error('❌ Erro crítico no Firebase:', e);
    showNotification('Erro ao conectar com o servidor', 'error');
}

// ============================================
// 🔥 CLASSE DE SEGURANÇA PARA FIREBASE SDK
// ============================================
class SecureFirebase {
    constructor() {
        this.operationQueue = [];
        this.processingQueue = false;
    }

    /**
     * Gera token CSRF
     */
    generateCsrfToken() {
        const token = btoa(String.fromCharCode(...crypto.getRandomValues(new Uint8Array(32))));
        localStorage.setItem(CSRF_TOKEN_KEY, token);
        return token;
    }

    /**
     * Obtém token CSRF
     */
    getCsrfToken() {
        let token = localStorage.getItem(CSRF_TOKEN_KEY);
        if (!token) {
            token = this.generateCsrfToken();
        }
        return token;
    }

    /**
     * Verifica se o usuário tem permissão para acessar um documento
     */
    async verifyDocumentPermission(collection, docId, operation = 'read') {
        if (!currentUserId) {
            throw new Error('Usuário não autenticado');
        }

        try {
            const docRef = db.collection(collection).doc(docId);
            const doc = await docRef.get();

            if (!doc.exists) {
                throw new Error('Documento não encontrado');
            }

            const data = doc.data();
            
            // 🔥 Verificação multi-tenant
            if (data.userId && data.userId !== currentUserId) {
                // Log de tentativa de acesso não autorizado
                this.logSecurityEvent('unauthorized_access', {
                    collection,
                    docId,
                    attemptedUserId: currentUserId,
                    ownerUserId: data.userId
                });
                throw new Error('Acesso negado a este documento');
            }

            return { doc, data };
        } catch (error) {
            secureLog('Erro na verificação de permissão:', error);
            throw error;
        }
    }

    /**
     * Executa operação com verificação de segurança
     */
    async secureOperation(operation, ...args) {
        // Verificações de segurança
        if (devToolsDetected) {
            throw new Error('Acesso negado por questões de segurança');
        }

        if (!this.checkRateLimit()) {
            throw new Error('Muitas requisições. Tente novamente mais tarde.');
        }

        // Registrar atividade
        registerActivity();

        // Adicionar à fila
        return new Promise((resolve, reject) => {
            this.operationQueue.push({
                operation,
                args,
                resolve,
                reject
            });
            this.processQueue();
        });
    }

    /**
     * Processa fila de operações
     */
    async processQueue() {
        if (this.processingQueue) return;
        this.processingQueue = true;

        while (this.operationQueue.length > 0) {
            const item = this.operationQueue.shift();
            try {
                // Executar com timeout
                const result = await Promise.race([
                    item.operation(...item.args),
                    new Promise((_, reject) => 
                        setTimeout(() => reject(new Error('Timeout na operação')), REQUEST_TIMEOUT)
                    )
                ]);
                item.resolve(result);
            } catch (error) {
                item.reject(error);
            }
        }

        this.processingQueue = false;
    }

    /**
     * Rate limiting
     */
    checkRateLimit() {
        const now = Date.now();
        const timeWindow = 60000; // 1 minuto
        const maxRequests = MAX_REQUESTS_PER_MINUTE;

        if (now - lastRequestTime > timeWindow) {
            requestCount = 0;
            lastRequestTime = now;
        }

        requestCount++;

        if (requestCount > maxRequests) {
            this.logSecurityEvent('rate_limit_exceeded', { requestCount });
            return false;
        }
        return true;
    }

    /**
     * Log de eventos de segurança
     */
    async logSecurityEvent(eventType, details = {}) {
        if (!currentUserId) return;

        try {
            const eventData = {
                userId: currentUserId,
                eventType,
                details: JSON.stringify(details),
                userAgent: navigator.userAgent,
                timestamp: firebase.firestore.FieldValue.serverTimestamp(),
                url: window.location.href
            };

            // Tentar salvar log (falha silenciosa)
            await db.collection('security_logs').add(eventData).catch(() => {});
        } catch (error) {
            // Silencioso
        }
    }

    // ============================================
    // 🔥 MÉTODOS SEGUROS PARA CRUD
    // ============================================

    /**
     * Buscar coleção com filtro por usuário
     */
    async getCollection(collectionName) {
        return this.secureOperation(async () => {
            const snapshot = await db.collection(collectionName)
                .where('userId', '==', currentUserId)
                .get();

            const results = [];
            snapshot.forEach(doc => {
                results.push({ id: doc.id, ...doc.data() });
            });

            // Atualizar cache
            cache.set(collectionName, results);

            return results;
        });
    }

    /**
     * Buscar documento específico
     */
    async getDocument(collectionName, docId) {
        return this.secureOperation(async () => {
            const { data } = await this.verifyDocumentPermission(collectionName, docId);
            return { id: docId, ...data };
        });
    }

    /**
     * Criar documento
     */
    async createDocument(collectionName, data) {
        return this.secureOperation(async () => {
            // 🔥 Forçar userId do usuário atual
            const secureData = {
                ...data,
                userId: currentUserId,
                createdAt: firebase.firestore.FieldValue.serverTimestamp(),
                updatedAt: firebase.firestore.FieldValue.serverTimestamp()
            };

            const docRef = await db.collection(collectionName).add(secureData);
            const newDoc = await docRef.get();

            // Invalidar cache
            cache.clearType(collectionName);

            return { id: docRef.id, ...newDoc.data() };
        });
    }

    /**
     * Atualizar documento
     */
    async updateDocument(collectionName, docId, data) {
        return this.secureOperation(async () => {
            // Verificar permissão antes de atualizar
            await this.verifyDocumentPermission(collectionName, docId, 'update');

            const secureData = {
                ...data,
                updatedAt: firebase.firestore.FieldValue.serverTimestamp()
            };

            await db.collection(collectionName).doc(docId).update(secureData);
            
            // Invalidar cache
            cache.clearType(collectionName);

            return { id: docId, ...data };
        });
    }

    /**
     * Deletar documento
     */
    async deleteDocument(collectionName, docId) {
        return this.secureOperation(async () => {
            // Verificar permissão antes de deletar
            await this.verifyDocumentPermission(collectionName, docId, 'delete');

            await db.collection(collectionName).doc(docId).delete();
            
            // Invalidar cache
            cache.clearType(collectionName);

            return true;
        });
    }

    /**
     * Buscar com filtros personalizados
     */
    async queryCollection(collectionName, conditions = []) {
        return this.secureOperation(async () => {
            let query = db.collection(collectionName).where('userId', '==', currentUserId);

            // Aplicar condições adicionais
            conditions.forEach(cond => {
                query = query.where(cond.field, cond.operator, cond.value);
            });

            const snapshot = await query.get();

            const results = [];
            snapshot.forEach(doc => {
                results.push({ id: doc.id, ...doc.data() });
            });

            return results;
        });
    }
}

// 🔥 Instância global do serviço de segurança
const secureDB = new SecureFirebase();

// ============================================
// 🔥 FUNÇÕES DE PROTEÇÃO DE ACESSO
// ============================================

/**
 * Verifica se a página atual é protegida
 */
function isProtectedPage() {
    const currentPath = window.location.pathname.split('/').pop() || '';
    return PROTECTED_PAGES.includes(currentPath) || 
           currentPath === '' || 
           currentPath.includes('dashboard');
}

/**
 * Verifica se a página atual é pública
 */
function isPublicPage() {
    const currentPath = window.location.pathname.split('/').pop() || '';
    return ALLOWED_PAGES.includes(currentPath);
}

/**
 * Registra atividade do usuário
 */
function registerActivity() {
    lastActivityTime = Date.now();
}

/**
 * Verifica inatividade do usuário
 */
function checkInactivity() {
    const inactiveTime = Date.now() - lastActivityTime;
    if (inactiveTime > MAX_INACTIVITY_TIME) {
        secureLog('Usuário inativo por muito tempo, fazendo logout');
        forceLogout('Sessão expirada por inatividade');
    }
}

/**
 * Monitor de sessão contínuo
 */
function startSessionMonitor() {
    if (sessionCheckTimer) {
        clearInterval(sessionCheckTimer);
    }
    
    sessionCheckTimer = setInterval(async () => {
        checkInactivity();
        
        if (!auth.currentUser) {
            forceLogout('Sessão expirada');
            return;
        }
        
        try {
            const token = await auth.currentUser.getIdToken(true);
            if (!token) throw new Error('Token inválido');
        } catch (error) {
            forceLogout('Sessão inválida');
        }
    }, SESSION_CHECK_INTERVAL);
}

/**
 * Força logout com limpeza completa
 */
function forceLogout(reason = '') {
    secureLog('Forçando logout:', reason);
    
    if (sessionCheckTimer) {
        clearInterval(sessionCheckTimer);
        sessionCheckTimer = null;
    }
    
    currentUser = null;
    currentUserId = null;
    cache.clear();
    
    const theme = localStorage.getItem('theme');
    const language = localStorage.getItem('language');
    localStorage.clear();
    if (theme) localStorage.setItem('theme', theme);
    if (language) localStorage.setItem('language', language);
    
    auth.signOut().catch(error => {
        console.error('Erro ao fazer logout:', error);
    }).finally(() => {
        if (reason) showNotification(reason, 'error');
        setTimeout(() => window.location.href = 'index.html', 100);
    });
}

// ============================================
// 🔥 VERIFICAÇÃO DE ACESSO
// ============================================
async function verifyAccess() {
    try {
        const firebaseUser = auth.currentUser;
        if (!firebaseUser) {
            throw new Error('Usuário não autenticado');
        }
        
        const token = await firebaseUser.getIdToken(true);
        if (!token) throw new Error('Token inválido');
        
        // Verificar/criar documento do usuário
        const userDoc = await db.collection('users').doc(firebaseUser.uid).get();
        
        if (!userDoc.exists) {
            await db.collection('users').doc(firebaseUser.uid).set({
                email: firebaseUser.email,
                displayName: firebaseUser.displayName || firebaseUser.email?.split('@')[0],
                createdAt: firebase.firestore.FieldValue.serverTimestamp(),
                lastLogin: firebase.firestore.FieldValue.serverTimestamp(),
                status: 'active',
                role: 'user',
                settings: {
                    themeColors: null
                }
            });
        } else {
            const userData = userDoc.data();
            if (userData.status === 'blocked') throw new Error('Conta bloqueada');
            if (userData.status === 'inactive') throw new Error('Conta inativa');
            
            await db.collection('users').doc(firebaseUser.uid).update({
                lastLogin: firebase.firestore.FieldValue.serverTimestamp()
            });
            
            // Se foi criado pelo admin (tem createdBy), eh funcionario e nao precisa pagar
            window.isEmployee = !!userData.createdBy;
        }
        
        secureDB.getCsrfToken();
        securityCheckPassed = true;
        return true;
        
    } catch (error) {
        console.error('Falha na verificação de acesso:', error);
        securityCheckPassed = false;
        
        if (isProtectedPage()) {
            showNotification(error.message || 'Acesso negado', 'error');
            setTimeout(() => window.location.href = 'index.html', 1000);
        }
        
        return false;
    }
}

// ============================================
// 🔥 FUNÇÕES ANTI-DEVTOOLS
// ============================================

function detectDevTools() {
    if (!DISABLE_DEVTOOLS) return false;
    
    const threshold = 160;
    const start = performance.now();
    debugger;
    const end = performance.now();
    
    if (end - start > threshold) {
        devToolsDetected = true;
        handleSecurityBreach('DevTools detectado');
        return true;
    }
    return false;
}

function handleSecurityBreach(reason) {
    console.error('🚨 VIOLAÇÃO DE SEGURANÇA:', reason);
    secureDB.logSecurityEvent('security_breach', { reason });
    forceLogout('Violação de segurança detectada');
}

// ============================================
// FUNÇÕES DE SEGURANÇA
// ============================================

function secureLog(...args) {
    if (IS_DEVELOPMENT && !devToolsDetected) {
        console.log(...args);
    }
}

function sanitizeString(str) {
    if (str === null || str === undefined) return '';
    
    let sanitized = String(str)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#039;')
        .replace(/\//g, '&#x2F;')
        .replace(/\\/g, '&#x5C;')
        .replace(/`/g, '&#96;')
        .replace(/javascript:/gi, '')
        .replace(/onerror/gi, '')
        .replace(/onload/gi, '')
        .replace(/onclick/gi, '')
        .replace(/onmouse/gi, '')
        .replace(/data:/gi, '')
        .replace(/vbscript:/gi, '');
    
    if (sanitized.length > 5000) {
        sanitized = sanitized.substring(0, 5000);
    }
    
    return sanitized;
}

function isValidEmail(email) {
    if (!email || typeof email !== 'string') return false;
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return re.test(String(email).toLowerCase()) && email.length <= 100;
}

function isValidPhone(phone) {
    if (!phone) return false;
    const numbers = String(phone).replace(/\D/g, '');
    return numbers.length >= 10 && numbers.length <= 13;
}

function isValidCPF(cpf) {
    if (!cpf || typeof cpf !== 'string') return false;
    
    const numbers = String(cpf).replace(/\D/g, '');
    if (numbers.length !== 11) return false;
    
    let sum = 0;
    let remainder;
    
    for (let i = 1; i <= 9; i++) {
        sum = sum + parseInt(numbers.substring(i-1, i)) * (11 - i);
    }
    remainder = (sum * 10) % 11;
    if (remainder === 10 || remainder === 11) remainder = 0;
    if (remainder !== parseInt(numbers.substring(9, 10))) return false;
    
    sum = 0;
    for (let i = 1; i <= 10; i++) {
        sum = sum + parseInt(numbers.substring(i-1, i)) * (12 - i);
    }
    remainder = (sum * 10) % 11;
    if (remainder === 10 || remainder === 11) remainder = 0;
    if (remainder !== parseInt(numbers.substring(10, 11))) return false;
    
    return true;
}

function validateAndSanitizeImageBase64(base64String) {
    if (!base64String) return null;
    
    try {
        const matches = base64String.match(/^data:image\/(jpeg|png|gif|webp);base64,(.+)$/);
        if (!matches) throw new Error('Formato de imagem inválido');
        
        const base64Data = matches[2];
        const sizeInBytes = Math.ceil((base64Data.length * 3) / 4);
        if (sizeInBytes > MAX_IMAGE_SIZE) throw new Error('Imagem muito grande. Máximo 5MB');
        
        atob(base64Data);
        
        if (base64Data.toLowerCase().includes('script') || 
            base64Data.toLowerCase().includes('javascript')) {
            throw new Error('Imagem contém código suspeito');
        }
        
        return base64String;
    } catch (e) {
        secureLog('Erro na validação de imagem:', e);
        throw new Error('Imagem inválida ou corrompida');
    }
}

function maskCPF(cpf) {
    if (!cpf) return '***.***.***-**';
    const clean = String(cpf).replace(/\D/g, '');
    if (clean.length < 11) return '***.***.***-**';
    return `***.***.${clean.slice(-4)}`;
}

async function checkExistingCPF(cpf, excludeClientId = null) {
    if (!currentUserId) throw new Error('Usuário não autenticado');
    
    await verifyAccess();
    
    if (!isValidCPF(cpf)) throw new Error('CPF inválido');
    
    return secureDB.secureOperation(async () => {
        let query = db.collection('clients')
            .where('userId', '==', currentUserId)
            .where('cpf', '==', cpf);
        
        const snapshot = await query.get();
        
        if (snapshot.empty) return false;
        
        if (excludeClientId) {
            let exists = false;
            snapshot.forEach(doc => {
                if (doc.id !== excludeClientId) exists = true;
            });
            return exists;
        }
        
        return true;
    });
}

function showNotification(message, type = 'info') {
    const safeMessage = sanitizeString(message);
    
    const notification = document.createElement('div');
    notification.className = `google-notification ${type}`;
    
    const icon = type === 'success' ? 'fa-check-circle' : 
                 type === 'error' ? 'fa-exclamation-circle' : 'fa-info-circle';
    
    notification.innerHTML = `
        <i class="fas ${icon}"></i>
        <span>${safeMessage}</span>
    `;
    
    document.body.appendChild(notification);
    
    setTimeout(() => notification.classList.add('show'), 10);
    setTimeout(() => {
        notification.classList.remove('show');
        setTimeout(() => notification.remove(), 300);
    }, 3000);
}

// ============================================
// FUNÇÕES DE CORES GLOBAIS (Firebase)
// ============================================

const defaultColors = {
    primary: '#4f46e5',
    secondary: '#10b981',
    background: '#f3f4f6',
    success: '#22c55e',
    danger: '#ef4444',
    warning: '#f59e0b',
    text: '#1f2937',
    textLight: '#6b7280',
    totalpass: '#D91828',
    wellhub: '#D91414'
};

function isValidHex(hex) {
    return /^#[0-9A-Fa-f]{6}$/.test(hex);
}

/**
 * Salva as cores no Firebase (global)
 */
async function saveColorsToFirebase(colors) {
    if (!currentUserId) {
        secureLog('Usuário não autenticado, não é possível salvar cores globalmente');
        return false;
    }
    
    try {
        const userSettingsRef = db.collection('users').doc(currentUserId);
        
        // Verificar se o documento existe e atualizar
        const userDoc = await userSettingsRef.get();
        
        if (userDoc.exists) {
            await userSettingsRef.update({
                'settings.themeColors': colors,
                'settings.updatedAt': firebase.firestore.FieldValue.serverTimestamp()
            });
        } else {
            await userSettingsRef.set({
                settings: {
                    themeColors: colors,
                    createdAt: firebase.firestore.FieldValue.serverTimestamp(),
                    updatedAt: firebase.firestore.FieldValue.serverTimestamp()
                }
            });
        }
        
        secureLog('Cores salvas globalmente no Firebase');
        return true;
    } catch (error) {
        console.error('Erro ao salvar cores no Firebase:', error);
        return false;
    }
}

/**
 * Carrega as cores do Firebase (global)
 */
async function loadColorsFromFirebase() {
    if (!currentUserId) {
        secureLog('Usuário não autenticado, usando cores padrão');
        return null;
    }
    
    try {
        const userDoc = await db.collection('users').doc(currentUserId).get();
        
        if (userDoc.exists && userDoc.data().settings?.themeColors) {
            const colors = userDoc.data().settings.themeColors;
            
            // Validar cores antes de aplicar
            if (colors.primary && isValidHex(colors.primary) &&
                colors.secondary && isValidHex(colors.secondary) &&
                colors.background && isValidHex(colors.background)) {
                
                secureLog('Cores carregadas globalmente do Firebase');
                return colors;
            }
        }
        
        secureLog('Nenhuma cor personalizada encontrada no Firebase');
        return null;
    } catch (error) {
        console.error('Erro ao carregar cores do Firebase:', error);
        return null;
    }
}

/**
 * Carrega as cores salvas (prioriza Firebase, fallback localStorage)
 */
async function loadSavedColors() {
    try {
        // Tentar carregar do Firebase primeiro (global)
        const firebaseColors = await loadColorsFromFirebase();
        
        if (firebaseColors) {
            applyColorsToCSS(firebaseColors);
            return firebaseColors;
        }
        
        // Fallback: tentar carregar do localStorage (migração)
        const saved = localStorage.getItem('nexbook_colors');
        if (saved) {
            const colors = JSON.parse(saved);
            if (isValidHex(colors.primary) && 
                isValidHex(colors.secondary) && 
                isValidHex(colors.background)) {
                
                // Migrar cores antigas para o Firebase
                await saveColorsToFirebase(colors);
                applyColorsToCSS(colors);
                return colors;
            }
        }
    } catch (e) {
        secureLog('Erro ao carregar cores:', e);
    }
    return defaultColors;
}

function applyColorsToCSS(colors) {
    const safeColors = {
        primary: isValidHex(colors.primary) ? colors.primary : defaultColors.primary,
        secondary: isValidHex(colors.secondary) ? colors.secondary : defaultColors.secondary,
        background: isValidHex(colors.background) ? colors.background : defaultColors.background,
        success: isValidHex(colors.success) ? colors.success : defaultColors.success,
        danger: defaultColors.danger,
        warning: defaultColors.warning,
        text: defaultColors.text,
        textLight: defaultColors.textLight,
        totalpass: colors.totalpass || defaultColors.totalpass,
        wellhub: colors.wellhub || defaultColors.wellhub
    };
    
    const root = document.documentElement;
    
    root.style.setProperty('--primary', safeColors.primary);
    root.style.setProperty('--primary-light', adjustColor(safeColors.primary, 40));
    root.style.setProperty('--primary-dark', adjustColor(safeColors.primary, -40));
    
    root.style.setProperty('--secondary', safeColors.secondary);
    root.style.setProperty('--secondary-light', adjustColor(safeColors.secondary, 40));
    root.style.setProperty('--secondary-dark', adjustColor(safeColors.secondary, -40));
    
    root.style.setProperty('--background', safeColors.background);
    root.style.setProperty('--background-dark', adjustColor(safeColors.background, -20));
    
    root.style.setProperty('--success', safeColors.success);
    root.style.setProperty('--danger', safeColors.danger);
    root.style.setProperty('--warning', safeColors.warning);
    
    root.style.setProperty('--totalpass', safeColors.totalpass);
    root.style.setProperty('--wellhub', safeColors.wellhub);
    
    // Salvar também no localStorage como backup
    localStorage.setItem('nexbook_colors', JSON.stringify(safeColors));
    
    updateAllChartsColors(safeColors);
}

function adjustColor(hex, percent) {
    if (!isValidHex(hex)) return hex;
    
    hex = hex.replace('#', '');
    let r = parseInt(hex.substring(0, 2), 16);
    let g = parseInt(hex.substring(2, 4), 16);
    let b = parseInt(hex.substring(4, 6), 16);
    
    r = Math.min(255, Math.max(0, r + percent));
    g = Math.min(255, Math.max(0, g + percent));
    b = Math.min(255, Math.max(0, b + percent));
    
    return `#${((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1)}`;
}

function isColorLight(hex) {
    if (!isValidHex(hex)) return true;
    
    hex = hex.replace('#', '');
    const r = parseInt(hex.substring(0, 2), 16);
    const g = parseInt(hex.substring(2, 4), 16);
    const b = parseInt(hex.substring(4, 6), 16);
    const brightness = (r * 299 + g * 587 + b * 114) / 1000;
    return brightness > 128;
}

// ============================================
// FUNÇÕES DO MODAL DE DESIGN
// ============================================

function openDesignModal() {
    detectDevTools();
    
    const modal = document.getElementById('designModal');
    if (!modal) return;
    
    // Carregar cores atuais (async)
    loadSavedColors().then(currentColors => {
        modal.style.display = 'flex';
        
        setTimeout(() => {
            if (!primaryPicker) {
                primaryPicker = Pickr.create({
                    el: '#primaryColorPicker',
                    theme: 'classic',
                    default: currentColors.primary,
                    components: {
                        preview: true,
                        opacity: false,
                        hue: true,
                        interaction: {
                            hex: true,
                            rgba: false,
                            hsla: false,
                            hsva: false,
                            cmyk: false,
                            input: true,
                            clear: false,
                            save: true
                        }
                    }
                });
                
                primaryPicker.on('save', (color) => {
                    const hex = color.toHEXA().toString();
                    document.getElementById('primaryColorInput').value = hex;
                    updateColor('primary', hex);
                });
            } else {
                primaryPicker.setColor(currentColors.primary);
            }
            
            if (!secondaryPicker) {
                secondaryPicker = Pickr.create({
                    el: '#secondaryColorPicker',
                    theme: 'classic',
                    default: currentColors.secondary,
                    components: {
                        preview: true,
                        opacity: false,
                        hue: true,
                        interaction: {
                            hex: true,
                            rgba: false,
                            hsla: false,
                            hsva: false,
                            cmyk: false,
                            input: true,
                            clear: false,
                            save: true
                        }
                    }
                });
                
                secondaryPicker.on('save', (color) => {
                    const hex = color.toHEXA().toString();
                    document.getElementById('secondaryColorInput').value = hex;
                    updateColor('secondary', hex);
                });
            } else {
                secondaryPicker.setColor(currentColors.secondary);
            }
            
            if (!backgroundPicker) {
                backgroundPicker = Pickr.create({
                    el: '#backgroundColorPicker',
                    theme: 'classic',
                    default: currentColors.background,
                    components: {
                        preview: true,
                        opacity: false,
                        hue: true,
                        interaction: {
                            hex: true,
                            rgba: false,
                            hsla: false,
                            hsva: false,
                            cmyk: false,
                            input: true,
                            clear: false,
                            save: true
                        }
                    }
                });
                
                backgroundPicker.on('save', (color) => {
                    const hex = color.toHEXA().toString();
                    document.getElementById('backgroundColorInput').value = hex;
                    updateColor('background', hex);
                });
            } else {
                backgroundPicker.setColor(currentColors.background);
            }
            
            if (!successPicker) {
                successPicker = Pickr.create({
                    el: '#successColorPicker',
                    theme: 'classic',
                    default: currentColors.success,
                    components: {
                        preview: true,
                        opacity: false,
                        hue: true,
                        interaction: {
                            hex: true,
                            rgba: false,
                            hsla: false,
                            hsva: false,
                            cmyk: false,
                            input: true,
                            clear: false,
                            save: true
                        }
                    }
                });
                
                successPicker.on('save', (color) => {
                    const hex = color.toHEXA().toString();
                    document.getElementById('successColorInput').value = hex;
                    updateColor('success', hex);
                });
            } else {
                successPicker.setColor(currentColors.success);
            }
            
            document.getElementById('primaryColorInput').value = currentColors.primary;
            document.getElementById('secondaryColorInput').value = currentColors.secondary;
            document.getElementById('backgroundColorInput').value = currentColors.background;
            document.getElementById('successColorInput').value = currentColors.success;
        }, 100);
    });
}

function closeDesignModal() {
    const modal = document.getElementById('designModal');
    if (modal) modal.style.display = 'none';
}

async function updateColor(type, hex) {
    if (!isValidHex(hex)) {
        showNotification('Cor inválida', 'error');
        return;
    }
    
    const currentColors = await loadSavedColors();
    currentColors[type] = hex;
    applyColorsToCSS(currentColors);
    
    // Salvar no Firebase (global)
    await saveColorsToFirebase(currentColors);
}

async function resetDesignColors() {
    if (confirm('Tem certeza que deseja resetar todas as cores para o padrão?')) {
        applyColorsToCSS(defaultColors);
        
        // Salvar padrão no Firebase
        await saveColorsToFirebase(defaultColors);
        
        if (primaryPicker) primaryPicker.setColor(defaultColors.primary);
        if (secondaryPicker) secondaryPicker.setColor(defaultColors.secondary);
        if (backgroundPicker) backgroundPicker.setColor(defaultColors.background);
        if (successPicker) successPicker.setColor(defaultColors.success);
        
        document.getElementById('primaryColorInput').value = defaultColors.primary;
        document.getElementById('secondaryColorInput').value = defaultColors.secondary;
        document.getElementById('backgroundColorInput').value = defaultColors.background;
        document.getElementById('successColorInput').value = defaultColors.success;
        
        showNotification('Cores resetadas com sucesso!', 'success');
    }
}

async function saveDesignColors() {
    // As cores já foram salvas via updateColor, apenas fechar modal
    closeDesignModal();
    showNotification('Design salvo globalmente com sucesso!', 'success');
}

function updateAllChartsColors(colors) {
    if (appointmentsChart) {
        appointmentsChart.updateOptions({
            colors: [colors.success, colors.danger],
            grid: { borderColor: colors.borderColor || '#e5e7eb' }
        });
    }
    
    if (servicesChart) {
        servicesChart.updateOptions({
            colors: [colors.primary, colors.secondary, colors.success, colors.warning, colors.danger],
            tooltip: { theme: isColorLight(colors.background) ? 'light' : 'dark' }
        });
    }
    
    if (reportsLineChart) {
        reportsLineChart.updateOptions({
            colors: [colors.primary]
        });
    }
    
    if (reportsPieChart) {
        reportsPieChart.updateOptions({
            colors: [colors.primary, colors.secondary, colors.warning]
        });
    }
    
    if (reportsBarChart) {
        reportsBarChart.updateOptions({
            colors: [colors.secondary]
        });
    }
}

// ============================================
// FUNÇÕES DE RESPONSIVIDADE
// ============================================
function toggleSidebar() {
    const sidebar = document.getElementById('sidebar');
    const toggleBtn = document.getElementById('sidebarToggle');
    
    if (window.innerWidth <= 768) {
        sidebar.classList.toggle('mobile-open');
        isMobileSidebarOpen = sidebar.classList.contains('mobile-open');
        toggleBtn.innerHTML = isMobileSidebarOpen ? 
            '<i class="fas fa-times"></i>' : '<i class="fas fa-bars"></i>';
    } else {
        sidebar.classList.toggle('collapsed');
    }
}

function adjustTablesForMobile() {
    if (window.innerWidth <= 768) {
        document.querySelectorAll('table').forEach(table => {
            table.classList.add('mobile-table');
        });
    } else {
        document.querySelectorAll('table').forEach(table => {
            table.classList.remove('mobile-table');
        });
    }
}

document.querySelectorAll('.nav-item').forEach(item => {
    item.addEventListener('click', function() {
        if (window.innerWidth <= 768) {
            document.getElementById('sidebar').classList.remove('mobile-open');
            document.getElementById('sidebarToggle').innerHTML = '<i class="fas fa-bars"></i>';
        }
    });
});

window.addEventListener('resize', function() {
    adjustTablesForMobile();
    if (window.innerWidth > 768) {
        document.getElementById('sidebar').classList.remove('mobile-open');
        document.getElementById('sidebarToggle').innerHTML = '<i class="fas fa-bars"></i>';
    }
});

// ============================================
// FUNÇÕES DE BUSCA GLOBAL
// ============================================
function handleGlobalSearch() {
    const searchInput = document.getElementById('globalSearch');
    globalSearchTerm = sanitizeString(searchInput.value.toLowerCase().trim());
    
    secureLog('Buscando por:', globalSearchTerm);
    
    const activeView = document.querySelector('.view.active')?.id;
    
    if (activeView === 'professionalsView') {
        filterProfessionalsTable();
    } else if (activeView === 'servicesView') {
        filterServicesTable();
    } else if (activeView === 'clientsView') {
        filterClientsTable();
    } else if (activeView === 'reportsView') {
        filterReportClients();
    } else {
        loadAllData();
    }
}

function filterProfessionalsTable() {
    const rows = document.querySelectorAll('#professionalsList tr');
    let visibleCount = 0;
    
    rows.forEach(row => {
        if (row.cells && row.cells.length > 0) {
            const nome = (row.cells[0]?.textContent || '').toLowerCase();
            const especialidade = (row.cells[1]?.textContent || '').toLowerCase();
            const email = (row.cells[2]?.textContent || '').toLowerCase();
            const telefone = (row.cells[3]?.textContent || '').toLowerCase();
            
            const matches = nome.includes(globalSearchTerm) || 
                           especialidade.includes(globalSearchTerm) || 
                           email.includes(globalSearchTerm) || 
                           telefone.includes(globalSearchTerm);
            
            row.style.display = matches ? '' : 'none';
            if (matches) visibleCount++;
        }
    });
    
    const tbody = document.getElementById('professionalsList');
    if (visibleCount === 0 && rows.length > 0) {
        const noResultsRow = document.createElement('tr');
        noResultsRow.id = 'noResultsRow';
        noResultsRow.innerHTML = `<td colspan="6" style="text-align: center; padding: 20px;">Nenhum profissional encontrado com o termo "${sanitizeString(globalSearchTerm)}"</td>`;
        
        const oldNoResults = document.getElementById('noResultsRow');
        if (oldNoResults) oldNoResults.remove();
        tbody.appendChild(noResultsRow);
    } else {
        const oldNoResults = document.getElementById('noResultsRow');
        if (oldNoResults) oldNoResults.remove();
    }
}

function filterServicesTable() {
    const rows = document.querySelectorAll('#servicesList tr');
    let visibleCount = 0;
    
    rows.forEach(row => {
        if (row.cells && row.cells.length > 0) {
            const nome = (row.cells[0]?.textContent || '').toLowerCase();
            const descricao = (row.cells[2]?.textContent || '').toLowerCase();
            
            const matches = nome.includes(globalSearchTerm) || descricao.includes(globalSearchTerm);
            
            row.style.display = matches ? '' : 'none';
            if (matches) visibleCount++;
        }
    });
    
    const tbody = document.getElementById('servicesList');
    if (visibleCount === 0 && rows.length > 0) {
        const noResultsRow = document.createElement('tr');
        noResultsRow.id = 'noResultsRow';
        noResultsRow.innerHTML = `<td colspan="5" style="text-align: center; padding: 20px;">Nenhum serviço encontrado com o termo "${sanitizeString(globalSearchTerm)}"</td>`;
        
        const oldNoResults = document.getElementById('noResultsRow');
        if (oldNoResults) oldNoResults.remove();
        tbody.appendChild(noResultsRow);
    } else {
        const oldNoResults = document.getElementById('noResultsRow');
        if (oldNoResults) oldNoResults.remove();
    }
}

function filterClientsTable() {
    const rows = document.querySelectorAll('#clientsList tr');
    let visibleCount = 0;
    
    rows.forEach(row => {
        if (row.cells && row.cells.length > 0) {
            const nome = (row.cells[1]?.textContent || '').toLowerCase();
            const email = (row.cells[4]?.textContent || '').toLowerCase();
            const telefone = (row.cells[5]?.textContent || '').toLowerCase();
            const plano = (row.cells[6]?.textContent || '').toLowerCase();
            const origem = (row.cells[7]?.textContent || '').toLowerCase();
            const cidade = (row.cells[10]?.textContent || '').toLowerCase();
            
            const matches = nome.includes(globalSearchTerm) || 
                           email.includes(globalSearchTerm) || 
                           telefone.includes(globalSearchTerm) ||
                           plano.includes(globalSearchTerm) ||
                           origem.includes(globalSearchTerm) ||
                           cidade.includes(globalSearchTerm);
            
            row.style.display = matches ? '' : 'none';
            if (matches) visibleCount++;
        }
    });
    
    const tbody = document.getElementById('clientsList');
    if (visibleCount === 0 && rows.length > 0) {
        const noResultsRow = document.createElement('tr');
        noResultsRow.id = 'noResultsRow';
        noResultsRow.innerHTML = `<td colspan="13" style="text-align: center; padding: 20px;">Nenhum cliente encontrado com o termo "${sanitizeString(globalSearchTerm)}"</td>`;
        
        const oldNoResults = document.getElementById('noResultsRow');
        if (oldNoResults) oldNoResults.remove();
        tbody.appendChild(noResultsRow);
    } else {
        const oldNoResults = document.getElementById('noResultsRow');
        if (oldNoResults) oldNoResults.remove();
    }
}

function filterReportClients() {
    const searchInput = document.getElementById('reportClientSearch');
    const searchTerm = searchInput ? sanitizeString(searchInput.value.toLowerCase().trim()) : '';
    
    const rows = document.querySelectorAll('#reportClientsList tr');
    let visibleCount = 0;
    
    rows.forEach(row => {
        if (row.cells && row.cells.length > 0) {
            const nome = (row.cells[0]?.textContent || '').toLowerCase();
            const plano = (row.cells[1]?.textContent || '').toLowerCase();
            const origem = (row.cells[2]?.textContent || '').toLowerCase();
            
            const matches = nome.includes(searchTerm) || 
                           plano.includes(searchTerm) || 
                           origem.includes(searchTerm);
            
            row.style.display = matches ? '' : 'none';
            if (matches) visibleCount++;
        }
    });
}

// ============================================
// FUNÇÕES DE CARREGAMENTO COM SEGURANÇA
// ============================================
async function loadAllData() {
    if (!currentUserId) return;
    
    detectDevTools();
    await verifyAccess();
    
    try {
        await Promise.all([
            loadDashboardData(),
            loadProfessionals(),
            loadServices(),
            loadClients(),
            loadFilters()
        ]);
    } catch (error) {
        console.error('Erro ao carregar dados:', error);
        showNotification('Erro ao carregar dados', 'error');
    }
}

// ============================================
// FUNÇÃO LOADDASHBOARDDATA
// ============================================
async function loadDashboardData() {
    if (!currentUserId) return;
    
    try {
        const professionalFilter = document.getElementById('professionalFilter')?.value || 'all';
        const serviceFilter = document.getElementById('serviceFilter')?.value || 'all';
        
        secureLog('Carregando dashboard com filtros:', { professionalFilter, serviceFilter });
        
        // Buscar agendamentos
        let appointmentsQuery = db.collection('appointments').where('userId', '==', currentUserId);
        
        if (professionalFilter !== 'all') {
            appointmentsQuery = appointmentsQuery.where('professionalId', '==', professionalFilter);
        }
        if (serviceFilter !== 'all') {
            appointmentsQuery = appointmentsQuery.where('serviceId', '==', serviceFilter);
        }
        
        const appointmentsSnapshot = await appointmentsQuery.get();
        const appointments = [];
        appointmentsSnapshot.forEach(doc => {
            appointments.push({ id: doc.id, ...doc.data() });
        });
        
        const today = new Date();
        const year = today.getFullYear();
        const month = String(today.getMonth() + 1).padStart(2, '0');
        const day = String(today.getDate()).padStart(2, '0');
        const todayStr = `${year}-${month}-${day}`;
        
        const todayAppointments = appointments.filter(a => a.date === todayStr);
        
        // Calcular faturamento do dia
        let todayRevenue = 0;
        for (const apt of todayAppointments) {
            if (apt.serviceId) {
                try {
                    const serviceDoc = await db.collection('services').doc(apt.serviceId).get();
                    if (serviceDoc.exists) {
                        todayRevenue += serviceDoc.data().price || 0;
                    }
                } catch (e) {
                    secureLog('Erro ao buscar serviço:', e);
                }
            }
        }
        
        // Buscar clientes
        const clientsSnapshot = await db.collection('clients')
            .where('userId', '==', currentUserId)
            .get();
        
        const clients = [];
        clientsSnapshot.forEach(doc => {
            clients.push({ id: doc.id, ...doc.data() });
        });
        
        // Calcular faturamento mensal
        let monthlyRevenue = 0;
        const clientValues = [];
        
        const currentDate = new Date();
        const firstDayOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
        const lastDayOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0);
        
        const firstDayStr = firstDayOfMonth.toISOString().split('T')[0];
        const lastDayStr = lastDayOfMonth.toISOString().split('T')[0];
        
        clients.filter(c => c.status === 'active' && c.plan !== 'AVULSO').forEach(client => {
            if (client.planValue && client.planValue > 0) {
                monthlyRevenue += client.planValue;
                clientValues.push({
                    name: sanitizeString(client.name || ''),
                    valor: client.planValue,
                    plano: client.plan
                });
            }
        });
        
        const avulsoAppointments = appointments.filter(apt => {
            const client = clients.find(c => c.id === apt.clientId);
            return client && client.plan === 'AVULSO' && 
                   apt.date >= firstDayStr && apt.date <= lastDayStr &&
                   apt.status === 'attended';
        });
        
        for (const apt of avulsoAppointments) {
            if (apt.serviceId) {
                try {
                    const serviceDoc = await db.collection('services').doc(apt.serviceId).get();
                    if (serviceDoc.exists) {
                        const servicePrice = serviceDoc.data().price || 0;
                        monthlyRevenue += servicePrice;
                        
                        const client = clients.find(c => c.id === apt.clientId);
                        if (client) {
                            clientValues.push({
                                name: `${sanitizeString(client.name)} (Avulso)`,
                                valor: servicePrice,
                                plano: 'AVULSO'
                            });
                        }
                    }
                } catch (e) {
                    secureLog('Erro ao buscar serviço para avulso:', e);
                }
            }
        }
        
        updateDashboardUI({
            todayAppointments: todayAppointments.length,
            todayRevenue,
            monthlyRevenue,
            clientValues,
            activeClients: clients.filter(c => c.status === 'active').length,
            appointments
        });
        
        try {
            const profSnapshot = await db.collection('professionals')
                .where('userId', '==', currentUserId)
                .where('active', '==', true)
                .get();
            document.getElementById('attendanceValue').textContent = profSnapshot.size;
        } catch (e) {
            secureLog('Erro ao carregar profissionais:', e);
        }
        
        updateCharts(appointments);
        updatePlansChart(clients);
        
    } catch (error) {
        console.error('Erro ao carregar dashboard:', error);
        showNotification('Erro ao carregar dashboard', 'error');
    }
}

function updateDashboardUI(data) {
    document.getElementById('todayCount').textContent = data.todayAppointments;
    document.getElementById('revenueValue').textContent = formatCurrency(data.todayRevenue);
    document.getElementById('clientsValue').textContent = data.activeClients;
    
    let monthlyCard = document.getElementById('monthlyRevenueCard');
    if (!monthlyCard) {
        const statsGrid = document.querySelector('.stats-grid');
        if (statsGrid) {
            const newCard = document.createElement('div');
            newCard.className = 'stat-card';
            newCard.id = 'monthlyRevenueCard';
            newCard.innerHTML = `
                <div class="stat-header">
                    <div class="stat-icon"><i class="fas fa-calendar-alt"></i></div>
                    <span class="stat-badge positive">Mensal</span>
                </div>
                <div class="stat-value" id="monthlyRevenueValue">${formatCurrency(data.monthlyRevenue)}</div>
                <div class="stat-label">Faturamento Mensal</div>
                <div class="stat-comparison">
                    <i class="fas fa-users"></i> <span>${data.activeClients} clientes ativos</span>
                </div>
            `;
            statsGrid.appendChild(newCard);
        }
    } else {
        const valueElement = document.getElementById('monthlyRevenueValue');
        if (valueElement) {
            valueElement.textContent = formatCurrency(data.monthlyRevenue);
            
            let tooltipText = 'Detalhamento do faturamento mensal:\n';
            data.clientValues.sort((a, b) => b.valor - a.valor).forEach(c => {
                tooltipText += `${c.name}: ${formatCurrency(c.valor)}\n`;
            });
            valueElement.title = sanitizeString(tooltipText);
        }
    }
    
    updateAppointmentsList(data.appointments);
    // Insights Inteligentes
    if (typeof generateInsights === 'function') {
        const _today = new Date().toISOString().split('T')[0];
        const _upcoming = (data.appointments || []).filter(a => a.date === _today).length;
        generateInsights({ todayCount: data.todayAppointments || 0, totalClients: data.activeClients || 0, revenueRaw: data.monthlyRevenue || 0, upcomingToday: _upcoming, inactiveClients: 0, stoppedAppointments: 0 });
        if (typeof triggerStatAnimations === 'function') setTimeout(triggerStatAnimations, 200);
    }
}

// ============================================
// FUNÇÃO LOADPROFESSIONALS
// ============================================
async function loadProfessionals() {
    if (!currentUserId) return;
    
    try {
        const snapshot = await db.collection('professionals')
            .where('userId', '==', currentUserId)
            .get();
            
        const professionals = [];
        snapshot.forEach(doc => {
            professionals.push({ id: doc.id, ...doc.data() });
        });
        
        professionals.sort((a, b) => {
            const nomeA = (a.name || '').toLowerCase();
            const nomeB = (b.name || '').toLowerCase();
            return nomeA.localeCompare(nomeB);
        });
        
        document.getElementById('attendanceValue').textContent = professionals.filter(p => p.active).length;
        
        updateProfessionalsTable(professionals);
        updateProfessionalFilter(professionals);
        
    } catch (error) {
        console.error('Erro ao carregar profissionais:', error);
        showNotification('Erro ao carregar profissionais', 'error');
    }
}

function updateProfessionalsTable(professionals) {
    const tbody = document.getElementById('professionalsList');
    if (!tbody) return;
    
    if (professionals.length === 0) {
        tbody.innerHTML = '<tr><td colspan="6" style="text-align: center;">Nenhum profissional cadastrado</td></tr>';
        return;
    }
    
    tbody.innerHTML = professionals.map(p => {
        const safeName = sanitizeString(p.name || '---');
        const safeSpecialty = sanitizeString(p.specialty || '---');
        const safeEmail = sanitizeString(p.email || '---');
        const safePhone = sanitizeString(p.phone || '---');
        const statusClass = p.active ? 'active' : 'inactive';
        const statusText = p.active ? 'Ativo' : 'Inativo';
        
        return `
            <tr>
                <td data-label="Nome">${safeName}</td>
                <td data-label="Especialidade">${safeSpecialty}</td>
                <td data-label="Email">${safeEmail}</td>
                <td data-label="Telefone">${safePhone}</td>
                <td data-label="Status"><span class="badge ${statusClass}">${statusText}</span></td>
                <td data-label="Ações">
                    <div class="table-actions">
                        <button class="btn-secondary" onclick="editItem('professional', '${p.id}')">
                            <i class="fas fa-edit"></i>
                        </button>
                        <button class="btn-danger" onclick="deleteItem('professional', '${p.id}')">
                            <i class="fas fa-trash"></i>
                        </button>
                    </div>
                 </td>
            </tr>
        `;
    }).join('');
    
    if (globalSearchTerm) filterProfessionalsTable();
}

// ============================================
// FUNÇÃO LOADSERVICES
// ============================================
async function loadServices() {
    if (!currentUserId) return;
    
    try {
        const snapshot = await db.collection('services')
            .where('userId', '==', currentUserId)
            .get();
            
        const services = [];
        snapshot.forEach(doc => {
            services.push({ id: doc.id, ...doc.data() });
        });
        
        services.sort((a, b) => {
            const nomeA = (a.name || '').toLowerCase();
            const nomeB = (b.name || '').toLowerCase();
            return nomeA.localeCompare(nomeB);
        });
        
        updateServicesTable(services);
        updateServiceFilter(services);
        
    } catch (error) {
        console.error('Erro ao carregar serviços:', error);
        showNotification('Erro ao carregar serviços', 'error');
    }
}

function updateServicesTable(services) {
    const tbody = document.getElementById('servicesList');
    if (!tbody) return;
    
    if (services.length === 0) {
        tbody.innerHTML = '<td><td colspan="5" style="text-align: center;">Nenhum serviço cadastrado</td></tr>';
        return;
    }
    
    tbody.innerHTML = services.map(s => {
        const safeName = sanitizeString(s.name || '---');
        const safeDescription = sanitizeString(s.description || '---');
        const duration = s.duration || 0;
        const statusClass = s.active ? 'active' : 'inactive';
        const statusText = s.active ? 'Ativo' : 'Inativo';
        
        return `
            <tr>
                <td data-label="Nome">${safeName}</td>
                <td data-label="Duração">${duration} min</td>
                <td data-label="Descrição">${safeDescription}</td>
                <td data-label="Status"><span class="badge ${statusClass}">${statusText}</span></td>
                <td data-label="Ações">
                    <div class="table-actions">
                        <button class="btn-secondary" onclick="editItem('service', '${s.id}')">
                            <i class="fas fa-edit"></i>
                        </button>
                        <button class="btn-danger" onclick="deleteItem('service', '${s.id}')">
                            <i class="fas fa-trash"></i>
                        </button>
                    </div>
                 </td>
            </tr>
        `;
    }).join('');
    
    if (globalSearchTerm) filterServicesTable();
}

// ============================================
// FUNÇÃO LOADCLIENTS
// ============================================
async function loadClients() {
    if (!currentUserId) return;
    
    try {
        const snapshot = await db.collection('clients')
            .where('userId', '==', currentUserId)
            .get();
            
        const clients = [];
        snapshot.forEach(doc => {
            clients.push({ id: doc.id, ...doc.data() });
        });
        
        clients.sort((a, b) => {
            const nomeA = (a.name || '').toLowerCase();
            const nomeB = (b.name || '').toLowerCase();
            return nomeA.localeCompare(nomeB);
        });
        
        document.getElementById('clientsValue').textContent = clients.filter(c => c.status === 'active').length;
        
        updateClientsTable(clients);
        loadDashboardData();
        
    } catch (error) {
        console.error('Erro ao carregar clientes:', error);
        showNotification('Erro ao carregar clientes', 'error');
    }
}

function updateClientsTable(clients) {
    const tbody = document.getElementById('clientsList');
    if (!tbody) return;
    
    if (clients.length === 0) {
        tbody.innerHTML = '<tr><td colspan="13" style="text-align: center;">Nenhum cliente cadastrado</td></tr>';
        return;
    }
    
    // Carregar cores de forma assíncrona
    loadSavedColors().then(colors => {
        tbody.innerHTML = clients.map(c => {
            const safeName = sanitizeString(c.name || '---');
            const safeEmail = sanitizeString(c.email || '---');
            const safePhone = sanitizeString(c.phone || '---');
            const safePlan = sanitizeString(c.plan || '---');
            const safeOrigin = sanitizeString(c.origin || 'Direto');
            const safeCity = sanitizeString(c.city || '---');
            
            const maskedCpf = maskCPF(c.cpf);
            
            let fotoHtml = '<div class="user-avatar" style="width: 40px; height: 40px; font-size: 14px;"><i class="fas fa-user"></i></div>';
            if (c.photoBase64) {
                try {
                    if (validateAndSanitizeImageBase64(c.photoBase64)) {
                        fotoHtml = `<img src="${c.photoBase64}" style="width: 40px; height: 40px; border-radius: 50%; object-fit: cover;" alt="Foto de ${safeName}" loading="lazy">`;
                    }
                } catch (e) {
                    secureLog('Imagem inválida para cliente', c.id);
                }
            }
            
            let dataNascimentoFormatada = '---';
            if (c.birthDate) {
                try {
                    const [ano, mes, dia] = String(c.birthDate).split('-');
                    if (ano && mes && dia) dataNascimentoFormatada = `${dia}/${mes}/${ano}`;
                } catch (e) {
                    secureLog('Erro ao formatar data nascimento');
                }
            }
            
            let dataInicioFormatada = '---';
            if (c.startDate) {
                try {
                    const [ano, mes, dia] = String(c.startDate).split('-');
                    dataInicioFormatada = `${dia}/${mes}/${ano}`;
                } catch (e) {
                    secureLog('Erro ao formatar data início');
                }
            }
            
            const valorPlano = c.planValue ? formatCurrency(c.planValue) : '---';
            const statusClass = c.status === 'active' ? 'active' : 'inactive';
            const statusText = c.status === 'active' ? 'Ativo' : 'Inativo';
            
            return `
            <tr>
                <td data-label="Foto">${fotoHtml}</td>
                <td data-label="Nome">${safeName}</td>
                <td data-label="Nascimento">${dataNascimentoFormatada}</td>
                <td data-label="CPF">${maskedCpf}</td>
                <td data-label="Email">${safeEmail}</td>
                <td data-label="Telefone">${safePhone}</td>
                <td data-label="Plano"><span class="plan-badge plan-${(safePlan||'').toLowerCase()}">${safePlan}</span></td>
                <td data-label="Origem"><span class="origin-badge origin-${safeOrigin === 'Total Pass' ? 'totalpass' : (safeOrigin === 'Well Hub' ? 'wellhub' : 'direto')}">${safeOrigin}</span></td>
                <td data-label="Valor">${valorPlano}</td>
                <td data-label="Data Início"><span class="start-date-badge"><i class="fas fa-calendar-alt"></i> ${dataInicioFormatada}</span></td>
                <td data-label="Cidade">${safeCity}</td>
                <td data-label="Status"><span class="badge ${statusClass}">${statusText}</span></td>
                <td data-label="Ações">
                    <div class="table-actions">
                        <button class="btn-secondary" onclick="editItem('client', '${c.id}')">
                            <i class="fas fa-edit"></i>
                        </button>
                        <button class="btn-danger" onclick="deleteItem('client', '${c.id}')">
                            <i class="fas fa-trash"></i>
                        </button>
                        <button class="btn-secondary" onclick="generateClientReport('${c.id}')">
                            <i class="fas fa-file-pdf"></i> Relatório
                        </button>
                    </div>
                </td>
            </tr>
            `;
        }).join('');
        
        if (globalSearchTerm) filterClientsTable();
    });
}

// ============================================
// FUNÇÃO LOADFILTERS
// ============================================
async function loadFilters() {
    if (!currentUserId) return;
    
    try {
        const profSnapshot = await db.collection('professionals')
            .where('userId', '==', currentUserId)
            .where('active', '==', true)
            .get();
            
        const profSelect = document.getElementById('professionalFilter');
        if (profSelect) {
            profSelect.innerHTML = '<option value="all">Todos profissionais</option>';
            profSnapshot.forEach(doc => {
                const data = doc.data();
                const safeName = sanitizeString(data.name);
                profSelect.innerHTML += `<option value="${doc.id}">${safeName}</option>`;
            });
        }
        
        const servSnapshot = await db.collection('services')
            .where('userId', '==', currentUserId)
            .where('active', '==', true)
            .get();
            
        const servSelect = document.getElementById('serviceFilter');
        if (servSelect) {
            servSelect.innerHTML = '<option value="all">Todos serviços</option>';
            servSnapshot.forEach(doc => {
                const data = doc.data();
                const safeName = sanitizeString(data.name);
                servSelect.innerHTML += `<option value="${doc.id}">${safeName}</option>`;
            });
        }
    } catch (error) {
        console.error('Erro ao carregar filtros:', error);
    }
}

function updateProfessionalFilter(professionals) {
    const select = document.getElementById('professionalFilter');
    if (select) {
        const currentValue = select.value;
        select.innerHTML = '<option value="all">Todos profissionais</option>';
        professionals.filter(p => p.active).forEach(p => {
            const safeName = sanitizeString(p.name);
            select.innerHTML += `<option value="${p.id}" ${p.id === currentValue ? 'selected' : ''}>${safeName}</option>`;
        });
    }
}

function updateServiceFilter(services) {
    const select = document.getElementById('serviceFilter');
    if (select) {
        const currentValue = select.value;
        select.innerHTML = '<option value="all">Todos serviços</option>';
        services.filter(s => s.active).forEach(s => {
            const safeName = sanitizeString(s.name);
            select.innerHTML += `<option value="${s.id}" ${s.id === currentValue ? 'selected' : ''}>${safeName}</option>`;
        });
    }
}

// ============================================
// FUNÇÃO UPDATEAPPOINTMENTSLIST
// ============================================
async function updateAppointmentsList(appointments) {
    const list = document.getElementById('appointmentsList');
    if (!list) return;
    
    if (!appointments || appointments.length === 0) {
        list.innerHTML = `
            <div class="appointment-item" style="justify-content: center; padding: 40px;">
                <div style="text-align: center;">
                    <i class="fas fa-calendar-plus" style="font-size: 48px; color: var(--text-muted);"></i>
                    <p style="color: var(--text-muted); margin-top: 16px;">Nenhum agendamento encontrado</p>
                    <button class="btn-primary" onclick="openModal('appointment')" style="margin-top: 16px;">
                        <i class="fas fa-plus"></i> Criar agendamento
                    </button>
                </div>
            </div>
        `;
        return;
    }
    
    const today = new Date().toISOString().split('T')[0];
    const upcoming = appointments
        .filter(a => a.date >= today)
        .sort((a, b) => a.date.localeCompare(b.date) || a.time.localeCompare(b.time))
        .slice(0, 5);
    
    if (upcoming.length === 0) {
        list.innerHTML = `
            <div class="appointment-item" style="justify-content: center; padding: 20px;">
                <p style="color: var(--text-muted);">Nenhum agendamento futuro</p>
            </div>
        `;
        return;
    }
    
    const items = await Promise.all(upcoming.map(async a => {
        const client = await getClientName(a.clientId);
        const service = await getServiceName(a.serviceId);
        const professional = await getProfessionalName(a.professionalId);
        
        const safeClient = sanitizeString(client);
        const safeService = sanitizeString(service);
        const safeProfessional = sanitizeString(professional);
        
        const initials = (safeClient || 'C').substring(0, 2).toUpperCase();
        const dateObj = new Date(a.date + 'T12:00:00');
        const formattedDate = dateObj.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' });
        
        let statusClass = 'pending';
        let statusText = 'Pendente';
        
        if (a.status === 'confirmed') {
            statusClass = 'confirmed';
            statusText = 'Confirmado';
        } else if (a.status === 'attended') {
            statusClass = 'attended';
            statusText = 'Compareceu';
        } else if (a.status === 'absent') {
            statusClass = 'absent';
            statusText = 'Faltou';
        } else if (a.status === 'cancelled') {
            statusClass = 'cancelled';
            statusText = 'Cancelado';
        }
        
        return `
            <div class="appointment-item">
                <div class="appointment-time">${formattedDate}<br><small>${a.time || '--:--'}</small></div>
                <div class="appointment-avatar">${initials}</div>
                <div class="appointment-info">
                    <div class="appointment-name">${safeClient || 'Cliente'}</div>
                    <div class="appointment-service">
                        <i class="fas fa-dumbbell"></i> ${safeService || 'Serviço'}
                        <i class="fas fa-user-md" style="margin-left: 8px;"></i> ${safeProfessional || 'Profissional'}
                    </div>
                </div>
                <div class="appointment-status status-${statusClass}">
                    ${statusText}
                </div>
                <div class="appointment-actions">
                    ${a.date === today || a.date < today ? `
                        <button class="action-btn attended" onclick="updateAppointmentStatus('${a.id}', 'attended')" title="Compareceu">
                            <i class="fas fa-check-circle"></i>
                        </button>
                        <button class="action-btn absent" onclick="updateAppointmentStatus('${a.id}', 'absent')" title="Faltou">
                            <i class="fas fa-times-circle"></i>
                        </button>
                    ` : `
                        <button class="action-btn confirm" onclick="updateAppointmentStatus('${a.id}', 'confirmed')" title="Confirmar">
                            <i class="fas fa-check"></i>
                        </button>
                    `}
                    <button class="action-btn cancel" onclick="updateAppointmentStatus('${a.id}', 'cancelled')" title="Cancelar">
                        <i class="fas fa-times"></i>
                    </button>
                    <button class="action-btn" onclick="editItem('appointment', '${a.id}')" title="Editar">
                        <i class="fas fa-edit"></i>
                    </button>
                </div>
            </div>
        `;
    }));
    
    list.innerHTML = items.join('');
}

// Funções auxiliares
async function getClientName(clientId) {
    if (!clientId || !currentUserId) return 'Cliente';
    try {
        const doc = await db.collection('clients').doc(clientId).get();
        return doc.exists ? doc.data().name : 'Cliente';
    } catch {
        return 'Cliente';
    }
}

async function getServiceName(serviceId) {
    if (!serviceId || !currentUserId) return 'Serviço';
    try {
        const doc = await db.collection('services').doc(serviceId).get();
        return doc.exists ? doc.data().name : 'Serviço';
    } catch {
        return 'Serviço';
    }
}

async function getProfessionalName(professionalId) {
    if (!professionalId || !currentUserId) return 'Profissional';
    try {
        const doc = await db.collection('professionals').doc(professionalId).get();
        return doc.exists ? doc.data().name : 'Profissional';
    } catch {
        return 'Profissional';
    }
}

// ============================================
// FUNÇÕES DE GRÁFICOS
// ============================================
function updateCharts(appointments) {
    const categories = [];
    const attendedData = [];
    const absentData = [];
    
    for (let i = 6; i >= 0; i--) {
        const date = new Date();
        date.setDate(date.getDate() - i);
        const dateStr = date.toISOString().split('T')[0];
        categories.push(date.toLocaleDateString('pt-BR', { weekday: 'short' }));
        
        const dayAppointments = appointments.filter(a => a.date === dateStr);
        
        const attended = dayAppointments.filter(a => a.status === 'attended').length;
        const absent = dayAppointments.filter(a => a.status === 'absent').length;
        
        attendedData.push(attended);
        absentData.push(absent);
    }
    
    if (appointmentsChart) {
        loadSavedColors().then(colors => {
            appointmentsChart.updateOptions({ 
                xaxis: { categories },
                colors: [colors.success, colors.danger]
            });
            appointmentsChart.updateSeries([
                { name: 'Compareceram', data: attendedData },
                { name: 'Faltaram', data: absentData }
            ]);
        });
    }
}

function updatePlansChart(clients) {
    if (!servicesChart) return;
    
    const planCounts = {
        MENSAL: 0,
        TRIMESTRAL: 0,
        SEMESTRAL: 0,
        ANUAL: 0,
        AVULSO: 0
    };
    
    clients.forEach(client => {
        if (client.plan && planCounts.hasOwnProperty(client.plan)) {
            planCounts[client.plan]++;
        } else if (client.plan === 'AVULSO') {
            planCounts.AVULSO++;
        }
    });
    
    const planData = [
        planCounts.MENSAL,
        planCounts.TRIMESTRAL,
        planCounts.SEMESTRAL,
        planCounts.ANUAL,
        planCounts.AVULSO
    ];
    
    loadSavedColors().then(colors => {
        servicesChart.updateOptions({
            labels: ['MENSAL', 'TRIMESTRAL', 'SEMESTRAL', 'ANUAL', 'AVULSO'],
            colors: [colors.primary, colors.secondary, colors.success, colors.warning, colors.danger]
        });
        servicesChart.updateSeries(planData);
    });
}

function updateUserInterface(user) {
    const displayName = sanitizeString(user.displayName || user.email?.split('@')[0] || 'Admin');
    document.getElementById('userNameDisplay').textContent = displayName;
    
    let initials = displayName.substring(0, 2).toUpperCase();
    document.getElementById('userAvatar').textContent = initials;
}

// ============================================
// FUNÇÕES AUXILIARES DO CALENDÁRIO
// ============================================
function getStatusIcon(status) {
    const icons = {
        'confirmed': 'fas fa-check-circle',
        'attended': 'fas fa-check-double',
        'pending': 'fas fa-clock',
        'absent': 'fas fa-times-circle',
        'cancelled': 'fas fa-ban'
    };
    return icons[status] || 'fas fa-calendar';
}

function getStatusText(status) {
    const texts = {
        'confirmed': 'Confirmado',
        'attended': 'Compareceu',
        'pending': 'Pendente',
        'absent': 'Faltou',
        'cancelled': 'Cancelado'
    };
    return texts[status] || status;
}

// ============================================
// CALENDÁRIO
// ============================================
function initializeCalendar() {
    const calendarEl = document.getElementById('calendar');
    if (!calendarEl) {
        console.warn('Elemento do calendário não encontrado');
        return;
    }
    
    if (calendar) {
        try {
            calendar.destroy();
        } catch (e) {
            console.warn('Erro ao destruir calendário anterior:', e);
        }
    }
    
    calendar = new FullCalendar.Calendar(calendarEl, {
        locale: 'pt-br',
        timeZone: 'local',
        firstDay: 0,
        weekNumbers: true,
        weekText: 'S',
        
        initialView: window.innerWidth <= 768 ? 'timeGridDay' : 'dayGridMonth',
        height: 'auto',
        contentHeight: 'auto',
        aspectRatio: 1.8,
        handleWindowResize: true,
        windowResizeDelay: 100,
        
        headerToolbar: {
            left: 'prev,next today',
            center: 'title',
            right: 'dayGridMonth,timeGridWeek,timeGridDay,listWeek'
        },
        
        buttonText: {
            today: 'Hoje',
            month: 'Mês',
            week: 'Semana',
            day: 'Dia',
            list: 'Agenda'
        },
        
        events: loadCalendarEvents,
        
        editable: true,
        selectable: true,
        selectMirror: true,
        selectOverlap: true,
        eventDurationEditable: true,
        eventStartEditable: true,
        eventResizableFromStart: true,
        dragScroll: true,
        longPressDelay: 200,
        
        select: function(info) {
            const startDate = info.startStr.split('T')[0];
            const startTime = info.startStr.split('T')[1]?.substring(0, 5) || '09:00';
            openModal('appointment', startDate, startTime);
            calendar.unselect();
        },
        
        eventClick: function(info) {
            showAppointmentDetails(info.event);
        },
        
        eventDrop: async function(info) {
            if (!currentUserId) {
                info.revert();
                showNotification('Usuário não autenticado', 'error');
                return;
            }
            
            try {
                const eventId = info.event.id;
                const newStart = info.event.start;
                
                // Verificar propriedade antes de atualizar
                const docRef = db.collection('appointments').doc(eventId);
                const doc = await docRef.get();
                
                if (!doc.exists || doc.data().userId !== currentUserId) {
                    throw new Error('Acesso negado');
                }
                
                const year  = newStart.getFullYear();
                const month = String(newStart.getMonth() + 1).padStart(2, '0');
                const day   = String(newStart.getDate()).padStart(2, '0');
                const dateStr = `${year}-${month}-${day}`;
                const timeStr = `${String(newStart.getHours()).padStart(2, '0')}:${String(newStart.getMinutes()).padStart(2, '0')}`;
                
                await docRef.update({
                    date: dateStr,
                    time: timeStr,
                    updatedAt: firebase.firestore.FieldValue.serverTimestamp()
                });
                
                showNotification('Agendamento movido com sucesso!', 'success');
                await loadAllData();
                
            } catch (error) {
                console.error('Erro ao mover agendamento:', error);
                showNotification(error.message || 'Erro ao mover agendamento', 'error');
                info.revert();
            }
        },
        
        eventResize: async function(info) {
            if (!currentUserId) {
                info.revert();
                return;
            }
            
            try {
                const eventId = info.event.id;
                
                const docRef = db.collection('appointments').doc(eventId);
                const doc = await docRef.get();
                
                if (!doc.exists || doc.data().userId !== currentUserId) {
                    throw new Error('Acesso negado');
                }
                
                const newStart = info.event.start;
                const newEnd = info.event.end;
                
                if (newEnd) {
                    const diffMs = newEnd - newStart;
                    const newDuration = Math.round(diffMs / 60000);
                    
                    const appointmentData = doc.data();
                    
                    if (appointmentData.serviceId) {
                        const serviceDoc = await db.collection('services').doc(appointmentData.serviceId).get();
                        const serviceDuration = serviceDoc.exists ? serviceDoc.data().duration : 60;
                        
                        if (Math.abs(newDuration - serviceDuration) > 15) {
                            if (confirm('Deseja alterar a duração deste agendamento?')) {
                                await docRef.update({
                                    customDuration: newDuration,
                                    updatedAt: firebase.firestore.FieldValue.serverTimestamp()
                                });
                            } else {
                                info.revert();
                            }
                        }
                    }
                }
                
                showNotification('Duração atualizada!', 'success');
                
            } catch (error) {
                console.error('Erro ao redimensionar:', error);
                showNotification(error.message || 'Erro ao redimensionar', 'error');
                info.revert();
            }
        },
        
        eventMouseEnter: function(info) {
            const props = info.event.extendedProps;
            const startTime = info.event.start ? 
                info.event.start.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }) : 
                props.time || '--:--';
            
            const endTime = info.event.end ? 
                info.event.end.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }) : 
                props.endTime || '--:--';
            
            loadSavedColors().then(colors => {
                const safeClientName = sanitizeString(props.clientName || 'Cliente');
                const safeServiceName = sanitizeString(props.serviceName || 'Serviço');
                const safeProfessionalName = sanitizeString(props.professionalName || 'Profissional');
                
                const tooltip = document.createElement('div');
                tooltip.className = 'event-tooltip';
                tooltip.id = 'event-tooltip';
                tooltip.innerHTML = `
                    <div style="font-weight: 600; margin-bottom: 5px;">${safeClientName}</div>
                    <div style="font-size: 11px;">${startTime} - ${endTime}</div>
                    <div style="font-size: 11px; margin-top: 3px;">
                        <span style="color: ${colors.primary};">${safeServiceName}</span> com ${safeProfessionalName}
                    </div>
                    <div style="font-size: 11px; margin-top: 3px;">
                        Status: ${getStatusText(props.status)}
                    </div>
                `;
                
                document.body.appendChild(tooltip);
                
                const rect = info.el.getBoundingClientRect();
                tooltip.style.top = rect.top - tooltip.offsetHeight - 5 + 'px';
                tooltip.style.left = rect.left + (rect.width / 2) - (tooltip.offsetWidth / 2) + 'px';
            });
        },
        
        eventMouseLeave: function() {
            const tooltip = document.getElementById('event-tooltip');
            if (tooltip) tooltip.remove();
        },
        
        eventDidMount: function(info) {
            const props = info.event.extendedProps;
            info.el.classList.add(`event-status-${props.status || 'pending'}`);
        }
    });
    
    calendar.render();
}

// ============================================
// FUNÇÃO PARA CARREGAR EVENTOS DO CALENDÁRIO
// ============================================
async function loadCalendarEvents(fetchInfo, successCallback, failureCallback) {
    if (!currentUserId) {
        successCallback([]);
        return;
    }
    
    try {
        const snapshot = await db.collection('appointments')
            .where('userId', '==', currentUserId)
            .where('date', '>=', fetchInfo.startStr.split('T')[0])
            .where('date', '<=', fetchInfo.endStr.split('T')[0])
            .orderBy('date', 'asc')
            .orderBy('time', 'asc')
            .get();
        
        const events = [];
        const clientIds = new Set();
        const serviceIds = new Set();
        const professionalIds = new Set();
        
        snapshot.docs.forEach(doc => {
            const data = doc.data();
            if (data.clientId) clientIds.add(data.clientId);
            if (data.serviceId) serviceIds.add(data.serviceId);
            if (data.professionalId) professionalIds.add(data.professionalId);
        });
        
        const [clientDocs, serviceDocs, professionalDocs] = await Promise.all([
            Promise.all(Array.from(clientIds).map(id => 
                db.collection('clients').doc(id).get().catch(() => null)
            )),
            Promise.all(Array.from(serviceIds).map(id => 
                db.collection('services').doc(id).get().catch(() => null)
            )),
            Promise.all(Array.from(professionalIds).map(id => 
                db.collection('professionals').doc(id).get().catch(() => null)
            ))
        ]);
        
        const clientMap = new Map();
        clientDocs.forEach((doc, index) => {
            const id = Array.from(clientIds)[index];
            if (doc && doc.exists) {
                clientMap.set(id, doc.data().name);
            }
        });
        
        const serviceMap = new Map();
        serviceDocs.forEach((doc, index) => {
            const id = Array.from(serviceIds)[index];
            if (doc && doc.exists) {
                serviceMap.set(id, doc.data());
            }
        });
        
        const professionalMap = new Map();
        professionalDocs.forEach((doc, index) => {
            const id = Array.from(professionalIds)[index];
            if (doc && doc.exists) {
                professionalMap.set(id, doc.data().name);
            }
        });
        
        const colors = await loadSavedColors();
        
        snapshot.docs.forEach(doc => {
            const data = doc.data();
            
            const clientName = clientMap.get(data.clientId) || 'Cliente';
            const serviceData = serviceMap.get(data.serviceId) || { name: 'Serviço', duration: 60, price: 0 };
            const professionalName = professionalMap.get(data.professionalId) || 'Profissional';
            
            const startTime = data.time || '09:00';
            let endTime = startTime;
            
            if (serviceData.duration) {
                const [hours, minutes] = startTime.split(':').map(Number);
                const totalMinutes = hours * 60 + minutes + serviceData.duration;
                const endHours = Math.floor(totalMinutes / 60);
                const endMinutes = totalMinutes % 60;
                endTime = `${String(endHours).padStart(2, '0')}:${String(endMinutes).padStart(2, '0')}`;
            }
            
            let backgroundColor = colors.primary;
            if (data.status === 'pending') backgroundColor = colors.warning;
            else if (data.status === 'confirmed') backgroundColor = colors.success;
            else if (data.status === 'attended') backgroundColor = colors.secondary;
            else if (data.status === 'absent') backgroundColor = colors.danger;
            else if (data.status === 'cancelled') backgroundColor = adjustColor(colors.text, -20);
            
            events.push({
                id: doc.id,
                title: sanitizeString(clientName),
                start: data.date + 'T' + startTime + ':00',
                end: data.date + 'T' + endTime + ':00',
                backgroundColor: backgroundColor,
                borderColor: backgroundColor,
                textColor: '#ffffff',
                extendedProps: {
                    clientName: sanitizeString(clientName),
                    serviceName: sanitizeString(serviceData.name),
                    professionalName: sanitizeString(professionalName),
                    servicePrice: serviceData.price || 0,
                    serviceDuration: serviceData.duration || 60,
                    status: data.status || 'pending',
                    notes: sanitizeString(data.notes || ''),
                    date: data.date,
                    time: data.time,
                    endTime: endTime
                }
            });
        });
        
        successCallback(events);
        
    } catch (error) {
        console.error('Erro ao carregar eventos:', error);
        failureCallback(error);
    }
}

// ============================================
// FUNÇÃO PARA MOSTRAR DETALHES DO AGENDAMENTO
// ============================================
function showAppointmentDetails(event) {
    const props = event.extendedProps;
    const startTime = event.start ? 
        event.start.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }) : 
        props.time;
    
    const endTime = event.end ? 
        event.end.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }) : 
        props.endTime;
    
    loadSavedColors().then(colors => {
        let statusText = '';
        let statusColor = '';
        let statusBg = '';
        
        if (props.status === 'confirmed') {
            statusText = '✅ Confirmado';
            statusColor = colors.success;
            statusBg = adjustColor(colors.success, 40) + '20';
        } else if (props.status === 'attended') {
            statusText = '✅ Compareceu';
            statusColor = colors.secondary;
            statusBg = adjustColor(colors.secondary, 40) + '20';
        } else if (props.status === 'absent') {
            statusText = '❌ Faltou';
            statusColor = colors.danger;
            statusBg = adjustColor(colors.danger, 40) + '20';
        } else if (props.status === 'pending') {
            statusText = '⏳ Pendente';
            statusColor = colors.warning;
            statusBg = adjustColor(colors.warning, 40) + '20';
        } else if (props.status === 'cancelled') {
            statusText = '❌ Cancelado';
            statusColor = colors.textLight;
            statusBg = adjustColor(colors.textLight, 40) + '20';
        }
        
        const safeClientName = sanitizeString(props.clientName);
        const safeServiceName = sanitizeString(props.serviceName);
        const safeProfessionalName = sanitizeString(props.professionalName);
        const safeNotes = sanitizeString(props.notes);
        
        const detailsHTML = `
            <div class="modal" id="appointmentDetailsModal" style="display: flex;">
                <div class="modal-content" style="max-width: 500px;">
                    <h2 style="margin-bottom: 20px; color: ${colors.primary};">
                        <i class="fas fa-calendar-check"></i> Detalhes do Agendamento
                    </h2>
                    
                    <div style="margin-bottom: 20px;">
                        <div style="background: ${isColorLight(colors.background) ? '#f3f4f6' : adjustColor(colors.background, 20)}; padding: 15px; border-radius: 12px; margin-bottom: 15px;">
                            <div style="display: flex; align-items: center;">
                                <div style="width: 40px; height: 40px; background: linear-gradient(135deg, ${colors.primary}, ${adjustColor(colors.primary, 20)}); border-radius: 50%; display: flex; align-items: center; justify-content: center; margin-right: 15px;">
                                    <i class="fas fa-user" style="color: white;"></i>
                                </div>
                                <div>
                                    <div style="font-size: 12px; color: ${colors.textLight};">Cliente</div>
                                    <div style="font-size: 18px; font-weight: 600;">${safeClientName}</div>
                                </div>
                            </div>
                        </div>
                        
                        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 10px; margin-bottom: 15px;">
                            <div style="background: ${isColorLight(colors.background) ? '#f3f4f6' : adjustColor(colors.background, 20)}; padding: 12px; border-radius: 12px;">
                                <div style="font-size: 12px; color: ${colors.textLight}; margin-bottom: 5px;">
                                    <i class="fas fa-cut"></i> Serviço
                                </div>
                                <div style="font-weight: 600;">${safeServiceName}</div>
                            </div>
                            
                            <div style="background: ${isColorLight(colors.background) ? '#f3f4f6' : adjustColor(colors.background, 20)}; padding: 12px; border-radius: 12px;">
                                <div style="font-size: 12px; color: ${colors.textLight}; margin-bottom: 5px;">
                                    <i class="fas fa-user-md"></i> Profissional
                                </div>
                                <div style="font-weight: 600;">${safeProfessionalName}</div>
                            </div>
                        </div>
                        
                        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 10px; margin-bottom: 15px;">
                            <div style="background: ${isColorLight(colors.background) ? '#f3f4f6' : adjustColor(colors.background, 20)}; padding: 12px; border-radius: 12px;">
                                <div style="font-size: 12px; color: ${colors.textLight}; margin-bottom: 5px;">
                                    <i class="fas fa-clock"></i> Horário
                                </div>
                                <div style="font-weight: 600;">${startTime} às ${endTime}</div>
                            </div>
                            
                            <div style="background: ${isColorLight(colors.background) ? '#f3f4f6' : adjustColor(colors.background, 20)}; padding: 12px; border-radius: 12px;">
                                <div style="font-size: 12px; color: ${colors.textLight}; margin-bottom: 5px;">
                                    <i class="fas fa-dollar-sign"></i> Valor
                                </div>
                                <div style="font-weight: 600;">${formatCurrency(props.servicePrice)}</div>
                            </div>
                        </div>
                        
                        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 10px; margin-bottom: 15px;">
                            <div style="background: ${isColorLight(colors.background) ? '#f3f4f6' : adjustColor(colors.background, 20)}; padding: 12px; border-radius: 12px;">
                                <div style="font-size: 12px; color: ${colors.textLight}; margin-bottom: 5px;">
                                    <i class="fas fa-hourglass-half"></i> Duração
                                </div>
                                <div style="font-weight: 600;">${props.serviceDuration} minutos</div>
                            </div>
                            
                            <div style="background: ${isColorLight(colors.background) ? '#f3f4f6' : adjustColor(colors.background, 20)}; padding: 12px; border-radius: 12px;">
                                <div style="font-size: 12px; color: ${colors.textLight}; margin-bottom: 5px;">
                                    <i class="fas fa-tag"></i> Status
                                </div>
                                <div>
                                    <span class="badge" style="background: ${statusBg}; color: ${statusColor}; padding: 5px 10px; border-radius: 20px; border: 1px solid ${statusColor};">
                                        ${statusText}
                                    </span>
                                </div>
                            </div>
                        </div>
                        
                        ${safeNotes ? `
                            <div style="background: ${isColorLight(colors.background) ? '#f3f4f6' : adjustColor(colors.background, 20)}; padding: 12px; border-radius: 12px; margin-bottom: 15px;">
                                <div style="font-size: 12px; color: ${colors.textLight}; margin-bottom: 5px;">
                                    <i class="fas fa-comment"></i> Observações
                                </div>
                                <div>${safeNotes}</div>
                            </div>
                        ` : ''}
                        
                        <div style="background: ${isColorLight(colors.background) ? '#f3f4f6' : adjustColor(colors.background, 20)}; padding: 12px; border-radius: 12px;">
                            <div style="font-size: 12px; color: ${colors.textLight}; margin-bottom: 5px;">
                                <i class="fas fa-calendar-day"></i> Data
                            </div>
                            <div style="font-weight: 600;">${new Date(props.date + 'T12:00:00').toLocaleDateString('pt-BR', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</div>
                        </div>
                    </div>
                    
                    <div class="modal-actions" style="justify-content: space-between;">
                        <div>
                            <button class="btn-secondary" onclick="editItem('appointment', '${event.id}')">
                                <i class="fas fa-edit"></i> Editar
                            </button>
                            <button class="btn-danger" onclick="deleteItem('appointment', '${event.id}')" style="margin-left: 10px;">
                                <i class="fas fa-trash"></i> Excluir
                            </button>
                        </div>
                        <button class="btn-primary" onclick="closeAppointmentDetails()">
                            <i class="fas fa-times"></i> Fechar
                        </button>
                    </div>
                </div>
            </div>
        `;
        
        const oldModal = document.getElementById('appointmentDetailsModal');
        if (oldModal) oldModal.remove();
        
        document.body.insertAdjacentHTML('beforeend', detailsHTML);
    });
}

function closeAppointmentDetails() {
    const modal = document.getElementById('appointmentDetailsModal');
    if (modal) modal.remove();
}

// ============================================
// FUNÇÕES DE FOTO
// ============================================
function openCamera() {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';
    input.capture = 'environment';
    input.onchange = (e) => handlePhotoSelect(e);
    input.click();
}

function uploadFromGallery() {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';
    input.onchange = (e) => handlePhotoSelect(e);
    input.click();
}

function handlePhotoSelect(event) {
    const file = event.target.files[0];
    if (!file) return;
    
    if (!ALLOWED_IMAGE_TYPES.includes(file.type)) {
        showNotification('Tipo de arquivo não permitido. Use apenas imagens.', 'error');
        return;
    }
    
    if (file.size > MAX_IMAGE_SIZE) {
        showNotification('A imagem deve ter no máximo 5MB', 'error');
        return;
    }
    
    const reader = new FileReader();
    reader.onload = (e) => {
        try {
            currentPhotoBase64 = validateAndSanitizeImageBase64(e.target.result);
            
            const preview = document.getElementById('photoPreview');
            if (preview) {
                preview.innerHTML = `<img src="${currentPhotoBase64}" alt="Preview" style="width: 100%; height: 100%; object-fit: cover;">`;
            }
        } catch (error) {
            showNotification(error.message, 'error');
        }
    };
    reader.readAsDataURL(file);
}

// ============================================
// FUNÇÕES DO MODAL
// ============================================
function openModal(type, date = null, time = null) {
    if (!currentUserId) {
        showNotification('Faça login primeiro', 'error');
        return;
    }
    
    detectDevTools();
    registerActivity();
    
    currentModalType = type;
    editingId = null;
    currentPhotoBase64 = null;
    
    const modal = document.getElementById('genericModal');
    const title = document.getElementById('modalTitle');
    const fields = document.getElementById('modalFields');
    const saveBtn = document.getElementById('saveModalBtn');
    
    saveBtn.innerHTML = 'Salvar';
    saveBtn.disabled = false;
    
    if (type === 'totalpass') {
        title.textContent = 'Novo Cliente Total Pass';
    } else if (type === 'wellhub') {
        title.textContent = 'Novo Cliente Well Hub';
    } else {
        title.textContent = type === 'appointment' ? 'Novo Agendamento' :
                           type === 'professional' ? 'Novo Profissional' :
                           type === 'service' ? 'Novo Serviço' : 'Novo Cliente';
    }
    
    if (type === 'appointment') {
        fields.innerHTML = `
            <div class="form-group">
                <label>Cliente</label>
                <select id="modalClientId" class="form-control" required>
                    <option value="">Selecione um cliente</option>
                </select>
            </div>
            <div class="form-group">
                <label>Serviço</label>
                <select id="modalServiceId" class="form-control" required>
                    <option value="">Selecione um serviço</option>
                </select>
            </div>
            <div class="form-group">
                <label>Profissional</label>
                <select id="modalProfessionalId" class="form-control" required>
                    <option value="">Selecione um profissional</option>
                </select>
            </div>
            <div class="form-group">
                <label>Data</label>
                <input type="date" id="modalDate" class="form-control" value="${date || new Date().toISOString().split('T')[0]}" required>
            </div>
            <div class="form-group">
                <label>Horário</label>
                <input type="time" id="modalTime" class="form-control" value="${time || '09:00'}" required>
            </div>
            <div class="form-group">
                <label>Observações</label>
                <textarea id="modalNotes" class="form-control" rows="3"></textarea>
            </div>
        `;
        
        loadModalSelects();
        
    } else if (type === 'professional') {
        fields.innerHTML = `
            <div class="form-group">
                <label>Nome Completo *</label>
                <input type="text" id="modalName" class="form-control" required maxlength="100">
            </div>
            <div class="form-group">
                <label>Especialidade *</label>
                <input type="text" id="modalSpecialty" class="form-control" required maxlength="100">
            </div>
            <div class="form-group">
                <label>Email</label>
                <input type="email" id="modalEmail" class="form-control" maxlength="100">
            </div>
            <div class="form-group">
                <label>Telefone</label>
                <input type="tel" id="modalPhone" class="form-control" maxlength="15">
            </div>
            <div class="form-group">
                <label>Status</label>
                <select id="modalActive" class="form-control">
                    <option value="true">Ativo</option>
                    <option value="false">Inativo</option>
                </select>
            </div>
        `;
        
    } else if (type === 'service') {
        fields.innerHTML = `
            <div class="form-group">
                <label>Nome *</label>
                <input type="text" id="modalName" class="form-control" required maxlength="100">
            </div>
            <div class="form-group">
                <label>Duração (minutos) *</label>
                <input type="number" id="modalDuration" class="form-control" value="60" required min="5" max="480">
            </div>
            <div class="form-group">
                <label>Preço (R$) *</label>
                <input type="text" id="modalPrice" class="form-control" value="0,00" onkeyup="mascaraMoeda(this)" required>
            </div>
            <div class="form-group">
                <label>Descrição</label>
                <textarea id="modalDescription" class="form-control" rows="3" maxlength="500"></textarea>
            </div>
            <div class="form-group">
                <label>Status</label>
                <select id="modalActive" class="form-control">
                    <option value="true">Ativo</option>
                    <option value="false">Inativo</option>
                </select>
            </div>
        `;
        
    } else if (type === 'client' || type === 'totalpass' || type === 'wellhub') {
        const origin = type === 'totalpass' ? 'Total Pass' : (type === 'wellhub' ? 'Well Hub' : 'Direto');
        fields.innerHTML = getClientModalFields(origin);
    }
    
    modal.style.display = 'flex';
}

// ============================================
// FUNÇÃO GETCLIENTMODALFIELDS
// ============================================
function getClientModalFields(origin = 'Direto') {
    const today = new Date().toISOString().split('T')[0];
    
    return `
        <div class="photo-upload-container">
            <div class="photo-preview" id="photoPreview">
                <i class="fas fa-camera"></i>
            </div>
            <div>
                <div class="photo-buttons">
                    <button type="button" class="photo-btn" onclick="openCamera()">
                        <i class="fas fa-camera"></i> Tirar Foto
                    </button>
                    <button type="button" class="photo-btn" onclick="uploadFromGallery()">
                        <i class="fas fa-images"></i> Galeria
                    </button>
                </div>
                <div class="photo-optional" style="color: #6b7280; font-size: 11px; margin-top: 5px; text-align: center;">
                    <i class="fas fa-info-circle"></i> Foto opcional (máx. 5MB)
                </div>
            </div>
        </div>
        
        <div class="form-group">
            <label>Nome Completo *</label>
            <input type="text" id="modalName" class="form-control" required placeholder="Digite o nome completo" maxlength="100">
        </div>
        
        <div class="form-group">
            <label>CPF *</label>
            <input type="text" id="modalCpf" class="form-control" required placeholder="000.000.000-00" maxlength="14" onkeyup="mascaraCPF(this)">
        </div>
        
        <div class="form-group">
            <label>Data de Nascimento *</label>
            <input type="date" id="modalBirthDate" class="form-control" required max="${today}">
        </div>
        
        <div class="form-group">
            <label>Email</label>
            <input type="email" id="modalEmail" class="form-control" placeholder="email@exemplo.com" maxlength="100">
        </div>
        
        <div class="form-group">
            <label>Número de Telefone *</label>
            <input type="tel" id="modalPhone" class="form-control" required placeholder="(11) 99999-9999" maxlength="15" onkeyup="mascaraTelefone(this)">
        </div>
        
        <div class="form-group">
            <label>Plano do Cliente *</label>
            <select id="modalPlan" class="form-control" required>
                <option value="">Selecione o plano</option>
                <option value="MENSAL">MENSAL</option>
                <option value="TRIMESTRAL">TRIMESTRAL</option>
                <option value="SEMESTRAL">SEMESTRAL</option>
                <option value="ANUAL">ANUAL</option>
                <option value="AVULSO">AVULSO</option>
            </select>
        </div>
        
        <div class="form-group">
            <label>Valor do Plano (R$) *</label>
            <input type="text" id="modalPlanValue" class="form-control" required placeholder="0,00" onkeyup="mascaraMoeda(this)" value="0,00">
        </div>
        
        <div class="form-group">
            <label>Data de Início *</label>
            <input type="date" id="modalStartDate" class="form-control" required value="${today}" max="${today}">
            <small class="field-hint"><i class="fas fa-calendar-alt"></i> Data em que o cliente iniciou as aulas</small>
        </div>
        
        <input type="hidden" id="modalOrigin" value="${origin}">
        
        <div class="form-group">
            <label>Endereço</label>
            <input type="text" id="modalAddress" class="form-control" placeholder="Rua, número" maxlength="200">
        </div>
        
        <div class="row-3">
            <div class="form-group">
                <label>CEP</label>
                <input type="text" id="modalCep" class="form-control" placeholder="00000-000" maxlength="9" onkeyup="mascaraCEP(this)" onblur="buscarCep()">
            </div>
            <div class="form-group">
                <label>Bairro</label>
                <input type="text" id="modalNeighborhood" class="form-control" placeholder="Bairro" maxlength="100">
            </div>
            <div class="form-group">
                <label>Cidade</label>
                <input type="text" id="modalCity" class="form-control" placeholder="Cidade" maxlength="100">
            </div>
        </div>
        
        <div class="form-group">
            <label>Status</label>
            <select id="modalStatus" class="form-control">
                <option value="active">Ativo</option>
                <option value="inactive">Inativo</option>
            </select>
        </div>
    `;
}

// ============================================
// FUNÇÃO LOADMODALSELECTS
// ============================================
async function loadModalSelects(selected = {}) {
    if (!currentUserId) return;
    
    try {
        const clientsSnap = await db.collection('clients')
            .where('userId', '==', currentUserId)
            .where('status', '==', 'active')
            .get();
            
        const clientSelect = document.getElementById('modalClientId');
        if (clientSelect) {
            clientSelect.innerHTML = '<option value="">Selecione um cliente</option>';
            const clients = [];
            clientsSnap.forEach(doc => {
                clients.push({ id: doc.id, name: doc.data().name });
            });
            
            clients.sort((a, b) => (a.name || '').localeCompare(b.name || ''));
            
            clients.forEach(client => {
                const safeName = sanitizeString(client.name);
                clientSelect.innerHTML += `<option value="${client.id}" ${client.id === selected.clientId ? 'selected' : ''}>${safeName}</option>`;
            });
        }
        
        const servicesSnap = await db.collection('services')
            .where('userId', '==', currentUserId)
            .where('active', '==', true)
            .get();
            
        const serviceSelect = document.getElementById('modalServiceId');
        if (serviceSelect) {
            serviceSelect.innerHTML = '<option value="">Selecione um serviço</option>';
            const services = [];
            servicesSnap.forEach(doc => {
                services.push({ id: doc.id, name: doc.data().name });
            });
            
            services.sort((a, b) => (a.name || '').localeCompare(b.name || ''));
            
            services.forEach(service => {
                const safeName = sanitizeString(service.name);
                serviceSelect.innerHTML += `<option value="${service.id}" ${service.id === selected.serviceId ? 'selected' : ''}>${safeName}</option>`;
            });
        }
        
        const profSnap = await db.collection('professionals')
            .where('userId', '==', currentUserId)
            .where('active', '==', true)
            .get();
            
        const profSelect = document.getElementById('modalProfessionalId');
        if (profSelect) {
            profSelect.innerHTML = '<option value="">Selecione um profissional</option>';
            const professionals = [];
            profSnap.forEach(doc => {
                const data = doc.data();
                professionals.push({ id: doc.id, name: data.name, specialty: data.specialty });
            });
            
            professionals.sort((a, b) => (a.name || '').localeCompare(b.name || ''));
            
            professionals.forEach(prof => {
                const safeName = sanitizeString(prof.name);
                const safeSpecialty = sanitizeString(prof.specialty || '');
                profSelect.innerHTML += `<option value="${prof.id}" ${prof.id === selected.professionalId ? 'selected' : ''}>${safeName} - ${safeSpecialty}</option>`;
            });
        }
    } catch (error) {
        console.error('Erro ao carregar selects:', error);
        showNotification('Erro ao carregar dados', 'error');
    }
}

function closeModal() {
    document.getElementById('genericModal').style.display = 'none';
    editingId = null;
    currentModalType = null;
    currentPhotoBase64 = null;
    
    const saveBtn = document.getElementById('saveModalBtn');
    saveBtn.innerHTML = 'Salvar';
    saveBtn.disabled = false;
}

// ============================================
// FUNÇÕES DE MÁSCARA
// ============================================
function mascaraMoeda(input) {
    let v = input.value.replace(/\D/g, '');
    v = (v / 100).toFixed(2) + '';
    v = v.replace('.', ',');
    v = v.replace(/(\d)(?=(\d{3})+(?!\d))/g, '$1.');
    input.value = v;
}

function mascaraCPF(input) {
    let v = input.value.replace(/\D/g, '');
    v = v.replace(/(\d{3})(\d)/, '$1.$2');
    v = v.replace(/(\d{3})(\d)/, '$1.$2');
    v = v.replace(/(\d{3})(\d{1,2})$/, '$1-$2');
    input.value = v;
}

function mascaraTelefone(input) {
    let v = input.value.replace(/\D/g, '');
    v = v.replace(/^(\d{2})(\d)/g, '($1) $2');
    v = v.replace(/(\d{5})(\d)/, '$1-$2');
    input.value = v;
}

function mascaraCEP(input) {
    let v = input.value.replace(/\D/g, '');
    v = v.replace(/^(\d{5})(\d)/, '$1-$2');
    input.value = v;
}

async function buscarCep() {
    const cep = document.getElementById('modalCep')?.value.replace(/\D/g, '');
    if (cep && cep.length === 8) {
        try {
            const response = await fetch(`https://viacep.com.br/ws/${cep}/json/`);
            const data = await response.json();
            
            if (!data.erro) {
                document.getElementById('modalAddress').value = data.logradouro || '';
                document.getElementById('modalNeighborhood').value = data.bairro || '';
                document.getElementById('modalCity').value = data.localidade || '';
            }
        } catch (error) {
            console.error('Erro ao buscar CEP:', error);
        }
    }
}

// ============================================
// FUNÇÃO EDITITEM
// ============================================
async function editItem(type, id) {
    if (!currentUserId) {
        showNotification('Usuário não autenticado', 'error');
        return;
    }
    
    detectDevTools();
    registerActivity();
    
    try {
        // Verificar propriedade antes de carregar
        const docRef = db.collection(type + 's').doc(id);
        const doc = await docRef.get();
        
        if (!doc.exists) {
            showNotification('Documento não encontrado', 'error');
            return;
        }
        
        if (doc.data().userId !== currentUserId) {
            showNotification('Acesso negado a este documento', 'error');
            return;
        }
        
        const data = doc.data();
        
        currentModalType = type;
        editingId = id;
        currentPhotoBase64 = null;
        
        const modal = document.getElementById('genericModal');
        const title = document.getElementById('modalTitle');
        const saveBtn = document.getElementById('saveModalBtn');
        
        saveBtn.innerHTML = 'Salvar';
        saveBtn.disabled = false;
        
        title.textContent = type === 'appointment' ? 'Editar Agendamento' :
                           type === 'professional' ? 'Editar Profissional' :
                           type === 'service' ? 'Editar Serviço' : 'Editar Cliente';
        
        const fields = document.getElementById('modalFields');
        
        if (type === 'appointment') {
            fields.innerHTML = `
                <div class="form-group">
                    <label>Cliente</label>
                    <select id="modalClientId" class="form-control" required>
                        <option value="${data.clientId}">Carregando...</option>
                    </select>
                </div>
                <div class="form-group">
                    <label>Serviço</label>
                    <select id="modalServiceId" class="form-control" required>
                        <option value="${data.serviceId}">Carregando...</option>
                    </select>
                </div>
                <div class="form-group">
                    <label>Profissional</label>
                    <select id="modalProfessionalId" class="form-control" required>
                        <option value="${data.professionalId}">Carregando...</option>
                    </select>
                </div>
                <div class="form-group">
                    <label>Data</label>
                    <input type="date" id="modalDate" class="form-control" value="${data.date}" required>
                </div>
                <div class="form-group">
                    <label>Horário</label>
                    <input type="time" id="modalTime" class="form-control" value="${data.time}" required>
                </div>
                <div class="form-group">
                    <label>Observações</label>
                    <textarea id="modalNotes" class="form-control" rows="3">${sanitizeString(data.notes || '')}</textarea>
                </div>
            `;
            loadModalSelects(data);
            
        } else if (type === 'professional') {
            fields.innerHTML = `
                <div class="form-group">
                    <label>Nome Completo</label>
                    <input type="text" id="modalName" class="form-control" value="${sanitizeString(data.name || '')}" required maxlength="100">
                </div>
                <div class="form-group">
                    <label>Especialidade</label>
                    <input type="text" id="modalSpecialty" class="form-control" value="${sanitizeString(data.specialty || '')}" required maxlength="100">
                </div>
                <div class="form-group">
                    <label>Email</label>
                    <input type="email" id="modalEmail" class="form-control" value="${sanitizeString(data.email || '')}" maxlength="100">
                </div>
                <div class="form-group">
                    <label>Telefone</label>
                    <input type="tel" id="modalPhone" class="form-control" value="${sanitizeString(data.phone || '')}" maxlength="15">
                </div>
                <div class="form-group">
                    <label>Status</label>
                    <select id="modalActive" class="form-control">
                        <option value="true" ${data.active ? 'selected' : ''}>Ativo</option>
                        <option value="false" ${!data.active ? 'selected' : ''}>Inativo</option>
                    </select>
                </div>
            `;
        } else if (type === 'service') {
            const priceFormatted = data.price ? data.price.toFixed(2).replace('.', ',').replace(/(\d)(?=(\d{3})+(?!\d))/g, '$1.') : '0,00';
            
            fields.innerHTML = `
                <div class="form-group">
                    <label>Nome</label>
                    <input type="text" id="modalName" class="form-control" value="${sanitizeString(data.name || '')}" required maxlength="100">
                </div>
                <div class="form-group">
                    <label>Duração (minutos)</label>
                    <input type="number" id="modalDuration" class="form-control" value="${data.duration || 60}" required min="5" max="480">
                </div>
                <div class="form-group">
                    <label>Preço (R$)</label>
                    <input type="text" id="modalPrice" class="form-control" value="${priceFormatted}" onkeyup="mascaraMoeda(this)">
                </div>
                <div class="form-group">
                    <label>Descrição</label>
                    <textarea id="modalDescription" class="form-control" rows="3" maxlength="500">${sanitizeString(data.description || '')}</textarea>
                </div>
                <div class="form-group">
                    <label>Status</label>
                    <select id="modalActive" class="form-control">
                        <option value="true" ${data.active ? 'selected' : ''}>Ativo</option>
                        <option value="false" ${!data.active ? 'selected' : ''}>Inativo</option>
                    </select>
                </div>
            `;
        } else if (type === 'client') {
            const cpfFormatado = data.cpf ? data.cpf.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4') : '';
            
            let valorFormatado = '0,00';
            if (data.planValue) {
                valorFormatado = data.planValue.toFixed(2).replace('.', ',');
                valorFormatado = valorFormatado.replace(/(\d)(?=(\d{3})+(?!\d))/g, '$1.');
            }
            
            let photoHtml = '<i class="fas fa-camera"></i>';
            if (data.photoBase64) {
                try {
                    if (validateAndSanitizeImageBase64(data.photoBase64)) {
                        photoHtml = `<img src="${data.photoBase64}" alt="Foto">`;
                        currentPhotoBase64 = data.photoBase64;
                    }
                } catch (e) {
                    secureLog('Imagem inválida ao editar');
                }
            }
            
            const today = new Date().toISOString().split('T')[0];
            
            fields.innerHTML = `
                <div class="photo-upload-container">
                    <div class="photo-preview" id="photoPreview">
                        ${photoHtml}
                    </div>
                    <div>
                        <div class="photo-buttons">
                            <button type="button" class="photo-btn" onclick="openCamera()">
                                <i class="fas fa-camera"></i> Tirar Foto
                            </button>
                            <button type="button" class="photo-btn" onclick="uploadFromGallery()">
                                <i class="fas fa-images"></i> Galeria
                            </button>
                        </div>
                        <div class="photo-optional" style="color: #6b7280; font-size: 11px; margin-top: 5px; text-align: center;">
                            <i class="fas fa-info-circle"></i> Foto opcional (máx. 5MB)
                        </div>
                    </div>
                </div>
                
                <div class="form-group">
                    <label>Nome Completo *</label>
                    <input type="text" id="modalName" class="form-control" value="${sanitizeString(data.name || '')}" required maxlength="100">
                </div>
                
                <div class="form-group">
                    <label>CPF *</label>
                    <input type="text" id="modalCpf" class="form-control" value="${cpfFormatado}" required maxlength="14" onkeyup="mascaraCPF(this)">
                </div>
                
                <div class="form-group">
                    <label>Data de Nascimento *</label>
                    <input type="date" id="modalBirthDate" class="form-control" value="${data.birthDate || ''}" required max="${today}">
                </div>
                
                <div class="form-group">
                    <label>Email</label>
                    <input type="email" id="modalEmail" class="form-control" value="${sanitizeString(data.email || '')}" maxlength="100">
                </div>
                
                <div class="form-group">
                    <label>Número de Telefone *</label>
                    <input type="tel" id="modalPhone" class="form-control" value="${sanitizeString(data.phone || '')}" required maxlength="15" onkeyup="mascaraTelefone(this)">
                </div>
                
                <div class="form-group">
                    <label>Plano do Cliente *</label>
                    <select id="modalPlan" class="form-control" required>
                        <option value="">Selecione o plano</option>
                        <option value="MENSAL" ${data.plan === 'MENSAL' ? 'selected' : ''}>MENSAL</option>
                        <option value="TRIMESTRAL" ${data.plan === 'TRIMESTRAL' ? 'selected' : ''}>TRIMESTRAL</option>
                        <option value="SEMESTRAL" ${data.plan === 'SEMESTRAL' ? 'selected' : ''}>SEMESTRAL</option>
                        <option value="ANUAL" ${data.plan === 'ANUAL' ? 'selected' : ''}>ANUAL</option>
                        <option value="AVULSO" ${data.plan === 'AVULSO' ? 'selected' : ''}>AVULSO</option>
                    </select>
                </div>
                
                <div class="form-group">
                    <label>Valor do Plano (R$) *</label>
                    <input type="text" id="modalPlanValue" class="form-control" required value="${valorFormatado}" onkeyup="mascaraMoeda(this)">
                </div>
                
                <div class="form-group">
                    <label>Data de Início *</label>
                    <input type="date" id="modalStartDate" class="form-control" required value="${data.startDate || today}" max="${today}">
                    <small class="field-hint"><i class="fas fa-calendar-alt"></i> Data em que o cliente iniciou as aulas</small>
                </div>
                
                <input type="hidden" id="modalOrigin" value="${sanitizeString(data.origin || 'Direto')}">
                
                <div class="form-group">
                    <label>Endereço</label>
                    <input type="text" id="modalAddress" class="form-control" value="${sanitizeString(data.address || '')}" maxlength="200">
                </div>
                
                <div class="row-3">
                    <div class="form-group">
                        <label>CEP</label>
                        <input type="text" id="modalCep" class="form-control" value="${sanitizeString(data.cep || '')}" maxlength="9" onkeyup="mascaraCEP(this)" onblur="buscarCep()">
                    </div>
                    <div class="form-group">
                        <label>Bairro</label>
                        <input type="text" id="modalNeighborhood" class="form-control" value="${sanitizeString(data.neighborhood || '')}" maxlength="100">
                    </div>
                    <div class="form-group">
                        <label>Cidade</label>
                        <input type="text" id="modalCity" class="form-control" value="${sanitizeString(data.city || '')}" maxlength="100">
                    </div>
                </div>
                
                <div class="form-group">
                    <label>Status</label>
                    <select id="modalStatus" class="form-control">
                        <option value="active" ${data.status === 'active' ? 'selected' : ''}>Ativo</option>
                        <option value="inactive" ${data.status !== 'active' ? 'selected' : ''}>Inativo</option>
                    </select>
                </div>
            `;
        }
        
        modal.style.display = 'flex';
        
    } catch (error) {
        console.error('Erro ao carregar para edição:', error);
        showNotification(error.message || 'Erro ao carregar dados', 'error');
    }
}

// ============================================
// FUNÇÃO SAVEMODAL
// ============================================
async function saveModal() {
    if (!currentModalType || !currentUserId) {
        showNotification('Usuário não autenticado', 'error');
        return;
    }
    
    detectDevTools();
    registerActivity();
    
    const type = currentModalType;
    let data = {};
    
    const saveBtn = document.getElementById('saveModalBtn');
    const originalText = saveBtn.innerHTML;
    saveBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Salvando...';
    saveBtn.disabled = true;
    
    try {
        if (type === 'appointment') {
            const clientId = document.getElementById('modalClientId')?.value;
            const serviceId = document.getElementById('modalServiceId')?.value;
            const professionalId = document.getElementById('modalProfessionalId')?.value;
            const date = document.getElementById('modalDate')?.value;
            const time = document.getElementById('modalTime')?.value;
            const notes = document.getElementById('modalNotes')?.value;
            
            if (!clientId || !serviceId || !professionalId || !date || !time) {
                throw new Error('Preencha todos os campos obrigatórios');
            }
            
            data = {
                userId: currentUserId,
                clientId,
                serviceId,
                professionalId,
                date,
                time,
                notes: sanitizeString(notes || ''),
                status: 'pending',
                createdAt: firebase.firestore.FieldValue.serverTimestamp(),
                updatedAt: firebase.firestore.FieldValue.serverTimestamp()
            };
            
            if (editingId) {
                await db.collection('appointments').doc(editingId).update(data);
            } else {
                await db.collection('appointments').add(data);
            }
            
        } else if (type === 'professional') {
            const name = document.getElementById('modalName')?.value;
            const specialty = document.getElementById('modalSpecialty')?.value;
            const email = document.getElementById('modalEmail')?.value;
            const phone = document.getElementById('modalPhone')?.value;
            
            if (!name) throw new Error('Nome é obrigatório');
            
            if (email && !isValidEmail(email)) throw new Error('Email inválido');
            if (phone && !isValidPhone(phone)) throw new Error('Telefone inválido');
            
            data = {
                userId: currentUserId,
                name: sanitizeString(name),
                specialty: sanitizeString(specialty || ''),
                email: sanitizeString(email || ''),
                phone: sanitizeString(phone || ''),
                active: document.getElementById('modalActive')?.value === 'true',
                updatedAt: firebase.firestore.FieldValue.serverTimestamp()
            };
            
            if (!editingId) {
                data.createdAt = firebase.firestore.FieldValue.serverTimestamp();
            }
            
            if (editingId) {
                await db.collection('professionals').doc(editingId).update(data);
            } else {
                await db.collection('professionals').add(data);
            }
            
        } else if (type === 'service') {
            const name = document.getElementById('modalName')?.value;
            const duration = parseInt(document.getElementById('modalDuration')?.value);
            const priceInput = document.getElementById('modalPrice')?.value || '0,00';
            const price = parseFloat(priceInput.replace(/\./g, '').replace(',', '.'));
            
            if (!name) throw new Error('Nome é obrigatório');
            if (duration < 5 || duration > 480) throw new Error('Duração inválida (5-480 minutos)');
            if (price < 0) throw new Error('Preço inválido');
            
            data = {
                userId: currentUserId,
                name: sanitizeString(name),
                duration,
                price,
                description: sanitizeString(document.getElementById('modalDescription')?.value || ''),
                active: document.getElementById('modalActive')?.value === 'true',
                updatedAt: firebase.firestore.FieldValue.serverTimestamp()
            };
            
            if (!editingId) {
                data.createdAt = firebase.firestore.FieldValue.serverTimestamp();
            }
            
            if (editingId) {
                await db.collection('services').doc(editingId).update(data);
            } else {
                await db.collection('services').add(data);
            }
            
        } else if (type === 'client' || type === 'totalpass' || type === 'wellhub') {
            const name = document.getElementById('modalName')?.value;
            const cpfRaw = document.getElementById('modalCpf')?.value.replace(/\D/g, '');
            const birthDate = document.getElementById('modalBirthDate')?.value;
            const phoneRaw = document.getElementById('modalPhone')?.value.replace(/\D/g, '');
            const plan = document.getElementById('modalPlan')?.value;
            const startDate = document.getElementById('modalStartDate')?.value;
            const origin = document.getElementById('modalOrigin')?.value || 
                          (type === 'totalpass' ? 'Total Pass' : 
                           type === 'wellhub' ? 'Well Hub' : 'Direto');
            
            if (!name) throw new Error('Nome é obrigatório');
            if (!isValidCPF(cpfRaw)) throw new Error('CPF inválido');
            if (!birthDate) throw new Error('Data de nascimento é obrigatória');
            if (!isValidPhone(phoneRaw)) throw new Error('Telefone inválido');
            if (!plan) throw new Error('Plano é obrigatório');
            if (!startDate) throw new Error('Data de início é obrigatória');
            
            const cpfExists = await checkExistingCPF(cpfRaw, editingId);
            if (cpfExists) throw new Error('CPF já cadastrado para outro cliente');
            
            if (new Date(birthDate) > new Date()) {
                throw new Error('Data de nascimento não pode ser futura');
            }
            
            let planValue = 0;
            if (plan !== 'AVULSO') {
                const valueInput = document.getElementById('modalPlanValue')?.value || '0,00';
                planValue = parseFloat(valueInput.replace(/\./g, '').replace(',', '.'));
                if (isNaN(planValue) || planValue <= 0) {
                    throw new Error('Valor do plano inválido');
                }
            }
            
            let photoBase64 = null;
            if (currentPhotoBase64) {
                photoBase64 = validateAndSanitizeImageBase64(currentPhotoBase64);
            }
            
            data = {
                userId: currentUserId,
                name: sanitizeString(name),
                cpf: cpfRaw,
                birthDate,
                email: sanitizeString(document.getElementById('modalEmail')?.value || ''),
                phone: phoneRaw,
                plan,
                planValue,
                startDate,
                origin,
                address: sanitizeString(document.getElementById('modalAddress')?.value || ''),
                cep: sanitizeString(document.getElementById('modalCep')?.value || ''),
                neighborhood: sanitizeString(document.getElementById('modalNeighborhood')?.value || ''),
                city: sanitizeString(document.getElementById('modalCity')?.value || ''),
                status: document.getElementById('modalStatus')?.value || 'active',
                totalAppointments: 0,
                photoBase64,
                updatedAt: firebase.firestore.FieldValue.serverTimestamp()
            };
            
            if (!editingId) {
                data.createdAt = firebase.firestore.FieldValue.serverTimestamp();
            }
            
            if (editingId) {
                await db.collection('clients').doc(editingId).update(data);
            } else {
                await db.collection('clients').add(data);
            }
        }
        
        closeModal();
        await loadAllData();
        if (calendar) calendar.refetchEvents();
        
        showNotification('Salvo com sucesso!', 'success');
        
    } catch (error) {
        console.error('Erro ao salvar:', error);
        showNotification(error.message || 'Erro ao salvar', 'error');
        
        saveBtn.innerHTML = originalText;
        saveBtn.disabled = false;
    }
}

// ============================================
// FUNÇÕES DE AÇÃO
// ============================================
async function deleteItem(type, id) {
    if (!currentUserId) {
        showNotification('Usuário não autenticado', 'error');
        return;
    }
    
    detectDevTools();
    registerActivity();
    
    if (!confirm('Tem certeza que deseja excluir permanentemente?')) return;
    
    try {
        // Verificar propriedade antes de excluir
        const docRef = db.collection(type + 's').doc(id);
        const doc = await docRef.get();
        
        if (!doc.exists) {
            showNotification('Documento não encontrado', 'error');
            return;
        }
        
        if (doc.data().userId !== currentUserId) {
            showNotification('Acesso negado a este documento', 'error');
            return;
        }
        
        await docRef.delete();
        
        cache.clearType(type + 's');
        
        showNotification('Excluído com sucesso!', 'success');
        await loadAllData();
        if (calendar) calendar.refetchEvents();
        
    } catch (error) {
        console.error('Erro ao excluir:', error);
        showNotification(error.message || 'Erro ao excluir', 'error');
    }
}

async function updateAppointmentStatus(id, status) {
    if (!currentUserId) {
        showNotification('Usuário não autenticado', 'error');
        return;
    }
    
    detectDevTools();
    registerActivity();
    
    try {
        const docRef = db.collection('appointments').doc(id);
        const doc = await docRef.get();
        
        if (!doc.exists || doc.data().userId !== currentUserId) {
            throw new Error('Acesso negado');
        }
        
        await docRef.update({ 
            status,
            updatedAt: firebase.firestore.FieldValue.serverTimestamp()
        });
        
        await loadAllData();
        if (calendar) calendar.refetchEvents();
        
        const messages = {
            'attended': '✅ Cliente marcado como COMPARECEU!',
            'absent': '❌ Cliente marcado como FALTOU!',
            'cancelled': '❌ Agendamento CANCELADO!',
            'confirmed': '✅ Agendamento CONFIRMADO!'
        };
        
        showNotification(messages[status], status === 'attended' || status === 'confirmed' ? 'success' : 'error');
        
    } catch (error) {
        console.error('Erro ao atualizar status:', error);
        showNotification(error.message || 'Erro ao atualizar status', 'error');
    }
}

function formatCurrency(value) {
    if (value === null || value === undefined) return 'R$ 0,00';
    const num = typeof value === 'string' ? parseFloat(value) : value;
    if (isNaN(num)) return 'R$ 0,00';
    return new Intl.NumberFormat('pt-BR', { 
        style: 'currency', 
        currency: 'BRL',
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
    }).format(num);
}

// ============================================
// FUNÇÕES DE UI
// ============================================
function toggleTheme() {
    document.body.classList.toggle('dark-theme');
    const icon = document.getElementById('themeIcon');
    icon.className = document.body.classList.contains('dark-theme') ? 'fas fa-sun' : 'fas fa-moon';
    localStorage.setItem('theme', document.body.classList.contains('dark-theme') ? 'dark' : 'light');
}

function loadTheme() {
    if (localStorage.getItem('theme') === 'dark') {
        document.body.classList.add('dark-theme');
        document.getElementById('themeIcon').className = 'fas fa-sun';
    }
}

function toggleUserDropdown() {
    const dropdown = document.getElementById('userDropdown');
    const userBtn = document.querySelector('.user');
    if (!dropdown || !userBtn) return;
    const rect = userBtn.getBoundingClientRect();
    dropdown.style.top = (rect.bottom + 8) + 'px';
    dropdown.style.right = (window.innerWidth - rect.right) + 'px';
    dropdown.style.display = dropdown.style.display === 'block' ? 'none' : 'block';
}

document.addEventListener('click', (e) => {
    const dropdown = document.getElementById('userDropdown');
    const user = document.querySelector('.user');
    if (!user?.contains(e.target) && !dropdown?.contains(e.target)) {
        dropdown?.classList.remove('show');
    }
});

function viewProfile() {
    alert('Perfil do usuário');
    toggleUserDropdown();
}

function viewSettings() {
    document.querySelector('[data-view="settings"]').click();
    toggleUserDropdown();
}

function editSetting(setting) {
    alert('Função em desenvolvimento: ' + setting);
}

function saveSetting(setting, value) {
    secureLog('Salvando configuração:', setting, value);
    localStorage.setItem(setting, value);
}

function integrateGoogle() {
    alert('Integração com Google Calendar em desenvolvimento');
}

function setupPayments() {
    alert('Configuração de pagamentos em desenvolvimento');
}

function handlePeriodChange() {
    const customRange = document.getElementById('customDateRange');
    if (customRange) {
        customRange.style.display = document.getElementById('periodFilter')?.value === 'custom' ? 'flex' : 'none';
    }
    applyFilters();
}

function applyFilters() {
    loadDashboardData();
}

// ============================================
// CSS DO CALENDÁRIO
// ============================================
function addCalendarStyles() {
    if (document.getElementById('calendar-styles')) return;
    
    loadSavedColors().then(colors => {
        const styleSheet = document.createElement('style');
        styleSheet.id = 'calendar-styles';
        styleSheet.textContent = `
            .fc {
                font-family: 'Google Sans', 'Roboto', system-ui, sans-serif;
                background: ${isColorLight(colors.background) ? '#ffffff' : adjustColor(colors.background, 10)};
                border-radius: 16px;
                padding: 24px;
                box-shadow: 0 4px 20px rgba(0,0,0,0.05);
            }
            
            .dark-theme .fc {
                background: ${isColorLight(colors.background) ? adjustColor(colors.background, -20) : colors.background};
            }
            
            .fc-toolbar {
                margin-bottom: 24px !important;
            }
            
            .fc-toolbar-title {
                font-size: 1.5rem !important;
                font-weight: 600 !important;
                color: ${colors.text};
            }
            
            .dark-theme .fc-toolbar-title {
                color: ${isColorLight(colors.text) ? colors.text : '#f3f4f6'};
            }
            
            .fc-button {
                background: transparent !important;
                border: 1px solid ${colors.borderColor || '#e5e7eb'} !important;
                color: ${colors.text} !important;
                font-weight: 500 !important;
                padding: 8px 16px !important;
                border-radius: 24px !important;
                transition: all 0.2s;
                text-transform: capitalize !important;
                box-shadow: none !important;
            }
            
            .dark-theme .fc-button {
                border-color: ${adjustColor(colors.background, 30)} !important;
                color: ${isColorLight(colors.text) ? colors.text : '#f3f4f6'} !important;
            }
            
            .fc-button:hover {
                background: ${colors.primary}20 !important;
                border-color: ${colors.primary} !important;
            }
            
            .fc-button-active {
                background: ${colors.primary} !important;
                border-color: ${colors.primary} !important;
                color: white !important;
            }
            
            .fc-button-active:hover {
                background: ${adjustColor(colors.primary, -20)} !important;
            }
            
            .fc-col-header-cell {
                background: ${isColorLight(colors.background) ? '#f9fafb' : adjustColor(colors.background, 10)};
                padding: 14px 0;
                font-weight: 600;
                color: ${colors.text};
                border: none;
            }
            
            .dark-theme .fc-col-header-cell {
                background: ${adjustColor(colors.background, -10)};
                color: ${isColorLight(colors.text) ? colors.text : '#f3f4f6'};
            }
            
            .fc-col-header-cell-cushion {
                text-decoration: none;
                color: inherit;
            }
            
            .fc-daygrid-day {
                border: 1px solid ${colors.borderColor || '#f3f4f6'} !important;
                transition: background 0.2s;
            }
            
            .dark-theme .fc-daygrid-day {
                border-color: ${adjustColor(colors.background, 20)} !important;
            }
            
            .fc-daygrid-day:hover {
                background: ${isColorLight(colors.background) ? '#f9fafb' : adjustColor(colors.background, 10)};
                cursor: pointer;
            }
            
            .fc-day-today {
                background: ${colors.primary}10 !important;
            }
            
            .fc-day-today .fc-daygrid-day-number {
                background: ${colors.primary};
                color: white !important;
                width: 28px;
                height: 28px;
                display: flex;
                align-items: center;
                justify-content: center;
                border-radius: 50%;
                margin: 4px;
            }
            
            .fc-daygrid-day-number {
                color: ${colors.text};
                text-decoration: none;
                font-size: 14px;
                font-weight: 500;
                padding: 8px !important;
            }
            
            .dark-theme .fc-daygrid-day-number {
                color: ${isColorLight(colors.text) ? colors.text : '#f3f4f6'};
            }
            
            .fc-event {
                border: none !important;
                border-radius: 6px !important;
                padding: 4px 6px !important;
                font-size: 12px !important;
                cursor: pointer !important;
                margin: 2px 0 !important;
                transition: transform 0.1s, box-shadow 0.1s;
                font-weight: 500;
            }
            
            .fc-event:hover {
                transform: scale(1.02);
                box-shadow: 0 4px 12px rgba(0,0,0,0.15);
            }
            
            .event-status-pending {
                background: linear-gradient(135deg, ${colors.warning}, ${adjustColor(colors.warning, 20)}) !important;
            }
            
            .event-status-confirmed {
                background: linear-gradient(135deg, ${colors.success}, ${adjustColor(colors.success, 20)}) !important;
            }
            
            .event-status-attended {
                background: linear-gradient(135deg, ${colors.secondary}, ${adjustColor(colors.secondary, 20)}) !important;
            }
            
            .event-status-absent {
                background: linear-gradient(135deg, ${colors.danger}, ${adjustColor(colors.danger, 20)}) !important;
            }
            
            .event-status-cancelled {
                background: linear-gradient(135deg, ${colors.textLight}, ${adjustColor(colors.textLight, -20)}) !important;
            }
            
            .fc-timegrid-slot {
                height: 40px !important;
                border-color: ${colors.borderColor || '#f3f4f6'} !important;
            }
            
            .dark-theme .fc-timegrid-slot {
                border-color: ${adjustColor(colors.background, 20)} !important;
            }
            
            .fc-timegrid-slot-label {
                font-size: 12px;
                color: ${colors.textLight};
                font-weight: 500;
            }
            
            .dark-theme .fc-timegrid-slot-label {
                color: ${isColorLight(colors.textLight) ? colors.textLight : '#9ca3af'};
            }
            
            .fc-timegrid-now-indicator-line {
                border-color: ${colors.primary} !important;
                border-width: 2px !important;
            }
            
            .fc-timegrid-now-indicator-arrow {
                border-color: ${colors.primary} !important;
                color: ${colors.primary} !important;
            }
            
            .fc-scrollgrid {
                border: 1px solid ${colors.borderColor || '#f3f4f6'} !important;
                border-radius: 12px;
                overflow: hidden;
            }
            
            .dark-theme .fc-scrollgrid {
                border-color: ${adjustColor(colors.background, 20)} !important;
            }
            
            .fc-scrollgrid td {
                border-color: ${colors.borderColor || '#f3f4f6'} !important;
            }
            
            .dark-theme .fc-scrollgrid td {
                border-color: ${adjustColor(colors.background, 20)} !important;
            }
            
            .event-tooltip {
                position: fixed;
                background: ${isColorLight(colors.background) ? '#ffffff' : adjustColor(colors.background, 10)};
                color: ${colors.text};
                padding: 12px;
                border-radius: 8px;
                font-size: 12px;
                box-shadow: 0 4px 20px rgba(0,0,0,0.15);
                border: 1px solid ${colors.borderColor || '#e5e7eb'};
                z-index: 9999;
                pointer-events: none;
                max-width: 250px;
                animation: fadeIn 0.2s;
            }
            
            .dark-theme .event-tooltip {
                background: ${adjustColor(colors.background, 10)};
                color: ${isColorLight(colors.text) ? colors.text : '#f3f4f6'};
                border-color: ${adjustColor(colors.background, 30)};
            }
            
            .event-tooltip::after {
                content: '';
                position: absolute;
                bottom: -5px;
                left: 50%;
                transform: translateX(-50%);
                width: 10px;
                height: 10px;
                background: ${isColorLight(colors.background) ? '#ffffff' : adjustColor(colors.background, 10)};
                border-right: 1px solid ${colors.borderColor || '#e5e7eb'};
                border-bottom: 1px solid ${colors.borderColor || '#e5e7eb'};
                transform: translateX(-50%) rotate(45deg);
            }
            
            .dark-theme .event-tooltip::after {
                background: ${adjustColor(colors.background, 10)};
                border-color: ${adjustColor(colors.background, 30)};
            }
            
            @keyframes fadeIn {
                from { opacity: 0; transform: translateY(5px); }
                to { opacity: 1; transform: translateY(0); }
            }
            
            .google-notification {
                position: fixed;
                bottom: 24px;
                right: 24px;
                background: ${isColorLight(colors.background) ? '#ffffff' : adjustColor(colors.background, 10)};
                color: ${colors.text};
                padding: 16px 24px;
                border-radius: 8px;
                box-shadow: 0 4px 12px rgba(0,0,0,0.1);
                display: flex;
                align-items: center;
                gap: 12px;
                transform: translateY(100px);
                opacity: 0;
                transition: all 0.3s;
                z-index: 10000;
                border-left: 4px solid ${colors.primary};
            }
            
            .dark-theme .google-notification {
                background: ${adjustColor(colors.background, 10)};
                color: ${isColorLight(colors.text) ? colors.text : '#f3f4f6'};
            }
            
            .google-notification.show {
                transform: translateY(0);
                opacity: 1;
            }
            
            .google-notification.success {
                border-left-color: ${colors.success};
            }
            
            .google-notification.error {
                border-left-color: ${colors.danger};
            }
            
            .google-notification i {
                font-size: 20px;
            }
            
            @media (max-width: 768px) {
                .fc-toolbar {
                    flex-direction: column;
                    gap: 16px;
                }
                
                .fc-toolbar-chunk {
                    display: flex;
                    justify-content: center;
                    width: 100%;
                }
                
                .fc .fc-button {
                    padding: 6px 12px !important;
                    font-size: 12px !important;
                }
                
                .fc-daygrid-day-number {
                    font-size: 12px;
                }
                
                .fc {
                    padding: 16px;
                }
            }
        `;
        
        document.head.appendChild(styleSheet);
    });
}

// ============================================
// LOGOUT SEGURO
// ============================================
function logout() {
    if (confirm('Tem certeza que deseja sair?')) {
        forceLogout('Logout manual');
    }
}

// ============================================
// NAVEGAÇÃO
// ============================================
document.querySelectorAll('.nav-item').forEach(item => {
    item.addEventListener('click', function() {
        document.querySelectorAll('.nav-item').forEach(n => n.classList.remove('active'));
        this.classList.add('active');
        
        document.querySelectorAll('.view').forEach(v => v.classList.remove('active'));
        const viewId = this.dataset.view + 'View';
        document.getElementById(viewId).classList.add('active');
        
        const titles = {
            dashboard: 'Dashboard Inteligente',
            calendar: 'Calendário de Agendamentos',
            professionals: 'Gerenciar Profissionais',
            services: 'Gerenciar Serviços',
            clients: 'Gerenciar Clientes',
            whatsapp: 'Configurações do WhatsApp',
            reports: 'Relatórios e Análises',
            settings: 'Configurações do Sistema',
            users: 'Usuários'
        };
        
        document.querySelector('.page-title h1').textContent = titles[this.dataset.view] || this.dataset.view;
        
        if (this.dataset.view === 'reports') {
            loadReportsData();
        }
        if (this.dataset.view === 'whatsapp') {
            loadWhatsAppSettings();
        }
        if (this.dataset.view === 'users') { if (typeof loadUsersView === 'function') loadUsersView(); }
        
        if (globalSearchTerm) {
            setTimeout(() => {
                if (this.dataset.view === 'professionals') {
                    filterProfessionalsTable();
                } else if (this.dataset.view === 'services') {
                    filterServicesTable();
                } else if (this.dataset.view === 'clients') {
                    filterClientsTable();
                } else if (this.dataset.view === 'reports') {
                    filterReportClients();
                }
            }, 100);
        }
        
        if (this.dataset.view === 'calendar' && calendar) {
            setTimeout(() => calendar.render(), 100);
        }
    });
});

// ============================================
// FUNÇÕES DE RELATÓRIOS
// ============================================

// ── Exportar Relatorios para Excel ─────────────────────────
function exportReportsToExcel() {
    if (typeof XLSX === 'undefined') {
        showNotification('Biblioteca Excel não carregada. Aguarde e tente novamente.', 'error');
        return;
    }
    try {
        const wb = XLSX.utils.book_new();

        // Aba 1: Agendamentos do periodo
        const reportsTable = document.getElementById('reportsTableBody') || document.querySelector('#reportsView table tbody');
        if (reportsTable) {
            const rows = [['Data', 'Cliente', 'Serviço', 'Profissional', 'Status', 'Valor (R$)']];
            reportsTable.querySelectorAll('tr').forEach(tr => {
                const cells = tr.querySelectorAll('td');
                if (cells.length > 0) {
                    rows.push(Array.from(cells).map(td => td.textContent.trim()));
                }
            });
            const ws1 = XLSX.utils.aoa_to_sheet(rows);
            ws1['!cols'] = rows[0].map(() => ({ wch: 20 }));
            XLSX.utils.book_append_sheet(wb, ws1, 'Agendamentos');
        }

        // Aba 2: KPIs resumo
        const kpiData = [
            ['Métrica', 'Valor'],
            ['Total de Clientes', document.getElementById('reportTotalClients')?.textContent || '—'],
            ['Total de Agendamentos', document.getElementById('reportTotalAppointments')?.textContent || '—'],
            ['Taxa de Comparecimento', document.getElementById('reportAttendanceRate')?.textContent || '—'],
            ['Receita no Período', document.getElementById('reportTotalRevenue')?.textContent || '—'],
        ];
        const ws2 = XLSX.utils.aoa_to_sheet(kpiData);
        ws2['!cols'] = [{ wch: 28 }, { wch: 20 }];
        XLSX.utils.book_append_sheet(wb, ws2, 'Resumo');

        // Gerar e baixar
        const date = new Date().toLocaleDateString('pt-BR').replace(/\//g, '-');
        XLSX.writeFile(wb, 'relatorio-nexbook-' + date + '.xlsx');
        if (typeof showNotification === 'function') showNotification('Excel exportado com sucesso!', 'success');
    } catch(e) {
        if (typeof showNotification === 'function') showNotification('Erro ao exportar: ' + e.message, 'error');
    }
}
async function loadReportsData() {
    if (!currentUserId) return;
    
    detectDevTools();
    registerActivity();
    
    try {
        const period = document.getElementById('reportPeriod')?.value || '30';
        
        const endDate = new Date();
        const startDate = new Date();
        
        if (period !== 'all') {
            startDate.setDate(startDate.getDate() - parseInt(period));
        } else {
            startDate.setFullYear(startDate.getFullYear() - 10);
        }
        
        const startStr = startDate.toISOString().split('T')[0];
        const endStr = endDate.toISOString().split('T')[0];
        
        const clientsSnapshot = await db.collection('clients')
            .where('userId', '==', currentUserId)
            .get();
        
        const clients = [];
        clientsSnapshot.forEach(doc => {
            clients.push({ id: doc.id, ...doc.data() });
        });
        
        const allAppointmentsSnapshot = await db.collection('appointments')
            .where('userId', '==', currentUserId)
            .get();
        
        const allAppointments = [];
        allAppointmentsSnapshot.forEach(doc => {
            allAppointments.push({ id: doc.id, ...doc.data() });
        });
        
        const appointments = allAppointments.filter(apt => 
            apt.date >= startStr && apt.date <= endStr
        );
        
        const totalClients = clients.filter(c => c.status === 'active').length;
        const totalAppointments = appointments.length;
        const attendedAppointments = appointments.filter(a => a.status === 'attended').length;
        const attendanceRate = totalAppointments > 0 ? ((attendedAppointments / totalAppointments) * 100).toFixed(1) : 0;
        
        let revenueFromAppointments = 0;
        for (const apt of appointments) {
            if (apt.status === 'attended' && apt.serviceId) {
                try {
                    const serviceDoc = await db.collection('services').doc(apt.serviceId).get();
                    if (serviceDoc.exists) {
                        revenueFromAppointments += serviceDoc.data().price || 0;
                    }
                } catch (e) {
                    secureLog('Erro ao buscar serviço:', e);
                }
            }
        }
        
        let revenueFromPlans = 0;
        clients.filter(c => c.status === 'active' && c.plan !== 'AVULSO').forEach(c => {
            if (c.planValue) {
                revenueFromPlans += c.planValue;
            }
        });
        
        const totalRevenue = revenueFromAppointments + revenueFromPlans;
        
        document.getElementById('totalClients').textContent = totalClients;
        document.getElementById('totalAppointments').textContent = totalAppointments;
        document.getElementById('totalRevenue').textContent = formatCurrency(totalRevenue);
        document.getElementById('attendanceRate').textContent = attendanceRate + '%';
        
        document.getElementById('clientsGrowth').textContent = '+12%';
        document.getElementById('appointmentsGrowth').textContent = '+8%';
        document.getElementById('revenueGrowth').textContent = '+15%';
        document.getElementById('attendanceChange').textContent = '+5%';
        
        updateReportsCharts(appointments, clients);
        await updateReportClientsList(clients, appointments);
        
        showNotification('Relatórios carregados com sucesso!', 'success');
        
    } catch (error) {
        console.error('Erro ao carregar relatórios:', error);
        showNotification('Erro ao carregar relatórios', 'error');
        
        document.getElementById('totalClients').textContent = '0';
        document.getElementById('totalAppointments').textContent = '0';
        document.getElementById('totalRevenue').textContent = 'R$ 0';
        document.getElementById('attendanceRate').textContent = '0%';
    }
}

function updateReportsCharts(appointments, clients) {
    try {
        loadSavedColors().then(colors => {
            const last30Days = [];
            const dates = [];
            
            for (let i = 29; i >= 0; i--) {
                const date = new Date();
                date.setDate(date.getDate() - i);
                const dateStr = date.toISOString().split('T')[0];
                dates.push(date.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' }));
                
                const dayAppointments = appointments.filter(a => a.date === dateStr).length;
                last30Days.push(dayAppointments);
            }
            
            if (reportsLineChart) {
                reportsLineChart.updateOptions({
                    xaxis: { 
                        categories: dates,
                        labels: { rotate: -45, rotateAlways: false }
                    },
                    colors: [colors.primary]
                });
                reportsLineChart.updateSeries([{
                    name: 'Agendamentos',
                    data: last30Days
                }]);
            }
            
            const origins = {
                'Direto': 0,
                'Total Pass': 0,
                'Well Hub': 0
            };
            
            clients.forEach(c => {
                const origin = c.origin || 'Direto';
                if (origins.hasOwnProperty(origin)) {
                    origins[origin]++;
                } else {
                    origins['Direto']++;
                }
            });
            
            const originLabels = Object.keys(origins).filter(key => origins[key] > 0);
            const originData = originLabels.map(key => origins[key]);
            
            if (reportsPieChart) {
                reportsPieChart.updateOptions({
                    labels: originLabels,
                    colors: originLabels.map(label => 
                        label === 'Total Pass' ? colors.totalpass : 
                        label === 'Well Hub' ? colors.wellhub : colors.warning
                    )
                });
                reportsPieChart.updateSeries(originData);
            }
            
            db.collection('professionals')
                .where('userId', '==', currentUserId)
                .get()
                .then(profSnapshot => {
                    const professionals = [];
                    profSnapshot.forEach(doc => {
                        professionals.push({ id: doc.id, name: doc.data().name });
                    });
                    
                    const professionalMap = new Map();
                    appointments.forEach(apt => {
                        if (apt.professionalId) {
                            const count = professionalMap.get(apt.professionalId) || 0;
                            professionalMap.set(apt.professionalId, count + 1);
                        }
                    });
                    
                    const professionalNames = [];
                    const professionalCounts = [];
                    
                    const sortedProfessionals = [...professionalMap.entries()]
                        .sort((a, b) => b[1] - a[1])
                        .slice(0, 10);
                    
                    sortedProfessionals.forEach(([id, count]) => {
                        const prof = professionals.find(p => p.id === id);
                        const name = prof ? sanitizeString(prof.name) : `Profissional ${id.substring(0, 4)}`;
                        professionalNames.push(name);
                        professionalCounts.push(count);
                    });
                    
                    if (reportsBarChart) {
                        reportsBarChart.updateOptions({
                            xaxis: { 
                                categories: professionalNames,
                                labels: { rotate: -45, rotateAlways: false, trim: true }
                            },
                            colors: [colors.secondary]
                        });
                        reportsBarChart.updateSeries([{
                            name: 'Agendamentos',
                            data: professionalCounts
                        }]);
                    }
                })
                .catch(error => {
                    console.error('Erro ao buscar profissionais:', error);
                });
        });
    } catch (error) {
        console.error('Erro ao atualizar gráficos:', error);
    }
}

async function updateReportClientsList(clients, appointments) {
    const tbody = document.getElementById('reportClientsList');
    if (!tbody) return;
    
    if (clients.length === 0) {
        tbody.innerHTML = '<tr><td colspan="10" style="text-align: center; padding: 20px;">Nenhum cliente encontrado</td></tr>';
        return;
    }
    
    try {
        const servicesSnapshot = await db.collection('services')
            .where('userId', '==', currentUserId)
            .get();
        
        const services = {};
        servicesSnapshot.forEach(doc => {
            services[doc.id] = doc.data();
        });
        
        const colors = await loadSavedColors();
        const clientRows = await Promise.all(clients.map(async client => {
            const clientAppointments = appointments.filter(a => a.clientId === client.id);
            const total = clientAppointments.length;
            const attended = clientAppointments.filter(a => a.status === 'attended').length;
            const absent = clientAppointments.filter(a => a.status === 'absent').length;
            const rate = total > 0 ? ((attended / total) * 100).toFixed(1) : 0;
            
            let revenue = 0;
            for (const apt of clientAppointments) {
                if (apt.status === 'attended' && apt.serviceId && services[apt.serviceId]) {
                    revenue += services[apt.serviceId].price || 0;
                }
            }
            
            if (client.status === 'active' && client.planValue && client.plan !== 'AVULSO') {
                revenue += client.planValue;
            }
            
            const safeName = sanitizeString(client.name || '---');
            const safePlan = sanitizeString(client.plan || '---');
            const safeOrigin = sanitizeString(client.origin || 'Direto');
            
            let dataInicioFormatada = '---';
            if (client.startDate) {
                try {
                    const [ano, mes, dia] = client.startDate.split('-');
                    dataInicioFormatada = `${dia}/${mes}/${ano}`;
                } catch (e) {
                    secureLog('Erro ao formatar data');
                }
            }
            
            return `
                <tr>
                    <td data-label="Nome">${safeName}</td>
                    <td data-label="Plano"><span class="plan-badge plan-${(safePlan||'').toLowerCase()}">${safePlan}</span></td>
                    <td data-label="Origem"><span class="origin-badge origin-${safeOrigin === 'Total Pass' ? 'totalpass' : (safeOrigin === 'Well Hub' ? 'wellhub' : 'direto')}">${safeOrigin}</span></td>
                    <td data-label="Data Início"><span class="start-date-badge"><i class="fas fa-calendar-alt"></i> ${dataInicioFormatada}</span></td>
                    <td data-label="Agendamentos">${total}</td>
                    <td data-label="Comparecimentos">${attended}</td>
                    <td data-label="Faltas">${absent}</td>
                    <td data-label="Taxa">${rate}%</td>
                    <td data-label="Receita">${formatCurrency(revenue)}</td>
                    <td data-label="Ações">
                        <button class="btn-secondary" onclick="generateClientReport('${client.id}')">
                            <i class="fas fa-file-pdf"></i> Relatório
                        </button>
                    </td>
                </tr>
            `;
        }));
        
        tbody.innerHTML = clientRows.join('');
        
    } catch (error) {
        console.error('Erro ao atualizar lista de clientes:', error);
        tbody.innerHTML = '<tr><td colspan="10" style="text-align: center; padding: 20px; color: #ef4444;">Erro ao carregar dados</td></tr>';
    }
}

// ============================================
// GERAR RELATÓRIO INDIVIDUAL
// ============================================
async function generateClientReport(clientId) {
    if (!currentUserId) {
        showNotification('Usuário não autenticado', 'error');
        return;
    }
    
    detectDevTools();
    registerActivity();
    
    try {
        const clientDoc = await db.collection('clients').doc(clientId).get();
        if (!clientDoc.exists) {
            showNotification('Cliente não encontrado', 'error');
            return;
        }
        
        if (clientDoc.data().userId !== currentUserId) {
            showNotification('Acesso negado a este cliente', 'error');
            return;
        }
        
        const client = { id: clientDoc.id, ...clientDoc.data() };
        
        const appointmentsSnapshot = await db.collection('appointments')
            .where('userId', '==', currentUserId)
            .where('clientId', '==', clientId)
            .orderBy('date', 'desc')
            .get();
        
        const appointments = [];
        appointmentsSnapshot.forEach(doc => {
            appointments.push({ id: doc.id, ...doc.data() });
        });
        
        const totalAppointments = appointments.length;
        const attended = appointments.filter(a => a.status === 'attended').length;
        const absent = appointments.filter(a => a.status === 'absent').length;
        const pending = appointments.filter(a => a.status === 'pending' || a.status === 'confirmed').length;
        const rate = totalAppointments > 0 ? (attended / totalAppointments * 100).toFixed(1) : 0;
        
        let revenue = 0;
        for (const apt of appointments) {
            if (apt.status === 'attended' && apt.serviceId) {
                try {
                    const serviceDoc = await db.collection('services').doc(apt.serviceId).get();
                    if (serviceDoc.exists) {
                        revenue += serviceDoc.data().price || 0;
                    }
                } catch (e) {
                    secureLog('Erro ao buscar serviço');
                }
            }
        }
        
        if (client.status === 'active' && client.planValue && client.plan !== 'AVULSO') {
            revenue += client.planValue;
        }
        
        const colors = await loadSavedColors();
        
        const content = document.getElementById('clientReportContent');
        const title = document.getElementById('clientReportTitle');
        
        const safeName = sanitizeString(client.name);
        title.innerHTML = `Relatório - ${safeName}`;
        
        const initials = safeName ? safeName.substring(0, 2).toUpperCase() : 'CL';
        let fotoHtml = `<span>${initials}</span>`;
        if (client.photoBase64) {
            try {
                if (validateAndSanitizeImageBase64(client.photoBase64)) {
                    fotoHtml = `<img src="${client.photoBase64}" alt="${safeName}">`;
                }
            } catch (e) {
                secureLog('Imagem inválida');
            }
        }
        
        let dataInicioFormatada = 'Não informado';
        if (client.startDate) {
            try {
                const [ano, mes, dia] = client.startDate.split('-');
                dataInicioFormatada = `${dia}/${mes}/${ano}`;
            } catch (e) {
                secureLog('Erro ao formatar data');
            }
        }
        
        const safeEmail = sanitizeString(client.email || 'Não informado');
        const safePhone = sanitizeString(client.phone || 'Não informado');
        const safePlan = sanitizeString(client.plan || 'Não possui');
        const safeOrigin = sanitizeString(client.origin || 'Direto');
        const safeCity = sanitizeString(client.city || 'Não informado');
        
        const maskedCpf = maskCPF(client.cpf);
        
        content.innerHTML = `
            <div class="client-report-content">
                <div class="client-report-header">
                    <div class="client-report-avatar">
                        ${fotoHtml}
                    </div>
                    <div class="client-report-info">
                        <h3>${safeName}</h3>
                        <p><i class="fas fa-envelope"></i> ${safeEmail}</p>
                        <p><i class="fas fa-phone"></i> ${safePhone}</p>
                        <p><i class="fas fa-id-card"></i> CPF: ${maskedCpf}</p>
                        <p><i class="fas fa-calendar-alt"></i> Data de Início: ${dataInicioFormatada}</p>
                    </div>
                </div>
                
                <div class="client-report-stats">
                    <div class="client-report-stat">
                        <div class="client-report-stat-value">${totalAppointments}</div>
                        <div class="client-report-stat-label">Total de Agendamentos</div>
                    </div>
                    <div class="client-report-stat">
                        <div class="client-report-stat-value">${attended}</div>
                        <div class="client-report-stat-label">Comparecimentos</div>
                    </div>
                    <div class="client-report-stat">
                        <div class="client-report-stat-value">${absent}</div>
                        <div class="client-report-stat-label">Faltas</div>
                    </div>
                    <div class="client-report-stat">
                        <div class="client-report-stat-value">${rate}%</div>
                        <div class="client-report-stat-label">Taxa de Comparecimento</div>
                    </div>
                </div>
                
                <div class="client-report-chart" id="clientReportChart"></div>
                
                <div class="client-report-details">
                    <div class="client-report-detail-item">
                        <span class="client-report-detail-label">Plano:</span>
                        <span class="client-report-detail-value">${safePlan}</span>
                    </div>
                    ${client.plan !== 'AVULSO' ? `
                    <div class="client-report-detail-item">
                        <span class="client-report-detail-label">Valor do Plano:</span>
                        <span class="client-report-detail-value">${client.planValue ? formatCurrency(client.planValue) : '---'}</span>
                    </div>
                    ` : ''}
                    <div class="client-report-detail-item">
                        <span class="client-report-detail-label">Origem:</span>
                        <span class="client-report-detail-value">${safeOrigin}</span>
                    </div>
                    <div class="client-report-detail-item">
                        <span class="client-report-detail-label">Status:</span>
                        <span class="client-report-detail-value">${client.status === 'active' ? 'Ativo' : 'Inativo'}</span>
                    </div>
                    <div class="client-report-detail-item">
                        <span class="client-report-detail-label">Receita Gerada:</span>
                        <span class="client-report-detail-value">${formatCurrency(revenue)}</span>
                    </div>
                    <div class="client-report-detail-item">
                        <span class="client-report-detail-label">Cidade:</span>
                        <span class="client-report-detail-value">${safeCity}</span>
                    </div>
                </div>
                
                <div style="margin-top: 20px;">
                    <h4>Últimos Agendamentos</h4>
                    <table style="width: 100%; margin-top: 10px;">
                        <thead>
                            <tr>
                                <th>Data</th>
                                <th>Horário</th>
                                <th>Serviço</th>
                                <th>Profissional</th>
                                <th>Status</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${appointments.slice(0, 5).map(apt => {
                                const statusMap = {
                                    'attended': 'Compareceu',
                                    'absent': 'Faltou',
                                    'confirmed': 'Confirmado',
                                    'pending': 'Pendente',
                                    'cancelled': 'Cancelado'
                                };
                                const formattedDate = new Date(apt.date + 'T12:00:00').toLocaleDateString('pt-BR');
                                return `
                                    <tr>
                                        <td>${formattedDate}</td>
                                        <td>${apt.time || '--:--'}</td>
                                        <td>Serviço</td>
                                        <td>Profissional</td>
                                        <td><span class="status-${apt.status || 'pending'}">${statusMap[apt.status] || 'Pendente'}</span></td>
                                    </tr>
                                `;
                            }).join('')}
                        </tbody>
                    </table>
                </div>
            </div>
        `;
        
        const chartOptions = {
            series: [attended, absent, pending],
            chart: {
                type: 'pie',
                height: 200,
                width: '100%'
            },
            labels: ['Compareceu', 'Faltou', 'Pendente'],
            colors: [colors.success, colors.danger, colors.warning],
            legend: {
                position: 'bottom',
                fontSize: '12px'
            }
        };
        
        const chart = new ApexCharts(document.querySelector("#clientReportChart"), chartOptions);
        chart.render();
        
        window.currentClientChart = chart;
        
        document.getElementById('clientReportModal').style.display = 'flex';
        
    } catch (error) {
        console.error('Erro ao gerar relatório do cliente:', error);
        showNotification(error.message || 'Erro ao gerar relatório', 'error');
    }
}

function closeClientReportModal() {
    document.getElementById('clientReportModal').style.display = 'none';
    
    if (window.currentClientChart) {
        window.currentClientChart.destroy();
        window.currentClientChart = null;
    }
}

// ============================================
// GERAR RELATÓRIO GERAL PDF
// ============================================
async function generateGeneralReport() {
    if (!currentUserId) {
        showNotification('Usuário não autenticado', 'error');
        return;
    }
    
    detectDevTools();
    registerActivity();
    
    try {
        const { jsPDF } = window.jspdf;
        const doc = new jsPDF('landscape');
        
        const colors = await loadSavedColors();
        
        doc.setFontSize(18);
        doc.setTextColor(parseInt(colors.primary.slice(1,3), 16), parseInt(colors.primary.slice(3,5), 16), parseInt(colors.primary.slice(5,7), 16));
        doc.text('RELATÓRIO GERAL NEXBOOK', 14, 20);
        
        doc.setFontSize(11);
        doc.setTextColor(100, 100, 100);
        doc.text(`Gerado em: ${new Date().toLocaleDateString('pt-BR')} às ${new Date().toLocaleTimeString('pt-BR')}`, 14, 28);
        
        const clientsSnapshot = await db.collection('clients')
            .where('userId', '==', currentUserId)
            .get();
        
        const appointmentsSnapshot = await db.collection('appointments')
            .where('userId', '==', currentUserId)
            .get();
        
        const clients = [];
        clientsSnapshot.forEach(doc => {
            clients.push({ id: doc.id, ...doc.data() });
        });
        
        const appointments = [];
        appointmentsSnapshot.forEach(doc => {
            appointments.push({ id: doc.id, ...doc.data() });
        });
        
        const totalClients = clients.length;
        const activeClients = clients.filter(c => c.status === 'active').length;
        const totalAppointments = appointments.length;
        const attendedAppointments = appointments.filter(a => a.status === 'attended').length;
        const attendanceRate = totalAppointments > 0 ? (attendedAppointments / totalAppointments * 100).toFixed(1) : 0;
        
        const totalPassClients = clients.filter(c => c.origin === 'Total Pass').length;
        const wellHubClients = clients.filter(c => c.origin === 'Well Hub').length;
        const directClients = clients.filter(c => !c.origin || c.origin === 'Direto').length;
        const avulsoClients = clients.filter(c => c.plan === 'AVULSO').length;
        
        let totalRevenue = 0;
        for (const apt of appointments) {
            if (apt.status === 'attended' && apt.serviceId) {
                try {
                    const serviceDoc = await db.collection('services').doc(apt.serviceId).get();
                    if (serviceDoc.exists) {
                        totalRevenue += serviceDoc.data().price || 0;
                    }
                } catch (e) {
                    secureLog('Erro ao buscar serviço');
                }
            }
        }
        
        clients.filter(c => c.status === 'active' && c.plan !== 'AVULSO').forEach(c => {
            if (c.planValue) {
                totalRevenue += c.planValue;
            }
        });
        
        doc.setFontSize(12);
        doc.setTextColor(0, 0, 0);
        doc.text('INDICADORES PRINCIPAIS', 14, 40);
        
        doc.setFontSize(10);
        doc.text(`Total de Clientes: ${totalClients}`, 14, 48);
        doc.text(`Clientes Ativos: ${activeClients}`, 14, 55);
        doc.text(`Total de Agendamentos: ${totalAppointments}`, 14, 62);
        doc.text(`Taxa de Comparecimento: ${attendanceRate}%`, 14, 69);
        doc.text(`Receita Total: ${formatCurrency(totalRevenue)}`, 14, 76);
        
        doc.text(`Total Pass: ${totalPassClients}`, 120, 48);
        doc.text(`Well Hub: ${wellHubClients}`, 120, 55);
        doc.text(`Direto: ${directClients}`, 120, 62);
        doc.text(`AVULSO: ${avulsoClients}`, 120, 69);
        
        doc.text('LISTA DE CLIENTES', 14, 90);
        
        const tableColumn = ['Nome', 'CPF', 'Telefone', 'Plano', 'Origem', 'Data Início', 'Status', 'Valor'];
        const tableRows = [];
        
        clients.slice(0, 20).forEach(client => {
            const safeName = sanitizeString(client.name || '---');
            const maskedCpf = maskCPF(client.cpf);
            const safePhone = sanitizeString(client.phone || '---');
            const safePlan = sanitizeString(client.plan || '---');
            const safeOrigin = sanitizeString(client.origin || 'Direto');
            const valor = client.planValue ? formatCurrency(client.planValue) : '---';
            
            let dataInicioFormatada = '---';
            if (client.startDate) {
                try {
                    const [ano, mes, dia] = client.startDate.split('-');
                    dataInicioFormatada = `${dia}/${mes}/${ano}`;
                } catch (e) {
                    secureLog('Erro ao formatar data');
                }
            }
            
            tableRows.push([
                safeName,
                maskedCpf,
                safePhone,
                safePlan,
                safeOrigin,
                dataInicioFormatada,
                client.status === 'active' ? 'Ativo' : 'Inativo',
                valor
            ]);
        });
        
        doc.autoTable({
            startY: 95,
            head: [tableColumn],
            body: tableRows,
            theme: 'grid',
            styles: { fontSize: 8 },
            headStyles: { fillColor: [parseInt(colors.primary.slice(1,3), 16), parseInt(colors.primary.slice(3,5), 16), parseInt(colors.primary.slice(5,7), 16)] }
        });
        
        doc.save(`relatorio-geral-${new Date().toISOString().split('T')[0]}.pdf`);
        
        showNotification('Relatório PDF gerado com sucesso!', 'success');
        
    } catch (error) {
        console.error('Erro ao gerar relatório PDF:', error);
        showNotification('Erro ao gerar relatório PDF', 'error');
    }
}

async function downloadClientReportPDF() {
    showNotification('Função em desenvolvimento', 'info');
}

// ============================================
// AUTH STATE OBSERVER
// ============================================
auth.onAuthStateChanged(async user => {
    secureLog('Auth state changed:', user ? 'Logado' : 'Deslogado');
    
    if (user) {
        currentUser = user;
        currentUserId = user.uid;
        window.currentUserId = user.uid; // expor para outros scripts
        
        detectDevTools();
        
        const hasAccess = await verifyAccess();
        
        if (!hasAccess) {
            forceLogout('Acesso negado');
            return;
        }
        
        try {
            const mainElement = document.querySelector('.main');
            const sidebarElement = document.querySelector('.sidebar');
            
            if (mainElement) mainElement.style.display = 'flex';
            if (sidebarElement) sidebarElement.style.display = 'flex';
            
            updateUserInterface(user);
            // Controle de permissoes: verificar role e dados sensiveis
            const MASTER_UIDS = ['Nrq4TYVDGsfboHOPDx7csCF0QSi2','O525l43Yzxatu5ckI7k8J1VLfjU2','SpygmGopNAXhban8lTi8JaBvAoG2','pZQbVSQkaid4lYSTDcNarjZTUHl1','tx3jN29YGcUzDu2kLGlErI86CgW2'];
            const isMasterUid = MASTER_UIDS.includes(user.uid);
            try {
                const userDoc = await db.collection('users').doc(user.uid).get();
                const userData = userDoc.exists ? userDoc.data() : {};
                const firestoreRole = userData.role || (isMasterUid ? 'admin' : 'funcionario');
                window.userRole = firestoreRole;
                window.canViewSensitiveData = isMasterUid || (userData.canViewSensitiveData === true) || firestoreRole === 'admin';
            } catch(e) {
                window.canViewSensitiveData = isMasterUid;
                window.userRole = isMasterUid ? 'admin' : 'funcionario';
            }
            // Mostrar/ocultar elementos de admin (botao Usuarios, etc)
            document.querySelectorAll('[data-permission="admin"]').forEach(function(el) {
                el.style.display = (isMasterUid || window.userRole === 'admin') ? '' : 'none';
            });
            if (!window.canViewSensitiveData) {
                document.querySelectorAll('[data-permission="financeiro"]').forEach(el => el.style.display = "none");
            }

            
            startSessionMonitor();
            
            // Carregar cores do Firebase primeiro
            await loadSavedColors();
            
            await loadAllData();
            initializeCalendar();
            if (typeof window.loadRealInsights === 'function') setTimeout(window.loadRealInsights, 1000);
            adjustTablesForMobile();
            
            showNotification(`Bem-vindo, ${user.displayName || user.email}!`, 'success');
            
        } catch (error) {
            console.error('Erro ao carregar dados:', error);
            showNotification('Erro ao carregar dados. Tente recarregar a página.', 'error');
        }
        
    } else {
        currentUser = null;
        currentUserId = null;
        cache.clear();
        
        if (isProtectedPage()) {
            window.location.href = 'index.html';
        }
    }
});

// ============================================
// INICIALIZAÇÃO
// ============================================
document.addEventListener('DOMContentLoaded', function() {
    loadTheme();
    addCalendarStyles();
    
    registerActivity();
    
    appointmentsChart = new ApexCharts(document.querySelector("#appointmentsChart"), {
        series: [
            { name: 'Compareceram', data: [] },
            { name: 'Faltaram', data: [] }
        ],
        chart: { 
            type: 'bar', 
            height: 250, 
            toolbar: { show: false },
            animations: { enabled: true },
            stacked: false,
            background: 'transparent'
        },
        colors: [defaultColors.success, defaultColors.danger],
        dataLabels: { enabled: false },
        stroke: { 
            curve: 'smooth', 
            width: 2,
            colors: ['#ffffff']
        },
        grid: { 
            borderColor: '#e5e7eb',
            strokeDashArray: 4
        },
        xaxis: {
            categories: [],
            labels: { 
                style: { 
                    colors: '#6b7280',
                    fontFamily: 'Plus Jakarta Sans, sans-serif'
                } 
            },
            axisBorder: { show: false },
            axisTicks: { show: false }
        },
        yaxis: {
            labels: { 
                style: { 
                    colors: '#6b7280',
                    fontFamily: 'Plus Jakarta Sans, sans-serif'
                } 
            },
            title: {
                text: 'Número de alunos',
                style: { 
                    color: '#6b7280',
                    fontFamily: 'Plus Jakarta Sans, sans-serif',
                    fontWeight: 500
                }
            }
        },
        tooltip: { 
            theme: 'dark',
            y: {
                formatter: function(val) {
                    return val + ' aluno' + (val !== 1 ? 's' : '');
                }
            },
            style: {
                fontFamily: 'Plus Jakarta Sans, sans-serif'
            }
        },
        legend: {
            position: 'top',
            horizontalAlign: 'right',
            labels: { 
                colors: '#1f2937',
                fontFamily: 'Plus Jakarta Sans, sans-serif',
                fontWeight: 500
            },
            markers: {
                radius: 4,
                width: 12,
                height: 12
            }
        },
        plotOptions: {
            bar: {
                borderRadius: 6,
                columnWidth: '60%',
                distributed: false
            }
        },
        fill: {
            opacity: 1,
            type: 'gradient',
            gradient: {
                shade: 'dark',
                type: 'vertical',
                shadeIntensity: 0.5,
                gradientToColors: ['#059669', '#b91c1c'],
                inverseColors: true,
                opacityFrom: 1,
                opacityTo: 0.9,
                stops: [0, 100]
            }
        }
    });
    appointmentsChart.render();

    servicesChart = new ApexCharts(document.querySelector("#servicesChart"), {
        series: [],
        chart: {
            type: 'donut',
            height: 320,
            animations: {
                enabled: true,
                easing: 'easeinout',
                speed: 800,
                animateGradually: {
                    enabled: true,
                    delay: 150
                },
                dynamicAnimation: {
                    enabled: true,
                    speed: 350
                }
            },
            background: 'transparent',
            dropShadow: {
                enabled: true,
                top: 0,
                left: 0,
                blur: 10,
                color: '#000',
                opacity: 0.08
            }
        },
        colors: [defaultColors.primary, defaultColors.secondary, defaultColors.success, defaultColors.warning, defaultColors.danger],
        labels: ['MENSAL', 'TRIMESTRAL', 'SEMESTRAL', 'ANUAL', 'AVULSO'],
        plotOptions: {
            pie: {
                expandOnClick: true,
                donut: {
                    size: '72%',
                    background: 'transparent',
                    labels: {
                        show: true,
                        name: {
                            show: true,
                            fontSize: '13px',
                            fontFamily: 'Plus Jakarta Sans, sans-serif',
                            fontWeight: 600,
                            color: '#6b7280',
                            offsetY: -8
                        },
                        value: {
                            show: true,
                            fontSize: '26px',
                            fontFamily: 'Plus Jakarta Sans, sans-serif',
                            fontWeight: 700,
                            color: '#1f2937',
                            offsetY: 8,
                            formatter: function(val) {
                                return val;
                            }
                        },
                        total: {
                            show: true,
                            showAlways: true,
                            label: 'Clientes',
                            fontSize: '13px',
                            fontFamily: 'Plus Jakarta Sans, sans-serif',
                            fontWeight: 600,
                            color: '#6b7280',
                            formatter: function(w) {
                                const total = w.globals.seriesTotals.reduce((a, b) => a + b, 0);
                                return total;
                            }
                        }
                    }
                }
            }
        },
        dataLabels: {
            enabled: true,
            formatter: function(val, opts) {
                if (val < 8) return '';
                return val.toFixed(1) + '%';
            },
            style: {
                fontSize: '12px',
                fontFamily: 'Plus Jakarta Sans, sans-serif',
                fontWeight: 700,
                colors: ['#ffffff']
            },
            dropShadow: {
                enabled: true,
                top: 1,
                left: 1,
                blur: 3,
                color: '#00000055',
                opacity: 0.6
            }
        },
        legend: {
            show: true,
            position: 'bottom',
            horizontalAlign: 'center',
            floating: false,
            fontSize: '13px',
            fontFamily: 'Plus Jakarta Sans, sans-serif',
            fontWeight: 500,
            offsetY: 4,
            labels: {
                colors: '#1f2937',
                useSeriesColors: false
            },
            markers: {
                width: 12,
                height: 12,
                radius: 6,
                strokeWidth: 0,
                offsetY: 1
            },
            itemMargin: {
                horizontal: 14,
                vertical: 6
            },
            formatter: function(seriesName, opts) {
                const val = opts.w.globals.series[opts.seriesIndex] || 0;
                return `${seriesName} &nbsp;<strong>${val}</strong>`;
            }
        },
        tooltip: {
            enabled: true,
            fillSeriesColor: false,
            style: {
                fontSize: '13px',
                fontFamily: 'Plus Jakarta Sans, sans-serif'
            },
            y: {
                formatter: function(val, opts) {
                    const total = opts.w.globals.seriesTotals.reduce((a, b) => a + b, 0);
                    const pct = total > 0 ? ((val / total) * 100).toFixed(1) : 0;
                    return `${val} cliente${val !== 1 ? 's' : ''} (${pct}%)`;
                },
                title: {
                    formatter: function(seriesName) {
                        return `Plano ${seriesName}:`;
                    }
                }
            }
        },
        stroke: {
            show: true,
            width: 3,
            colors: ['#ffffff']
        },
        states: {
            hover: {
                filter: { type: 'darken', value: 0.08 }
            },
            active: {
                allowMultipleDataPointsSelection: false,
                filter: { type: 'darken', value: 0.18 }
            }
        },
        responsive: [
            {
                breakpoint: 1200,
                options: {
                    chart: { height: 290 },
                    plotOptions: {
                        pie: { donut: { size: '70%' } }
                    }
                }
            },
            {
                breakpoint: 768,
                options: {
                    chart: { height: 270 },
                    legend: {
                        position: 'bottom',
                        fontSize: '11px',
                        itemMargin: { horizontal: 8, vertical: 4 }
                    },
                    plotOptions: {
                        pie: {
                            donut: {
                                size: '68%',
                                labels: {
                                    value: { fontSize: '20px' },
                                    name:  { fontSize: '11px' }
                                }
                            }
                        }
                    },
                    dataLabels: { enabled: false }
                }
            }
        ]
    });
    servicesChart.render();
    
    reportsLineChart = new ApexCharts(document.querySelector("#reportsLineChart"), {
        series: [{ name: 'Agendamentos', data: [] }],
        chart: { type: 'line', height: 250, toolbar: { show: false } },
        colors: [defaultColors.primary],
        stroke: { curve: 'smooth', width: 3 },
        xaxis: { categories: [] }
    });
    reportsLineChart.render();
    
    reportsPieChart = new ApexCharts(document.querySelector("#reportsPieChart"), {
        series: [],
        chart: { type: 'pie', height: 250 },
        labels: [],
        colors: [defaultColors.primary, defaultColors.success, defaultColors.warning]
    });
    reportsPieChart.render();
    
    reportsBarChart = new ApexCharts(document.querySelector("#reportsBarChart"), {
        series: [{ name: 'Agendamentos', data: [] }],
        chart: { type: 'bar', height: 250, toolbar: { show: false } },
        colors: [defaultColors.secondary],
        plotOptions: { bar: { borderRadius: 4, horizontal: true } },
        xaxis: { categories: [] }
    });
    reportsBarChart.render();
    
    const today = new Date();
    const lastWeek = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    const startDate = document.getElementById('startDate');
    const endDate = document.getElementById('endDate');
    if (startDate) startDate.value = lastWeek.toISOString().split('T')[0];
    if (endDate) endDate.value = today.toISOString().split('T')[0];
    
    const reportPeriod = document.getElementById('reportPeriod');
    if (reportPeriod) {
        reportPeriod.addEventListener('change', function() {
            loadReportsData();
        });
    }
    
    if (document.getElementById('reportsView').classList.contains('active')) {
        loadReportsData();
    }
});

// ============================================
// EXPOR FUNÇÕES GLOBALMENTE
// ============================================
window.toggleSidebar = toggleSidebar;
window.handleGlobalSearch = handleGlobalSearch;
window.openModal = openModal;
window.closeModal = closeModal;
window.saveModal = saveModal;
window.editItem = editItem;
window.deleteItem = deleteItem;
window.updateAppointmentStatus = updateAppointmentStatus;
window.toggleTheme = toggleTheme;
window.toggleUserDropdown = toggleUserDropdown;
window.viewProfile = viewProfile;
window.viewSettings = viewSettings;
window.logout = logout;
window.openDesignModal = openDesignModal;
window.closeDesignModal = closeDesignModal;
window.resetDesignColors = resetDesignColors; 
window.saveDesignColors = saveDesignColors;
window.editSetting = editSetting;
window.saveSetting = saveSetting;
window.integrateGoogle = integrateGoogle;
window.setupPayments = setupPayments;
window.handlePeriodChange = handlePeriodChange;
window.applyFilters = applyFilters;
window.openCamera = openCamera;
window.uploadFromGallery = uploadFromGallery;
window.mascaraMoeda = mascaraMoeda;
window.mascaraCPF = mascaraCPF;
window.mascaraTelefone = mascaraTelefone;
window.mascaraCEP = mascaraCEP;
window.buscarCep = buscarCep;
window.generateClientReport = generateClientReport;
window.closeClientReportModal = closeClientReportModal;
window.downloadClientReportPDF = downloadClientReportPDF;
window.generateGeneralReport = generateGeneralReport;
window.filterReportClients = filterReportClients;
window.closeAppointmentDetails = closeAppointmentDetails;

async function searchClientsForAppointment() {
    const searchInput = document.getElementById('modalClientSearch');
    const clientSelect = document.getElementById('modalClientId');
    
    if (!searchInput || !clientSelect) return;
    
    const searchTerm = searchInput.value.trim().toLowerCase();
    
    if (searchTerm.length === 0) {
        loadModalSelects();
        return;
    }
    
    if (searchTerm.length < 2) return;
    
    try {
        const clientsSnap = await db.collection('clients')
            .where('userId', '==', currentUserId)
            .get();
        
        clientSelect.innerHTML = '<option value="">Selecione um cliente</option>';
        
        let foundClients = [];
        
        clientsSnap.forEach(doc => {
            const data = doc.data();
            const clientName = (data.name || '').toLowerCase();
            const clientCpf = (data.cpf || '').replace(/\D/g, '');
            const searchTermClean = searchTerm.replace(/\D/g, '');
            
            const matchName = clientName.includes(searchTerm);
            const matchCpf = searchTermClean.length > 0 && clientCpf.includes(searchTermClean);
            
            if (matchName || matchCpf) {
                foundClients.push({
                    id: doc.id,
                    name: data.name || 'Sem nome',
                    cpf: data.cpf || ''
                });
            }
        });
        
        foundClients.sort((a, b) => a.name.localeCompare(b.name));
        
        if (foundClients.length === 0) {
            clientSelect.innerHTML += '<option value="" disabled>Nenhum cliente encontrado</option>';
        } else {
            foundClients.forEach(client => {
                const displayText = client.cpf 
                    ? `${client.name} (CPF: ${client.cpf})` 
                    : client.name;
                clientSelect.innerHTML += `<option value="${client.id}">${displayText}</option>`;
            });
        }
        
    } catch (error) {
        console.error('Erro ao buscar clientes:', error);
    }
}

// ============================================
// FUNÇÃO DE BUSCA DE CLIENTES
// ============================================
let allClientsData = [];

function searchClients() {
    const searchInput = document.getElementById('clientSearchInput');
    if (!searchInput) return;
    
    const searchTerm = searchInput.value.trim().toLowerCase();
    
    // Se vazio, recarrega todos
    if (searchTerm.length === 0) {
        loadClients();
        return;
    }
    
    // Filtra na tabela atual
    const rows = document.querySelectorAll('#clientsList tr');
    rows.forEach(row => {
        const nameCell = row.cells[1]; // Coluna do nome
        const cpfCell = row.cells[3];  // Coluna do CPF
        
        if (nameCell && cpfCell) {
            const name = nameCell.textContent.toLowerCase();
            const cpf = cpfCell.textContent.replace(/\D/g, '');
            const searchClean = searchTerm.replace(/\D/g, '');
            
            const matchName = name.includes(searchTerm);
            const matchCpf = searchClean.length > 0 && cpf.includes(searchClean);
            
            row.style.display = (matchName || matchCpf) ? '' : 'none';
        }
    });
}



// ============================================
// CONFIGURAÇÕES WHATSAPP
// ============================================
async function loadWhatsAppSettings() {
    try {
        if (!currentUserId) return;
        const doc = await db.collection('settings').doc(currentUserId).get();
        const data = doc.exists ? doc.data() : {};
        const numberEl = document.getElementById('whatsappBusinessNumber');
        const linkEl = document.getElementById('whatsappBusinessLink');
        if (numberEl) numberEl.value = data.whatsappBusinessNumber || data.companyPhone || '';
        if (linkEl) linkEl.value = data.whatsappBusinessLink || '';
    } catch (error) {
        console.error('Erro ao carregar WhatsApp:', error);
        showNotification('Erro ao carregar configurações do WhatsApp', 'error');
    }
}

async function saveWhatsAppSettings() {
    try {
        if (!currentUserId) {
            showNotification('Usuário não autenticado', 'error');
            return;
        }
        const numberEl = document.getElementById('whatsappBusinessNumber');
        const linkEl = document.getElementById('whatsappBusinessLink');
        const rawNumber = (numberEl?.value || '').trim();
        const cleanNumber = rawNumber.replace(/\D/g, '');
        let link = (linkEl?.value || '').trim();
        if (!link && cleanNumber) {
            link = `https://wa.me/${cleanNumber.startsWith('55') ? cleanNumber : '55' + cleanNumber}`;
        }
        await db.collection('settings').doc(currentUserId).set({
            whatsappBusinessNumber: cleanNumber,
            whatsappBusinessLink: link,
            updatedAt: firebase.firestore.FieldValue.serverTimestamp()
        }, { merge: true });
        localStorage.setItem('whatsappBusinessNumber', cleanNumber);
        localStorage.setItem('whatsappBusinessLink', link);
        showNotification('WhatsApp salvo com sucesso!', 'success');
    } catch (error) {
        console.error('Erro ao salvar WhatsApp:', error);
        showNotification('Erro ao salvar WhatsApp', 'error');
    }
}

function openConfiguredWhatsAppLink() {
    const numberEl = document.getElementById('whatsappBusinessNumber');
    const linkEl = document.getElementById('whatsappBusinessLink');
    const rawNumber = (numberEl?.value || localStorage.getItem('whatsappBusinessNumber') || '').trim();
    const savedLink = (linkEl?.value || localStorage.getItem('whatsappBusinessLink') || '').trim();
    const cleanNumber = rawNumber.replace(/\D/g, '');
    const finalLink = savedLink || (cleanNumber ? `https://wa.me/${cleanNumber.startsWith('55') ? cleanNumber : '55' + cleanNumber}` : '');
    if (!finalLink) {
        showNotification('Cadastre um número ou link do WhatsApp primeiro', 'error');
        return;
    }
    window.open(finalLink, '_blank');
}





function openWhatsAppWebLogin() {
    window.open('https://web.whatsapp.com/', '_blank');
    showNotification('Abra o WhatsApp Web e faça login com o número do cliente neste navegador.', 'success');
}

window.openWhatsAppWebLogin = openWhatsAppWebLogin;


// Remove tooltips de eventos ao sair do calendário, rolar ou clicar fora
(function attachEventTooltipCleanup() {
    document.addEventListener('mouseover', function(e) {
        const overEvent = e.target.closest('.fc-event');
        const overTooltip = e.target.closest('.event-tooltip');
        if (!overEvent && !overTooltip) {
            document.querySelectorAll('.event-tooltip').forEach(t => t.remove());
        }
    });
    document.addEventListener('scroll', function() {
        document.querySelectorAll('.event-tooltip').forEach(t => t.remove());
    }, true);
    document.addEventListener('click', function(e) {
        if (!e.target.closest('.fc-event') && !e.target.closest('.event-tooltip')) {
            document.querySelectorAll('.event-tooltip').forEach(t => t.remove());
        }
    });
})();

async function loadTrialBanner() {
    try {
        const firebaseUser = auth.currentUser;
        const banner = document.getElementById('trialNoticeBanner');
        const text = document.getElementById('trialNoticeText');
        const planDisplay = document.getElementById('userPlanDisplay');
        if (!firebaseUser || !banner || !text) return;

        const subDoc = await db.collection('subscriptions').doc(firebaseUser.uid).get();
        if (!subDoc.exists) {
            banner.style.display = 'none';
            return;
        }

        const sub = subDoc.data() || {};
        if ((sub.plan || '').toLowerCase() !== 'trial' || sub.status !== 'active' || !sub.expiresAt) {
            banner.style.display = 'none';
            if (planDisplay && sub.plan) planDisplay.textContent = String(sub.plan).charAt(0).toUpperCase() + String(sub.plan).slice(1);
            return;
        }

        const expiresAt = sub.expiresAt.toDate ? sub.expiresAt.toDate() : new Date(sub.expiresAt);
        const now = new Date();
        const diffMs = expiresAt.getTime() - now.getTime();
        const daysLeft = Math.max(0, Math.ceil(diffMs / (1000 * 60 * 60 * 24)));

        if (daysLeft <= 0) {
            banner.style.display = 'none';
            return;
        }

        banner.style.display = 'block';
        text.textContent = daysLeft === 1
            ? 'Seu período grátis termina em 1 dia.'
            : `Seu período grátis termina em ${daysLeft} dias.`;

        if (planDisplay) {
            planDisplay.textContent = `Trial • ${daysLeft} dia${daysLeft === 1 ? '' : 's'}`;
        }
    } catch (error) {
        console.error('Erro ao carregar aviso do trial:', error);
    }
}

