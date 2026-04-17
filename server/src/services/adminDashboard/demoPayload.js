const MOCK_SERVER_TEMPLATES = {
  war: [
    { id: "war-eu-1", name: "WAR-EU-1", status: "live", maxPlayers: 3000 },
    { id: "war-eu-2", name: "WAR-EU-2", status: "locked", maxPlayers: 3000 },
    { id: "war-us-1", name: "WAR-US-1", status: "maintenance", maxPlayers: 3000 }
  ],
  free: [
    { id: "free-eu-1", name: "FREE-EU-1", status: "live", maxPlayers: 3000 },
    { id: "free-eu-2", name: "FREE-EU-2", status: "live", maxPlayers: 3000 },
    { id: "free-us-1", name: "FREE-US-1", status: "maintenance", maxPlayers: 3000 }
  ]
};

function buildDemoPayload(gameMode) {
  const templates = MOCK_SERVER_TEMPLATES[gameMode] || MOCK_SERVER_TEMPLATES.war;
  const now = new Date();
  const players = templates.flatMap((server, index) => (
    Array.from({ length: 6 }).map((_, offset) => {
      const idNum = (index + 1) * 100 + offset + 1;
      const heat = 40 + (index * 35) + (offset * 11);
      const reports = offset % 3;
      return {
        id: `P-${gameMode.toUpperCase()}-${idNum}`,
        nickname: `${gameMode}-player-${idNum}`,
        server: server.id,
        faction: ["Mafián", "Kartel", "Hackeři", "Motorkářský gang", "Pouliční gang", "Soukromá armáda"][offset % 6],
        alliance: `Alliance-${index + 1}`,
        districts: 35 + (offset * 9),
        cleanCash: 250000 + (offset * 32000),
        dirtyCash: 120000 + (offset * 18000),
        heat,
        online: offset % 2 === 0,
        lastActivity: offset % 2 === 0 ? "před 12s" : "před 8m",
        reports,
        suspicion: heat >= 250 || reports >= 4 ? "critical" : heat >= 120 || reports >= 2 ? "warning" : "none",
        profile: `Rank ${22 + offset} • Demo profil hráče.`,
        economy: `Clean +$${(42 + offset) * 1000}/h • Dirty +$${(21 + offset) * 1000}/h.`,
        districtInfo: "Test district line.",
        production: "Test production pipeline.",
        attacks: `${12 + offset} útoků / 24h.`,
        spyOps: `${4 + offset} špehování / 24h.`,
        heatHistory: `${Math.max(0, heat - 60)} → ${heat} dnes.`,
        lastLogs: "Demo audit log entry."
      };
    })
  ));

  const alliances = templates.map((server, index) => ({
    id: `${server.id}-alliance-${index + 1}`,
    name: `Alliance-${index + 1}`,
    server: server.id,
    members: 16 + (index * 4),
    districts: 120 + (index * 27),
    dominance: 42 + (index * 12),
    power: 122000 + (index * 34000),
    cashFlow: `$${260 + (index * 70)}k/h`,
    conflicts: 3 + index,
    founded: "2026-03-01",
    status: index === 1 ? "High dominance alert" : "Stable"
  }));

  const dashboardByServer = {};
  templates.forEach((server, index) => {
    const basePlayers = 950 + (index * 370);
    const playersTrend = Array.from({ length: 12 }).map((_, trendIdx) => basePlayers + (trendIdx * (32 + index * 4)));
    const attacks24h = Array.from({ length: 12 }).map((_, trendIdx) => 16 + (trendIdx * (4 + index)));
    const clean = 4200000 + (index * 1400000);
    const dirty = 2200000 + (index * 900000);
    dashboardByServer[server.id] = {
      meta: {
        serverName: server.name,
        status: server.status.toUpperCase(),
        uptime: `${4 + index}d ${8 + index}h ${(10 + index) % 60}m`
      },
      playersTrend,
      attacks24h,
      clean,
      dirty,
      heat: [540 + index * 90, 290 + index * 64, 130 + index * 38, 62 + index * 22, 21 + index * 7],
      police: [6 + index * 2, 20 + index * 8, 12 + index * 3, 4 + index],
      alerts: [
        { severity: "critical", title: `${server.name}: Attack spike`, detail: "Demo telemetry: nárůst útoků na clusteru districtů." },
        { severity: "warning", title: `${server.name}: Heat trend`, detail: "Demo telemetry: heat tier 150+ stoupá posledních 30 minut." }
      ]
    };
  });

  return {
    source: "demo",
    generatedAt: now.toISOString(),
    mode: gameMode,
    defaultServerId: templates[0].id,
    servers: templates.map((server, index) => ({
      ...server,
      type: gameMode,
      players: dashboardByServer[server.id].playersTrend.at(-1) || 0,
      districtCount: gameMode === "free" ? 161 : 190,
      cleanCashPerHour: dashboardByServer[server.id].clean,
      dirtyCashPerHour: dashboardByServer[server.id].dirty,
      activeRaids: dashboardByServer[server.id].attacks24h.at(-1) || 0,
      sessionLength: `${index + 1}d ${(8 + index).toString().padStart(2, "0")}h`,
      dominance: 41 + (index * 11),
      leader: alliances[index]?.name || "-"
    })),
    players,
    alliances,
    dashboardByServer
  };
}

module.exports = {
  MOCK_SERVER_TEMPLATES,
  buildDemoPayload
};
