const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const User = require("../models/User");
const Organization = require("../models/organization");
const { generateAccessToken, generateRefreshToken } = require("../utils/generateTokens");
const crypto = require("crypto");
const sendEmail = require("../utils/sendEmail");
const { sendPasswordChangedEmail } = require("../utils/authEmails");
const { OAuth2Client } = require("google-auth-library");
const googleClient = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);


const cookieOptions = {
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite: "lax",
  maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
};

// POST /api/auth/signup
exports.signup = async (req, res) => {
  try {
    const { orgName, name, email, password } = req.body;

    if (!orgName || !name || !email || !password || password.length < 8) {
      return res.status(400).json({ message: "All fields are required; password must be at least 8 characters." });
    }

    const existing = await User.findOne({ email });
    if (existing) {
      return res.status(409).json({ message: "An account with this email already exists." });
    }

    const organization = await Organization.create({ name: orgName });

    const passwordHash = await bcrypt.hash(password, 10);
    const user = await User.create({
      organizationId: organization._id,
      name,
      email,
      passwordHash,
      role: "admin", // first user in a new org is always admin
    });

    const accessToken = generateAccessToken(user);
    const refreshToken = generateRefreshToken(user);

    res.cookie("refreshToken", refreshToken, cookieOptions);
    res.status(201).json({
      accessToken,
      user: { id: user._id, name: user.name, email: user.email, role: user.role, organizationId: user.organizationId },
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Signup failed. Please try again." });
  }
};

// POST /api/auth/login
exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email });

    // Deliberately generic message — don't reveal whether the email exists
    if (!user || !(await bcrypt.compare(password, user.passwordHash))) {
      return res.status(401).json({ message: "Invalid email or password." });
    }

    const accessToken = generateAccessToken(user);
    const refreshToken = generateRefreshToken(user);

    res.cookie("refreshToken", refreshToken, cookieOptions);
    res.json({
      accessToken,
      user: { id: user._id, name: user.name, email: user.email, role: user.role, organizationId: user.organizationId },
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Login failed. Please try again." });
  }
};

// POST /api/auth/refresh
exports.refresh = async (req, res) => {
  const token = req.cookies.refreshToken;
  if (!token) return res.status(401).json({ message: "No refresh token provided." });

  try {
    const decoded = jwt.verify(token, process.env.JWT_REFRESH_SECRET);
    const user = await User.findById(decoded.userId);
    if (!user) return res.status(401).json({ message: "User no longer exists." });

    const accessToken = generateAccessToken(user);
    res.json({ accessToken });
  } catch (err) {
    return res.status(401).json({ message: "Invalid or expired refresh token." });
  }
};


// POST /api/auth/forgot-password
exports.forgotPassword = async (req,res) => {
    const { email } = req.body;
    const genericMessage = { message: "If an account with that email exists, a reset link has been sent."};

    try {
        const user = await User.findOne({ email });

        // Always respond the same way — don't reveal whether the email exists
        if (!user) return res.json(genericMessage);

        const rawToken = crypto.randomBytes(32).toString('hex');
        const tokenHash = crypto.createHash("sha256").update(rawToken).digest("hex");

        user.resetPasswordTokenHash = tokenHash;
        user.resetPasswordExpires = Date.now() + 15 * 60 * 1000; // 15 minutes
        await user.save();

        const resetLink = `${process.env.CLIENT_URL}/reset-password/${rawToken}`;

        await sendEmail({
            to: user.email,
            subject: "Reset Your StatusForge password",
            html: `<p>Click the link below to reset your password. This link expires in 15 minutes.</p>
                <a href="${resetLink}">${resetLink}</a>`,
        });
        res.json(genericMessage);
    } catch(err){
        console.error(err);
        res.status(500).json({ message: "Something went wrong. Please try again."});
    }
};

// POST /api/auth/reset-password/:token
exports.resetPassword = async (req, res) => {
  try {
    const { token } = req.params;
    const { newPassword } = req.body;

    if (!newPassword || newPassword.length < 8) {
      return res.status(400).json({ message: "Password must be at least 8 characters." });
    }

    const tokenHash = crypto.createHash("sha256").update(token).digest("hex");

    const user = await User.findOne({
      resetPasswordTokenHash: tokenHash,
      resetPasswordExpires: { $gt: Date.now() }, // not expired
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

// POST /api/auth/google
exports.googleAuth = async (req, res) => {
  try {
    const { credential } = req.body; // the ID token from the frontend

    const ticket = await googleClient.verifyIdToken({
      idToken: credential,
      audience: process.env.GOOGLE_CLIENT_ID, // must match OUR client id, or it could be someone else's token
    });

    const payload = ticket.getPayload();
    const { sub: googleId, email, name } = payload;

    let user = await User.findOne({ email });

    if (user) {
      // Existing account (maybe signed up with password before) — link Google to it
      if (!user.googleId) {
        user.googleId = googleId;
        await user.save();
      }
    } else {
      // Brand new user via Google — create their own organization
      const organization = await Organization.create({ name: `${name}'s Organization` });
      user = await User.create({
        organizationId: organization._id,
        name,
        email,
        googleId,
        role: "admin",
      });
    }

    const accessToken = generateAccessToken(user);
    const refreshToken = generateRefreshToken(user);

    res.cookie("refreshToken", refreshToken, cookieOptions);
    res.json({
      accessToken,
      user: { id: user._id, name: user.name, email: user.email, role: user.role, organizationId: user.organizationId },
    });
  } catch (err) {
    console.error(err);
    res.status(401).json({ message: "Google sign-in failed. Please try again." });
  }
};

// POST /api/auth/logout
exports.logout = (req, res) => {
  res.clearCookie("refreshToken", cookieOptions);
  res.json({ message: "Logged out successfully." });
};

// POST /api/auth/set-password  (must be logged in)
exports.setPassword = async (req, res) => {
  try {
    const { newPassword } = req.body;

    if (!newPassword || newPassword.length < 8) {
      return res.status(400).json({ message: "Password must be at least 8 characters." });
    }

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

// GET /api/auth/me
exports.getMe = async (req, res) => {
  const user = await User.findById(req.user.userId).select("-passwordHash");
  res.json({ user });
};


