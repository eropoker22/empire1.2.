const http = require("http");
const path = require("path");
const express = require("express");
const cors = require("cors");
const helmet = require("helmet");

const { loadEnv } = require("./config/env");
const { limiter } = require("./middleware/rateLimit");
const { gameMode } = require("./middleware/gameMode");
const { GAME_MODES } = require("./config/gameModes");
const { initWebSocket } = require("./ws/wsServer");
const { runIncomeTick } = require("./jobs/incomeTick");
const { runParkIncomeTick } = require("./jobs/parkIncomeTick");
const { runRoundTick } = require("./jobs/roundTick");
const { runMigrations } = require("./db/migrate");
const { assertDatabaseSchema } = require("./db/schemaGuard");

const authRoutes = require("./routes/auth");
const playerRoutes = require("./routes/players");
const districtRoutes = require("./routes/districts");
const combatRoutes = require("./routes/combat");
const economyRoutes = require("./routes/economy");
const marketRoutes = require("./routes/market");
const allianceRoutes = require("./routes/alliances");
const roundRoutes = require("./routes/rounds");
const bountyRoutes = require("./routes/bounties");
const adminRoutes = require("./routes/admin");
const configRoutes = require("./routes/config");

loadEnv();

const app = express();

app.use(helmet());
app.use(cors());
app.use(express.json({ limit: "256kb" }));
app.use(express.static(path.resolve(__dirname, "../../client")));
app.use("/img", express.static(path.resolve(__dirname, "../../img")));
app.use(limiter);
app.use(gameMode);

app.get("/health", (req, res) => {
  res.json({ ok: true, status: "running" });
});

app.use("/auth", authRoutes);
app.use("/players", playerRoutes);
app.use("/districts", districtRoutes);
app.use("/combat", combatRoutes);
app.use("/economy", economyRoutes);
app.use("/market", marketRoutes);
app.use("/alliances", allianceRoutes);
app.use("/rounds", roundRoutes);
app.use("/bounties", bountyRoutes);
app.use("/admin", adminRoutes);
app.use("/config", configRoutes);

const port = Number(process.env.PORT || 3000);
const server = http.createServer(app);

initWebSocket(server);

function createModeScheduler({ label, mode, serverKey, intervalMs, runner }) {
  let inFlight = false;
  const safeIntervalMs = Math.max(1000, Math.floor(Number(intervalMs) || 0));

  const tick = () => {
    if (inFlight) return;
    inFlight = true;
    Promise.resolve()
      .then(() => runner(mode, serverKey))
      .catch((err) => console.error(`${label} failed for ${mode}/${serverKey}`, err))
      .finally(() => {
        inFlight = false;
      });
  };

  tick();
  return setInterval(tick, safeIntervalMs);
}

function startSchedulers() {
  Object.entries(GAME_MODES).forEach(([mode, config]) => {
    (config.servers || []).forEach((server) => {
      const serverKey = String(server.key || "").trim().toLowerCase();
      createModeScheduler({
        label: "Income tick",
        mode,
        serverKey,
        intervalMs: Number(config.incomeTickMinutes || 0) * 60 * 1000,
        runner: runIncomeTick
      });
      createModeScheduler({
        label: "Park income tick",
        mode,
        serverKey,
        intervalMs: Number(config.parkIncomeTickSeconds || 0) * 1000,
        runner: runParkIncomeTick
      });
      createModeScheduler({
        label: "Round tick",
        mode,
        serverKey,
        intervalMs: Number(config.roundTickSeconds || 0) * 1000,
        runner: runRoundTick
      });
    });
  });
}

async function bootstrap() {
  await runMigrations();
  await assertDatabaseSchema();
  startSchedulers();
  server.listen(port, () => {
    console.log(`Server listening on port ${port}`);
  });
}

bootstrap().catch((err) => {
  console.error("Server bootstrap failed", err);
  process.exit(1);
});
