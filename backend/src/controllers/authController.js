const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const crypto = require("crypto");
const { OAuth2Client } = require("google-auth-library");

const User = require("../models/user");
const Organization = require("../models/organization");
const RefreshToken = require("../models/RefreshToken");
const { generateAccessToken } = require("../utils/generateTokens");
const sendEmail = require("../utils/sendEmail");
const { sendPasswordChangedEmail, sendNewLoginEmail } = require("../utils/authEmails");
const generateSlug = require("../utils/generateSlug");

const googleClient = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

const cookieOptions = {
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite: "lax",
  maxAge: 7 * 24 * 60 * 60 * 1000,
};

const hashToken = (token) => crypto.createHash("sha256").update(token).digest("hex");

async function issueRefreshToken(userId, familyId = crypto.randomUUID()) {
  const refreshToken = jwt.sign({ userId, familyId }, process.env.JWT_REFRESH_SECRET, {
    expiresIn: "7d",
  });
  await RefreshToken.create({
    userId,
    tokenHash: hashToken(refreshToken),
    familyId,
    expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
  });
  return refreshToken;
}

function buildUserResponse(user, orgSlug) {
  return {
    id: user._id,
    name: user.name,
    email: user.email,
    role: user.role,
    organizationId: user.organizationId,
    orgSlug,
  };
}

exports.signup = async (req, res) => {
  try {
    const { orgName, name, email, password } = req.body;

    const existing = await User.findOne({ email });
    if (existing) {
      return res.status(409).json({ message: "An account with this email already exists." });
    }

    const organization = await Organization.create({ name: orgName, slug: generateSlug(orgName) });

    const passwordHash = await bcrypt.hash(password, 10);
    const user = await User.create({
      organizationId: organization._id,
      name,
      email,
      passwordHash,
      role: "admin",
    });

    const accessToken = generateAccessToken(user);
    const refreshToken = await issueRefreshToken(user._id);

    res.cookie("refreshToken", refreshToken, cookieOptions);
    res.status(201).json({
      accessToken,
      user: buildUserResponse(user, organization.slug),
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Signup failed. Please try again." });
  }
};

exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email });

    if (!user) {
      return res.status(401).json({ message: "Invalid email or password." });
    }

    if (!user.passwordHash) {
      return res.status(400).json({
        message: "This account uses Google Sign-In. Continue with Google, or set a password from Account Settings first.",
        signInMethod: "google",
      });
    }

    const isMatch = await bcrypt.compare(password, user.passwordHash);
    if (!isMatch) {
      return res.status(401).json({ message: "Invalid email or password." });
    }

    const organization = await Organization.findById(user.organizationId).select("slug");

    const accessToken = generateAccessToken(user);
    const refreshToken = await issueRefreshToken(user._id);

    // Email notifications should not prevent a valid user from signing in when
    // optional mail credentials are unavailable or the mail provider is down.
    try {
      await sendNewLoginEmail(user, {
        ip: req.ip,
        userAgent: req.headers["user-agent"],
        time: new Date().toLocaleString(),
      });
    } catch (emailError) {
      console.error("[auth] Could not send login notification:", emailError.message);
    }

    res.cookie("refreshToken", refreshToken, cookieOptions);
    res.json({
      accessToken,
      user: buildUserResponse(user, organization?.slug),
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Login failed. Please try again." });
  }
};

exports.refresh = async (req, res) => {
  const token = req.cookies.refreshToken;
  if (!token) return res.status(401).json({ message: "No refresh token provided." });

  try {
    const decoded = jwt.verify(token, process.env.JWT_REFRESH_SECRET);
    const tokenHash = hashToken(token);
    const stored = await RefreshToken.findOne({ tokenHash });

    if (!stored) {
      return res.status(401).json({ message: "Session not recognized. Please log in again." });
    }

    if (stored.isUsed) {
      await RefreshToken.deleteMany({ familyId: stored.familyId });
      res.clearCookie("refreshToken", cookieOptions);
      return res.status(401).json({ message: "Security alert: session revoked. Please log in again." });
    }

    stored.isUsed = true;
    await stored.save();

    const user = await User.findById(decoded.userId);
    if (!user) return res.status(401).json({ message: "User no longer exists." });

    const newRefreshToken = await issueRefreshToken(user._id, decoded.familyId);
    res.cookie("refreshToken", newRefreshToken, cookieOptions);

    const accessToken = generateAccessToken(user);
    res.json({ accessToken });
  } catch (err) {
    return res.status(401).json({ message: "Invalid or expired refresh token." });
  }
};

exports.logout = async (req, res) => {
  const token = req.cookies.refreshToken;
  if (token) {
    const stored = await RefreshToken.findOne({ tokenHash: hashToken(token) });
    if (stored) {
      await RefreshToken.deleteMany({ familyId: stored.familyId });
    }
  }
  res.clearCookie("refreshToken", cookieOptions);
  res.json({ message: "Logged out successfully." });
};

exports.getMe = async (req, res) => {
  const user = await User.findById(req.user.userId).select("-passwordHash");
  const organization = await Organization.findById(req.user.organizationId).select("slug");
  res.json({ user: { ...user.toObject(), orgSlug: organization?.slug } });
};

exports.forgotPassword = async (req, res) => {
  const { email } = req.body;
  const genericMessage = { message: "If an account with that email exists, a reset link has been sent." };

  try {
    const user = await User.findOne({ email });
    if (!user) return res.json(genericMessage);

    const rawToken = crypto.randomBytes(32).toString("hex");
    const tokenHash = crypto.createHash("sha256").update(rawToken).digest("hex");

    user.resetPasswordTokenHash = tokenHash;
    user.resetPasswordExpires = Date.now() + 15 * 60 * 1000;
    await user.save();

    const resetLink = `${process.env.CLIENT_URL}/reset-password/${rawToken}`;

    await sendEmail({
      to: user.email,
      subject: "Reset your StatusForge password",
      html: `<p>Click the link below to reset your password. This link expires in 15 minutes.</p><a href="${resetLink}">${resetLink}</a>`,
    });

    res.json(genericMessage);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Something went wrong. Please try again." });
  }
};

exports.resetPassword = async (req, res) => {
  try {
    const { token } = req.params;
    const { newPassword } = req.body;

    const tokenHash = crypto.createHash("sha256").update(token).digest("hex");

    const user = await User.findOne({
      resetPasswordTokenHash: tokenHash,
      resetPasswordExpires: { $gt: Date.now() },
    });

    if (!user) {
      return res.status(400).json({ message: "Reset link is invalid or has expired." });
    }

    user.passwordHash = await bcrypt.hash(newPassword, 10);
    user.resetPasswordTokenHash = undefined;
    user.resetPasswordExpires = undefined;
    await user.save();

    await sendPasswordChangedEmail(user);

    res.json({ message: "Password reset successfully. You can now log in." });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Something went wrong. Please try again." });
  }
};

exports.setPassword = async (req, res) => {
  try {
    const { newPassword } = req.body;

    const user = await User.findById(req.user.userId);
    if (!user) return res.status(404).json({ message: "User not found." });

    user.passwordHash = await bcrypt.hash(newPassword, 10);
    await user.save();

    await sendPasswordChangedEmail(user);

    res.json({ message: "Password set successfully. You can now log in with email and password too." });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Something went wrong. Please try again." });
  }
};

exports.googleAuth = async (req, res) => {
  try {
    const { credential } = req.body;

    const ticket = await googleClient.verifyIdToken({
      idToken: credential,
      audience: process.env.GOOGLE_CLIENT_ID,
    });

    const payload = ticket.getPayload();
    const { sub: googleId, email, name } = payload;

    let user = await User.findOne({ email });
    let isNewUser = false;
    let organization;

    if (user) {
      if (!user.googleId) {
        user.googleId = googleId;
        await user.save();
      }
      organization = await Organization.findById(user.organizationId).select("slug");
    } else {
      isNewUser = true;
      organization = await Organization.create({
        name: `${name}'s Organization`,
        slug: generateSlug(`${name}'s Organization`),
      });
      user = await User.create({
        organizationId: organization._id,
        name,
        email,
        googleId,
        role: "admin",
      });
    }

    const accessToken = generateAccessToken(user);
    const refreshToken = await issueRefreshToken(user._id);

    if (!isNewUser) {
      await sendNewLoginEmail(user, {
        ip: req.ip,
        userAgent: req.headers["user-agent"],
        time: new Date().toLocaleString(),
      });
    }

    res.cookie("refreshToken", refreshToken, cookieOptions);
    res.json({
      accessToken,
      user: buildUserResponse(user, organization.slug),
    });
  } catch (err) {
    console.error(err);
    res.status(401).json({ message: "Google sign-in failed. Please try again." });
  }
};
