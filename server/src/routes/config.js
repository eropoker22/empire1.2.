const express = require("express");
const { getPublicGameplayRules } = require("../config/gameplayRules");

const router = express.Router();

router.get("/gameplay-rules", (req, res) => {
  return res.json(getPublicGameplayRules({
    gameMode: req.gameMode,
    serverKey: req.serverKey
  }));
});

module.exports = router;
