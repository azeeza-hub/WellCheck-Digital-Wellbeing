const express = require("express");
const router = express.Router();
const { register, login, updateMascot } = require("../controllers/authController");
const auth = require("../middleware/auth");

router.post("/register", register);
router.post("/login", login);
router.put("/mascot", auth, updateMascot);

module.exports = router;