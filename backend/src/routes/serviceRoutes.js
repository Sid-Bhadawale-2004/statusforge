const express = require("express");
const router = express.Router();

const {
  createService, getServices, getServiceById, updateService, deleteService,
} = require("../controllers/serviceController");
const { requireAuth, requireRole } = require("../middleware/authMiddleware");
const validate = require("../middleware/validate");
const { createServiceSchema, updateServiceSchema } = require("../validators/serviceValidators");

router.use(requireAuth);

router.post("/", requireRole("admin"), validate(createServiceSchema), createService);
router.get("/", getServices);
router.get("/:id", getServiceById);
router.put("/:id", requireRole("admin"), validate(updateServiceSchema), updateService);
router.delete("/:id", requireRole("admin"), deleteService);

module.exports = router;