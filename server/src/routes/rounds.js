const express = require("express");
const { auth } = require("../middleware/auth");
const { getRoundStatus } = require("../services/roundService");

const router = express.Router();

router.get("/status", auth, async (req, res) => {
  const status = await getRoundStatus();
  res.json(status);
});

module.exports = router;
