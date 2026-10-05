const express = require("express");
const router = express.Router();
const db = require("../config/db");
const auth = require("../middleware/auth");

const ALLOWED_REACTIONS = ["❤️", "🤝", "💪", "🌟", "🫂"];

// Get all posts
router.get("/", auth, async (req, res) => {
  try {
    const [posts] = await db.execute(`
      SELECT p.id, p.content, p.is_anonymous, p.created_at, p.tag, p.tag_color, p.tag_bg,
        CASE WHEN p.is_anonymous = 1 THEN 'Anonymous' ELSE u.name END as author
      FROM peer_posts p JOIN users u ON p.user_id = u.id
      ORDER BY p.created_at DESC LIMIT 50
    `);

    if (posts.length === 0) return res.json([]);

    const postIds = posts.map(p => p.id);
    const placeholders = postIds.map(() => "?").join(",");
    const [reactionRows] = await db.execute(
      `SELECT post_id, reaction, COUNT(*) as count FROM peer_reactions WHERE post_id IN (${placeholders}) GROUP BY post_id, reaction`,
      postIds
    );

    const reactionsByPost = {};
    reactionRows.forEach(r => {
      if (!reactionsByPost[r.post_id]) reactionsByPost[r.post_id] = {};
      reactionsByPost[r.post_id][r.reaction] = r.count;
    });

    const result = posts.map(p => ({ ...p, reactions: reactionsByPost[p.id] || {} }));
    res.json(result);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Create post
router.post("/", auth, async (req, res) => {
  try {
    const { content, is_anonymous, tag, tag_color, tag_bg } = req.body;
    if (!content || content.trim().length < 3)
      return res.status(400).json({ error: "Post is too short." });
    await db.execute(
      "INSERT INTO peer_posts (user_id, content, is_anonymous, tag, tag_color, tag_bg) VALUES (?,?,?,?,?,?)",
      [req.user.id, content.trim(), is_anonymous ? 1 : 0, tag || "General", tag_color || "#6D28D9", tag_bg || "#EDE9FE"]
    );
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// React / un-react (toggle) — supports 5 independent emoji reactions per post
router.post("/:id/react", auth, async (req, res) => {
  try {
    const postId = req.params.id;
    const { reaction } = req.body;

    if (!ALLOWED_REACTIONS.includes(reaction)) {
      return res.status(400).json({ error: "Invalid reaction." });
    }

    const [existing] = await db.execute(
      "SELECT * FROM peer_reactions WHERE user_id = ? AND post_id = ? AND reaction = ?",
      [req.user.id, postId, reaction]
    );

    if (existing.length) {
      await db.execute(
        "DELETE FROM peer_reactions WHERE user_id = ? AND post_id = ? AND reaction = ?",
        [req.user.id, postId, reaction]
      );
      res.json({ reacted: false });
    } else {
      await db.execute(
        "INSERT INTO peer_reactions (user_id, post_id, reaction) VALUES (?,?,?)",
        [req.user.id, postId, reaction]
      );
      res.json({ reacted: true });
    }
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;