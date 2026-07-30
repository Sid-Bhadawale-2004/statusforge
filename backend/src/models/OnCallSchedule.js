const mongoose = require("mongoose");

const onCallScheduleSchema = new mongoose.Schema(
  {
    organizationId: { type: mongoose.Schema.Types.ObjectId, ref: "Organization", required: true },
    serviceId: { type: mongoose.Schema.Types.ObjectId, ref: "Service", required: true },
    rotationMembers: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
    rotationType: { type: String, enum: ["daily", "weekly"], required: true },
    startDate: { type: Date, required: true },
  },
  { timestamps: true }
);

onCallScheduleSchema.index({ serviceId: 1 }, { unique: true });

module.exports = mongoose.model("OnCallSchedule", onCallScheduleSchema);