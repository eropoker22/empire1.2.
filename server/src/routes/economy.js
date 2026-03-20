const express = require("express");
const { auth } = require("../middleware/auth");
const { getEconomyStatus } = require("../services/economyService");

const router = express.Router();

router.get("/status", auth, async (req, res) => {
  const economy = await getEconomyStatus(req.user.id);
  res.json(economy);
});

module.exports = router;
