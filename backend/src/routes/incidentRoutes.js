const express = require("express");
const router = express.Router();

const {
  testTrigger, getIncidents, acknowledgeIncident, resolveIncident,
} = require("../controllers/incidentController");
const { requireAuth } = require("../middleware/authMiddleware");

router.use(requireAuth);

router.post("/test-trigger", testTrigger);
router.get("/", getIncidents);
router.post("/:id/acknowledge", acknowledgeIncident);
router.post("/:id/resolve", resolveIncident);

module.exports = router;