const express = require("express");
const router = express.Router();
const db = require("../config/db");
const auth = require("../middleware/auth");

// Rule engine
function computeMean(scores) {
  const valid = scores.filter((s) => s !== null && s !== undefined);
  return parseFloat((valid.reduce((a, b) => a + b, 0) / valid.length).toFixed(2));
}

function screenTimeScore(hours) {
  if (!hours || hours <= 0) return null;
  if (hours <= 2) return 1;
  if (hours <= 4) return 2;
  if (hours <= 6) return 3;
  if (hours <= 8) return 4;
  return 5;
}

function adjustedDigitalScore(likertMean, screenHours) {
  const st = screenTimeScore(screenHours);
  if (st === null) return likertMean;
  return parseFloat(((likertMean * 0.7) + (st * 0.3)).toFixed(2));
}

function classifyRisk(acad, fin, fam, dig) {
  const overall = parseFloat(((acad + fin + fam + dig) / 4).toFixed(2));
  let risk = "Low";
  if (overall >= 3.5) risk = "High";
  else if (acad >= 4.0 && dig >= 3.5) risk = "High";
  else if (acad >= 4.0 || dig >= 4.0) risk = "High";
  else if (overall >= 2.5) risk = "Medium";
  else if (acad >= 3.0 || dig >= 3.0) risk = "Medium";
  return { risk, overall };
}

function getRecommendations(risk, scores) {
  const recs = [];
  if (scores.acad >= 3.0) recs.push({ icon: "📚", title: "Break assignments into 25-min blocks", desc: `Targets your Academic score of ${scores.acad}` });
  if (scores.dig >= 3.0) recs.push({ icon: "📵", title: "Set a daily 2-hour screen-free window", desc: `Targets Digital score of ${scores.dig}. Screen time: ${scores.screen_hours || "not recorded"}h/day` });
  if (scores.fin >= 3.0) recs.push({ icon: "💰", title: "Visit APU Financial Aid office", desc: `Targets Financial score of ${scores.fin}` });
  if (scores.fam >= 3.0) recs.push({ icon: "🤝", title: "Reach out to APU counselling services", desc: `Targets Family/Personal score of ${scores.fam}` });
  if (risk === "High") recs.push({ icon: "🚨", title: "Priority counsellor referral", desc: "Your score qualifies you for urgent support." });
  return recs;
}

// Submit survey
router.post("/submit", auth, async (req, res) => {
  try {
    const { academic, financial, family, digital, screen_hours } = req.body;
    const userId = req.user.id;
    console.log("SUBMIT — user_id:", userId); // DEBUG — remove once confirmed working

    const acadMean = computeMean(academic);
    const finMean = computeMean(financial);
    const famMean = computeMean(family);
    const digRaw = computeMean(digital);
    const digAdj = adjustedDigitalScore(digRaw, screen_hours);
    const { risk, overall } = classifyRisk(acadMean, finMean, famMean, digAdj);

    const recommendations = getRecommendations(risk, { acad: acadMean, fin: finMean, fam: famMean, dig: digAdj, screen_hours });

    // Build flat columns
    const acadVals = academic.map((v, i) => [`acad_q${i + 1}`, v]);
    const finVals = financial.map((v, i) => [`fin_q${i + 1}`, v]);
    const famVals = family.map((v, i) => [`fam_q${i + 1}`, v]);
    const digVals = digital.map((v, i) => [`dig_q${i + 1}`, v]);
    const allVals = [...acadVals, ...finVals, ...famVals, ...digVals];

    const colNames = allVals.map((c) => c[0]).join(", ") +
      ", screen_hours, acad_mean, fin_mean, fam_mean, dig_mean, dig_adjusted, overall_mean, risk_level, user_id";
    const placeholders = allVals.map(() => "?").join(", ") + ", ?, ?, ?, ?, ?, ?, ?, ?, ?";
    const values = [...allVals.map((c) => c[1]), screen_hours || null, acadMean, finMean, famMean, digRaw, digAdj, overall, risk, userId];

    const [result] = await db.execute(
      `INSERT INTO survey_responses (${colNames}) VALUES (${placeholders})`,
      values
    );

    // New assessment means a new recovery plan — wipe old progress so it doesn't bleed into the new plan
    try {
      const [delResult] = await db.execute("DELETE FROM recovery_progress WHERE user_id = ?", [userId]);
      console.log("DELETE — user_id:", userId, "rows removed:", delResult.affectedRows); // DEBUG — remove once confirmed working
    } catch (cleanupErr) {
      console.error("Failed to reset recovery progress:", cleanupErr.message);
      // don't fail the whole submission if this cleanup fails
    }

    res.json({
      success: true,
      responseId: result.insertId,
      risk,
      overall,
      acadMean,
      finMean,
      famMean,
      digAdj,
      screen_hours,
      recommendations,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get history
router.get("/history", auth, async (req, res) => {
  try {
    const [rows] = await db.execute(
      "SELECT id, submitted_at, acad_mean, fin_mean, fam_mean, dig_adjusted, overall_mean, risk_level, screen_hours FROM survey_responses WHERE user_id = ? ORDER BY submitted_at ASC",
      [req.user.id]
    );
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get latest
router.get("/latest", auth, async (req, res) => {
  try {
    const [rows] = await db.execute(
      "SELECT * FROM survey_responses WHERE user_id = ? ORDER BY submitted_at DESC LIMIT 1",
      [req.user.id]
    );
    if (!rows.length) return res.json(null);
    const r = rows[0];
    const recommendations = getRecommendations(r.risk_level, { acad: r.acad_mean, fin: r.fin_mean, fam: r.fam_mean, dig: r.dig_adjusted, screen_hours: r.screen_hours });
    res.json({ ...r, recommendations });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;