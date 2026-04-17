window.Empire = window.Empire || {};
window.Empire.UIRound = window.Empire.UIRound || {};

window.Empire.UIRound.createStatusController = function createStatusController(deps = {}) {
  const {
    getRoundPhaseTimer = () => null,
    setRoundPhaseTimer = () => {},
    getRoundStatusState = () => null,
    setRoundStatusState = () => {},
    getRoundStatusOverride = () => null,
    updateFreeCtaVisibility = () => {}
  } = deps;

  function stopRoundPhaseTicker() {
    const timer = getRoundPhaseTimer();
    if (!timer) return;
    clearInterval(timer);
    setRoundPhaseTimer(null);
  }

  function resolveRoundPhaseSnapshot(round) {
    if (!round?.roundStartedAt || !round?.phaseDurationMs) return null;
    const startedAtMs = new Date(round.roundStartedAt).getTime();
    const phaseDurationMs = Math.max(1, Math.floor(Number(round.phaseDurationMs) || 0));
    if (!Number.isFinite(startedAtMs) || !Number.isFinite(phaseDurationMs)) return null;
    const nowMs = Date.now();
    const elapsedMs = Math.max(0, nowMs - startedAtMs);
    const phaseIndex = Math.floor(elapsedMs / phaseDurationMs);
    const phaseKey = phaseIndex % 2 === 0 ? "day" : "night";
    const phaseLabel = phaseKey === "day" ? "DEN" : "NOC";
    const currentGameDay = Math.max(1, Math.floor(elapsedMs / (phaseDurationMs * 2)) + 1);
    const totalGameDays = Math.max(1, Math.floor(Number(round.totalGameDays) || 0));
    return { phaseKey, phaseLabel, currentGameDay: Math.min(totalGameDays, currentGameDay) };
  }

  function buildRoundStatusPresetForMode(mode) {
    const normalizedMode = String(mode || "").trim().toLowerCase();
    if (normalizedMode === "day") {
      return { currentGameDay: 1, timeLabel: "09:15", phaseKey: "day", phaseLabel: "DEN", phaseStartedAt: Date.now() };
    }
    if (normalizedMode === "blackout") {
      return {
        currentGameDay: 3, timeLabel: "20:30", phaseKey: "night", subPhaseKey: "blackout", phaseLabel: "NOC-BLACKOUT", phaseStartedAt: Date.now()
      };
    }
    return { currentGameDay: 3, timeLabel: "20:30", phaseKey: "night", phaseLabel: "NOC", phaseStartedAt: Date.now() };
  }

  function resolveEffectiveRoundMode(phaseKey, subPhaseKey = "") {
    const normalizedPhaseKey = String(phaseKey || "").trim().toLowerCase();
    const normalizedSubPhaseKey = String(subPhaseKey || "").trim().toLowerCase();
    if (normalizedSubPhaseKey === "blackout" && normalizedPhaseKey === "night") {
      return { mapMode: "blackout", phaseLabel: "NOC-BLACKOUT" };
    }
    return { mapMode: normalizedPhaseKey === "day" ? "day" : "night", phaseLabel: normalizedPhaseKey === "day" ? "DEN" : "NOC" };
  }

  function formatRoundClockLabel(minutesInDay) {
    const safeMinutes = ((Math.floor(Number(minutesInDay) || 0) % 1440) + 1440) % 1440;
    const hours = Math.floor(safeMinutes / 60);
    const minutes = safeMinutes % 60;
    return `${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}`;
  }

  function resolveRoundClockSnapshot(round) {
    if (!round?.roundStartedAt) return null;
    const startedAtMs = new Date(round.roundStartedAt).getTime();
    const gameClockStartHour = Math.max(0, Math.floor(Number(round.gameClockStartHour) || 6));
    const gameMinutesPerRealMinute = Math.max(1, Number(round.gameMinutesPerRealMinute) || 3);
    if (!Number.isFinite(startedAtMs)) return null;
    const elapsedMs = Math.max(0, Date.now() - startedAtMs);
    const elapsedGameMinutes = Math.floor((elapsedMs / (60 * 1000)) * gameMinutesPerRealMinute);
    const minutesInDay = (gameClockStartHour * 60 + elapsedGameMinutes) % 1440;
    return { minutesInDay, label: formatRoundClockLabel(minutesInDay) };
  }

  function renderRoundStatusState() {
    const roundStatusOverride = getRoundStatusOverride();
    const roundStatusState = getRoundStatusState();
    const override = roundStatusOverride && typeof roundStatusOverride === "object" ? roundStatusOverride : null;
    const fallbackTotalGameDays = 30;
    if (!roundStatusState && !override) return;
    const roundEnds = document.getElementById("round-ends");
    const roundDays = document.getElementById("round-days");
    const roundGameDay = document.getElementById("round-game-day");
    const roundGameTime = document.getElementById("round-game-time");
    const roundPhase = document.getElementById("round-phase");
    const phaseSnapshot = roundStatusState ? resolveRoundPhaseSnapshot(roundStatusState) : null;
    const clockSnapshot = roundStatusState ? resolveRoundClockSnapshot(roundStatusState) : null;
    const basePhaseKey = override?.phaseKey || phaseSnapshot?.phaseKey || roundStatusState?.currentPhaseKey || "";
    const activeSubPhaseKey = override?.subPhaseKey || roundStatusState?.currentSubPhaseKey || "";
    const effectiveMode = resolveEffectiveRoundMode(basePhaseKey, activeSubPhaseKey);
    const displayPhaseKey = effectiveMode.mapMode || "";
    const displayPhaseLabel = override?.phaseLabel || roundStatusState?.currentSubPhaseLabel || effectiveMode.phaseLabel || "-";
    const displayGameDay = override?.currentGameDay || phaseSnapshot?.currentGameDay || 1;
    const displayClockLabel = override?.timeLabel || clockSnapshot?.label || roundStatusState?.currentGameTimeLabel || "09:15";
    const totalGameDays = Math.max(1, Math.floor(Number(roundStatusState?.totalGameDays) || fallbackTotalGameDays));
    if (roundEnds) roundEnds.textContent = roundStatusState?.roundEndsAt || "-";
    if (roundDays) roundDays.textContent = roundStatusState?.roundRemainingLabel || (roundStatusState?.daysRemaining != null ? roundStatusState.daysRemaining : "-");
    if (roundGameDay) roundGameDay.textContent = phaseSnapshot || override ? `${displayGameDay}/${totalGameDays}` : "-";
    if (roundGameTime) roundGameTime.textContent = displayClockLabel;
    if (roundPhase) roundPhase.textContent = displayPhaseLabel;
    if (displayPhaseKey) window.Empire.Map?.setMapMode?.(displayPhaseKey);
    updateFreeCtaVisibility();
  }

  function startRoundPhaseTicker() {
    const roundStatusState = getRoundStatusState();
    stopRoundPhaseTicker();
    if (!roundStatusState?.roundStartedAt || !roundStatusState?.phaseDurationMs) return;
    renderRoundStatusState();
    setRoundPhaseTimer(setInterval(() => renderRoundStatusState(), 1000));
  }

  function updateRound(round) {
    if (!round) return;
    setRoundStatusState({ ...round });
    renderRoundStatusState();
    startRoundPhaseTicker();
  }

  function getRoundStatusSnapshot() {
    const roundStatusOverride = getRoundStatusOverride();
    const roundStatusState = getRoundStatusState();
    const override = roundStatusOverride && typeof roundStatusOverride === "object" ? roundStatusOverride : null;
    const state = roundStatusState && typeof roundStatusState === "object" ? roundStatusState : null;
    if (!state && !override) return null;
    const source = override || state;
    const phaseSnapshot = state ? resolveRoundPhaseSnapshot(state) : null;
    const clockSnapshot = state ? resolveRoundClockSnapshot(state) : null;
    const basePhaseKey = source?.phaseKey || phaseSnapshot?.phaseKey || state?.currentPhaseKey || "";
    const activeSubPhaseKey = source?.subPhaseKey || state?.currentSubPhaseKey || "";
    const effectiveMode = resolveEffectiveRoundMode(basePhaseKey, activeSubPhaseKey);
    const phaseDurationMs = Math.max(0, Math.floor(Number(state?.phaseDurationMs || source?.phaseDurationMs) || 0));
    const roundStartedAt = Number(state?.roundStartedAt || source?.phaseStartedAt || source?.roundStartedAt || 0);
    const currentPhaseIndex = roundStartedAt && phaseDurationMs ? Math.floor(Math.max(0, Date.now() - roundStartedAt) / phaseDurationMs) : 0;
    const phaseStartedAt = roundStartedAt && phaseDurationMs ? roundStartedAt + (currentPhaseIndex * phaseDurationMs) : null;
    return {
      ...(state || {}),
      ...(override || {}),
      currentPhaseKey: effectiveMode.mapMode || basePhaseKey || "",
      currentSubPhaseKey: activeSubPhaseKey || "",
      currentSubPhaseLabel: source?.phaseLabel || state?.currentSubPhaseLabel || effectiveMode.phaseLabel || "",
      currentGameDay: source?.currentGameDay || phaseSnapshot?.currentGameDay || 1,
      currentGameTimeLabel: source?.timeLabel || clockSnapshot?.label || state?.currentGameTimeLabel || "09:15",
      phaseStartedAt,
      phaseDurationMs,
      roundStartedAt,
      currentPhaseIndex
    };
  }

  return {
    stopRoundPhaseTicker,
    resolveRoundPhaseSnapshot,
    buildRoundStatusPresetForMode,
    resolveEffectiveRoundMode,
    formatRoundClockLabel,
    resolveRoundClockSnapshot,
    renderRoundStatusState,
    startRoundPhaseTicker,
    updateRound,
    getRoundStatusSnapshot
  };
};
