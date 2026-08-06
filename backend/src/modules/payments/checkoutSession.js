function buildCheckoutSessionParams({ amount, currency, email, beats, successUrl, cancelUrl }) {
  const receipt = `prabh-musik-${Date.now()}`;

  return {
    amount: Math.max(1, Math.round(amount || 0)),
    currency: (currency || 'INR').toUpperCase(),
    receipt,
    notes: {
      email,
      beats: JSON.stringify(beats || []),
      successUrl,
      cancelUrl,
    },
  };
}

module.exports = { buildCheckoutSessionParams };
