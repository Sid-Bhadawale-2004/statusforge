require("dotenv").config();
const express = require("express");
const cors = require("cors");
const connectDB = require("./config/db");
const cookieParser = require("cookie-parser");
const authRoutes = require("./routes/authRoutes");

const app = express();
app.use(cors({ origin: process.env.CLIENT_URL, credentials: true }));
app.use(express.json());
app.use(cookieParser());   


app.get("/health", (req, res) => res.json({ status: "ok" }));

connectDB().then(() => {
  const PORT = process.env.PORT || 5000;
  app.use("/api/auth", authRoutes);
  app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
});