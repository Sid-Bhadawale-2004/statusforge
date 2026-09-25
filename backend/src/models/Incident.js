const mongoose = require("mongoose");

const incidentSchema = new mongoose.Schema(
  {
    organizationId: { type: mongoose.Schema.Types.ObjectId, ref: "Organization", required: true },
    serviceId: { type: mongoose.Schema.Types.ObjectId, ref: "Service", required: true },
    title: { type: String, required: true, trim: true },
    status: { type: String, enum: ["triggered", "acknowledged", "resolved"], default: "triggered" },
    severity: { type: String, enum: ["P1", "P2", "P3", "P4"], default: "P2" },

    currentEscalationStep: { type: Number, default: 0 },
    nextEscalationAt: { type: Date },

    resolvedAt: { type: Date },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Incident", incidentSchema);