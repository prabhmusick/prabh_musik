const { buildCheckoutSessionParams } = require('./checkoutSession');

describe('buildCheckoutSessionParams', () => {
  it('builds Razorpay order options for INR purchases', () => {
    const params = buildCheckoutSessionParams({
      amount: 1000,
      currency: 'INR',
      email: 'user@example.com',
      beats: [{ id: 1, title: 'Demo Beat', price: 1000 }],
      successUrl: 'http://localhost/profile?payment=success',
      cancelUrl: 'http://localhost/checkout',
    });

    expect(params.amount).toBe(1000);
    expect(params.currency).toBe('INR');
    expect(params.receipt).toMatch(/^prabh-musik-/);
    expect(params.notes).toMatchObject({ email: 'user@example.com' });
  });
});
