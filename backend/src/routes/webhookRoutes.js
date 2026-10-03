const express = require("express");
const router = express.Router();

const { receiveWebhook } = require("../controllers/webhookController");
const { webhookLimiter } = require("../middleware/rateLimiters");

router.post("/:serviceId", webhookLimiter, receiveWebhook);

module.exports = router;