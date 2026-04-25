// api/webhook-mercadopago.js
import admin from 'firebase-admin';

export default async function handler(req, res) {
    if (req.method !== 'POST') {
        return res.status(405).end();
    }

    const { type, data } = req.body;

    if (type === 'payment') {
        const paymentId = data.id;
        
        // Buscar detalhes do pagamento
        const payment = await mercadopago.payment.findById(paymentId);
        
        if (payment.body.status === 'approved') {
            const userId = payment.body.external_reference;
            const plano = payment.body.additional_info.items[0].title;
            
            // Atualizar no Firebase
            const db = admin.firestore();
            await db.collection('users').doc(userId).update({
                plano: plano,
                status: 'active',
                dataExpiracao: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
                paymentId: paymentId
            });
        }
    }

    res.status(200).end();
}