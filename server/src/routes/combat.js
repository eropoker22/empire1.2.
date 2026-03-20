const express = require("express");
const { auth } = require("../middleware/auth");
const { attackDistrict } = require("../services/combatService");
const { listDistricts } = require("../services/districtService");
const { getRoomRegistry } = require("../ws/wsServer");
const { broadcastMapUpdate } = require("../ws/wsHandlers");

const router = express.Router();

router.post("/attack", auth, async (req, res) => {
  const { districtId } = req.body || {};
  if (!districtId) return res.status(400).json({ error: "missing_district" });

  try {
    const result = await attackDistrict({ playerId: req.user.id, districtId });
    if (!result.ok) return res.status(400).json({ error: result.error });

    const districts = await listDistricts();
    broadcastMapUpdate({ rooms: getRoomRegistry(), update: { districts } });

    return res.json({
      message: result.success ? "Attack succeeded." : "Attack failed.",
      success: result.success,
      influenceChange: result.influenceChange
    });
  } catch (err) {
    return res.status(500).json({ error: "attack_failed" });
  }
});

module.exports = router;
