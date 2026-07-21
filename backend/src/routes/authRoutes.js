const express = require("express");
const router = express.Router();
const {
  signup,
  login,
  refresh,
  logout,
  getMe,
  forgotPassword,
  resetPassword,
  googleAuth,
  setPassword,
} = require("../controllers/authController");
const { requireAuth } = require("../middleware/authMiddleware");
const { authLimiter, forgotPasswordLimiter } = require("../middleware/rateLimiters");

router.post("/signup", authLimiter, signup);
router.post("/login", authLimiter, login);
router.post("/forgot-password", forgotPasswordLimiter, forgotPassword);
router.post("/refresh", refresh);
router.post("/logout", logout);
router.get("/me", requireAuth, getMe);


router.post("/reset-password/:token", resetPassword);

router.post("/google", googleAuth);

router.post("/set-password", requireAuth, setPassword);

module.exports = router;