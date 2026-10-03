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

const app = express();
app.set("trust proxy", 1);
app.use(helmet());
app.use(cors({ origin: process.env.CLIENT_URL, credentials: true }));
app.use(express.json());
app.use(cookieParser());   


app.get("/health", (req, res) => res.json({ status: "ok" }));

connectDB().then(() => {
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