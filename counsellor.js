const express = require("express");
const router = express.Router();
const db = require("../config/db");
const auth = require("../middleware/auth");

const counsellorOnly = (req, res, next) => {
  if (req.user.role !== "counsellor")
    return res.status(403).json({ error: "Access denied." });
  next();
};

// Get all students with latest scores
router.get("/cohort", auth, counsellorOnly, async (req, res) => {
  try {
    const [students] = await db.execute(`
      SELECT u.id, u.name, u.student_id, u.email,
        sr.acad_mean, sr.fin_mean, sr.fam_mean, sr.dig_adjusted,
        sr.overall_mean, sr.risk_level, sr.submitted_at, sr.screen_hours
      FROM users u
      LEFT JOIN survey_responses sr ON sr.id = (
        SELECT id FROM survey_responses WHERE user_id = u.id ORDER BY submitted_at DESC LIMIT 1
      )
      WHERE u.role = 'student'
      ORDER BY sr.overall_mean DESC
    `);
    const total = students.length;
    const high = students.filter((s) => s.risk_level === "High").length;
    const medium = students.filter((s) => s.risk_level === "Medium").length;
    const low = students.filter((s) => s.risk_level === "Low").length;
    res.json({ students, stats: { total, high, medium, low } });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Save counsellor note
router.post("/note", auth, counsellorOnly, async (req, res) => {
  try {
    const { student_id, note } = req.body;
    await db.execute(
      "INSERT INTO counsellor_notes (counsellor_id, student_id, note) VALUES (?,?,?)",
      [req.user.id, student_id, note]
    );
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get notes for a student
router.get("/notes/:studentId", auth, counsellorOnly, async (req, res) => {
  try {
    const [notes] = await db.execute(
      "SELECT * FROM counsellor_notes WHERE student_id = ? ORDER BY created_at DESC",
      [req.params.studentId]
    );
    res.json(notes);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;