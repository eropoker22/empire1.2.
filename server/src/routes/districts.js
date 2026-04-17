const express = require("express");
const { auth } = require("../middleware/auth");
const { listDistricts } = require("../services/districtService");

const router = express.Router();

router.get("/", auth, async (req, res) => {
  const districts = await listDistricts(req.gameMode, req.serverKey);
  res.json({ districts });
});

module.exports = router;
