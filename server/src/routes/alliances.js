const express = require("express");
const { auth } = require("../middleware/auth");
const {
  getAlliance,
  createAlliance,
  joinAlliance,
  leaveAlliance,
  listAlliances
} = require("../services/allianceService");

const router = express.Router();

router.get("/mine", auth, async (req, res) => {
  const alliance = await getAlliance(req.user.id);
  res.json({ alliance });
});

router.get("/", auth, async (req, res) => {
  const alliances = await listAlliances();
  res.json({ alliances });
});

router.post("/create", auth, async (req, res) => {
  const { name } = req.body || {};
  if (!name) return res.status(400).json({ error: "missing_name" });

  try {
    const alliance = await createAlliance({ playerId: req.user.id, name });
    res.json({ alliance });
  } catch (err) {
    res.status(400).json({ error: "create_failed" });
  }
});

router.post("/join", auth, async (req, res) => {
  const { allianceId } = req.body || {};
  if (!allianceId) return res.status(400).json({ error: "missing_alliance" });

  await joinAlliance({ playerId: req.user.id, allianceId });
  res.json({ ok: true });
});

router.post("/leave", auth, async (req, res) => {
  await leaveAlliance(req.user.id);
  res.json({ ok: true });
});

module.exports = router;
