// ============================================
// NAVEGAÇÃO
// ============================================

// 75. Navegação entre views
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
            reports: 'Relatórios e Análises',
            settings: 'Configurações do Sistema'
        };
        
        document.querySelector('.page-title h1').textContent = titles[this.dataset.view];
        
        if (this.dataset.view === 'reports') {
            console.log('📊 Carregando relatórios...');
            loadReportsData();
        }
        
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