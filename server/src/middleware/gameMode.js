const { getGameModeConfig, normalizeGameMode, normalizeServerKey } = require("../config/gameModes");

function gameMode(req, res, next) {
  const headerMode = req.headers["x-game-mode"];
  const queryMode = req.query?.mode;
  const bodyMode = req.body?.mode;
  const headerServerKey = req.headers["x-server-key"];
  const queryServerKey = req.query?.serverKey || req.query?.server_key;
  const bodyServerKey = req.body?.serverKey || req.body?.server_key;
  const resolvedMode = normalizeGameMode(req.user?.gameMode || headerMode || queryMode || bodyMode || "war");
  req.gameMode = resolvedMode;
  req.serverKey = normalizeServerKey(
    resolvedMode,
    req.user?.serverKey || headerServerKey || queryServerKey || bodyServerKey || req.serverKey || ""
  );
  req.gameModeConfig = getGameModeConfig(resolvedMode);
  return next();
}

module.exports = { gameMode };
