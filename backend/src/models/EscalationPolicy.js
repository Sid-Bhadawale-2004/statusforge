const mongoose = require("mongoose");

const stepSchema = new mongoose.Schema(
  {
    order: { type: Number, required: true },
    timeoutMinutes: { type: Number, required: true, min: 1 },
    notifyUserId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  },
  { _id: false }
);

const escalationPolicySchema = new mongoose.Schema(
  {
    organizationId: { type: mongoose.Schema.Types.ObjectId, ref: "Organization", required: true },
    serviceId: { type: mongoose.Schema.Types.ObjectId, ref: "Service", required: true },
    steps: {
      type: [stepSchema],
      validate: {
        validator: (arr) => arr.length > 0,
        message: "At least one escalation step is required.",
      },
    },
  },
  { timestamps: true }
);

escalationPolicySchema.index({ serviceId: 1 }, { unique: true });

module.exports = mongoose.model("EscalationPolicy", escalationPolicySchema);