const rateLimit = require('express-rate-limit');

function buildRateLimiter({ windowMs, maxRequests, message }) {
  return rateLimit({
    windowMs,
    max: maxRequests,
    message: {
      success: false,
      message,
    },
    standardHeaders: true,
    legacyHeaders: false,
  });
}

const apiLimiter = buildRateLimiter({
  windowMs: 15 * 60 * 1000,
  maxRequests: 500,
  message: 'Demasiadas peticiones desde esta IP, por favor intente de nuevo más tarde.',
});

const loginLimiter = buildRateLimiter({
  windowMs: 15 * 60 * 1000,
  maxRequests: 5,
  message: 'Demasiados intentos de inicio de sesión. Su IP ha sido bloqueada por 15 minutos.',
});

module.exports = {
  apiLimiter,
  loginLimiter,
};
