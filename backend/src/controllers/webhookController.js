const crypto = require("crypto");
const Service = require("../models/Service");
const { createIncidentIfNotDuplicate } = require("../services/incidentService");

exports.receiveWebhook = async (req, res) => {
  try {
    const { serviceId } = req.params;
    const signature = req.headers["x-signature"];

    if (!signature) {
      return res.status(401).json({ message: "Missing signature." });
    }

    const service = await Service.findById(serviceId);
    if (!service || !service.webhookSecret) {
      return res.status(401).json({ message: "Invalid webhook target or signature." });
    }

    const expectedSignature = crypto
      .createHmac("sha256", service.webhookSecret)
      .update(JSON.stringify(req.body))
      .digest("hex");

    const isValid =
      signature.length === expectedSignature.length &&
      crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(expectedSignature));

    if (!isValid) {
      return res.status(401).json({ message: "Invalid webhook target or signature." });
    }

    const { title, severity } = req.body;

    const { incident, created } = await createIncidentIfNotDuplicate({
      organizationId: service.organizationId,
      serviceId: service._id,
      title: title || `${service.name} is down`,
      severity,
    });

    res.status(created ? 201 : 200).json({ incident, created });
  } catch (err) {
    if (err.message === "NO_ESCALATION_POLICY") {
      return res.status(400).json({ message: "This service has no escalation policy configured." });
    }
    console.error(err);
    res.status(500).json({ message: "Failed to process webhook." });
  }
};