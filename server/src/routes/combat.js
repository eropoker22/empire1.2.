const express = require("express");
const { auth } = require("../middleware/auth");
const { attackDistrict } = require("../services/combatService");
const { listDistricts } = require("../services/districtService");
const { getRoomRegistry } = require("../ws/wsServer");
const { broadcastMapUpdate } = require("../ws/wsHandlers");

const router = express.Router();
const ATTACK_MARKER_DURATION_MS = 8 * 60 * 1000;

router.post("/attack", auth, async (req, res) => {
  const { districtId } = req.body || {};
  if (!districtId) return res.status(400).json({ error: "missing_district" });

  try {
    const result = await attackDistrict({ playerId: req.user.id, districtId });
    if (!result.ok) return res.status(400).json({ error: result.error });

    const districts = await listDistricts();
    broadcastMapUpdate({
      rooms: getRoomRegistry(),
      update: {
        districts,
        attackEvent: {
          targetDistrictId: districtId,
          sourceDistrictId: result.sourceDistrictId ?? null,
          durationMs: ATTACK_MARKER_DURATION_MS,
          source: "combat"
        }
      }
    });

    return res.json({
      message: result.destroyed
        ? "District destroyed. It is now neutral and unusable."
        : (result.success ? "Attack succeeded." : "Attack failed."),
      success: result.success,
      destroyed: Boolean(result.destroyed),
      influenceChange: result.influenceChange,
      heatGain: result.heatGain || 0,
      sourceDistrictId: result.sourceDistrictId ?? null
    });
  } catch (err) {
    return res.status(500).json({ error: "attack_failed" });
  }
});

module.exports = router;
