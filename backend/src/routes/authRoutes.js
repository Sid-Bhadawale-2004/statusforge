const express = require("express");
const router = express.Router();
const { signup, login, refresh, logout, getMe } = require("../controllers/authController");
const { requireAuth } = require("../middleware/authMiddleware");
const { forgotPassword, resetPassword } = require("../controllers/authController");

router.post("/signup", signup);
router.post("/login", login);
router.post("/refresh", refresh);
router.post("/logout", logout);
router.post("/forgot-password", forgotPassword);
router.post("/reset-password/:token", resetPassword);

router.get("/me", requireAuth, getMe);

module.exports = router;