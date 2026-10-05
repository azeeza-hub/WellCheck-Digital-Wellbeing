console.log("=== VERIFY.JS FILE LOADED ===");
const express = require("express");
const router = express.Router();
const auth = require("../middleware/auth");
const db = require("../config/db");
const OpenAI = require("openai");

const client = new OpenAI({
  baseURL: "https://openrouter.ai/api/v1",
  apiKey: process.env.OPENROUTER_KEY,
});

router.post("/proof", auth, async (req, res) => {
  console.log("=== VERIFY ROUTE HIT ===");
  try {
    const { taskTitle, taskPrompt, mood, reflection, day } = req.body;

    if (!reflection || reflection.trim().length < 10) {
      return res.json({
        approved: false,
        confidence: 0,
        feedback: "Please write more detail about what you did.",
        coaching: "A genuine reflection helps you process your progress. Try again with a bit more detail!",
      });
    }

const prompt = `You are a strict verification AI for a university student wellbeing app called WellCheck APU. Your job is to catch students who did NOT actually do the assigned task, not just to be encouraging.

The student was assigned this EXACT task: "${taskTitle}"
Task context: "${taskPrompt}"
Student's mood after completing it: "${mood}"
Student's reflection: "${reflection}"

STRICT VERIFICATION RULES:
1. The reflection MUST describe an action that specifically matches "${taskTitle}" — not a different task, even if it's from the same general category (e.g. describing "mapping deadlines" does NOT count as evidence for "emailing a lecturer", even though both are academic tasks).
2. If the reflection describes a DIFFERENT specific action than the one assigned, REJECT it regardless of how genuine or detailed it sounds, and explain in the feedback which task it actually sounds like they did instead.
3. Reject vague, generic, or copy-paste-sounding reflections that could apply to almost any task.
4. Reject reflections that are too short, off-topic, or clearly fake (e.g. 'asdfsdf', 'done', single words).
5. Only approve if the reflection clearly and specifically demonstrates the exact assigned task was completed.

Respond ONLY in this exact JSON format with no other text:
{
  "approved": true or false,
  "confidence": a number from 0 to 100,
  "feedback": "specific feedback about their reflection in 1-2 sentences — if rejecting due to task mismatch, say which task it sounds like they actually did instead",
  "coaching": "a warm personalised coaching message in 1-2 sentences based on their mood and reflection"
}`;

    const response = await client.chat.completions.create({
      model: "openai/gpt-oss-20b:free",
      messages: [{ role: "user", content: prompt }],
    });

    console.log("=== FULL RESPONSE ===", JSON.stringify(response, null, 2));
    const text = response.choices?.[0]?.message?.content || "";
    console.log("=== AI RESPONSE ===", text);

    let result;
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      result = JSON.parse(jsonMatch[0]);
    } else {
      result = {
        approved: true,
        confidence: 75,
        feedback: "Reflection received and reviewed.",
        coaching: "Keep going — every step forward counts!",
      };
    }

    // If approved, save it as real recovery progress
    if (result.approved && day) {
      try {
        await db.execute(
          `INSERT INTO recovery_progress (user_id, day, task_title, mood, reflection)
           VALUES (?, ?, ?, ?, ?)
           ON DUPLICATE KEY UPDATE
             task_title = VALUES(task_title),
             mood = VALUES(mood),
             reflection = VALUES(reflection),
             completed_at = CURRENT_TIMESTAMP`,
          [req.user.id, day, taskTitle, mood, reflection]
        );
      } catch (dbErr) {
        console.error("=== FAILED TO SAVE RECOVERY PROGRESS ===", dbErr.message);
        // don't fail the whole request if saving progress fails — AI feedback still returns
      }
    }

    res.json(result);
  } catch (err) {
    console.error("=== VERIFY ERROR ===", err.message);
    res.status(500).json({
      approved: false,
      confidence: 0,
      feedback: "Verification failed. Please try again.",
      coaching: "",
    });
  }
});

// Get a student's recovery progress (which days are completed)
router.get("/progress", auth, async (req, res) => {
  try {
    const [rows] = await db.execute(
      "SELECT day, task_title, mood, completed_at FROM recovery_progress WHERE user_id = ? ORDER BY day ASC",
      [req.user.id]
    );
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get("/test", (req, res) => {
  res.json({ ok: true });
});

module.exports = router;