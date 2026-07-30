const OnCallSchedule = require("../models/OnCallSchedule");
const Service = require("../models/Service");
const User = require("../models/User");
const { getCurrentOnCallUserId } = require("../utils/scheduleUtils");

async function validateMembersBelongToOrg(memberIds, organizationId) {
  const count = await User.countDocuments({
    _id: { $in: memberIds },
    organizationId,
  });
  return count === memberIds.length;
}

// POST /api/schedules
exports.createSchedule = async (req, res) => {
  try {
    const { serviceId, rotationMembers, rotationType, startDate } = req.body;

    const service = await Service.findOne({ _id: serviceId, organizationId: req.user.organizationId });
    if (!service) return res.status(404).json({ message: "Service not found." });

    const membersValid = await validateMembersBelongToOrg(rotationMembers, req.user.organizationId);
    if (!membersValid) {
      return res.status(400).json({ message: "One or more rotation members do not belong to your organization." });
    }

    const schedule = await OnCallSchedule.create({
      organizationId: req.user.organizationId,
      serviceId,
      rotationMembers,
      rotationType,
      startDate,
    });

    res.status(201).json({ schedule });
  } catch (err) {
    if (err.code === 11000) {
      return res.status(409).json({ message: "This service already has a schedule. Use update instead." });
    }
    console.error(err);
    res.status(500).json({ message: "Failed to create schedule." });
  }
};

// GET /api/schedules/service/:serviceId
exports.getScheduleForService = async (req, res) => {
  try {
    const schedule = await OnCallSchedule.findOne({
      serviceId: req.params.serviceId,
      organizationId: req.user.organizationId,
    }).populate("rotationMembers", "name email");

    if (!schedule) return res.status(404).json({ message: "No schedule found for this service." });

    const currentOnCallUserId = getCurrentOnCallUserId(schedule);
    const currentOnCallUser = schedule.rotationMembers.find(
      (m) => m._id.toString() === currentOnCallUserId?.toString()
    );

    res.json({ schedule, currentOnCall: currentOnCallUser || null });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Failed to fetch schedule." });
  }
};

// PUT /api/schedules/:id
exports.updateSchedule = async (req, res) => {
  try {
    if (req.body.rotationMembers) {
      const membersValid = await validateMembersBelongToOrg(req.body.rotationMembers, req.user.organizationId);
      if (!membersValid) {
        return res.status(400).json({ message: "One or more rotation members do not belong to your organization." });
      }
    }

    const schedule = await OnCallSchedule.findOneAndUpdate(
      { _id: req.params.id, organizationId: req.user.organizationId },
      { $set: req.body },
      { new: true, runValidators: true }
    ).populate("rotationMembers", "name email");

    if (!schedule) return res.status(404).json({ message: "Schedule not found." });
    res.json({ schedule });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Failed to update schedule." });
  }
};

// DELETE /api/schedules/:id
exports.deleteSchedule = async (req, res) => {
  try {
    const schedule = await OnCallSchedule.findOneAndDelete({
      _id: req.params.id,
      organizationId: req.user.organizationId,
    });
    if (!schedule) return res.status(404).json({ message: "Schedule not found." });
    res.json({ message: "Schedule deleted." });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Failed to delete schedule." });
  }
};