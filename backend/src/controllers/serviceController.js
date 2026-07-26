const Service = require("../models/Service");

// POST /api/services
exports.createService = async (req, res) => {
  try {
    const { name, description } = req.body;

    const service = await Service.create({
      organizationId: req.user.organizationId,
      name,
      description,
    });

    res.status(201).json({ service });
  } catch (err) {
    if (err.code === 11000) {
      return res.status(409).json({ message: "A service with this name already exists in your organization." });
    }
    console.error(err);
    res.status(500).json({ message: "Failed to create service." });
  }
};

// GET /api/services
exports.getServices = async (req, res) => {
  try {
    const services = await Service.find({ organizationId: req.user.organizationId }).sort({ createdAt: -1 });
    res.json({ services });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Failed to fetch services." });
  }
};

// GET /api/services/:id
exports.getServiceById = async (req, res) => {
  try {
    const service = await Service.findOne({
      _id: req.params.id,
      organizationId: req.user.organizationId,
    });
    if (!service) return res.status(404).json({ message: "Service not found." });
    res.json({ service });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Failed to fetch service." });
  }
};

// PUT /api/services/:id
exports.updateService = async (req, res) => {
  try {
    const service = await Service.findOneAndUpdate(
      { _id: req.params.id, organizationId: req.user.organizationId },
      { $set: req.body },
      { new: true, runValidators: true }
    );

    if (!service) return res.status(404).json({ message: "Service not found." });
    res.json({ service });
  } catch (err) {
    if (err.code === 11000) {
      return res.status(409).json({ message: "A service with this name already exists in your organization." });
    }
    console.error(err);
    res.status(500).json({ message: "Failed to update service." });
  }
};

// DELETE /api/services/:id
exports.deleteService = async (req, res) => {
  try {
    const service = await Service.findOneAndDelete({
      _id: req.params.id,
      organizationId: req.user.organizationId,
    });
    if (!service) return res.status(404).json({ message: "Service not found." });
    res.json({ message: "Service deleted." });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Failed to delete service." });
  }
};