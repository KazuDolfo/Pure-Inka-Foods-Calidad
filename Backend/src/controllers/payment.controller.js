const stripeKey = process.env.STRIPE_SECRET_KEY;
if (!stripeKey) {
    console.error('❌ ERROR: STRIPE_SECRET_KEY no está definida en el archivo .env');
}
const stripe = require('stripe')(stripeKey);

exports.createPaymentIntent = async (req, res) => {
  try {
    const { amount } = req.body;
    
    if (!amount || isNaN(amount) || amount <= 0) {
        console.error('❌ ERROR: El monto proporcionado no es válido:', amount);
        return res.status(400).json({
            success: false,
            message: 'El monto del pago debe ser un número positivo.'
        });
    }

    console.log(`💳 Creando PaymentIntent para monto: ${amount} PEN`);

    
    
    const paymentIntent = await stripe.paymentIntents.create({
      amount: Math.round(amount * 100),
      currency: 'pen',
      automatic_payment_methods: {
        enabled: true,
      },
    });

    console.log('✅ PaymentIntent creado con éxito:', paymentIntent.id);

    res.json({
      success: true,
      clientSecret: paymentIntent.client_secret,
    });
  } catch (error) {
    console.error('❌ ERROR de Stripe al crear PaymentIntent:', error);
    res.status(500).json({
      success: false,
      message: 'No se pudo iniciar el proceso de pago.',
      error: error.message,
      type: error.type || 'StripeError'
    });
  }
};
