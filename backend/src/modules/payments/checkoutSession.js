function buildCheckoutSessionParams({ amount, currency, email, beats, successUrl, cancelUrl }) {
  return {
    mode: 'payment',
    payment_method_types: ['card', 'upi'],
    line_items: [
      {
        price_data: {
          currency: currency.toUpperCase(),
          product_data: {
            name: 'Prabh Musik Beat Purchase',
            description: beats?.length ? `${beats.length} beat(s)` : 'Beat purchase',
          },
          unit_amount: amount,
        },
        quantity: 1,
      },
    ],
    customer_email: email,
    success_url: successUrl,
    cancel_url: cancelUrl,
    metadata: {
      email,
      beats: JSON.stringify(beats || []),
    },
  };
}

module.exports = { buildCheckoutSessionParams };
