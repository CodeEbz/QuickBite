const axios = require('axios');
const config = require('../config');
const { httpError } = require('../utils/respond');

async function initializePayment(email, amount, callbackUrl) {
  if (!config.paystackSecretKey) {
    return {
      authorizationUrl: callbackUrl || config.appBaseUrl,
      reference: `dev-${Date.now()}`,
      accessCode: 'dev-mode'
    };
  }

  const response = await axios.post(`${config.paystackBaseUrl}/transaction/initialize`, {
    email,
    amount: Math.round(Number(amount) * 100),
    currency: config.paystackCurrency,
    callback_url: callbackUrl || config.appBaseUrl
  }, {
    headers: { Authorization: `Bearer ${config.paystackSecretKey}` }
  });

  return {
    authorizationUrl: response.data.data.authorization_url,
    reference: response.data.data.reference,
    accessCode: response.data.data.access_code
  };
}

async function verifyPayment(reference) {
  if (!reference) throw httpError('Payment reference is required.');
  if (!config.paystackSecretKey && reference.startsWith('dev-')) {
    return { successful: true, reference, status: 'success', amount: null };
  }

  const response = await axios.get(`${config.paystackBaseUrl}/transaction/verify/${encodeURIComponent(reference)}`, {
    headers: { Authorization: `Bearer ${config.paystackSecretKey}` }
  });
  const data = response.data.data;
  return {
    successful: data.status === 'success',
    reference: data.reference,
    status: data.status,
    amount: data.amount
  };
}

module.exports = { initializePayment, verifyPayment };
