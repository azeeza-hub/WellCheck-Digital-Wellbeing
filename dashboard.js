const express = require("express");
const router = express.Router();
const db = require("../config/db");
const auth = require("../middleware/auth");

router.get("/", auth, async (req, res) => {
  try {
    const [user] = await db.execute(
      "SELECT name, mascot, student_id FROM users WHERE id = ?",
      [req.user.id]
    );
    const [latest] = await db.execute(
      "SELECT acad_mean, fin_mean, fam_mean, dig_adjusted, overall_mean, risk_level, submitted_at, screen_hours FROM survey_responses WHERE user_id = ? ORDER BY submitted_at DESC LIMIT 1",
      [req.user.id]
    );
    const [count] = await db.execute(
      "SELECT COUNT(*) as total FROM survey_responses WHERE user_id = ?",
      [req.user.id]
    );
    const [history] = await db.execute(
      "SELECT submitted_at, overall_mean, acad_mean, fin_mean, fam_mean, dig_adjusted FROM survey_responses WHERE user_id = ? ORDER BY submitted_at ASC LIMIT 10",
      [req.user.id]
    );
    res.json({
      user: user[0],
      latest: latest[0] || null,
      assessmentCount: count[0].total,
      history,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;