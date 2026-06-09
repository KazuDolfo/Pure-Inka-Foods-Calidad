const stripeKey = process.env.STRIPE_SECRET_KEY;
if (!stripeKey) {
  console.error('❌ ERROR: STRIPE_SECRET_KEY no está definida en el archivo .env');
}
const stripe = require('stripe')(stripeKey);
const logger = require('../utils/logger');
const { sendSuccess, sendError } = require('../utils/controller-helpers');

function formatStripeAmount(amount) {
  return Math.round(Number(amount) * 100);
}

function validatePaymentAmount(amount) {
  const numericAmount = Number(amount);
  return numericAmount > 0 && !Number.isNaN(numericAmount);
}

exports.createPaymentIntent = async (req, res) => {
  try {
    const { amount } = req.body;

    if (!validatePaymentAmount(amount)) {
      logger.error('Monto de pago inválido', { amount });
      return sendError(res, 400, 'El monto del pago debe ser un número positivo.');
    }

    logger.info(`Creando PaymentIntent para monto: ${amount} PEN`);

    const paymentIntent = await stripe.paymentIntents.create({
      amount: formatStripeAmount(amount),
      currency: 'pen',
      automatic_payment_methods: { enabled: true },
    });

    logger.info(`PaymentIntent creado: ${paymentIntent.id}`);

    return sendSuccess(res, { clientSecret: paymentIntent.client_secret });
  } catch (error) {
    logger.error('Error de Stripe al crear PaymentIntent', {
      message: error.message,
      type: error.type,
    });
    return sendError(res, 500, 'No se pudo iniciar el proceso de pago.', {
      error: error.message,
      type: error.type || 'StripeError',
    });
  }
};
