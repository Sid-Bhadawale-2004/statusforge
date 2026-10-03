const Incident = require("../models/Incident");
const EscalationPolicy = require("../models/EscalationPolicy");

// POST /api/incidents/test-trigger  (temporary — Module 5 replaces this with real webhook ingestion)
exports.testTrigger = async (req, res) => {
  try {
    const { serviceId, title } = req.body;

    const policy = await EscalationPolicy.findOne({ serviceId, organizationId: req.user.organizationId });
    if (!policy) {
      return res.status(400).json({ message: "This service has no escalation policy configured yet." });
    }

    const firstStep = policy.steps[0];
    const nextEscalationAt = new Date(Date.now() + firstStep.timeoutMinutes * 60 * 1000);

    const incident = await Incident.create({
      organizationId: req.user.organizationId,
      serviceId,
      title: title || "Test incident",
      currentEscalationStep: 0,
      nextEscalationAt,
    });

    res.status(201).json({ incident });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Failed to trigger test incident." });
  }
};

// GET /api/incidents
exports.getIncidents = async (req, res) => {
  try {
    const incidents = await Incident.find({ organizationId: req.user.organizationId })
      .populate("serviceId", "name")
      .sort({ createdAt: -1 });
    res.json({ incidents });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Failed to fetch incidents." });
  }
};

// POST /api/incidents/:id/acknowledge
exports.acknowledgeIncident = async (req, res) => {
  try {
    const incident = await Incident.findOneAndUpdate(
      { _id: req.params.id, organizationId: req.user.organizationId, status: "triggered" },
      { $set: { status: "acknowledged", nextEscalationAt: null } },
      { new: true }
    );
    if (!incident) return res.status(404).json({ message: "Incident not found or already handled." });
    res.json({ incident });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Failed to acknowledge incident." });
  }
};

// POST /api/incidents/:id/resolve
exports.resolveIncident = async (req, res) => {
  try {
    const incident = await Incident.findOneAndUpdate(
      { _id: req.params.id, organizationId: req.user.organizationId },
      { $set: { status: "resolved", resolvedAt: new Date(), nextEscalationAt: null } },
      { new: true }
    );
    if (!incident) return res.status(404).json({ message: "Incident not found." });
    res.json({ incident });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Failed to resolve incident." });
  }
};