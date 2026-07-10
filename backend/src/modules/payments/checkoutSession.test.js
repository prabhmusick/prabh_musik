const { buildCheckoutSessionParams } = require('./checkoutSession');

describe('buildCheckoutSessionParams', () => {
  it('includes Stripe-supported payment methods such as card and UPI', () => {
    const params = buildCheckoutSessionParams({
      amount: 1000,
      currency: 'INR',
      email: 'user@example.com',
      beats: [{ id: 1, title: 'Demo Beat', price: 1000 }],
      successUrl: 'http://localhost/profile?payment=success',
      cancelUrl: 'http://localhost/checkout',
    });

    expect(params.mode).toBe('payment');
    expect(params.payment_method_types).toEqual(expect.arrayContaining(['card', 'upi']));
    expect(params.customer_email).toBe('user@example.com');
    expect(params.metadata).toMatchObject({ email: 'user@example.com' });
  });
});
