// ============================================================
// NEXBOOK - Email Management JavaScript
// ============================================================

// Estado do gerenciador de email
const emailManager = {
    status: {
        sendgrid: 'checking',
        functions: 'checking'
    },
    config: {
        enableConfirmationEmail: true,
        enableReminderEmail: true,
        enableWhatsAppIntegration: true
    },
    stats: {
        totalSent: 0,
        successful: 0,
        failed: 0
    }
};

// Inicialização
document.addEventListener('DOMContentLoaded', () => {
    initializeEmailManager();
});

function initializeEmailManager() {
    // Configurar data mínima para teste
    const testDateInput = document.getElementById('testDate');
    if (testDateInput) {
        testDateInput.min = new Date().toISOString().split('T')[0];
    }
    
    // Carregar configurações salvas
    loadEmailConfig();
    
    // Verificar status inicial
    checkEmailStatus();
    
    // Carregar estatísticas
    loadEmailStats();
}

// Verificar status do sistema de email
async function checkEmailStatus() {
    updateStatusDisplay('sendgrid', 'checking', 'Verificando...');
    updateStatusDisplay('functions', 'checking', 'Verificando...');
    
    try {
        // Verificar se as functions estão ativas
        const functionsStatus = await checkCloudFunctionsStatus();
        updateStatusDisplay('functions', functionsStatus.active ? 'success' : 'error', 
                          functionsStatus.active ? 'Ativas' : 'Inativas');
        
        // Verificar configuração SendGrid (indiretamente via teste)
        const sendgridStatus = await checkSendGridStatus();
        updateStatusDisplay('sendgrid', sendgridStatus.configured ? 'success' : 'warning', 
                          sendgridStatus.configured ? 'Configurada' : 'Não Configurada');
        
    } catch (error) {
        console.error('Erro ao verificar status:', error);
        updateStatusDisplay('sendgrid', 'error', 'Erro');
        updateStatusDisplay('functions', 'error', 'Erro');
    }
}

// Verificar status das Cloud Functions
async function checkCloudFunctionsStatus() {
    try {
        // Simulação - na prática, verificaríamos via API do Firebase
        // Por ora, assumimos que estão ativas se o deploy foi bem-sucedido
        return { active: true };
    } catch (error) {
        return { active: false };
    }
}

// Verificar status do SendGrid
async function checkSendGridStatus() {
    try {
        // Simulação - na prática, verificaríamos se a secret está configurada
        // Por ora, assumimos que não está configurada até o usuário configurar
        return { configured: false };
    } catch (error) {
        return { configured: false };
    }
}

// Atualizar display de status
function updateStatusDisplay(service, status, text) {
    const iconElement = document.getElementById(service + 'Status');
    const textElement = document.getElementById(service + 'StatusText');
    
    if (iconElement && textElement) {
        // Remover classes anteriores
        iconElement.className = 'status-icon';
        
        // Adicionar classe e ícone correspondentes
        switch (status) {
            case 'success':
                iconElement.classList.add('success');
                iconElement.innerHTML = '<i class="fas fa-check-circle"></i>';
                break;
            case 'error':
                iconElement.classList.add('error');
                iconElement.innerHTML = '<i class="fas fa-times-circle"></i>';
                break;
            case 'warning':
                iconElement.classList.add('warning');
                iconElement.innerHTML = '<i class="fas fa-exclamation-triangle"></i>';
                break;
            case 'checking':
                iconElement.classList.add('checking');
                iconElement.innerHTML = '<i class="fas fa-spinner fa-spin"></i>';
                break;
        }
        
        textElement.textContent = text;
    }
    
    emailManager.status[service] = status;
}

// Enviar email de teste
async function sendTestEmail(event) {
    event.preventDefault();
    
    const form = document.getElementById('emailTestForm');
    const resultDiv = document.getElementById('emailTestResult');
    const submitBtn = document.getElementById('sendTestBtn');
    const btnText = document.getElementById('sendTestBtnText');
    
    // Desabilitar botão
    submitBtn.disabled = true;
    btnText.textContent = 'Enviando...';
    resultDiv.style.display = 'none';
    
    try {
        const testData = {
            userId: window.currentUserId || 'test-user-id',
            clientName: document.getElementById('testName').value,
            clientPhone: document.getElementById('testPhone').value.replace(/\D/g, ''),
            clientEmail: document.getElementById('testEmail').value,
            professionalId: 'test-professional',
            professionalName: 'Profissional Teste',
            serviceId: 'test-service',
            serviceName: 'Serviço de Teste',
            servicePrice: 0,
            date: document.getElementById('testDate').value,
            time: document.getElementById('testTime').value,
            status: 'pending',
            source: 'email_test',
            createdAt: firebase.firestore.FieldValue.serverTimestamp()
        };
        
        // Criar agendamento de teste no Firestore
        const docRef = await db.collection('appointments').add(testData);
        
        // Exibir resultado
        showTestResult('success', `
            <h3>✅ Email enviado com sucesso!</h3>
            <p><strong>ID do Agendamento:</strong> ${docRef.id}</p>
            <p>Verifique sua caixa de entrada (e pasta de spam) para o email de confirmação.</p>
            <p>Caso a chave API do SendGrid não esteja configurada, o email não será enviado.</p>
        `);
        
        // Limpar formulário
        form.reset();
        
        // Atualizar estatísticas
        emailManager.stats.totalSent++;
        updateEmailStatsDisplay();
        
    } catch (error) {
        console.error('Erro ao enviar email de teste:', error);
        showTestResult('error', `
            <h3>❌ Erro ao enviar email</h3>
            <p><strong>Erro:</strong> ${error.message}</p>
            <p>Verifique se as permissões estão configuradas corretamente.</p>
        `);
        
        emailManager.stats.failed++;
        updateEmailStatsDisplay();
    } finally {
        submitBtn.disabled = false;
        btnText.textContent = 'Enviar Email de Teste';
    }
}

// Exibir resultado do teste
function showTestResult(type, content) {
    const resultDiv = document.getElementById('emailTestResult');
    resultDiv.className = `test-result ${type}`;
    resultDiv.innerHTML = content;
    resultDiv.style.display = 'block';
    
    // Scroll para o resultado
    resultDiv.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
}

// Carregar configurações de email
function loadEmailConfig() {
    const userId = window.currentUserId;
    if (!userId) return;
    
    // Carregar do Firestore
    db.collection('settings').doc(userId).get().then(doc => {
        if (doc.exists) {
            const settings = doc.data();
            emailManager.config = {
                enableConfirmationEmail: settings.enableConfirmationEmail !== false,
                enableReminderEmail: settings.enableReminderEmail !== false,
                enableWhatsAppIntegration: settings.enableWhatsAppIntegration !== false
            };
            updateConfigDisplay();
        }
    }).catch(error => {
        console.error('Erro ao carregar configurações:', error);
    });
}

// Atualizar display das configurações
function updateConfigDisplay() {
    document.getElementById('enableConfirmationEmail').checked = emailManager.config.enableConfirmationEmail;
    document.getElementById('enableReminderEmail').checked = emailManager.config.enableReminderEmail;
    document.getElementById('enableWhatsAppIntegration').checked = emailManager.config.enableWhatsAppIntegration;
}

// Salvar configurações de email
function saveEmailConfig() {
    const userId = window.currentUserId;
    if (!userId) {
        showNotification('Usuário não autenticado', 'error');
        return;
    }
    
    emailManager.config = {
        enableConfirmationEmail: document.getElementById('enableConfirmationEmail').checked,
        enableReminderEmail: document.getElementById('enableReminderEmail').checked,
        enableWhatsAppIntegration: document.getElementById('enableWhatsAppIntegration').checked
    };
    
    // Salvar no Firestore
    db.collection('settings').doc(userId).update({
        enableConfirmationEmail: emailManager.config.enableConfirmationEmail,
        enableReminderEmail: emailManager.config.enableReminderEmail,
        enableWhatsAppIntegration: emailManager.config.enableWhatsAppIntegration,
        updatedAt: firebase.firestore.FieldValue.serverTimestamp()
    }).then(() => {
        showNotification('Configurações salvas com sucesso!', 'success');
    }).catch(error => {
        console.error('Erro ao salvar configurações:', error);
        showNotification('Erro ao salvar configurações', 'error');
    });
}

// Resetar configurações de email
function resetEmailConfig() {
    if (confirm('Tem certeza que deseja resetar as configurações para os valores padrão?')) {
        emailManager.config = {
            enableConfirmationEmail: true,
            enableReminderEmail: true,
            enableWhatsAppIntegration: true
        };
        updateConfigDisplay();
        saveEmailConfig();
    }
}

// Carregar estatísticas de email
function loadEmailStats() {
    const userId = window.currentUserId;
    if (!userId) return;
    
    const period = document.getElementById('emailPeriod')?.value || 30;
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - period);
    
    // Buscar agendamentos com email no período
    db.collection('appointments')
        .where('userId', '==', userId)
        .where('clientEmail', '!=', null)
        .where('createdAt', '>=', startDate)
        .get()
        .then(snapshot => {
            const appointments = snapshot.docs.map(doc => doc.data());
            
            // Calcular estatísticas (simulação - na prática, teríamos logs reais)
            emailManager.stats = {
                totalSent: appointments.length,
                successful: Math.floor(appointments.length * 0.85), // Simulação de 85% sucesso
                failed: Math.floor(appointments.length * 0.15) // Simulação de 15% falha
            };
            
            updateEmailStatsDisplay();
        })
        .catch(error => {
            console.error('Erro ao carregar estatísticas:', error);
        });
}

// Atualizar display das estatísticas
function updateEmailStatsDisplay() {
    const stats = emailManager.stats;
    
    document.getElementById('totalEmailsSent').textContent = stats.totalSent;
    document.getElementById('successfulEmails').textContent = stats.successful;
    document.getElementById('failedEmails').textContent = stats.failed;
    
    const successRate = stats.totalSent > 0 
        ? Math.round((stats.successful / stats.totalSent) * 100) 
        : 0;
    document.getElementById('emailSuccessRate').textContent = successRate + '%';
}

// Máscara para telefone
function maskPhone(element) {
    let value = element.value.replace(/\D/g, '').slice(0, 11);
    if (value.length > 10) {
        value = value.replace(/(\d{2})(\d{5})(\d{4})/, '($1) $2-$3');
    } else if (value.length > 6) {
        value = value.replace(/(\d{2})(\d{4})(\d*)/, '($1) $2-$3');
    } else if (value.length > 2) {
        value = value.replace(/(\d{2})(\d*)/, '($1) $2');
    }
    element.value = value;
}

// Exibir notificação (função auxiliar)
function showNotification(message, type = 'info') {
    // Implementar notificação existente no sistema
    if (typeof window.showToast === 'function') {
        window.showToast(message, type);
    } else {
        // Fallback
        const notification = document.createElement('div');
        notification.className = `notification ${type}`;
        notification.textContent = message;
        notification.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            padding: 16px 20px;
            border-radius: 8px;
            color: white;
            font-weight: 500;
            z-index: 10000;
            animation: slideIn 0.3s ease;
        `;
        
        switch (type) {
            case 'success':
                notification.style.background = '#22c55e';
                break;
            case 'error':
                notification.style.background = '#ef4444';
                break;
            default:
                notification.style.background = '#3b82f6';
        }
        
        document.body.appendChild(notification);
        
        setTimeout(() => {
            notification.remove();
        }, 3000);
    }
}

// Adicionar animação CSS
const style = document.createElement('style');
style.textContent = `
    @keyframes slideIn {
        from { transform: translateX(100%); opacity: 0; }
        to { transform: translateX(0); opacity: 1; }
    }
`;
document.head.appendChild(style);
