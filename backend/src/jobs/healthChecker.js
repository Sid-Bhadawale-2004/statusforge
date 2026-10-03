const cron = require("node-cron");
const axios = require("axios");
const Service = require("../models/Service");
const { createIncidentIfNotDuplicate, autoResolveIncident } = require("../services/incidentService");

async function checkServiceHealth(service) {
  try {
    await axios.get(service.healthCheckUrl, { timeout: 5000 });

    if (service.currentStatus === "outage") {
      await autoResolveIncident(service._id);
      console.log(`Service ${service.name} recovered — incident auto-resolved.`);
    }
  } catch (err) {
    try {
      await createIncidentIfNotDuplicate({
        organizationId: service.organizationId,
        serviceId: service._id,
        title: `${service.name} failed health check`,
        severity: "P1",
      });
      console.log(`Service ${service.name} failed health check — incident created (or already open).`);
    } catch (incidentErr) {
      if (incidentErr.message === "NO_ESCALATION_POLICY") {
        console.log(`Service ${service.name} is down, but has no escalation policy — skipping.`);
      } else {
        console.error(`Failed to create incident for ${service.name}:`, incidentErr);
      }
    }
  }
}

function startHealthChecker() {
  cron.schedule("* * * * *", async () => {
    try {
      const services = await Service.find({ healthCheckUrl: { $ne: null, $ne: "" } });
      for (const service of services) {
        await checkServiceHealth(service);
      }
    } catch (err) {
      console.error("Health checker failed:", err);
    }
  });
  console.log("Health checker started (runs every minute).");
}

module.exports = { startHealthChecker };