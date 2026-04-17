const { pool } = require("../../config/db");
const { assertDatabaseSchema } = require("../../db/schemaGuard");
const { getGameModeConfig } = require("../../config/gameModes");
const { toNumber, pct, formatRelativeActivity, splitAcrossServers } = require("./shared");

async function ensurePlayerModeSchema() {
  return assertDatabaseSchema();
}

async function buildLivePayload(gameMode) {
  await ensurePlayerModeSchema();

  const modeConfig = getGameModeConfig(gameMode);
  const modeServers = (modeConfig.servers || []).map((server, index) => ({
    id: server.key,
    key: server.key,
    name: server.name || `SERVER-${index + 1}`,
    status: "live",
    maxPlayers: server.capacity || modeConfig.maxPlayers || 3000
  }));

  const [playersAggRes, attacksRes, heatRes, alliancesRes, playersRes, alliancesBoardRes] = await Promise.all([
    pool.query(
      `SELECT server_key,
              COUNT(*)::int AS total_players,
              COALESCE(SUM(clean_money), 0)::bigint AS clean_total,
              COALESCE(SUM(dirty_money), 0)::bigint AS dirty_total
       FROM players
       WHERE game_mode = $1
       GROUP BY server_key`,
      [gameMode]
    ),
    pool.query(
      `SELECT p.server_key,
              date_trunc('hour', c.created_at) AS hour_bucket,
              COUNT(*)::int AS attacks_count
         FROM combat_logs c
         JOIN players p ON p.id = c.attacker_player_id
        WHERE p.game_mode = $1
          AND p.server_key = c.server_key
          AND c.created_at >= NOW() - INTERVAL '24 hours'
        GROUP BY p.server_key, hour_bucket
        ORDER BY p.server_key ASC, hour_bucket ASC`,
      [gameMode]
    ),
    pool.query(
      `SELECT server_key,
         COUNT(*) FILTER (WHERE heat < 25)::int AS tier_0_24,
         COUNT(*) FILTER (WHERE heat >= 25 AND heat < 75)::int AS tier_25_74,
         COUNT(*) FILTER (WHERE heat >= 75 AND heat < 150)::int AS tier_75_149,
         COUNT(*) FILTER (WHERE heat >= 150 AND heat < 300)::int AS tier_150_299,
         COUNT(*) FILTER (WHERE heat >= 300)::int AS tier_300_plus
       FROM players
       WHERE game_mode = $1
       GROUP BY server_key`,
      [gameMode]
    ),
    pool.query(
      `SELECT a.id, a.name, a.created_at, a.server_key,
              COUNT(p.id)::int AS members,
              COALESCE(SUM(p.clean_money + p.dirty_money), 0)::bigint AS total_money
         FROM alliances a
         LEFT JOIN players p
           ON p.alliance_id = a.id
          AND p.game_mode = a.game_mode
          AND p.server_key = a.server_key
        WHERE a.game_mode = $1
        GROUP BY a.id, a.name, a.created_at, a.server_key
        ORDER BY members DESC, total_money DESC
        LIMIT 24`,
      [gameMode]
    ),
    pool.query(
      `SELECT p.id, p.username, p.gang_name, p.clean_money, p.dirty_money, p.heat, p.updated_at,
              p.server_key,
              COALESCE(a.name, 'Bez aliance') AS alliance_name,
              COALESCE((SELECT COUNT(*) FROM districts d WHERE d.owner_player_id = p.id AND d.game_mode = p.game_mode AND d.server_key = p.server_key), 0)::int AS district_count,
              COALESCE((SELECT COUNT(*) FROM bounties b WHERE b.target_player_id = p.id AND b.status = 'active' AND b.game_mode = p.game_mode AND b.server_key = p.server_key), 0)::int AS report_count
         FROM players p
         LEFT JOIN alliances a ON a.id = p.alliance_id AND a.game_mode = p.game_mode AND a.server_key = p.server_key
        WHERE p.game_mode = $1
        ORDER BY district_count DESC, (p.clean_money + p.dirty_money) DESC
        LIMIT 120`,
      [gameMode]
    ),
    pool.query(
      `SELECT a.id, a.name, a.created_at, a.server_key,
              COUNT(p.id)::int AS members,
              COALESCE(SUM(p.clean_money + p.dirty_money), 0)::bigint AS total_money,
              COALESCE(SUM(CASE WHEN d.owner_player_id IS NOT NULL THEN 1 ELSE 0 END), 0)::int AS district_count
         FROM alliances a
         LEFT JOIN players p ON p.alliance_id = a.id AND p.game_mode = a.game_mode AND p.server_key = a.server_key
         LEFT JOIN districts d ON d.owner_player_id = p.id AND d.game_mode = p.game_mode AND d.server_key = p.server_key
        WHERE a.game_mode = $1
        GROUP BY a.id, a.name, a.created_at, a.server_key
        ORDER BY district_count DESC, members DESC
        LIMIT 16`,
      [gameMode]
    )
  ]);

  const serverAggByKey = new Map(
    playersAggRes.rows.map((row) => [
      String(row.server_key || "").trim().toLowerCase(),
      {
        totalPlayers: toNumber(row.total_players, 0),
        cleanTotal: toNumber(row.clean_total, 0),
        dirtyTotal: toNumber(row.dirty_total, 0)
      }
    ])
  );
  const totalPlayers = Array.from(serverAggByKey.values()).reduce((sum, row) => sum + row.totalPlayers, 0);
  const templates = modeServers;

  const topAllianceByServer = new Map();
  alliancesRes.rows.forEach((row) => {
    const serverKey = String(row.server_key || "").trim().toLowerCase();
    if (!serverKey || topAllianceByServer.has(serverKey)) return;
    topAllianceByServer.set(serverKey, {
      name: row.name || "-",
      members: toNumber(row.members, 0)
    });
  });

  const servers = templates.map((template, index) => {
    const serverKey = String(template.id || template.key || "").trim().toLowerCase();
    const agg = serverAggByKey.get(serverKey) || { totalPlayers: 0, cleanTotal: 0, dirtyTotal: 0 };
    const playersCount = agg.totalPlayers;
    const maxPlayers = toNumber(template.maxPlayers, 3000);
    const dominance = Math.min(96, Math.max(0, pct(playersCount, Math.max(maxPlayers, 1))));
    const leader = topAllianceByServer.get(serverKey);
    return {
      id: serverKey,
      name: template.name || `SERVER-${index + 1}`,
      type: gameMode,
      status: playersCount === 0 ? "maintenance" : template.status || "live",
      players: playersCount,
      maxPlayers,
      districtCount: gameMode === "free" ? 161 : 190,
      cleanCashPerHour: agg.cleanTotal,
      dirtyCashPerHour: agg.dirtyTotal,
      activeRaids: 0,
      sessionLength: gameMode === "free" ? `${20 + index * 5}m` : `${1 + index}d ${10 + index}h`,
      dominance,
      leader: leader?.members > 0 ? leader.name : "-"
    };
  });

  const last24h = Array.from({ length: 24 }).map((_, idx) => {
    const date = new Date(Date.now() - (23 - idx) * 60 * 60 * 1000);
    date.setMinutes(0, 0, 0);
    return date.toISOString();
  });
  const attacksByServer = new Map();
  attacksRes.rows.forEach((row) => {
    const serverKey = String(row.server_key || "").trim().toLowerCase();
    if (!attacksByServer.has(serverKey)) {
      attacksByServer.set(serverKey, new Map());
    }
    attacksByServer.get(serverKey).set(new Date(row.hour_bucket).toISOString(), toNumber(row.attacks_count, 0));
  });
  const heatByServer = new Map(
    heatRes.rows.map((row) => [
      String(row.server_key || "").trim().toLowerCase(),
      [
        toNumber(row.tier_0_24, 0),
        toNumber(row.tier_25_74, 0),
        toNumber(row.tier_75_149, 0),
        toNumber(row.tier_150_299, 0),
        toNumber(row.tier_300_plus, 0)
      ]
    ])
  );

  const players = playersRes.rows.map((row, index) => {
    const reports = toNumber(row.report_count, 0);
    const heatValue = toNumber(row.heat, 0);
    const suspicion = heatValue >= 300 || reports >= 4 ? "critical" : heatValue >= 150 || reports >= 2 ? "warning" : "none";
    const server = row.server_key || servers[index % servers.length]?.id || servers[0]?.id || `${gameMode}-alpha`;
    return {
      id: row.id,
      nickname: row.username,
      server,
      faction: row.gang_name || "Bez frakce",
      alliance: row.alliance_name || "Bez aliance",
      districts: toNumber(row.district_count, 0),
      cleanCash: toNumber(row.clean_money, 0),
      dirtyCash: toNumber(row.dirty_money, 0),
      heat: heatValue,
      online: (Date.now() - new Date(row.updated_at).getTime()) < (5 * 60 * 1000),
      lastActivity: formatRelativeActivity(row.updated_at),
      lastActivityMinutes: Math.max(1, Math.round((Date.now() - new Date(row.updated_at).getTime()) / 60000)),
      reports,
      suspicion,
      profile: `Profil ${row.username}`,
      economy: `Clean +$${Math.max(1, Math.round(toNumber(row.clean_money, 0) * 0.01))}/h • Dirty +$${Math.max(1, Math.round(toNumber(row.dirty_money, 0) * 0.01))}/h.`,
      districtInfo: `${toNumber(row.district_count, 0)} districtů pod kontrolou.`,
      production: "Live snapshot z DB.",
      attacks: `${reports + Math.max(1, Math.round(heatValue / 30))} útoků / 24h.`,
      spyOps: `${Math.max(0, Math.round(heatValue / 80))} špehování / 24h.`,
      spying: `${Math.max(0, Math.round(heatValue / 80))} špehování / 24h.`,
      heatHistory: `${Math.max(0, heatValue - 35)} → ${heatValue} dnes.`,
      lastLogs: `Aktualizace ${formatRelativeActivity(row.updated_at)}`
    };
  });

  const allDistrictsInAlliances = alliancesBoardRes.rows.reduce((acc, row) => acc + toNumber(row.district_count, 0), 0);
  const alliances = alliancesBoardRes.rows.map((row, index) => {
    const dominance = allDistrictsInAlliances > 0
      ? pct(toNumber(row.district_count, 0), allDistrictsInAlliances)
      : pct(toNumber(row.members, 0), Math.max(1, totalPlayers));
    const server = row.server_key || servers[index % servers.length]?.id || servers[0]?.id || `${gameMode}-alpha`;
    return {
      id: row.id,
      name: row.name,
      server,
      members: toNumber(row.members, 0),
      districts: toNumber(row.district_count, 0),
      dominance,
      power: toNumber(row.total_money, 0),
      cashFlow: `$${Math.max(0, Math.round(toNumber(row.total_money, 0) * 0.02)).toLocaleString("cs-CZ")}/h`,
      conflicts: Math.max(0, Math.round(dominance / 7)),
      founded: row.created_at ? new Date(row.created_at).toISOString().slice(0, 10) : "N/A",
      status: dominance >= 70 ? "High dominance alert" : "Stable"
    };
  });

  const dashboardByServer = {};
  servers.forEach((server, index) => {
    const serverKey = String(server.id || "").trim().toLowerCase();
    const agg = serverAggByKey.get(serverKey) || { totalPlayers: 0, cleanTotal: 0, dirtyTotal: 0 };
    const attackByHour = attacksByServer.get(serverKey) || new Map();
    const attacks24h = last24h.map((key) => attackByHour.get(key) || 0);
    const playersTrend = splitAcrossServers(agg.totalPlayers, 12).map((value, trendIndex) => (
      Math.max(0, value + (trendIndex * Math.max(1, Math.round(Math.max(agg.totalPlayers, 1) * 0.01))))
    ));
    const heat = heatByServer.get(serverKey) || [0, 0, 0, 0, 0];
    const alliancesOnServer = alliancesBoardRes.rows.filter((row) => String(row.server_key || "").trim().toLowerCase() === serverKey).length;
    const police = [
      toNumber(Math.round(heat[3] * 0.18 + heat[4] * 0.45), 0),
      toNumber(Math.round(attacks24h.slice(-6).reduce((acc, x) => acc + x, 0) * 0.4), 0),
      toNumber(Math.round((agg.dirtyTotal / 100000) * 0.07), 0),
      toNumber(Math.round(Math.max(alliancesOnServer, 1) * 1.5), 0)
    ];
    const alerts = [];
    if (attacks24h.slice(-3).reduce((acc, x) => acc + x, 0) >= 40) {
      alerts.push({ severity: "critical", title: "Attack spike", detail: "Live telemetry: výrazný nárůst útoků za poslední 3 hodiny." });
    }
    if (heat[4] >= 10) {
      alerts.push({ severity: "critical", title: "Heat 300+ trend", detail: `Live telemetry: ${heat[4]} hráčů překročilo tier 300+.` });
    }
    if (agg.dirtyTotal > agg.cleanTotal) {
      alerts.push({ severity: "warning", title: "Dirty cash dominance", detail: "Live telemetry: dirty cash převyšuje clean cash flow." });
    }
    if (!alerts.length) {
      alerts.push({ severity: "warning", title: "Stabilní stav", detail: "Aktuálně bez kritických incidentů." });
    }
    dashboardByServer[server.id] = {
      meta: {
        serverName: server.name,
        status: String(server.status || "maintenance").toUpperCase(),
        uptime: gameMode === "free" ? `${1 + index}d ${5 + index}h` : `${8 + index}d ${10 + index}h`
      },
      playersTrend,
      attacks24h: attacks24h.slice(-12),
      clean: agg.cleanTotal,
      dirty: agg.dirtyTotal,
      heat,
      police,
      alerts
    };
    server.activeRaids = attacks24h.at(-1) || 0;
  });

  return {
    source: "live",
    generatedAt: new Date().toISOString(),
    mode: gameMode,
    defaultServerId: servers[0]?.id || `${gameMode}-alpha`,
    servers,
    players,
    alliances,
    dashboardByServer
  };
}

module.exports = {
  buildLivePayload
};
