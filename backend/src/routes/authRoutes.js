const express = require("express");
const router = express.Router();

const {
  signup, login, refresh, logout, getMe,
  forgotPassword, resetPassword, googleAuth, setPassword,
} = require("../controllers/authController");
const { requireAuth } = require("../middleware/authMiddleware");
const { authLimiter, forgotPasswordLimiter } = require("../middleware/rateLimiters");
const validate = require("../middleware/validate");
const {
  signupSchema, loginSchema, forgotPasswordSchema,
  resetPasswordSchema, setPasswordSchema, googleAuthSchema,
} = require("../validators/authValidators");

router.post("/signup", authLimiter, validate(signupSchema), signup);
router.post("/login", authLimiter, validate(loginSchema), login);
router.post("/refresh", refresh);
router.post("/logout", logout);
router.get("/me", requireAuth, getMe);

router.post("/forgot-password", forgotPasswordLimiter, validate(forgotPasswordSchema), forgotPassword);
router.post("/reset-password/:token", validate(resetPasswordSchema), resetPassword);

router.post("/google", validate(googleAuthSchema), googleAuth);

router.post("/set-password", requireAuth, validate(setPasswordSchema), setPassword);

module.exports = router;