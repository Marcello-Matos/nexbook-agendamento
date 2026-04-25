// api/criar-pagamento.js
const mercadopago = require('mercadopago');

mercadopago.configure({
  access_token: process.env.MERCADO_PAGO_ACCESS_TOKEN
});

module.exports = async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Metodo nao permitido' });
  }

  const { plano, userId, email } = req.body || {};

  const precos = {
    basico: 29,
    profissional: 59,
    premium: 99
  };

  if (!plano || !precos[plano]) {
    return res.status(400).json({ error: 'Plano invalido' });
  }

  try {
    const preference = {
      items: [
        {
          title: `Plano ${plano.charAt(0).toUpperCase() + plano.slice(1)} - NEXBOOK`,
          quantity: 1,
          currency_id: 'BRL',
          unit_price: precos[plano]
        }
      ],
      payer: { email: email || '' },
      back_urls: {
        success: 'https://seusite.com/pagamento-sucesso.html',
        failure: 'https://seusite.com/pagamento-falha.html',
        pending: 'https://seusite.com/pagamento-pendente.html'
      },
      auto_return: 'approved',
      external_reference: userId || '',
      notification_url: 'https://seusite.com/api/webhook-mercadopago'
    };

    const response = await mercadopago.preferences.create(preference);

    return res.status(200).json({
      init_point: response.body.init_point,
      preference_id: response.body.id
    });
  } catch (error) {
    console.error('Erro ao criar pagamento:', error);
    return res.status(500).json({ error: error.message || 'Erro interno' });
  }
};