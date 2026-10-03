require("dotenv").config();
const express = require("express");
const cors = require("cors");
const connectDB = require("./config/db");
const cookieParser = require("cookie-parser");
const helmet = require("helmet");
const authRoutes = require("./routes/authRoutes");
const serviceRoutes = require("./routes/serviceRoutes");
const teamRoutes = require("./routes/teamRoutes");
const scheduleRoutes = require("./routes/scheduleRoutes");
const { startEscalationChecker } = require("./jobs/escalationChecker");
const escalationRoutes = require("./routes/escalationRoutes");
const incidentRoutes = require("./routes/incidentRoutes");
const webhookRoutes = require("./routes/webhookRoutes");
const { startHealthChecker } = require("./jobs/healthChecker");
const publicStatusRoutes = require("./routes/publicStatusRoutes");
const bcrypt = require("bcryptjs");
const User = require("./models/user");
const Organization = require("./models/organization");

async function seedDemoAccount() {
  const email = (process.env.DEMO_ACCOUNT_EMAIL || "demo@statusforge.local").trim().toLowerCase();
  const password = process.env.DEMO_ACCOUNT_PASSWORD || "StatusForgeDemo123!";
  const existing = await User.findOne({ email });
  if (existing) return;

  const organization = await Organization.create({
    name: "StatusForge Demo",
    slug: "statusforge-demo",
  });
  const passwordHash = await bcrypt.hash(password, 10);
  await User.create({
    organizationId: organization._id,
    name: "Demo Operator",
    email,
    passwordHash,
    role: "admin",
  });
  console.log(`[demo] Seeded demo account: ${email}`);
}

const app = express();
app.set("trust proxy", 1);
app.use(helmet());
app.use(cors({ origin: process.env.CLIENT_URL, credentials: true }));
app.use(express.json());
app.use(cookieParser());   


app.get("/health", (req, res) => res.json({ status: "ok" }));

connectDB().then(async () => {
  await seedDemoAccount();
  const PORT = process.env.PORT || 5000;
  app.use("/api/auth", authRoutes);
  app.use("/api/services", serviceRoutes);
  app.use("/api/team", teamRoutes);
  app.use("/api/schedules", scheduleRoutes);
  app.use("/api/escalation-policies", escalationRoutes);
  app.use("/api/incidents", incidentRoutes);
  app.use("/api/webhooks", webhookRoutes); // was "/api/incidents/webhook"
  app.use("/api/public/status", publicStatusRoutes);
  
  app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
});
startEscalationChecker();
startHealthChecker();
