// ======================================
// SISTEMA DE IDIOMA - COMPLETO E FUNCIONAL CORRIGIDO
// ======================================

// Objeto de traduções COMPLETO com TODOS os idiomas
const translations = {
    'pt-BR': {
        // Dashboard
        'dashboardTitle': 'Dashboard Inteligente',
        'dashboardSubtitle': 'Visão geral do seu negócio com insights em tempo real',
        'last7days': 'Últimos 7 dias',
        'last30days': 'Últimos 30 dias',
        'thisMonth': 'Este mês',
        'custom': 'Personalizado',
        'allProfessionals': 'Todos profissionais',
        'allServices': 'Todos serviços',
        'to': 'até',
        'apply': 'Aplicar',
        'today': 'Hoje',
        'appointmentsToday': 'Agendamentos hoje',
        'vsYesterday': 'vs ontem',
        'revenueToday': 'Faturamento hoje',
        'professionals': 'Profissionais',
        'clients': 'Clientes',
        'active': 'Ativos',
        'appointmentsPerDay': 'Agendamentos por dia',
        'mostWantedServices': 'Serviços mais procurados',
        'nextAppointments': 'Próximos agendamentos',
        'sendWhatsApp': 'Enviar via WhatsApp',
        'newAppointment': 'Novo agendamento',
        
        // Navegação
        'dashboard': 'Dashboard',
        'calendar': 'Calendário',
        'services': 'Serviços',
        'reports': 'Relatórios',
        'settings': 'Configurações',
        
        // Gerais
        'search': 'Buscar...',
        'searchClient': 'Buscar aluno...',
        'searchStudent': 'Buscar aluno...',
        'loading': 'Carregando...',
        'loadingAppointments': 'Carregando agendamentos...',
        'loadingStudents': 'Carregando alunos...',
        'myProfile': 'Meu Perfil',
        'logout': 'Sair',
        'cancel': 'Cancelar',
        'save': 'Salvar',
        'edit': 'Editar',
        'delete': 'Excluir',
        'confirm': 'Confirmar',
        'close': 'Fechar',
        
        // Profissionais
        'name': 'Nome',
        'specialty': 'Especialidade',
        'email': 'Email',
        'phone': 'Telefone',
        'status': 'Status',
        'actions': 'Ações',
        'newProfessional': 'Novo Profissional',
        'editProfessional': 'Editar Profissional',
        'deleteProfessional': 'Excluir Profissional',
        'professionalStatus': 'Status do Profissional',
        'active': 'Ativo',
        'inactive': 'Inativo',
        
        // Serviços
        'duration': 'Duração (min)',
        'description': 'Descrição',
        'price': 'Preço',
        'newService': 'Novo Serviço',
        'editService': 'Editar Serviço',
        'deleteService': 'Excluir Serviço',
        'serviceStatus': 'Status do Serviço',
        
        // Clientes
        'photo': 'Foto',
        'birthdate': 'Data Nasc.',
        'plan': 'Plano',
        'origin': 'Origem',
        'value': 'Valor',
        'startDate': 'Data Início',
        'city': 'Cidade',
        'newClient': 'Novo Cliente',
        'editClient': 'Editar Cliente',
        'deleteClient': 'Excluir Cliente',
        'totalpass': 'Total Pass',
        'wellhub': 'Well Hub',
        'direct': 'Direto',
        'clientStatus': 'Status do Cliente',
        'cpf': 'CPF',
        'address': 'Endereço',
        'neighborhood': 'Bairro',
        'zipCode': 'CEP',
        'birthDate': 'Data de Nascimento',
        'planValue': 'Valor do Plano',
        
        // Planos
        'MENSAL': 'Mensal',
        'TRIMESTRAL': 'Trimestral',
        'SEMESTRAL': 'Semestral',
        'ANUAL': 'Anual',
        'AVULSO': 'Avulso',
        
        // Relatórios
        'reportsTitle': 'Relatórios e Análises',
        'last90days': 'Últimos 90 dias',
        'lastYear': 'Último ano',
        'allPeriod': 'Todo período',
        'generalReport': 'Relatório Geral',
        'total': 'Total',
        'activeClients': 'Clientes Ativos',
        'vsPreviousPeriod': 'vs período anterior',
        'appointments': 'Agendamentos',
        'revenue': 'Faturamento',
        'attendanceRate': 'Taxa de Comparecimento',
        'appointmentsEvolution': 'Evolução de Agendamentos',
        'selectedPeriod': 'Período selecionado',
        'distributionByOrigin': 'Distribuição por Origem',
        'totalpassVsWellhub': 'Total Pass vs Well Hub vs Direto',
        'performanceByProfessional': 'Desempenho por Profissional',
        'appointmentsPeriod': 'Agendamentos no período',
        'studentReport': 'Relatório do Aluno',
        'downloadPDF': 'Download PDF',
        'attended': 'Compareceu',
        'absent': 'Faltou',
        'pending': 'Pendente',
        'cancelled': 'Cancelado',
        'confirmed': 'Confirmado',
        
        // Configurações
        'language': 'Idioma',
        'interfaceLanguage': 'Idioma da Interface',
        'selectLanguage': 'Selecione o idioma do sistema',
        'generalSettings': 'Configurações Gerais',
        'companyName': 'Nome da Empresa',
        'contactEmail': 'Email de Contato',
        'address': 'Endereço',
        'workingHours': 'Horário de Funcionamento',
        'mondayToFriday': 'Segunda à Sexta',
        'saturday': 'Sábado',
        'sunday': 'Domingo',
        'closed': 'Fechado',
        'notifications': 'Notificações',
        'confirmationEmail': 'Email de Confirmação',
        'sendConfirmationEmail': 'Enviar confirmação por email',
        'smsReminder': 'SMS de Lembrete',
        'sendReminder1h': 'Enviar lembrete 1h antes',
        'whatsapp': 'WhatsApp',
        'whatsappNotifications': 'Notificações via WhatsApp',
        'integrations': 'Integrações',
        'syncGoogle': 'Sincronizar com Google',
        'onlinePayments': 'Pagamentos Online',
        'acceptPayments': 'Aceitar pagamentos',
        'connect': 'Conectar',
        'setup': 'Configurar',
        
        // Design
        'designColors': 'Design & Cores',
        'customizeSystemColors': 'Personalizar Cores do Sistema',
        'changeLayoutColors': 'Altere as cores principais do layout completo',
        'design': 'DESIGN',
        'livePreview': 'Pré-visualização em Tempo Real',
        'changesAppliedInstantly': 'As mudanças são aplicadas instantaneamente',
        'primaryColor': 'Cor Primária',
        'secondaryColor': 'Cor Secundária',
        'backgroundColor': 'Cor de Fundo',
        'successColor': 'Cor de Sucesso',
        'customizeDesign': 'Personalizar Design',
        'resetDefault': 'Resetar Padrão',
        'saveDesign': 'Salvar Design',
        
        // WhatsApp
        'sendReminderWhatsApp': 'Enviar Lembrete via WhatsApp',
        'confirmAppointmentData': 'Confirme os dados do agendamento',
        'whatsappNumber': 'Número do WhatsApp',
        'addCustomMessage': 'Adicionar mensagem personalizada',
        'customMessage': 'Digite sua mensagem adicional...',
        'sendNow': 'Enviar Agora',
        'selectStudentReminder': 'Selecione o aluno para enviar o lembrete',
        
        // Dias da semana
        'monday': 'Segunda',
        'tuesday': 'Terça',
        'wednesday': 'Quarta',
        'thursday': 'Quinta',
        'friday': 'Sexta',
        'saturday': 'Sábado',
        'sunday': 'Domingo',
        
        // Meses
        'january': 'Janeiro',
        'february': 'Fevereiro',
        'march': 'Março',
        'april': 'Abril',
        'may': 'Maio',
        'june': 'Junho',
        'july': 'Julho',
        'august': 'Agosto',
        'september': 'Setembro',
        'october': 'Outubro',
        'november': 'Novembro',
        'december': 'Dezembro',
        
        // Status dos agendamentos
        'status_confirmed': 'Confirmado',
        'status_attended': 'Compareceu',
        'status_pending': 'Pendente',
        'status_absent': 'Faltou',
        'status_cancelled': 'Cancelado',
        
        // Botões e ações
        'filter': 'Filtrar',
        'clear': 'Limpar',
        'apply': 'Aplicar',
        'refresh': 'Atualizar',
        'export': 'Exportar',
        'import': 'Importar',
        'print': 'Imprimir',
        'view': 'Visualizar',
        'download': 'Baixar',
        'upload': 'Enviar',
        'send': 'Enviar',
        'receive': 'Receber',
        
        // Mensagens
        'noResults': 'Nenhum resultado encontrado',
        'loading': 'Carregando...',
        'error': 'Erro',
        'success': 'Sucesso',
        'warning': 'Aviso',
        'info': 'Informação',
        'confirmDelete': 'Tem certeza que deseja excluir?',
        'confirmLogout': 'Tem certeza que deseja sair?',
        'sessionExpired': 'Sessão expirada',
        'unauthorized': 'Acesso não autorizado',
        
        // Placeholders
        'searchPlaceholder': 'Buscar...',
        'searchClientPlaceholder': 'Buscar cliente...',
        'searchProfessionalPlaceholder': 'Buscar profissional...',
        'searchServicePlaceholder': 'Buscar serviço...',
        'enterName': 'Digite o nome',
        'enterEmail': 'Digite o email',
        'enterPhone': 'Digite o telefone',
        'enterCpf': 'Digite o CPF',
        'enterAddress': 'Digite o endereço',
        'enterCity': 'Digite a cidade',
        'enterZipCode': 'Digite o CEP',
        'enterValue': 'Digite o valor',
        'enterDescription': 'Digite a descrição',
        
        // Títulos de página
        'pageDashboard': 'NEXBOOK',
        'pageCalendar': 'Calendário - NEXBOOK',
        'pageProfessionals': 'Profissionais - NEXBOOK',
        'pageServices': 'Serviços - NEXBOOK',
        'pageClients': 'Clientes - NEXBOOK',
        'pageReports': 'Relatórios - NEXBOOK',
        'pageSettings': 'Configurações - NEXBOOK'
    },
    
    'en': {
        // Dashboard
        'dashboardTitle': 'Smart Dashboard',
        'dashboardSubtitle': 'Business overview with real-time insights',
        'last7days': 'Last 7 days',
        'last30days': 'Last 30 days',
        'thisMonth': 'This month',
        'custom': 'Custom',
        'allProfessionals': 'All professionals',
        'allServices': 'All services',
        'to': 'to',
        'apply': 'Apply',
        'today': 'Today',
        'appointmentsToday': 'Appointments today',
        'vsYesterday': 'vs yesterday',
        'revenueToday': 'Revenue today',
        'professionals': 'Professionals',
        'clients': 'Clients',
        'active': 'Active',
        'appointmentsPerDay': 'Appointments per day',
        'mostWantedServices': 'Most wanted services',
        'nextAppointments': 'Next appointments',
        'sendWhatsApp': 'Send via WhatsApp',
        'newAppointment': 'New appointment',
        
        // Navigation
        'dashboard': 'Dashboard',
        'calendar': 'Calendar',
        'services': 'Services',
        'reports': 'Reports',
        'settings': 'Settings',
        
        // General
        'search': 'Search...',
        'searchClient': 'Search client...',
        'searchStudent': 'Search student...',
        'loading': 'Loading...',
        'loadingAppointments': 'Loading appointments...',
        'loadingStudents': 'Loading students...',
        'myProfile': 'My Profile',
        'logout': 'Logout',
        'cancel': 'Cancel',
        'save': 'Save',
        'edit': 'Edit',
        'delete': 'Delete',
        'confirm': 'Confirm',
        'close': 'Close',
        
        // Professionals
        'name': 'Name',
        'specialty': 'Specialty',
        'email': 'Email',
        'phone': 'Phone',
        'status': 'Status',
        'actions': 'Actions',
        'newProfessional': 'New Professional',
        'editProfessional': 'Edit Professional',
        'deleteProfessional': 'Delete Professional',
        'professionalStatus': 'Professional Status',
        'active': 'Active',
        'inactive': 'Inactive',
        
        // Services
        'duration': 'Duration (min)',
        'description': 'Description',
        'price': 'Price',
        'newService': 'New Service',
        'editService': 'Edit Service',
        'deleteService': 'Delete Service',
        'serviceStatus': 'Service Status',
        
        // Clients
        'photo': 'Photo',
        'birthdate': 'Birth Date',
        'plan': 'Plan',
        'origin': 'Origin',
        'value': 'Value',
        'startDate': 'Start Date',
        'city': 'City',
        'newClient': 'New Client',
        'editClient': 'Edit Client',
        'deleteClient': 'Delete Client',
        'totalpass': 'Total Pass',
        'wellhub': 'Well Hub',
        'direct': 'Direct',
        'clientStatus': 'Client Status',
        'cpf': 'CPF',
        'address': 'Address',
        'neighborhood': 'Neighborhood',
        'zipCode': 'Zip Code',
        'birthDate': 'Birth Date',
        'planValue': 'Plan Value',
        
        // Plans
        'MENSAL': 'Monthly',
        'TRIMESTRAL': 'Quarterly',
        'SEMESTRAL': 'Semester',
        'ANUAL': 'Yearly',
        'AVULSO': 'Single',
        
        // Reports
        'reportsTitle': 'Reports & Analytics',
        'last90days': 'Last 90 days',
        'lastYear': 'Last year',
        'allPeriod': 'All period',
        'generalReport': 'General Report',
        'total': 'Total',
        'activeClients': 'Active Clients',
        'vsPreviousPeriod': 'vs previous period',
        'appointments': 'Appointments',
        'revenue': 'Revenue',
        'attendanceRate': 'Attendance Rate',
        'appointmentsEvolution': 'Appointments Evolution',
        'selectedPeriod': 'Selected period',
        'distributionByOrigin': 'Distribution by Origin',
        'totalpassVsWellhub': 'Total Pass vs Well Hub vs Direct',
        'performanceByProfessional': 'Performance by Professional',
        'appointmentsPeriod': 'Appointments in period',
        'studentReport': 'Student Report',
        'downloadPDF': 'Download PDF',
        'attended': 'Attended',
        'absent': 'Absent',
        'pending': 'Pending',
        'cancelled': 'Cancelled',
        'confirmed': 'Confirmed',
        
        // Settings
        'language': 'Language',
        'interfaceLanguage': 'Interface Language',
        'selectLanguage': 'Select system language',
        'generalSettings': 'General Settings',
        'companyName': 'Company Name',
        'contactEmail': 'Contact Email',
        'address': 'Address',
        'workingHours': 'Working Hours',
        'mondayToFriday': 'Monday to Friday',
        'saturday': 'Saturday',
        'sunday': 'Sunday',
        'closed': 'Closed',
        'notifications': 'Notifications',
        'confirmationEmail': 'Confirmation Email',
        'sendConfirmationEmail': 'Send confirmation email',
        'smsReminder': 'SMS Reminder',
        'sendReminder1h': 'Send reminder 1h before',
        'whatsapp': 'WhatsApp',
        'whatsappNotifications': 'WhatsApp Notifications',
        'integrations': 'Integrations',
        'syncGoogle': 'Sync with Google',
        'onlinePayments': 'Online Payments',
        'acceptPayments': 'Accept payments',
        'connect': 'Connect',
        'setup': 'Setup',
        
        // Design
        'designColors': 'Design & Colors',
        'customizeSystemColors': 'Customize System Colors',
        'changeLayoutColors': 'Change main layout colors',
        'design': 'DESIGN',
        'livePreview': 'Live Preview',
        'changesAppliedInstantly': 'Changes are applied instantly',
        'primaryColor': 'Primary Color',
        'secondaryColor': 'Secondary Color',
        'backgroundColor': 'Background Color',
        'successColor': 'Success Color',
        'customizeDesign': 'Customize Design',
        'resetDefault': 'Reset to Default',
        'saveDesign': 'Save Design',
        
        // WhatsApp
        'sendReminderWhatsApp': 'Send Reminder via WhatsApp',
        'confirmAppointmentData': 'Confirm appointment data',
        'whatsappNumber': 'WhatsApp Number',
        'addCustomMessage': 'Add custom message',
        'customMessage': 'Type your additional message...',
        'sendNow': 'Send Now',
        'selectStudentReminder': 'Select student to send reminder',
        
        // Week days
        'monday': 'Monday',
        'tuesday': 'Tuesday',
        'wednesday': 'Wednesday',
        'thursday': 'Thursday',
        'friday': 'Friday',
        'saturday': 'Saturday',
        'sunday': 'Sunday',
        
        // Months
        'january': 'January',
        'february': 'February',
        'march': 'March',
        'april': 'April',
        'may': 'May',
        'june': 'June',
        'july': 'July',
        'august': 'August',
        'september': 'September',
        'october': 'October',
        'november': 'November',
        'december': 'December',
        
        // Appointment status
        'status_confirmed': 'Confirmed',
        'status_attended': 'Attended',
        'status_pending': 'Pending',
        'status_absent': 'Absent',
        'status_cancelled': 'Cancelled',
        
        // Buttons and actions
        'filter': 'Filter',
        'clear': 'Clear',
        'apply': 'Apply',
        'refresh': 'Refresh',
        'export': 'Export',
        'import': 'Import',
        'print': 'Print',
        'view': 'View',
        'download': 'Download',
        'upload': 'Upload',
        'send': 'Send',
        'receive': 'Receive',
        
        // Messages
        'noResults': 'No results found',
        'loading': 'Loading...',
        'error': 'Error',
        'success': 'Success',
        'warning': 'Warning',
        'info': 'Info',
        'confirmDelete': 'Are you sure you want to delete?',
        'confirmLogout': 'Are you sure you want to logout?',
        'sessionExpired': 'Session expired',
        'unauthorized': 'Unauthorized access',
        
        // Placeholders
        'searchPlaceholder': 'Search...',
        'searchClientPlaceholder': 'Search client...',
        'searchProfessionalPlaceholder': 'Search professional...',
        'searchServicePlaceholder': 'Search service...',
        'enterName': 'Enter name',
        'enterEmail': 'Enter email',
        'enterPhone': 'Enter phone',
        'enterCpf': 'Enter CPF',
        'enterAddress': 'Enter address',
        'enterCity': 'Enter city',
        'enterZipCode': 'Enter zip code',
        'enterValue': 'Enter value',
        'enterDescription': 'Enter description',
        
        // Page titles
        'pageDashboard': 'Dashboard - NEXBOOK',
        'pageCalendar': 'Calendar - NEXBOOK',
        'pageProfessionals': 'Professionals - NEXBOOK',
        'pageServices': 'Services - NEXBOOK',
        'pageClients': 'Clients - NEXBOOK',
        'pageReports': 'Reports - NEXBOOK',
        'pageSettings': 'Settings - NEXBOOK'
    },
    
    'es': {
        // Dashboard
        'dashboardTitle': 'Dashboard Inteligente',
        'dashboardSubtitle': 'Visión general de su negocio con información en tiempo real',
        'last7days': 'Últimos 7 días',
        'last30days': 'Últimos 30 días',
        'thisMonth': 'Este mes',
        'custom': 'Personalizado',
        'allProfessionals': 'Todos los profesionales',
        'allServices': 'Todos los servicios',
        'to': 'hasta',
        'apply': 'Aplicar',
        'today': 'Hoy',
        'appointmentsToday': 'Citas hoy',
        'vsYesterday': 'vs ayer',
        'revenueToday': 'Ingresos hoy',
        'professionals': 'Profesionales',
        'clients': 'Clientes',
        'active': 'Activos',
        'appointmentsPerDay': 'Citas por día',
        'mostWantedServices': 'Servicios más buscados',
        'nextAppointments': 'Próximas citas',
        'sendWhatsApp': 'Enviar vía WhatsApp',
        'newAppointment': 'Nueva cita',
        
        // Navegación
        'dashboard': 'Dashboard',
        'calendar': 'Calendario',
        'services': 'Servicios',
        'reports': 'Informes',
        'settings': 'Configuración',
        
        // Generales
        'search': 'Buscar...',
        'searchClient': 'Buscar cliente...',
        'searchStudent': 'Buscar alumno...',
        'loading': 'Cargando...',
        'loadingAppointments': 'Cargando citas...',
        'loadingStudents': 'Cargando alumnos...',
        'myProfile': 'Mi Perfil',
        'logout': 'Cerrar sesión',
        'cancel': 'Cancelar',
        'save': 'Guardar',
        'edit': 'Editar',
        'delete': 'Eliminar',
        'confirm': 'Confirmar',
        'close': 'Cerrar',
        
        // Profesionales
        'name': 'Nombre',
        'specialty': 'Especialidad',
        'email': 'Email',
        'phone': 'Teléfono',
        'status': 'Estado',
        'actions': 'Acciones',
        'newProfessional': 'Nuevo Profesional',
        'editProfessional': 'Editar Profesional',
        'deleteProfessional': 'Eliminar Profesional',
        'professionalStatus': 'Estado del Profesional',
        'active': 'Activo',
        'inactive': 'Inactivo',
        
        // Servicios
        'duration': 'Duración (min)',
        'description': 'Descripción',
        'price': 'Precio',
        'newService': 'Nuevo Servicio',
        'editService': 'Editar Servicio',
        'deleteService': 'Eliminar Servicio',
        'serviceStatus': 'Estado del Servicio',
        
        // Clientes
        'photo': 'Foto',
        'birthdate': 'Fecha Nac.',
        'plan': 'Plan',
        'origin': 'Origen',
        'value': 'Valor',
        'startDate': 'Fecha Inicio',
        'city': 'Ciudad',
        'newClient': 'Nuevo Cliente',
        'editClient': 'Editar Cliente',
        'deleteClient': 'Eliminar Cliente',
        'totalpass': 'Total Pass',
        'wellhub': 'Well Hub',
        'direct': 'Directo',
        'clientStatus': 'Estado del Cliente',
        'cpf': 'CPF',
        'address': 'Dirección',
        'neighborhood': 'Barrio',
        'zipCode': 'Código Postal',
        'birthDate': 'Fecha de Nacimiento',
        'planValue': 'Valor del Plan',
        
        // Planes
        'MENSAL': 'Mensual',
        'TRIMESTRAL': 'Trimestral',
        'SEMESTRAL': 'Semestral',
        'ANUAL': 'Anual',
        'AVULSO': 'Individual',
        
        // Informes
        'reportsTitle': 'Informes y Análisis',
        'last90days': 'Últimos 90 días',
        'lastYear': 'Último año',
        'allPeriod': 'Todo el período',
        'generalReport': 'Informe General',
        'total': 'Total',
        'activeClients': 'Clientes Activos',
        'vsPreviousPeriod': 'vs período anterior',
        'appointments': 'Citas',
        'revenue': 'Ingresos',
        'attendanceRate': 'Tasa de Asistencia',
        'appointmentsEvolution': 'Evolución de Citas',
        'selectedPeriod': 'Período seleccionado',
        'distributionByOrigin': 'Distribución por Origen',
        'totalpassVsWellhub': 'Total Pass vs Well Hub vs Directo',
        'performanceByProfessional': 'Rendimiento por Profesional',
        'appointmentsPeriod': 'Citas en el período',
        'studentReport': 'Informe del Alumno',
        'downloadPDF': 'Descargar PDF',
        'attended': 'Asistió',
        'absent': 'Faltó',
        'pending': 'Pendiente',
        'cancelled': 'Cancelado',
        'confirmed': 'Confirmado',
        
        // Configuración
        'language': 'Idioma',
        'interfaceLanguage': 'Idioma de la Interfaz',
        'selectLanguage': 'Seleccione el idioma del sistema',
        'generalSettings': 'Configuración General',
        'companyName': 'Nombre de la Empresa',
        'contactEmail': 'Email de Contacto',
        'address': 'Dirección',
        'workingHours': 'Horario de Funcionamiento',
        'mondayToFriday': 'Lunes a Viernes',
        'saturday': 'Sábado',
        'sunday': 'Domingo',
        'closed': 'Cerrado',
        'notifications': 'Notificaciones',
        'confirmationEmail': 'Email de Confirmación',
        'sendConfirmationEmail': 'Enviar confirmación por email',
        'smsReminder': 'SMS Recordatorio',
        'sendReminder1h': 'Enviar recordatorio 1h antes',
        'whatsapp': 'WhatsApp',
        'whatsappNotifications': 'Notificaciones vía WhatsApp',
        'integrations': 'Integraciones',
        'syncGoogle': 'Sincronizar con Google',
        'onlinePayments': 'Pagos Online',
        'acceptPayments': 'Aceptar pagos',
        'connect': 'Conectar',
        'setup': 'Configurar',
        
        // Diseño
        'designColors': 'Diseño y Colores',
        'customizeSystemColors': 'Personalizar Colores del Sistema',
        'changeLayoutColors': 'Cambie los colores principales del diseño',
        'design': 'DISEÑO',
        'livePreview': 'Vista Previa en Tiempo Real',
        'changesAppliedInstantly': 'Los cambios se aplican instantáneamente',
        'primaryColor': 'Color Primario',
        'secondaryColor': 'Color Secundario',
        'backgroundColor': 'Color de Fondo',
        'successColor': 'Color de Éxito',
        'customizeDesign': 'Personalizar Diseño',
        'resetDefault': 'Restablecer',
        'saveDesign': 'Guardar Diseño',
        
        // WhatsApp
        'sendReminderWhatsApp': 'Enviar Recordatorio vía WhatsApp',
        'confirmAppointmentData': 'Confirme los datos de la cita',
        'whatsappNumber': 'Número de WhatsApp',
        'addCustomMessage': 'Agregar mensaje personalizado',
        'customMessage': 'Escriba su mensaje adicional...',
        'sendNow': 'Enviar Ahora',
        'selectStudentReminder': 'Seleccione el alumno para enviar recordatorio',
        
        // Días de la semana
        'monday': 'Lunes',
        'tuesday': 'Martes',
        'wednesday': 'Miércoles',
        'thursday': 'Jueves',
        'friday': 'Viernes',
        'saturday': 'Sábado',
        'sunday': 'Domingo',
        
        // Meses
        'january': 'Enero',
        'february': 'Febrero',
        'march': 'Marzo',
        'april': 'Abril',
        'may': 'Mayo',
        'june': 'Junio',
        'july': 'Julio',
        'august': 'Agosto',
        'september': 'Septiembre',
        'october': 'Octubre',
        'november': 'Noviembre',
        'december': 'Diciembre',
        
        // Estado de las citas
        'status_confirmed': 'Confirmado',
        'status_attended': 'Asistió',
        'status_pending': 'Pendiente',
        'status_absent': 'Faltó',
        'status_cancelled': 'Cancelado',
        
        // Botones y acciones
        'filter': 'Filtrar',
        'clear': 'Limpiar',
        'apply': 'Aplicar',
        'refresh': 'Actualizar',
        'export': 'Exportar',
        'import': 'Importar',
        'print': 'Imprimir',
        'view': 'Ver',
        'download': 'Descargar',
        'upload': 'Subir',
        'send': 'Enviar',
        'receive': 'Recibir',
        
        // Mensajes
        'noResults': 'No se encontraron resultados',
        'loading': 'Cargando...',
        'error': 'Error',
        'success': 'Éxito',
        'warning': 'Advertencia',
        'info': 'Información',
        'confirmDelete': '¿Está seguro que desea eliminar?',
        'confirmLogout': '¿Está seguro que desea cerrar sesión?',
        'sessionExpired': 'Sesión expirada',
        'unauthorized': 'Acceso no autorizado',
        
        // Placeholders
        'searchPlaceholder': 'Buscar...',
        'searchClientPlaceholder': 'Buscar cliente...',
        'searchProfessionalPlaceholder': 'Buscar profesional...',
        'searchServicePlaceholder': 'Buscar servicio...',
        'enterName': 'Ingrese el nombre',
        'enterEmail': 'Ingrese el email',
        'enterPhone': 'Ingrese el teléfono',
        'enterCpf': 'Ingrese el CPF',
        'enterAddress': 'Ingrese la dirección',
        'enterCity': 'Ingrese la ciudad',
        'enterZipCode': 'Ingrese el código postal',
        'enterValue': 'Ingrese el valor',
        'enterDescription': 'Ingrese la descripción',
        
        // Títulos de página
        'pageDashboard': 'Dashboard - NEXBOOK',
        'pageCalendar': 'Calendario - NEXBOOK',
        'pageProfessionals': 'Profesionales - NEXBOOK',
        'pageServices': 'Servicios - NEXBOOK',
        'pageClients': 'Clientes - NEXBOOK',
        'pageReports': 'Informes - NEXBOOK',
        'pageSettings': 'Configuración - NEXBOOK'
    }
};

// ======================================
// VARIÁVEL GLOBAL DO IDIOMA ATUAL
// ======================================
let currentLanguage = 'pt-BR';

// ======================================
// FUNÇÃO PARA ATUALIZAR OS FILTROS (TODOS PROFISSIONAIS/TODOS SERVIÇOS)
// ======================================
function updateFilterTranslations() {
    // Atualiza o texto do option "all" nos selects de filtro
    const professionalFilter = document.getElementById('professionalFilter');
    const serviceFilter = document.getElementById('serviceFilter');
    
    if (professionalFilter && professionalFilter.options[0]) {
        const translation = translations[currentLanguage]?.allProfessionals;
        if (translation) {
            professionalFilter.options[0].textContent = translation;
        }
    }
    
    if (serviceFilter && serviceFilter.options[0]) {
        const translation = translations[currentLanguage]?.allServices;
        if (translation) {
            serviceFilter.options[0].textContent = translation;
        }
    }
}

// ======================================
// FUNÇÃO PRINCIPAL DE MUDANÇA DE IDIOMA
// ======================================
function changeLanguage(lang) {
    // Verifica se o idioma existe
    if (!translations[lang]) {
        console.error(`Idioma não suportado: ${lang}`);
        return;
    }
    
    // Salva a preferência
    currentLanguage = lang;
    document.documentElement.lang = lang;
    localStorage.setItem('language', lang);
    
    // Atualiza TODOS os elementos com data-i18n
    updateAllTranslations(lang);
    
    // Atualiza placeholders
    updateAllPlaceholders(lang);
    
    // Atualiza títulos de páginas
    updatePageTitles(lang);
    
    // Atualiza textos de elementos específicos que podem não ter data-i18n
    updateSpecificElements(lang);
    
    // ATUALIZA OS FILTROS (TODOS PROFISSIONAIS/TODOS SERVIÇOS)
    updateFilterTranslations();
    
    // Recarrega os filtros para garantir que os selects tenham os textos atualizados
    if (typeof loadFilters === 'function') {
        loadFilters();
    }
    
    // Dispara evento personalizado para componentes que precisam ser atualizados
    window.dispatchEvent(new CustomEvent('languageChanged', { detail: { language: lang } }));
    
    console.log(`🌍 Idioma alterado para: ${lang}`);
}

// ======================================
// ATUALIZA TODOS OS TEXTOS
// ======================================
function updateAllTranslations(lang) {
    document.querySelectorAll('[data-i18n]').forEach(element => {
        const key = element.getAttribute('data-i18n');
        const translation = translations[lang]?.[key];
        
        if (translation) {
            // Verifica se o elemento tem filhos (como ícones)
            if (element.children.length > 0) {
                // Preserva os ícones, atualiza apenas o texto
                let hasTextNode = false;
                element.childNodes.forEach(node => {
                    if (node.nodeType === Node.TEXT_NODE && node.textContent.trim() !== '') {
                        node.textContent = translation;
                        hasTextNode = true;
                    }
                });
                
                // Se não encontrou nó de texto, adiciona o texto após os ícones
                if (!hasTextNode) {
                    element.appendChild(document.createTextNode(' ' + translation));
                }
            } else {
                element.textContent = translation;
            }
        }
    });
}

// ======================================
// ATUALIZA TODOS OS PLACEHOLDERS
// ======================================
function updateAllPlaceholders(lang) {
    document.querySelectorAll('[data-i18n-placeholder]').forEach(element => {
        const key = element.getAttribute('data-i18n-placeholder');
        const translation = translations[lang]?.[key];
        
        if (translation) {
            element.placeholder = translation;
        }
    });
}

// ======================================
// ATUALIZA TÍTULOS DE PÁGINAS
// ======================================
function updatePageTitles(lang) {
    // Atualiza título da aba do navegador baseado na página atual
    const currentPath = window.location.pathname.split('/').pop() || 'dashboard.html';
    let pageKey = 'pageDashboard';
    
    if (currentPath.includes('calendar')) pageKey = 'pageCalendar';
    else if (currentPath.includes('professionals')) pageKey = 'pageProfessionals';
    else if (currentPath.includes('services')) pageKey = 'pageServices';
    else if (currentPath.includes('clients')) pageKey = 'pageClients';
    else if (currentPath.includes('reports')) pageKey = 'pageReports';
    else if (currentPath.includes('settings')) pageKey = 'pageSettings';
    
    const translation = translations[lang]?.[pageKey];
    if (translation) {
        document.title = translation;
    }
}

// ======================================
// ATUALIZA ELEMENTOS ESPECÍFICOS SEM DATA-I18N
// ======================================
function updateSpecificElements(lang) {
    // Atualiza placeholders de busca que podem não ter o atributo
    const searchInputs = document.querySelectorAll('input[type="text"][placeholder*="Buscar"], input[type="search"]');
    searchInputs.forEach(input => {
        if (input.placeholder.includes('Buscar')) {
            input.placeholder = translations[lang]?.searchPlaceholder || 'Buscar...';
        } else if (input.placeholder.includes('Search')) {
            input.placeholder = translations[lang]?.searchPlaceholder || 'Search...';
        } else if (input.placeholder.includes('Buscar')) {
            input.placeholder = translations[lang]?.searchPlaceholder || 'Buscar...';
        }
    });
    
    // Atualiza títulos de seções em tabelas
    updateTableHeaders(lang);
}

// ======================================
// ATUALIZA CABEÇALHOS DE TABELAS
// ======================================
function updateTableHeaders(lang) {
    // Mapeamento de textos em português para chaves de tradução
    const headerMap = {
        'Nome': 'name',
        'Especialidade': 'specialty',
        'Email': 'email',
        'Telefone': 'phone',
        'Status': 'status',
        'Ações': 'actions',
        'Duração': 'duration',
        'Descrição': 'description',
        'Preço': 'price',
        'Foto': 'photo',
        'Data Nasc.': 'birthdate',
        'CPF': 'cpf',
        'Plano': 'plan',
        'Origem': 'origin',
        'Valor': 'value',
        'Data Início': 'startDate',
        'Cidade': 'city',
        'Agendamentos': 'appointments',
        'Comparecimentos': 'attended',
        'Faltas': 'absent',
        'Taxa': 'attendanceRate',
        'Receita': 'revenue'
    };
    
    document.querySelectorAll('th').forEach(th => {
        const text = th.textContent.trim();
        if (headerMap[text]) {
            const translation = translations[lang]?.[headerMap[text]];
            if (translation) {
                th.textContent = translation;
            }
        }
    });
}

// ======================================
// FUNÇÃO PARA OBTER TEXTO TRADUZIDO
// ======================================
function t(key, lang = currentLanguage) {
    return translations[lang]?.[key] || key;
}

// ======================================
// FUNÇÃO PARA ATUALIZAR TRADUÇÃO ESPECÍFICA
// ======================================
function updateTranslation(key, lang = currentLanguage) {
    const elements = document.querySelectorAll(`[data-i18n="${key}"]`);
    const translation = translations[lang]?.[key];
    
    elements.forEach(el => {
        if (translation) {
            if (el.children.length > 0) {
                let hasTextNode = false;
                el.childNodes.forEach(node => {
                    if (node.nodeType === Node.TEXT_NODE && node.textContent.trim() !== '') {
                        node.textContent = translation;
                        hasTextNode = true;
                    }
                });
                if (!hasTextNode) {
                    el.appendChild(document.createTextNode(' ' + translation));
                }
            } else {
                el.textContent = translation;
            }
        }
    });
}

// ======================================
// FUNÇÃO PARA ATUALIZAR ELEMENTOS GERADOS DINAMICAMENTE
// ======================================
function applyTranslationsToDynamicContent(container, lang = currentLanguage) {
    if (!container) return;
    
    container.querySelectorAll('[data-i18n]').forEach(element => {
        const key = element.getAttribute('data-i18n');
        const translation = translations[lang]?.[key];
        
        if (translation) {
            if (element.children.length > 0) {
                let hasTextNode = false;
                element.childNodes.forEach(node => {
                    if (node.nodeType === Node.TEXT_NODE && node.textContent.trim() !== '') {
                        node.textContent = translation;
                        hasTextNode = true;
                    }
                });
                if (!hasTextNode) {
                    element.appendChild(document.createTextNode(' ' + translation));
                }
            } else {
                element.textContent = translation;
            }
        }
    });
    
    container.querySelectorAll('[data-i18n-placeholder]').forEach(element => {
        const key = element.getAttribute('data-i18n-placeholder');
        const translation = translations[lang]?.[key];
        if (translation) {
            element.placeholder = translation;
        }
    });
}

// ======================================
// FUNÇÃO PARA FORÇAR ATUALIZAÇÃO DE TODA A INTERFACE
// ======================================
function forceRefreshUI() {
    // Força a atualização de todos os elementos com data-i18n
    updateAllTranslations(currentLanguage);
    updateAllPlaceholders(currentLanguage);
    updatePageTitles(currentLanguage);
    updateSpecificElements(currentLanguage);
    
    // Atualiza os filtros
    updateFilterTranslations();
    
    // Se existirem tabelas com dados dinâmicos, recarregar
    if (typeof loadAllData === 'function') {
        loadAllData();
    }
}

// ======================================
// INICIALIZAÇÃO AO CARREGAR A PÁGINA
// ======================================
document.addEventListener('DOMContentLoaded', function() {
    // Carrega idioma salvo ou padrão
    const savedLang = localStorage.getItem('language');
    currentLanguage = (savedLang && translations[savedLang]) ? savedLang : 'pt-BR';
    
    // Configura o select de idioma
    const languageSelect = document.getElementById('languageSelect');
    if (languageSelect) {
        languageSelect.value = currentLanguage;
        changeLanguage(currentLanguage);
        
        // Listener para mudança de idioma
        languageSelect.addEventListener('change', function(e) {
            changeLanguage(e.target.value);
        });
    } else {
        // Se não tem select, ainda assim aplica o idioma salvo
        changeLanguage(currentLanguage);
    }
    
    // Observa mudanças no DOM para traduzir conteúdo dinâmico
    const observer = new MutationObserver(function(mutations) {
        mutations.forEach(function(mutation) {
            mutation.addedNodes.forEach(function(node) {
                if (node.nodeType === 1) { // Element node
                    applyTranslationsToDynamicContent(node, currentLanguage);
                }
            });
        });
    });
    
    observer.observe(document.body, {
        childList: true,
        subtree: true
    });
    
    // Força atualização inicial após um pequeno delay para garantir que tudo carregou
    setTimeout(() => {
        forceRefreshUI();
    }, 500);
});

// ======================================
// EXPÕE FUNÇÕES GLOBALMENTE
// ======================================
window.changeLanguage = changeLanguage;
window.t = t;
window.updateTranslation = updateTranslation;
window.applyTranslationsToDynamicContent = applyTranslationsToDynamicContent;
window.forceRefreshUI = forceRefreshUI;
window.updateFilterTranslations = updateFilterTranslations;
window.currentLanguage = currentLanguage;