const express = require("express");
const router = express.Router();
const db = require("../config/db");
const auth = require("../middleware/auth");

// Book a session
router.post("/", auth, async (req, res) => {
  try {
    const { counsellor_name, date, time, reason } = req.body;
    await db.execute(
      "INSERT INTO bookings (user_id, counsellor_name, date, time, reason, status) VALUES (?,?,?,?,?,?)",
      [req.user.id, counsellor_name, date, time, reason || null, "Pending confirmation"]
    );
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get my bookings
router.get("/", auth, async (req, res) => {
  try {
    const [bookings] = await db.execute(
      "SELECT * FROM bookings WHERE user_id = ? ORDER BY created_at DESC",
      [req.user.id]
    );
    res.json(bookings);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get bookings for the logged-in counsellor
router.get("/counsellor", auth, async (req, res) => {
  try {
    if (req.user.role !== "counsellor") {
      return res.status(403).json({ error: "Access denied. Counsellor account required." });
    }

    const [[counsellor]] = await db.execute(
      "SELECT name FROM users WHERE id = ?",
      [req.user.id]
    );
    if (!counsellor) return res.status(404).json({ error: "Counsellor account not found." });

    const [rows] = await db.execute(
      `SELECT b.id,b.user_id, b.date, b.time, b.reason AS notes, b.status,
              u.name AS student_name, u.email AS student_email
       FROM bookings b
       JOIN users u ON b.user_id = u.id
       WHERE b.counsellor_name = ?
       ORDER BY b.date ASC, b.time ASC`,
      [counsellor.name]
    );

    const normalized = rows.map(r => ({
      ...r,
      status: (r.status || "pending").toLowerCase().startsWith("pending") ? "pending" : r.status.toLowerCase(),
    }));

    res.json(normalized);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Update a booking's status (accept / decline / complete)
router.put("/:id/status", auth, async (req, res) => {
  try {
    if (req.user.role !== "counsellor") {
      return res.status(403).json({ error: "Access denied." });
    }
    const { status } = req.body;
    const allowed = ["confirmed", "cancelled", "completed"];
    if (!allowed.includes(status)) {
      return res.status(400).json({ error: "Invalid status." });
    }

    const [[counsellor]] = await db.execute(
      "SELECT name FROM users WHERE id = ?",
      [req.user.id]
    );
    if (!counsellor) return res.status(404).json({ error: "Counsellor account not found." });

    const [result] = await db.execute(
      "UPDATE bookings SET status = ? WHERE id = ? AND counsellor_name = ?",
      [status, req.params.id, counsellor.name]
    );
    if (result.affectedRows === 0) {
      return res.status(404).json({ error: "Booking not found or not yours." });
    }
    res.json({ success: true, status });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});
// Get a student's latest assessment (for counsellor review of a booking)
router.get("/student-assessment/:userId", auth, async (req, res) => {
  try {
    if (req.user.role !== "counsellor") {
      return res.status(403).json({ error: "Access denied." });
    }
    const [rows] = await db.execute(
      `SELECT s.*, u.name AS student_name, u.email AS student_email, u.student_id
       FROM survey_responses s
       JOIN users u ON s.user_id = u.id
       WHERE s.user_id = ?
       ORDER BY s.submitted_at DESC
       LIMIT 1`,
      [req.params.userId]
    );
    if (rows.length === 0) {
      return res.status(404).json({ error: "No assessment found for this student." });
    }
    res.json(rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});
module.exports = router;