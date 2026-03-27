const express = require("express");
const { auth } = require("../middleware/auth");
const { getEconomyStatus } = require("../services/economyService");
const { getPlayerDrugStatus, useDrug } = require("../services/drugService");

const router = express.Router();

router.get("/status", auth, async (req, res) => {
  try {
    const economy = await getEconomyStatus(req.user.id);
    res.json(economy);
  } catch (error) {
    res.status(error.status || 500).json({ error: error.message || "economy_status_failed" });
  }
});

router.get("/drugs", auth, async (req, res) => {
  try {
    const status = await getPlayerDrugStatus(req.user.id);
    res.json(status);
  } catch (error) {
    res.status(error.status || 500).json({ error: error.message || "drugs_status_failed" });
  }
});

router.post("/drugs/use", auth, async (req, res) => {
  try {
    const { drugKey, amount } = req.body || {};
    const status = await useDrug({
      playerId: req.user.id,
      drugKey,
      amount: amount == null ? 1 : Number(amount)
    });
    res.json(status);
  } catch (error) {
    res.status(error.status || 500).json({ error: error.message || "drug_use_failed" });
  }
});

module.exports = router;
