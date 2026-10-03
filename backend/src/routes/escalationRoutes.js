const express = require("express");
const router = express.Router();

const {
  createPolicy, getPolicyForService, updatePolicy, deletePolicy,
} = require("../controllers/escalationController");
const { requireAuth, requireRole } = require("../middleware/authMiddleware");
const validate = require("../middleware/validate");
const { createPolicySchema, updatePolicySchema } = require("../validators/escalationValidators");

router.use(requireAuth);

router.post("/", requireRole("admin"), validate(createPolicySchema), createPolicy);
router.get("/service/:serviceId", getPolicyForService);
router.put("/:id", requireRole("admin"), validate(updatePolicySchema), updatePolicy);
router.delete("/:id", requireRole("admin"), deletePolicy);

module.exports = router;