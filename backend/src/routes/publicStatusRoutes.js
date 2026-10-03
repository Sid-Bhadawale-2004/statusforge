const express = require("express");
const router = express.Router();
const rateLimit = require("express-rate-limit");

const { getPublicStatus } = require("../controllers/publicStatusController");

const publicStatusLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 60,
});

router.get("/:slug", publicStatusLimiter, getPublicStatus);

module.exports = router;