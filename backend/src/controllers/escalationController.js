const EscalationPolicy = require("../models/EscalationPolicy");
const Service = require("../models/Service");
const User = require("../models/User");

async function validateStepUsersBelongToOrg(steps, organizationId) {
  const userIds = steps.map((s) => s.notifyUserId);
  const count = await User.countDocuments({ _id: { $in: userIds }, organizationId });
  return count === new Set(userIds.map(String)).size;
}

// POST /api/escalation-policies
exports.createPolicy = async (req, res) => {
  try {
    const { serviceId, steps } = req.body;

    const service = await Service.findOne({ _id: serviceId, organizationId: req.user.organizationId });
    if (!service) return res.status(404).json({ message: "Service not found." });

    const usersValid = await validateStepUsersBelongToOrg(steps, req.user.organizationId);
    if (!usersValid) {
      return res.status(400).json({ message: "One or more notify targets do not belong to your organization." });
    }

    const sortedSteps = [...steps].sort((a, b) => a.order - b.order);

    const policy = await EscalationPolicy.create({
      organizationId: req.user.organizationId,
      serviceId,
      steps: sortedSteps,
    });

    res.status(201).json({ policy });
  } catch (err) {
    if (err.code === 11000) {
      return res.status(409).json({ message: "This service already has an escalation policy. Use update instead." });
    }
    console.error(err);
    res.status(500).json({ message: "Failed to create escalation policy." });
  }
};

// GET /api/escalation-policies/service/:serviceId
exports.getPolicyForService = async (req, res) => {
  try {
    const policy = await EscalationPolicy.findOne({
      serviceId: req.params.serviceId,
      organizationId: req.user.organizationId,
    }).populate("steps.notifyUserId", "name email");

    if (!policy) return res.status(404).json({ message: "No escalation policy found for this service." });
    res.json({ policy });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Failed to fetch escalation policy." });
  }
};

// PUT /api/escalation-policies/:id
exports.updatePolicy = async (req, res) => {
  try {
    if (req.body.steps) {
      const usersValid = await validateStepUsersBelongToOrg(req.body.steps, req.user.organizationId);
      if (!usersValid) {
        return res.status(400).json({ message: "One or more notify targets do not belong to your organization." });
      }
      req.body.steps = [...req.body.steps].sort((a, b) => a.order - b.order);
    }

    const policy = await EscalationPolicy.findOneAndUpdate(
      { _id: req.params.id, organizationId: req.user.organizationId },
      { $set: req.body },
      { new: true, runValidators: true }
    ).populate("steps.notifyUserId", "name email");

    if (!policy) return res.status(404).json({ message: "Escalation policy not found." });
    res.json({ policy });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Failed to update escalation policy." });
  }
};

// DELETE /api/escalation-policies/:id
exports.deletePolicy = async (req, res) => {
  try {
    const policy = await EscalationPolicy.findOneAndDelete({
      _id: req.params.id,
      organizationId: req.user.organizationId,
    });
    if (!policy) return res.status(404).json({ message: "Escalation policy not found." });
    res.json({ message: "Escalation policy deleted." });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Failed to delete escalation policy." });
  }
};