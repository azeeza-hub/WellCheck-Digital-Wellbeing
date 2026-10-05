const express = require("express");
const cors = require("cors");
require("dotenv").config();

const authRoutes = require("./routes/auth");
const surveyRoutes = require("./routes/survey");
const dashboardRoutes = require("./routes/dashboard");
const peerRoutes = require("./routes/peer");
const counsellorRoutes = require("./routes/counsellor");
const bookingRoutes = require("./routes/booking");
const verifyRoutes = require("./routes/verify");
console.log("Verify routes loaded:", typeof verifyRoutes);

const app = express();
app.use(cors());
app.use(express.json());

app.use("/api/auth", authRoutes);
app.use("/api/survey", surveyRoutes);
app.use("/api/dashboard", dashboardRoutes);
app.use("/api/peer", peerRoutes);
app.use("/api/counsellor", counsellorRoutes);
app.use("/api/booking", bookingRoutes);
app.use("/api/verify", verifyRoutes);

app.get("/", (req, res) => res.json({ message: "WellCheck APU backend running!" }));

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Backend running on port ${PORT}`));