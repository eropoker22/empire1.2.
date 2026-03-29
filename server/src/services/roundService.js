const { pool } = require("../config/db");
const { ROUND_DAYS, PHASE_DURATION_HOURS, GAME_DAYS_PER_REAL_DAY, GAME_CLOCK_START_HOUR } = require("../config/constants");

const PHASE_DURATION_MS = PHASE_DURATION_HOURS * 60 * 60 * 1000;
const PHASE_KEYS = Object.freeze(["day", "night"]);
const GAME_MINUTES_PER_REAL_MINUTE = GAME_DAYS_PER_REAL_DAY;

function resolveRoundPhase(startedAtValue, nowValue = Date.now()) {
  const startedAtMs = new Date(startedAtValue).getTime();
  const nowMs = Number.isFinite(Number(nowValue)) ? Number(nowValue) : Date.now();
  const elapsedMs = Math.max(0, nowMs - startedAtMs);
  const phaseIndex = Math.floor(elapsedMs / PHASE_DURATION_MS);
  const phaseKey = PHASE_KEYS[phaseIndex % PHASE_KEYS.length] || "day";
  const phaseLabel = phaseKey === "day" ? "DEN" : "NOC";
  const phaseStartedAtMs = startedAtMs + phaseIndex * PHASE_DURATION_MS;
  const phaseEndsAtMs = phaseStartedAtMs + PHASE_DURATION_MS;
  const currentGameDay = Math.floor(elapsedMs / (PHASE_DURATION_MS * 2)) + 1;
  return {
    phaseKey,
    phaseLabel,
    phaseStartedAt: new Date(phaseStartedAtMs),
    phaseEndsAt: new Date(phaseEndsAtMs),
    currentGameDay
  };
}

function resolveRoundClock(startedAtValue, nowValue = Date.now()) {
  const startedAtMs = new Date(startedAtValue).getTime();
  const nowMs = Number.isFinite(Number(nowValue)) ? Number(nowValue) : Date.now();
  const elapsedMs = Math.max(0, nowMs - startedAtMs);
  const elapsedGameMinutes = Math.floor((elapsedMs / (60 * 1000)) * GAME_MINUTES_PER_REAL_MINUTE);
  const totalMinutes = GAME_CLOCK_START_HOUR * 60 + elapsedGameMinutes;
  const minutesInDay = ((totalMinutes % 1440) + 1440) % 1440;
  const hours = Math.floor(minutesInDay / 60);
  const minutes = minutesInDay % 60;
  return {
    minutesInDay,
    hours,
    minutes,
    label: `${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}`
  };
}

async function getOrCreateActiveRound() {
  const res = await pool.query("SELECT * FROM rounds WHERE active = true ORDER BY started_at DESC LIMIT 1");
  if (res.rowCount > 0) return res.rows[0];

  const startedAt = new Date();
  const endsAt = new Date(startedAt.getTime() + ROUND_DAYS * 24 * 60 * 60 * 1000);
  const insert = await pool.query(
    "INSERT INTO rounds (started_at, ends_at, active) VALUES ($1, $2, true) RETURNING *",
    [startedAt, endsAt]
  );

  return insert.rows[0];
}

async function getRoundStatus() {
  const round = await getOrCreateActiveRound();
  const now = new Date();
  const endsAt = new Date(round.ends_at);
  const msLeft = Math.max(0, endsAt - now);
  const daysRemaining = Math.ceil(msLeft / (24 * 60 * 60 * 1000));
  const phase = resolveRoundPhase(round.started_at, now.getTime());
  const clock = resolveRoundClock(round.started_at, now.getTime());
  const totalGameDays = ROUND_DAYS * GAME_DAYS_PER_REAL_DAY;

  return {
    roundStartedAt: round.started_at,
    roundEndsAt: round.ends_at,
    daysRemaining,
    currentPhaseKey: phase.phaseKey,
    currentPhaseLabel: phase.phaseLabel,
    currentSubPhaseKey: null,
    currentSubPhaseLabel: null,
    phaseEndsAt: phase.phaseEndsAt,
    phaseDurationMs: PHASE_DURATION_MS,
    currentGameDay: Math.min(totalGameDays, phase.currentGameDay),
    totalGameDays,
    currentGameTimeLabel: clock.label,
    currentGameMinutesInDay: clock.minutesInDay,
    gameClockStartHour: GAME_CLOCK_START_HOUR,
    gameMinutesPerRealMinute: GAME_MINUTES_PER_REAL_MINUTE
  };
}

module.exports = { getRoundStatus, getOrCreateActiveRound };
