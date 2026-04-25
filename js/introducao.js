// introducao.js - VERSÃO ÚNICA E CORRETA
document.addEventListener('DOMContentLoaded', function() {
    console.log('🎬 Tela de introdução iniciada');
    
    // 🟢 MARCA que o usuário JÁ VIU a introdução nesta sessão
    sessionStorage.setItem('jaViuIntro', 'true');
    
    // 🔴 IMPEDE que o usuário volte para a introdução (botão voltar)
    history.pushState(null, null, location.href);
    window.onpopstate = function() {
        history.go(1);
    };
    
    // ⏱️ Se quiser que vá automaticamente após X segundos (opcional)
    // setTimeout(finalizarIntro, 5000);
});

// Função para finalizar a introdução (chame no botão)
function finalizarIntro() {
    console.log('➡️ Finalizando introdução, indo para login...');
    window.location.href = 'index.html';
}

// Função para pular introdução
function pularIntro() {
    finalizarIntro();
}