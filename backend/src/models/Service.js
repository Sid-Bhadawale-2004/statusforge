const mongoose = require("mongoose");

const serviceSchema = new mongoose.Schema(
  {
    organizationId: { type: mongoose.Schema.Types.ObjectId, ref: "Organization", required: true },
    name: { type: String, required: true, trim: true },
    currentStatus: {
      type: String,
      enum: ["operational", "degraded", "outage"],
      default: "operational",
    },
    description: { type: String, trim: true },
    webhookSecret: { type: String },
    healthCheckUrl: { type: String, trim: true }, // optional — enables self-monitoring
  },
  { timestamps: true }
);

serviceSchema.index({ organizationId: 1, name: 1 }, { unique: true });

module.exports = mongoose.model("Service", serviceSchema);