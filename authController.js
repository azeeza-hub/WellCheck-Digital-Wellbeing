const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const db = require("../config/db");
require("dotenv").config();

exports.register = async (req, res) => {
  try {
    const { student_id, name, email, password, role, mascot } = req.body;
    if (!name || !email || !password)
      return res.status(400).json({ error: "Name, email and password are required." });

    // Check if email already exists
    const [existing] = await db.execute("SELECT id FROM users WHERE email = ?", [email]);
    if (existing.length > 0)
      return res.status(400).json({ error: "Email already registered." });

    const hash = await bcrypt.hash(password, 10);
    const userRole = role === "counsellor" ? "counsellor" : "student";

    const [result] = await db.execute(
      "INSERT INTO users (student_id, name, email, password_hash, role, mascot) VALUES (?,?,?,?,?,?)",
      [student_id || null, name, email, hash, userRole, mascot || null]
    );

    const token = jwt.sign(
      { id: result.insertId, role: userRole },
      process.env.JWT_SECRET,
      { expiresIn: "7d" }
    );

    res.json({
      token,
      user: { id: result.insertId, name, email, role: userRole, mascot: mascot || null, student_id: student_id || null },
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.login = async (req, res) => {
  try {
    const { email, password, role } = req.body;
    if (!email || !password)
      return res.status(400).json({ error: "Email and password are required." });

    const [rows] = await db.execute("SELECT * FROM users WHERE email = ?", [email]);
    if (!rows.length)
      return res.status(401).json({ error: "Invalid email or password." });

    const user = rows[0];

    // Check role matches
    if (role && user.role !== role)
      return res.status(403).json({ error: `This account is not registered as a ${role}.` });

    const match = await bcrypt.compare(password, user.password_hash);
    if (!match)
      return res.status(401).json({ error: "Invalid email or password." });

    const token = jwt.sign(
      { id: user.id, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: "7d" }
    );

    res.json({
      token,
      user: { id: user.id, name: user.name, email: user.email, role: user.role, mascot: user.mascot, student_id: user.student_id },
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.updateMascot = async (req, res) => {
  try {
    const { mascot } = req.body;
    await db.execute("UPDATE users SET mascot = ? WHERE id = ?", [mascot, req.user.id]);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};