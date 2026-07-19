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

router.post("/signup", signup);
router.post("/login", login);
router.post("/refresh", refresh);
router.post("/logout", logout);
router.get("/me", requireAuth, getMe);

router.post("/forgot-password", forgotPassword);
router.post("/reset-password/:token", resetPassword);

router.post("/google", googleAuth);

router.post("/set-password", requireAuth, setPassword);

module.exports = router;