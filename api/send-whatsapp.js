// api/send-whatsapp.js
const twilio = require('twilio');

module.exports = async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Metodo nao permitido' });
  }

  try {
    const { to, date, time } = req.body || {};

    const client = twilio(
      process.env.TWILIO_ACCOUNT_SID,
      process.env.TWILIO_AUTH_TOKEN
    );

    const message = await client.messages.create({
      from: `whatsapp:${process.env.TWILIO_WHATSAPP_NUMBER}`,
      to: `whatsapp:${to}`,
      contentSid: process.env.TEMPLATE_APPOINTMENT_REMINDER,
      contentVariables: JSON.stringify({ 1: date, 2: time })
    });

    return res.status(200).json({ success: true, sid: message.sid });
  } catch (error) {
    console.error('Erro ao enviar WhatsApp:', error);
    return res.status(500).json({ error: error.message || 'Erro interno' });
  }
};