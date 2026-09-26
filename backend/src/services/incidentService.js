const Incident = require("../models/Incident");
const Service = require("../models/Service");
const EscalationPolicy = require("../models/EscalationPolicy");


async function createIncidentIfNotDuplicate({ organizationId, serviceId, title, severity }) {
  const existingOpenIncident = await Incident.findOne({
    serviceId,
    status: { $in: ["triggered", "acknowledged"] },
  });
  if (existingOpenIncident) {
    return { incident: existingOpenIncident, created: false };
  }

  const policy = await EscalationPolicy.findOne({ serviceId });
  if (!policy) {
    throw new Error("NO_ESCALATION_POLICY");
  }

  const firstStep = policy.steps[0];
  const nextEscalationAt = new Date(Date.now() + firstStep.timeoutMinutes * 60 * 1000);

  const incident = await Incident.create({
    organizationId,
    serviceId,
    title,
    severity: severity || "P2",
    currentEscalationStep: 0,
    nextEscalationAt,
  });

  await Service.findByIdAndUpdate(serviceId, { currentStatus: "outage" });

  return { incident, created: true };
}

async function autoResolveIncident(serviceId) {
  const incident = await Incident.findOneAndUpdate(
    { serviceId, status: { $in: ["triggered", "acknowledged"] } },
    { $set: { status: "resolved", resolvedAt: new Date(), nextEscalationAt: null } },
    { new: true }
  );

  if (incident) {
    await Service.findByIdAndUpdate(serviceId, { currentStatus: "operational" });
  }

  return incident;
}

module.exports = { createIncidentIfNotDuplicate, autoResolveIncident };