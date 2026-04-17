window.Empire = window.Empire || {};
window.Empire.Demo = window.Empire.Demo || {};

window.Empire.Demo.createPlayerScenarioData = function createPlayerScenarioData(deps = {}) {
  const {
    localAllianceRequestPlayerId = "guest-player",
    defaultAllianceDescription = "Aliance která všechny zabije",
    defaultAllianceIconKey = "lightning",
    normalizeOwnerName = (value) => String(value || "").trim().toLowerCase(),
    getCachedProfile = () => null,
    readStoredGangName = () => ""
  } = deps;

  function buildDefaultGuestAllianceState() {
    return {
      activeAllianceId: null,
      alliances: [
        {
          id: "alliance-neon-vipers",
          name: "Neon Vipers",
          description: "Rychlé přesuny, tlak na periferii a čisté vpády pod neonem.",
          icon_key: "lightning",
          owner_player_id: "owner-neon-vipers",
          bonus_income_pct: 8,
          bonus_influence_pct: 4,
          heat_control_text: "-6% heat",
          members: [
            { id: "owner-neon-vipers", username: "Raven", gang_name: "North Vultures", alliance_ready_at: new Date().toISOString() },
            { id: "member-neon-lira", username: "Lira", gang_name: "Chrome Echo", alliance_ready_at: null }
          ]
        },
        {
          id: "alliance-black-sun",
          name: "Black Sun Pact",
          description: "Tichá infiltrace, vydírání a chirurgické zásahy proti rivalům.",
          icon_key: "eye_triangle",
          owner_player_id: "owner-black-sun",
          bonus_income_pct: 5,
          bonus_influence_pct: 7,
          heat_control_text: "-10% heat",
          members: [
            { id: "owner-black-sun", username: "Hex", gang_name: "Dusk Syndicate", alliance_ready_at: new Date().toISOString() }
          ]
        }
      ],
      requests: [],
      memberInvites: [],
      kickVotes: [],
      notifications: [],
      auditLogs: [],
      chat: [
        { time: "09:12", author: "Raven", text: "Potřebujeme posily na sever." },
        { time: "09:14", author: "Lira", text: "Posílám tým, 5 minut." }
      ]
    };
  }

  function buildDefaultAllianceChatMessages() {
    return [
      { time: "09:12", author: "Raven", text: "Potřebujeme posily na sever." },
      { time: "09:14", author: "Lira", text: "Posílám tým, 5 minut." }
    ];
  }

  function buildDefaultServerChatMessages(participants = []) {
    const safeParticipants = Array.isArray(participants) ? participants.filter(Boolean) : [];
    const first = safeParticipants[0] || "Mariah";
    const second = safeParticipants[1] || "Willy";
    return [
      { time: "09:10", author: first, text: "Kdo drží severní sektor?" },
      { time: "09:12", author: second, text: "Jdu na útok za 5 minut." },
      { time: "09:15", author: "System", text: "Server chat je aktivní pro všechny hráče." }
    ];
  }

  function buildAllianceTenBlackoutLocalAllianceState(ownerName, allyName) {
    const allianceId = "scenario-blackout-alliance";
    const allianceName = "Zabijáci";
    const nowIso = new Date().toISOString();
    return {
      activeAllianceId: allianceId,
      alliances: [
        {
          id: allianceId,
          name: allianceName,
          description: "Blackout dvojice drzi sektor 102 a vede nocni kontrolu mesta.",
          icon_key: "lightning",
          owner_player_id: localAllianceRequestPlayerId,
          bonus_income_pct: 6,
          bonus_influence_pct: 5,
          heat_control_text: "-8% heat",
          members: [
            {
              id: localAllianceRequestPlayerId,
              username: ownerName,
              gang_name: getCachedProfile()?.gangName || ownerName,
              alliance_ready_at: nowIso
            },
            {
              id: "scenario-blackout-ally",
              username: allyName,
              gang_name: "Piškoti",
              alliance_ready_at: null
            }
          ]
        }
      ],
      requests: [
        {
          id: "scenario-blackout-poltergeist-request",
          alliance_id: allianceId,
          player_id: "scenario-blackout-poltergeist",
          username: "Poltergeist",
          gang_name: "District 143 + 121"
        }
      ],
      memberInvites: [],
      kickVotes: [],
      notifications: [],
      auditLogs: [
        {
          id: "scenario-blackout-audit-1",
          alliance_id: allianceId,
          message: "Poltergeist poslal zadost o vstup do aliance.",
          created_at: nowIso
        }
      ],
      chat: [
        { time: "20:12", author: allyName, text: "Drzim district 102. Blackout jede." },
        { time: "20:18", author: "System", text: "Poltergeist zadal o vstup do aliance." }
      ]
    };
  }

  function buildNightTwentyWarLocalAllianceState(ownerName, districts) {
    const nowIso = new Date().toISOString();
    const safeDistricts = Array.isArray(districts) ? districts : [];
    const playerName = String(ownerName || "Ty").trim() || "Ty";
    const playerAllianceName = safeDistricts.find((district) => normalizeOwnerName(district?.owner) === normalizeOwnerName(playerName))?.ownerAllianceName || "Neon Syndicate";
    const alliedOwners = Array.from(new Set(
      safeDistricts
        .filter((district) => String(district?.ownerAllianceName || "").trim() === String(playerAllianceName).trim())
        .map((district) => String(district?.owner || "").trim())
        .filter(Boolean)
    )).slice(0, 2);
    if (!alliedOwners.some((name) => normalizeOwnerName(name) === normalizeOwnerName(playerName))) {
      alliedOwners.unshift(playerName);
    }
    const members = alliedOwners.slice(0, 2).map((name, index) => ({
      id: index === 0 ? localAllianceRequestPlayerId : `scenario-night-war-member-${index}`,
      username: name,
      gang_name: index === 0 ? (getCachedProfile()?.gangName || name) : `${name} Crew`,
      alliance_ready_at: nowIso
    }));
    return {
      activeAllianceId: "scenario-night-war-alliance",
      alliances: [
        {
          id: "scenario-night-war-alliance",
          name: playerAllianceName,
          description: "Noční válka 20 hráčů. Plně obsazená mapa a vysoký tlak útoků.",
          icon_key: "lightning",
          owner_player_id: localAllianceRequestPlayerId,
          bonus_income_pct: 5,
          bonus_influence_pct: 4,
          heat_control_text: "-4% heat",
          members
        }
      ],
      requests: [],
      memberInvites: [],
      kickVotes: [],
      notifications: [],
      auditLogs: [
        {
          id: "scenario-night-war-audit-1",
          alliance_id: "scenario-night-war-alliance",
          message: "Noční server stav aktivován: 20 hráčů, 20 útoků, 2 policejní razie.",
          created_at: nowIso
        }
      ],
      chat: [
        { time: "20:26", author: "System", text: "Noční režim aktivní. Mapa plně obsazená." },
        { time: "20:27", author: "System", text: "Aktivních útoků: 20. Policejní razie: 2." }
      ]
    };
  }

  function resolveScenarioLocalAllianceState({ scenarioKey = "", ownerName = "", districts = [] } = {}) {
    const safeScenarioKey = String(scenarioKey || "").trim().toLowerCase();
    const safeOwnerName = String(ownerName || "").trim() || readStoredGangName() || "Ty";
    if (safeScenarioKey === "alliance-ten-blackout") {
      return buildAllianceTenBlackoutLocalAllianceState(safeOwnerName, "Knedlík");
    }
    if (safeScenarioKey === "night-20-war") {
      return buildNightTwentyWarLocalAllianceState(safeOwnerName, districts);
    }
    if (safeScenarioKey === "onboarding-20-edge") {
      return {
        ...buildDefaultGuestAllianceState(),
        activeAllianceId: null,
        alliances: [],
        chat: []
      };
    }
    return buildDefaultGuestAllianceState();
  }

  return {
    buildDefaultGuestAllianceState,
    buildDefaultAllianceChatMessages,
    buildDefaultServerChatMessages,
    buildAllianceTenBlackoutLocalAllianceState,
    buildNightTwentyWarLocalAllianceState,
    resolveScenarioLocalAllianceState,
    defaults: {
      localAllianceRequestPlayerId,
      defaultAllianceDescription,
      defaultAllianceIconKey
    }
  };
};
