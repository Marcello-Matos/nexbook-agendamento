// firestore-operations.js
// Funções para operações com o Firestore

const FirebaseOperations = {
    // ============================================
    // CRIAR DADOS INICIAIS
    // ============================================
    async setupInitialData() {
        if (!db) {
            throw new Error('Firestore não inicializado');
        }
        if (!currentUser) {
            throw new Error('Usuário não logado');
        }

        const batch = db.batch();
        const userId = currentUser.uid;

        // 1. CRIAR SERVIÇOS
        const services = [
            {
                name: 'Limpeza de Pele',
                description: 'Limpeza profunda com extração e máscara',
                duration: 60,
                price: 150.00,
                category: 'Estética',
                commission: 40,
                active: true,
                color: '#7c3aed',
                userId: userId
            },
            {
                name: 'Massagem Relaxante',
                description: 'Massagem corporal completa com óleos essenciais',
                duration: 90,
                price: 200.00,
                category: 'Bem-estar',
                commission: 45,
                active: true,
                color: '#c026d3',
                userId: userId
            },
            {
                name: 'Design de Sobrancelhas',
                description: 'Design personalizado com henna',
                duration: 30,
                price: 80.00,
                category: 'Estética',
                commission: 35,
                active: true,
                color: '#10b981',
                userId: userId
            },
            {
                name: 'Corte de Cabelo',
                description: 'Corte moderno com finalização',
                duration: 45,
                price: 120.00,
                category: 'Cabelo',
                commission: 40,
                active: true,
                color: '#f59e0b',
                userId: userId
            }
        ];

        services.forEach(service => {
            const ref = db.collection('services').doc();
            batch.set(ref, {
                ...service,
                createdAt: firebase.firestore.FieldValue.serverTimestamp(),
                updatedAt: firebase.firestore.FieldValue.serverTimestamp()
            });
        });

        // 2. CRIAR PROFISSIONAIS
        const professionals = [
            {
                name: 'Ana Oliveira',
                email: 'ana.oliveira@nexbook.com',
                phone: '(11) 98765-4321',
                specialty: 'Esteticista',
                bio: 'Especialista em limpeza de pele e tratamentos faciais',
                avatar: 'AO',
                commission: 40,
                active: true,
                rating: 4.8,
                totalAppointments: 0,
                userId: userId,
                workSchedule: {
                    monday: [{ start: '09:00', end: '18:00' }],
                    tuesday: [{ start: '09:00', end: '18:00' }],
                    wednesday: [{ start: '09:00', end: '18:00' }],
                    thursday: [{ start: '09:00', end: '18:00' }],
                    friday: [{ start: '09:00', end: '18:00' }],
                    saturday: [{ start: '09:00', end: '13:00' }],
                    sunday: []
                }
            },
            {
                name: 'Carlos Santos',
                email: 'carlos.santos@nexbook.com',
                phone: '(11) 97654-3210',
                specialty: 'Massoterapeuta',
                bio: 'Especialista em massagens terapêuticas e relaxantes',
                avatar: 'CS',
                commission: 45,
                active: true,
                rating: 4.9,
                totalAppointments: 0,
                userId: userId,
                workSchedule: {
                    monday: [{ start: '10:00', end: '20:00' }],
                    tuesday: [{ start: '10:00', end: '20:00' }],
                    wednesday: [{ start: '10:00', end: '20:00' }],
                    thursday: [{ start: '10:00', end: '20:00' }],
                    friday: [{ start: '10:00', end: '20:00' }],
                    saturday: [{ start: '10:00', end: '16:00' }],
                    sunday: []
                }
            },
            {
                name: 'Mariana Costa',
                email: 'mariana.costa@nexbook.com',
                phone: '(11) 96543-2109',
                specialty: 'Designer de Sobrancelhas',
                bio: 'Especialista em design de sobrancelhas e henna',
                avatar: 'MC',
                commission: 35,
                active: true,
                rating: 4.7,
                totalAppointments: 0,
                userId: userId,
                workSchedule: {
                    monday: [{ start: '09:00', end: '18:00' }],
                    tuesday: [{ start: '09:00', end: '18:00' }],
                    wednesday: [{ start: '09:00', end: '18:00' }],
                    thursday: [{ start: '09:00', end: '18:00' }],
                    friday: [{ start: '09:00', end: '18:00' }],
                    saturday: [{ start: '09:00', end: '13:00' }],
                    sunday: []
                }
            }
        ];

        professionals.forEach(prof => {
            const ref = db.collection('professionals').doc();
            batch.set(ref, {
                ...prof,
                createdAt: firebase.firestore.FieldValue.serverTimestamp(),
                updatedAt: firebase.firestore.FieldValue.serverTimestamp()
            });
        });

        // 3. CRIAR CLIENTES EXEMPLO
        const clients = [
            {
                name: 'João Silva',
                email: 'joao.silva@email.com',
                phone: '(11) 95555-1234',
                birthDate: '1990-05-15',
                status: 'active',
                totalVisits: 0,
                totalSpent: 0,
                userId: userId
            },
            {
                name: 'Maria Souza',
                email: 'maria.souza@email.com',
                phone: '(11) 94444-5678',
                birthDate: '1985-08-22',
                status: 'active',
                totalVisits: 0,
                totalSpent: 0,
                userId: userId
            },
            {
                name: 'Pedro Santos',
                email: 'pedro.santos@email.com',
                phone: '(11) 93333-9012',
                birthDate: '1988-12-10',
                status: 'active',
                totalVisits: 0,
                totalSpent: 0,
                userId: userId
            },
            {
                name: 'Ana Paula Lima',
                email: 'ana.lima@email.com',
                phone: '(11) 92222-3456',
                birthDate: '1992-03-18',
                status: 'active',
                totalVisits: 0,
                totalSpent: 0,
                userId: userId
            }
        ];

        clients.forEach(client => {
            const ref = db.collection('clients').doc();
            batch.set(ref, {
                ...client,
                createdAt: firebase.firestore.FieldValue.serverTimestamp(),
                updatedAt: firebase.firestore.FieldValue.serverTimestamp()
            });
        });

        // 4. CRIAR ALGUNS AGENDAMENTOS DE EXEMPLO
        const today = new Date();
        const tomorrow = new Date(today);
        tomorrow.setDate(tomorrow.getDate() + 1);
        const nextWeek = new Date(today);
        nextWeek.setDate(nextWeek.getDate() + 7);

        const appointments = [
            {
                date: today.toISOString().split('T')[0],
                time: '09:00',
                clientName: 'João Silva',
                serviceName: 'Limpeza de Pele',
                professionalName: 'Ana Oliveira',
                duration: 60,
                status: 'confirmed',
                paymentStatus: 'paid',
                amount: 150.00,
                userId: userId
            },
            {
                date: today.toISOString().split('T')[0],
                time: '14:00',
                clientName: 'Maria Souza',
                serviceName: 'Massagem Relaxante',
                professionalName: 'Carlos Santos',
                duration: 90,
                status: 'confirmed',
                paymentStatus: 'pending',
                amount: 200.00,
                userId: userId
            },
            {
                date: today.toISOString().split('T')[0],
                time: '16:30',
                clientName: 'Pedro Santos',
                serviceName: 'Corte de Cabelo',
                professionalName: 'Ana Oliveira',
                duration: 45,
                status: 'pending',
                paymentStatus: 'pending',
                amount: 120.00,
                userId: userId
            },
            {
                date: tomorrow.toISOString().split('T')[0],
                time: '10:30',
                clientName: 'Ana Paula Lima',
                serviceName: 'Design de Sobrancelhas',
                professionalName: 'Mariana Costa',
                duration: 30,
                status: 'confirmed',
                paymentStatus: 'pending',
                amount: 80.00,
                userId: userId
            },
            {
                date: nextWeek.toISOString().split('T')[0],
                time: '15:00',
                clientName: 'João Silva',
                serviceName: 'Massagem Relaxante',
                professionalName: 'Carlos Santos',
                duration: 90,
                status: 'pending',
                paymentStatus: 'pending',
                amount: 200.00,
                userId: userId
            }
        ];

        appointments.forEach(app => {
            const ref = db.collection('appointments').doc();
            batch.set(ref, {
                ...app,
                createdAt: firebase.firestore.FieldValue.serverTimestamp(),
                updatedAt: firebase.firestore.FieldValue.serverTimestamp()
            });
        });

        // Executar todas as operações
        await batch.commit();
        console.log('✅ Dados iniciais criados com sucesso!');
        return true;
    },

    // ============================================
    // CRIAR AGENDAMENTO
    // ============================================
    async createAppointment(appointmentData) {
        if (!currentUser) throw new Error('Usuário não logado');
        
        const appointment = {
            ...appointmentData,
            userId: currentUser.uid,
            status: appointmentData.status || 'pending',
            paymentStatus: appointmentData.paymentStatus || 'pending',
            createdAt: firebase.firestore.FieldValue.serverTimestamp(),
            updatedAt: firebase.firestore.FieldValue.serverTimestamp()
        };

        try {
            const docRef = await db.collection('appointments').add(appointment);
            console.log('✅ Agendamento criado:', docRef.id);
            return docRef.id;
        } catch (error) {
            console.error('❌ Erro ao criar agendamento:', error);
            throw error;
        }
    },

    // ============================================
    // CRIAR PROFISSIONAL
    // ============================================
    async createProfessional(professionalData) {
        if (!currentUser) throw new Error('Usuário não logado');
        
        const professional = {
            ...professionalData,
            userId: currentUser.uid,
            active: true,
            totalAppointments: 0,
            rating: 0,
            createdAt: firebase.firestore.FieldValue.serverTimestamp(),
            updatedAt: firebase.firestore.FieldValue.serverTimestamp()
        };

        try {
            const docRef = await db.collection('professionals').add(professional);
            return docRef.id;
        } catch (error) {
            console.error('❌ Erro ao criar profissional:', error);
            throw error;
        }
    },

    // ============================================
    // CRIAR SERVIÇO
    // ============================================
    async createService(serviceData) {
        if (!currentUser) throw new Error('Usuário não logado');
        
        const service = {
            ...serviceData,
            userId: currentUser.uid,
            active: true,
            createdAt: firebase.firestore.FieldValue.serverTimestamp(),
            updatedAt: firebase.firestore.FieldValue.serverTimestamp()
        };

        try {
            const docRef = await db.collection('services').add(service);
            return docRef.id;
        } catch (error) {
            console.error('❌ Erro ao criar serviço:', error);
            throw error;
        }
    },

    // ============================================
    // CRIAR CLIENTE
    // ============================================
    async createClient(clientData) {
        if (!currentUser) throw new Error('Usuário não logado');
        
        const client = {
            ...clientData,
            userId: currentUser.uid,
            status: 'active',
            totalVisits: 0,
            totalSpent: 0,
            createdAt: firebase.firestore.FieldValue.serverTimestamp(),
            updatedAt: firebase.firestore.FieldValue.serverTimestamp()
        };

        try {
            const docRef = await db.collection('clients').add(client);
            return docRef.id;
        } catch (error) {
            console.error('❌ Erro ao criar cliente:', error);
            throw error;
        }
    },

    // ============================================
    // BUSCAR DADOS DO DASHBOARD
    // ============================================
    async getDashboardData(period = 30) {
        if (!currentUser) throw new Error('Usuário não logado');
        
        try {
            // Calcular datas
            const today = new Date();
            const pastDate = new Date();
            pastDate.setDate(pastDate.getDate() - period);
            
            const startDate = pastDate.toISOString().split('T')[0];
            const endDate = today.toISOString().split('T')[0];

            // Buscar agendamentos do período
            const appointmentsSnapshot = await db.collection('appointments')
                .where('userId', '==', currentUser.uid)
                .where('date', '>=', startDate)
                .where('date', '<=', endDate)
                .orderBy('date', 'asc')
                .orderBy('time', 'asc')
                .get();

            const appointments = [];
            let totalRevenue = 0;
            let totalConfirmed = 0;
            let totalCancelled = 0;
            let totalPending = 0;

            appointmentsSnapshot.forEach(doc => {
                const data = doc.data();
                appointments.push({ id: doc.id, ...data });
                
                if (data.paymentStatus === 'paid') {
                    totalRevenue += data.amount || 0;
                }

                // Contar por status
                if (data.status === 'confirmed') totalConfirmed++;
                else if (data.status === 'cancelled') totalCancelled++;
                else if (data.status === 'pending') totalPending++;
            });

            // Buscar profissionais
            const professionalsSnapshot = await db.collection('professionals')
                .where('userId', '==', currentUser.uid)
                .where('active', '==', true)
                .get();
            
            const professionals = [];
            professionalsSnapshot.forEach(doc => {
                professionals.push({ id: doc.id, ...doc.data() });
            });

            // Buscar serviços
            const servicesSnapshot = await db.collection('services')
                .where('userId', '==', currentUser.uid)
                .where('active', '==', true)
                .get();
            
            const services = [];
            servicesSnapshot.forEach(doc => {
                services.push({ id: doc.id, ...doc.data() });
            });

            // Buscar clientes
            const clientsSnapshot = await db.collection('clients')
                .where('userId', '==', currentUser.uid)
                .where('status', '==', 'active')
                .get();
            
            const clients = [];
            clientsSnapshot.forEach(doc => {
                clients.push({ id: doc.id, ...doc.data() });
            });

            // Agendamentos de hoje
            const todayStr = today.toISOString().split('T')[0];
            const todayAppointments = appointments.filter(a => a.date === todayStr);

            return {
                appointments,
                totalRevenue,
                totalAppointments: appointments.length,
                totalConfirmed,
                totalCancelled,
                totalPending,
                professionals,
                services,
                clients,
                todayAppointments: todayAppointments.length,
                todayRevenue: todayAppointments
                    .filter(a => a.paymentStatus === 'paid')
                    .reduce((acc, a) => acc + (a.amount || 0), 0)
            };
        } catch (error) {
            console.error('❌ Erro ao buscar dados:', error);
            return null;
        }
    },

    // ============================================
    // BUSCAR TODOS OS PROFISSIONAIS
    // ============================================
    async getProfessionals() {
        if (!currentUser) throw new Error('Usuário não logado');
        
        try {
            const snapshot = await db.collection('professionals')
                .where('userId', '==', currentUser.uid)
                .orderBy('name')
                .get();
            
            const professionals = [];
            snapshot.forEach(doc => {
                professionals.push({ id: doc.id, ...doc.data() });
            });
            
            return professionals;
        } catch (error) {
            console.error('❌ Erro ao buscar profissionais:', error);
            return [];
        }
    },

    // ============================================
    // BUSCAR TODOS OS SERVIÇOS
    // ============================================
    async getServices() {
        if (!currentUser) throw new Error('Usuário não logado');
        
        try {
            const snapshot = await db.collection('services')
                .where('userId', '==', currentUser.uid)
                .orderBy('name')
                .get();
            
            const services = [];
            snapshot.forEach(doc => {
                services.push({ id: doc.id, ...doc.data() });
            });
            
            return services;
        } catch (error) {
            console.error('❌ Erro ao buscar serviços:', error);
            return [];
        }
    },

    // ============================================
    // BUSCAR TODOS OS CLIENTES
    // ============================================
    async getClients() {
        if (!currentUser) throw new Error('Usuário não logado');
        
        try {
            const snapshot = await db.collection('clients')
                .where('userId', '==', currentUser.uid)
                .orderBy('name')
                .get();
            
            const clients = [];
            snapshot.forEach(doc => {
                clients.push({ id: doc.id, ...doc.data() });
            });
            
            return clients;
        } catch (error) {
            console.error('❌ Erro ao buscar clientes:', error);
            return [];
        }
    },

    // ============================================
    // BUSCAR AGENDAMENTOS POR DATA
    // ============================================
    async getAppointmentsByDate(startDate, endDate) {
        if (!currentUser) throw new Error('Usuário não logado');
        
        try {
            let query = db.collection('appointments')
                .where('userId', '==', currentUser.uid);
            
            if (startDate) {
                query = query.where('date', '>=', startDate);
            }
            if (endDate) {
                query = query.where('date', '<=', endDate);
            }
            
            const snapshot = await query
                .orderBy('date', 'asc')
                .orderBy('time', 'asc')
                .get();
            
            const appointments = [];
            snapshot.forEach(doc => {
                appointments.push({ id: doc.id, ...doc.data() });
            });
            
            return appointments;
        } catch (error) {
            console.error('❌ Erro ao buscar agendamentos:', error);
            return [];
        }
    },

    // ============================================
    // ATUALIZAR STATUS DO AGENDAMENTO
    // ============================================
    async updateAppointmentStatus(appointmentId, status, paymentStatus = null) {
        if (!currentUser) throw new Error('Usuário não logado');
        
        try {
            const updateData = {
                status: status,
                updatedAt: firebase.firestore.FieldValue.serverTimestamp()
            };
            
            if (paymentStatus) {
                updateData.paymentStatus = paymentStatus;
            }
            
            await db.collection('appointments').doc(appointmentId).update(updateData);
            return true;
        } catch (error) {
            console.error('❌ Erro ao atualizar status:', error);
            throw error;
        }
    },

    // ============================================
    // ATUALIZAR PROFISSIONAL
    // ============================================
    async updateProfessional(professionalId, data) {
        if (!currentUser) throw new Error('Usuário não logado');
        
        try {
            await db.collection('professionals').doc(professionalId).update({
                ...data,
                updatedAt: firebase.firestore.FieldValue.serverTimestamp()
            });
            return true;
        } catch (error) {
            console.error('❌ Erro ao atualizar profissional:', error);
            throw error;
        }
    },

    // ============================================
    // ATUALIZAR SERVIÇO
    // ============================================
    async updateService(serviceId, data) {
        if (!currentUser) throw new Error('Usuário não logado');
        
        try {
            await db.collection('services').doc(serviceId).update({
                ...data,
                updatedAt: firebase.firestore.FieldValue.serverTimestamp()
            });
            return true;
        } catch (error) {
            console.error('❌ Erro ao atualizar serviço:', error);
            throw error;
        }
    },

    // ============================================
    // ATUALIZAR CLIENTE
    // ============================================
    async updateClient(clientId, data) {
        if (!currentUser) throw new Error('Usuário não logado');
        
        try {
            await db.collection('clients').doc(clientId).update({
                ...data,
                updatedAt: firebase.firestore.FieldValue.serverTimestamp()
            });
            return true;
        } catch (error) {
            console.error('❌ Erro ao atualizar cliente:', error);
            throw error;
        }
    },

    // ============================================
    // DELETAR (INATIVAR) PROFISSIONAL
    // ============================================
    async deactivateProfessional(professionalId) {
        if (!currentUser) throw new Error('Usuário não logado');
        
        try {
            await db.collection('professionals').doc(professionalId).update({
                active: false,
                updatedAt: firebase.firestore.FieldValue.serverTimestamp()
            });
            return true;
        } catch (error) {
            console.error('❌ Erro ao inativar profissional:', error);
            throw error;
        }
    },

    // ============================================
    // DELETAR (INATIVAR) SERVIÇO
    // ============================================
    async deactivateService(serviceId) {
        if (!currentUser) throw new Error('Usuário não logado');
        
        try {
            await db.collection('services').doc(serviceId).update({
                active: false,
                updatedAt: firebase.firestore.FieldValue.serverTimestamp()
            });
            return true;
        } catch (error) {
            console.error('❌ Erro ao inativar serviço:', error);
            throw error;
        }
    }
};