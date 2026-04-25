// api/webhook/whatsapp.js
const twilio = require('twilio');

export default async function handler(req, res) {
    if (req.method !== 'POST') {
        return res.status(405).end();
    }
    
    const { Body, From, ProfileName } = req.body;
    
    console.log(`📩 Mensagem de ${ProfileName} (${From}): ${Body}`);
    
    // Criar resposta TwiML
    const twiml = new twilio.twiml.MessagingResponse();
    
    const resposta = Body.toLowerCase().trim();
    
    if (resposta.includes('confirmar')) {
        twiml.message('✅ Agendamento confirmado! Te esperamos.');
        
        // Atualizar status no banco
        await db.collection('appointments')
            .where('clientPhone', '==', From.replace('whatsapp:', ''))
            .where('date', '>=', new Date().toISOString().split('T')[0])
            .get()
            .then(snapshot => {
                snapshot.forEach(doc => {
                    doc.ref.update({ status: 'confirmed' });
                });
            });
            
    } else if (resposta.includes('cancelar')) {
        twiml.message('❌ Agendamento cancelado. Fale conosco para remaracar.');
        
        await db.collection('appointments')
            .where('clientPhone', '==', From.replace('whatsapp:', ''))
            .where('date', '>=', new Date().toISOString().split('T')[0])
            .get()
            .then(snapshot => {
                snapshot.forEach(doc => {
                    doc.ref.update({ status: 'cancelled' });
                });
            });
            
    } else {
        twiml.message('Olá! Responda CONFIRMAR ou CANCELAR para gerenciar seu agendamento.');
    }
    
    // Configurar o response para o Twilio
    res.setHeader('Content-Type', 'text/xml');
    res.status(200).send(twiml.toString());
}