const express = require("express");
const router = express.Router();

const { inviteTeammate, getTeamMembers } = require("../controllers/teamController");
const { requireAuth, requireRole } = require("../middleware/authMiddleware");
const validate = require("../middleware/validate");
const { inviteTeammateSchema } = require("../validators/teamValidators");

router.use(requireAuth);

router.post("/invite", requireRole("admin"), validate(inviteTeammateSchema), inviteTeammate);
router.get("/", getTeamMembers);

module.exports = router;