const Organization = require("../models/organization");
const Service = require("../models/Service");
const Incident = require("../models/Incident");

exports.getPublicStatus = async (req, res) => {
  try {
    const organization = await Organization.findOne({ slug: req.params.slug }).select("name slug");
    if (!organization) {
      return res.status(404).json({ message: "Status page not found." });
    }

    const services = await Service.find({ organizationId: organization._id })
      .select("name currentStatus description")
      .sort({ name: 1 });

    const fourteenDaysAgo = new Date(Date.now() - 14 * 24 * 60 * 60 * 1000);

    const recentIncidents = await Incident.find({
      organizationId: organization._id,
      createdAt: { $gte: fourteenDaysAgo },
    })
      .select("title status severity serviceId createdAt resolvedAt")
      .populate("serviceId", "name")
      .sort({ createdAt: -1 })
      .limit(20);

    res.json({ organization, services, recentIncidents });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Failed to load status page." });
  }
};