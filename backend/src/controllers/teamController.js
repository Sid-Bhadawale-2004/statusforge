const crypto = require("crypto");
const User = require("../models/User");
const Organization = require("../models/organization");
const { sendInviteEmail } = require("../utils/authEmails");

// POST /api/team/invite  (admin only)
exports.inviteTeammate = async (req, res) => {
  try {
    const { name, email, role } = req.body;

    const existing = await User.findOne({ email });
    if (existing) {
      return res.status(409).json({ message: "A user with this email already exists." });
    }

    const organization = await Organization.findById(req.user.organizationId);
    const inviter = await User.findById(req.user.userId);

    const user = await User.create({
      organizationId: req.user.organizationId,
      name,
      email,
      role,
    });

    const rawToken = crypto.randomBytes(32).toString("hex");
    const tokenHash = crypto.createHash("sha256").update(rawToken).digest("hex");

    user.resetPasswordTokenHash = tokenHash;
    user.resetPasswordExpires = Date.now() + 24 * 60 * 60 * 1000;
    await user.save();

    const setupLink = `${process.env.CLIENT_URL}/reset-password/${rawToken}`;

    await sendInviteEmail(user, {
      orgName: organization.name,
      inviterName: inviter.name,
      setupLink,
    });

    res.status(201).json({
      message: `Invitation sent to ${email}.`,
      user: { id: user._id, name: user.name, email: user.email, role: user.role },
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Failed to send invitation." });
  }
};

// GET /api/team  (any logged-in user — view their own org's team)
exports.getTeamMembers = async (req, res) => {
  try {
    const members = await User.find({ organizationId: req.user.organizationId })
      .select("-passwordHash -resetPasswordTokenHash -resetPasswordExpires")
      .sort({ createdAt: 1 });
    res.json({ members });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Failed to fetch team members." });
  }
};