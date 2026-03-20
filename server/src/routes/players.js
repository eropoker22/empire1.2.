const express = require("express");
const { auth } = require("../middleware/auth");
const { getPlayerProfile, setPlayerStructure } = require("../services/playerService");
const { createToken } = require("../services/authService");

const router = express.Router();

router.get("/me", auth, async (req, res) => {
  const profile = await getPlayerProfile(req.user.id);
  if (!profile) return res.status(404).json({ error: "not_found" });

  res.json({
    id: profile.id,
    username: profile.username,
    gangName: profile.gang_name,
    structure: profile.gang_structure || null,
    money: Number(profile.money),
    influence: Number(profile.influence_points),
    alliance: profile.alliance_name,
    districts: Number(profile.district_count)
  });
});

router.post("/structure", auth, async (req, res) => {
  const { structure } = req.body || {};
  if (!structure) return res.status(400).json({ error: "missing_structure" });

  const saved = await setPlayerStructure(req.user.id, structure);
  const profile = await getPlayerProfile(req.user.id);
  const token = createToken(profile);
  res.json({ structure: saved, token });
});

module.exports = router;
