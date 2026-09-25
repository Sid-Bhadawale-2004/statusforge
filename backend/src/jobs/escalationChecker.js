const cron = require("node-cron");
const Incident = require("../models/Incident");
const EscalationPolicy = require("../models/EscalationPolicy");
const User = require("../models/User");
const sendEmail = require("../utils/sendEmail");

async function notifyUser(user, incident) {
  await sendEmail({
    to: user.email,
    subject: `[StatusForge] Incident escalated: ${incident.title}`,
    html: `
      <p>An incident has escalated to you:</p>
      <p><strong>${incident.title}</strong></p>
      <p>Please acknowledge it in StatusForge as soon as possible.</p>
    `,
  });
}

async function processOverdueIncidents() {
  const overdueIncidents = await Incident.find({
    status: "triggered",
    nextEscalationAt: { $lte: new Date() },
  });

  for (const incident of overdueIncidents) {
    const policy = await EscalationPolicy.findOne({ serviceId: incident.serviceId });
    if (!policy) continue;

    const nextStepIndex = incident.currentEscalationStep + 1;
    const nextStep = policy.steps[nextStepIndex];

    if (!nextStep) {
      incident.nextEscalationAt = null;
      await incident.save();
      console.log(`Incident ${incident._id}: escalation policy exhausted, no further steps.`);
      continue;
    }

    const user = await User.findById(nextStep.notifyUserId);
    if (user) {
      await notifyUser(user, incident);
    }

    incident.currentEscalationStep = nextStepIndex;
    incident.nextEscalationAt = new Date(Date.now() + nextStep.timeoutMinutes * 60 * 1000);
    await incident.save();

    console.log(`Incident ${incident._id}: escalated to step ${nextStepIndex} (${user?.email}).`);
  }
}

function startEscalationChecker() {
  cron.schedule("* * * * *", async () => {
    try {
      await processOverdueIncidents();
    } catch (err) {
      console.error("Escalation checker failed:", err);
    }
  });
  console.log("Escalation checker started (runs every minute).");
}

module.exports = { startEscalationChecker, processOverdueIncidents };