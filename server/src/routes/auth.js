const express = require("express");
const { registerPlayer, loginPlayer } = require("../services/authService");

const router = express.Router();

router.post("/register", async (req, res) => {
  const { username, password, gangName } = req.body || {};
  if (!username || !password || !gangName) {
    return res.status(400).json({ error: "missing_fields" });
  }

  try {
    const token = await registerPlayer({ username, password, gangName });
    return res.json({ token });
  } catch (err) {
    return res.status(400).json({ error: "register_failed" });
  }
});

router.post("/login", async (req, res) => {
  const { username, password } = req.body || {};
  if (!username || !password) {
    return res.status(400).json({ error: "missing_fields" });
  }

  const token = await loginPlayer({ username, password });
  if (!token) {
    return res.status(401).json({ error: "invalid_credentials" });
  }

  return res.json({ token });
});

module.exports = router;
