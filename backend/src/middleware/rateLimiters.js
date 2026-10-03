const rateLimit = require("express-rate-limit");

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10,
  message: { message: "Too many attempts. Please try again in 15 minutes." },
  standardHeaders: true,
  legacyHeaders: false,
});

const forgotPasswordLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5,
  message: { message: "Too many reset requests. Please try again later." },
});

const webhookLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 30,
  message: { message: "Too many webhook requests." },
});

module.exports = { authLimiter, forgotPasswordLimiter , webhookLimiter};