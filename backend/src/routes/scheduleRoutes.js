const express = require("express");
const router = express.Router();

const {
  createSchedule, getScheduleForService, updateSchedule, deleteSchedule,
} = require("../controllers/scheduleController");
const { requireAuth, requireRole } = require("../middleware/authMiddleware");
const validate = require("../middleware/validate");
const { createScheduleSchema, updateScheduleSchema } = require("../validators/scheduleValidators");

router.use(requireAuth);

router.post("/", requireRole("admin"), validate(createScheduleSchema), createSchedule);
router.get("/service/:serviceId", getScheduleForService);
router.put("/:id", requireRole("admin"), validate(updateScheduleSchema), updateSchedule);
router.delete("/:id", requireRole("admin"), deleteSchedule);

module.exports = router;