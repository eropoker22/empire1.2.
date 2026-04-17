window.EmpireAdminMockDistricts = (() => {
const handcraftedDistricts = [
  { id: "D-A1", name: "Mercury Exchange", zone: "Commercial", server: "war-district-war-alpha", owner: "Vortex_77", alliance: "Black Circuit", buildings: "Kasino, Směnárna, Datové centrum", income: 248000, heat: 312, defenseStatus: "Fortified", activeEvents: "Crackdown watch", trapStatus: "Trap net armed", policePressure: "High", attackHistory: ["15:22 Black Circuit defended raid from Neon Wolves", "14:58 Raid attempt failed", "14:33 District lock contested"], spyingHistory: ["15:10 Spy packet intercepted", "14:42 Recon scan from rival alliance"], activeEffects: ["Defense +12%", "Dirty cash tax +4%"], production: ["Data shards x122/h", "Trap kits x8/h"], rumorFeed: ["Downtown courier route is compromised.", "Bounty broker seen near the exchange."], bountyMarker: "2 active bounty markers" },
  { id: "D-B4", name: "Cinder Works", zone: "Industrial", server: "war-district-war-alpha", owner: "NeroGhost", alliance: "Black Circuit", buildings: "Továrna, Zbrojovka, Sklad", income: 179000, heat: 224, defenseStatus: "Reinforced", activeEvents: "Factory overdrive", trapStatus: "Trap placeholder", policePressure: "Medium", attackHistory: ["15:08 Harbor raid success", "14:11 Ownership retained"], spyingHistory: ["15:01 Suspicious logistics probe"], activeEffects: ["Production +8%"], production: ["Ammo crates x57/h", "Ballistic alloy x24/h"], rumorFeed: ["Convoy route may be compromised."], bountyMarker: "No direct bounty marker" },
  { id: "D-C7", name: "Nova Commons", zone: "Downtown", server: "war-sector-prime", owner: "QbitHunter", alliance: "Neon Wolves", buildings: "Kasino, Strip club, Večerka", income: 202000, heat: 281, defenseStatus: "Critical perimeter", activeEvents: "Siege pressure", trapStatus: "Tripwire grid hot", policePressure: "High", attackHistory: ["15:00 Four-chain raid held", "14:20 Perimeter breach recovered"], spyingHistory: ["14:47 Drone intel leak"], activeEffects: ["Income +15%", "Heat output +10%"], production: ["Dirty cash laundering x188/h"], rumorFeed: ["Secret organization scouts are marking rooftops."], bountyMarker: "District sabotage bounty active" },
  { id: "D-E2", name: "Glass Park", zone: "Park", server: "free-neon-rift-1", owner: "NightFalcon", alliance: "Chrome Saints", buildings: "Fitness Club, Večerka, Restaurace", income: 118000, heat: 92, defenseStatus: "Stable", activeEvents: "Park rush", trapStatus: "Trap placeholder", policePressure: "Low", attackHistory: ["14:02 Fast takeover complete"], spyingHistory: ["13:38 Scout pass detected"], activeEffects: ["Market spread +7%"], production: ["Consumables x72/h"], rumorFeed: ["Ghost Ledger is tracking clean cash flow."], bountyMarker: "No active bounty marker" },
  { id: "D-F6", name: "Railyard Echo", zone: "Residential", server: "free-black-grid-2", owner: "DeltaRush", alliance: "Ghost Ledger", buildings: "Pouliční dealeři, Pašovací tunel, Sklad", income: 99000, heat: 74, defenseStatus: "Watch mode", activeEvents: "Convoy window", trapStatus: "Trap placeholder", policePressure: "Low", attackHistory: ["13:46 Minor raid skirmish"], spyingHistory: ["13:10 Smuggler route mapping"], activeEffects: ["Logistics speed +6%"], production: ["Transit packs x61/h"], rumorFeed: ["Possible convoy ambush tonight."], bountyMarker: "Watcher bounty marker active" },
  { id: "D-H9", name: "Redline Heights", zone: "Residential", server: "war-iron-clash-3", owner: "SilkVector", alliance: "Velvet Crown", buildings: "Autosalon, Restaurace, Energetická stanice", income: 141000, heat: 111, defenseStatus: "Watch towers ready", activeEvents: "Influence drift", trapStatus: "Trap lattice idle", policePressure: "Medium", attackHistory: ["14:50 Influence push repelled"], spyingHistory: ["14:22 Silent crawl detected"], activeEffects: ["Clean cash +9%"], production: ["Vehicle exports x39/h"], rumorFeed: ["A corporation fixer is buying up local scouts."], bountyMarker: "Single bounty tag on owner" },
  { id: "84", name: "District 84", zone: "Residential", server: "hra-alliance-ten-blackout", owner: "Host", alliance: "Zabijáci", buildings: "Pouliční dealeři, Sklad, Večerka", income: 11800, heat: 84, defenseStatus: "Blackout watch", activeEvents: "NOC-BLACKOUT pressure", trapStatus: "Trap net armed", policePressure: "Medium", attackHistory: ["20:30 Blackout shift started", "20:12 Border raid denied"], spyingHistory: ["20:17 Recon ping near sector edge"], activeEffects: ["Night income +6%", "Heat control -8%"], production: ["Dirty cash x19/h", "Supply packs x11/h"], rumorFeed: ["Ledová aliance marks nearby blocks."], bountyMarker: "No active bounty marker" },
  { id: "95", name: "District 95", zone: "Residential", server: "hra-alliance-ten-blackout", owner: "Host", alliance: "Zabijáci", buildings: "Lékárna, Večerka, Sklad", income: 10600, heat: 72, defenseStatus: "Reinforced", activeEvents: "Blackout patrol", trapStatus: "Tripwire grid", policePressure: "Medium", attackHistory: ["20:11 Perimeter stabilized"], spyingHistory: ["20:19 Silent trace captured"], activeEffects: ["Defense +4%"], production: ["Chemicals x9/h"], rumorFeed: ["Poltergeist scouts were seen near block line."], bountyMarker: "Watcher bounty marker active" },
  { id: "102", name: "District 102", zone: "Downtown", server: "hra-alliance-ten-blackout", owner: "Knedlík", alliance: "Zabijáci", buildings: "Směnárna, Kasino, Datové centrum", income: 14200, heat: 58, defenseStatus: "Fortified", activeEvents: "Alliance hold", trapStatus: "Trap lattice idle", policePressure: "Low", attackHistory: ["20:18 Ally hold confirmed"], spyingHistory: ["20:22 Suspicious packet route"], activeEffects: ["Clean cash +8%"], production: ["Data shards x7/h"], rumorFeed: ["District 102 is primary blackout anchor."], bountyMarker: "No active bounty marker" },
  { id: "143", name: "District 143", zone: "Industrial", server: "hra-alliance-ten-blackout", owner: "Poltergeist", alliance: "Ledová aliance", buildings: "Továrna, Zbrojovka, Sklad", income: 12900, heat: 131, defenseStatus: "Critical perimeter", activeEvents: "Police incident", trapStatus: "Killbox primed", policePressure: "High", attackHistory: ["20:21 Police sweep started"], spyingHistory: ["20:23 Signal jammer active"], activeEffects: ["Heat output +12%"], production: ["Ammo crates x14/h"], rumorFeed: ["Police units locked district entrances."], bountyMarker: "District under pressure marker" }
];

const districtZonePlans = {
  "free-neon-rift-1": { Commercial: 34, Industrial: 29, Park: 21, Residential: 46, Downtown: 31 },
  "free-black-grid-2": { Commercial: 34, Industrial: 29, Park: 21, Residential: 46, Downtown: 31 },
  "free-spark-yard-3": { Commercial: 34, Industrial: 29, Park: 21, Residential: 46, Downtown: 31 },
  "hra-alliance-ten-blackout": { Commercial: 34, Industrial: 29, Park: 21, Residential: 46, Downtown: 31 },
  "war-district-war-alpha": { Commercial: 39, Industrial: 34, Park: 23, Residential: 52, Downtown: 38 },
  "war-sector-prime": { Commercial: 40, Industrial: 36, Park: 25, Residential: 55, Downtown: 38 },
  "war-iron-clash-3": { Commercial: 38, Industrial: 34, Park: 24, Residential: 54, Downtown: 38 }
};

const districtNamePools = {
  Commercial: ["Exchange", "Arcade", "Plaza", "Market", "Forum", "Crossing", "Bazaar", "Atrium", "Corner", "Quarter"],
  Industrial: ["Works", "Forge", "Depot", "Yard", "Foundry", "Plant", "Dock", "Refinery", "Mill", "Terminal"],
  Park: ["Gardens", "Park", "Commons", "Run", "Walk", "Fields", "Heights", "Grove", "Terrace", "Meadow"],
  Residential: ["Heights", "Blocks", "Residency", "Row", "Towers", "Gardens", "Courts", "Estate", "Homes", "Lane"],
  Downtown: ["Center", "Plaza", "Boulevard", "Spine", "Square", "Axis", "Hub", "Exchange", "Gate", "Core"]
};

const districtPrefixes = ["Neon", "Black", "Glass", "Redline", "Iron", "Velvet", "Ghost", "Mercury", "Cinder", "Nova", "Chrome", "Cipher", "Silent", "Copper", "Midnight", "Static", "Electric", "Rogue", "Obsidian", "Crimson"];
const districtBuildingPools = {
  Commercial: ["Kasino", "Směnárna", "Restaurace", "Autosalon", "Datové centrum", "Večerka"],
  Industrial: ["Továrna", "Zbrojovka", "Sklad", "Energetická stanice", "Pašovací tunel", "Drug lab"],
  Park: ["Fitness Club", "Restaurace", "Večerka", "Datové centrum", "Lékárna", "Směnárna"],
  Residential: ["Večerka", "Pouliční dealeři", "Sklad", "Lékárna", "Restaurace", "Pašovací tunel"],
  Downtown: ["Kasino", "Strip club", "Směnárna", "Datové centrum", "Autosalon", "Večerka"]
};

function buildDistrictDataset(data, options = {}) {
  const buildZonePlanFromDistrictCount = typeof options.buildZonePlanFromDistrictCount === "function"
    ? options.buildZonePlanFromDistrictCount
    : (() => ({ Commercial: 0, Industrial: 0, Park: 0, Residential: 0, Downtown: 0 }));
  const districts = [...handcraftedDistricts];
  const defenseByMode = { free: ["Stable", "Watch mode", "Rapid barricade"], war: ["Fortified", "Reinforced", "Critical perimeter", "Watch towers ready"] };
  const eventByMode = { free: ["Quick rush", "Park rush", "Fast takeover", "Supply burst", "Convoy window"], war: ["Crackdown watch", "Siege pressure", "Influence drift", "Factory overdrive", "Border lockdown"] };
  const trapByMode = { free: ["Trap placeholder", "Light snare", "Scout tripwire"], war: ["Trap net armed", "Tripwire grid hot", "Trap lattice idle", "Killbox primed"] };
  const policeByMode = { free: ["Low", "Low", "Medium"], war: ["Medium", "High", "High", "Critical"] };
  const baseIncomeByZone = {
    free: { Commercial: 116000, Industrial: 104000, Park: 88000, Residential: 82000, Downtown: 124000 },
    war: { Commercial: 146000, Industrial: 138000, Park: 112000, Residential: 108000, Downtown: 168000 }
  };

  const zonePlansByServer = Object.fromEntries(data.servers.map((server) => {
    const explicitPlan = server && typeof server.zonePlan === "object" ? server.zonePlan : null;
    const fallbackPlan = districtZonePlans[server.id] || buildZonePlanFromDistrictCount(server.districtCount, server.type);
    return [server.id, explicitPlan || fallbackPlan];
  }));

  Object.entries(zonePlansByServer).forEach(([serverId, zones]) => {
    const server = data.servers.find((item) => item.id === serverId);
    if (!server) return;
    const serverPlayers = data.players.filter((item) => item.server === serverId);
    const serverAlliances = data.alliances.filter((item) => item.server === serverId);
    const craftedCounts = handcraftedDistricts.filter((item) => item.server === serverId).reduce((acc, item) => ({ ...acc, [item.zone]: (acc[item.zone] || 0) + 1 }), {});
    const ownerPool = serverPlayers.length ? serverPlayers : [{ nickname: "Unclaimed", alliance: "Neutral", heat: 0 }];

    Object.entries(zones).forEach(([zone, total]) => {
      const remaining = total - (craftedCounts[zone] || 0);
      for (let index = 0; index < remaining; index += 1) {
        const ownerSeed = ownerPool[index % ownerPool.length];
        const allianceSeed = serverAlliances[index % Math.max(serverAlliances.length, 1)];
        const prefix = districtPrefixes[(index + zone.length + serverId.length) % districtPrefixes.length];
        const suffix = districtNamePools[zone][index % districtNamePools[zone].length];
        const districtNumber = String(index + 1).padStart(3, "0");
        const buildingPool = districtBuildingPools[zone];
        const buildingSet = [buildingPool[index % buildingPool.length], buildingPool[(index + 2) % buildingPool.length], buildingPool[(index + 4) % buildingPool.length]].join(", ");
        const isWar = server.type === "war";
        const income = baseIncomeByZone[server.type][zone] + (index % 7) * (isWar ? 4200 : 2600);
        const heat = (isWar ? 88 : 28) + (index % 11) * (isWar ? 14 : 6) + (zone === "Downtown" ? (isWar ? 58 : 22) : zone === "Industrial" ? 18 : 0);

        districts.push({
          id: `${serverId}-D-${zone.slice(0, 2).toUpperCase()}-${districtNumber}`,
          name: `${prefix} ${suffix} ${districtNumber}`,
          zone,
          server: serverId,
          owner: server.status === "maintenance" ? "Unclaimed" : ownerSeed.nickname,
          alliance: server.status === "maintenance" ? "Neutral Control" : (allianceSeed?.name || ownerSeed.alliance || "Independent"),
          buildings: buildingSet,
          income,
          heat,
          defenseStatus: defenseByMode[server.type][index % defenseByMode[server.type].length],
          activeEvents: eventByMode[server.type][index % eventByMode[server.type].length],
          trapStatus: trapByMode[server.type][index % trapByMode[server.type].length],
          policePressure: policeByMode[server.type][index % policeByMode[server.type].length],
          attackHistory: [`${15 - (index % 5)}:${String(50 - (index % 30)).padStart(2, "0")} Raid pressure on ${zone.toLowerCase()} line`, `${14 - (index % 3)}:${String(40 - (index % 25)).padStart(2, "0")} Defense rotation completed`],
          spyingHistory: [`${15 - (index % 4)}:${String(12 + (index % 40)).padStart(2, "0")} Spying sweep near ${prefix.toLowerCase()} corridor`, `${14 - (index % 2)}:${String(8 + (index % 45)).padStart(2, "0")} Recon trace flagged`],
          activeEffects: [zone === "Downtown" ? "Dirty cash +12%" : "Income +6%", isWar ? "Defense +8%" : "Heat decay boost +4%"],
          production: [zone === "Industrial" ? `Ammo crates x${18 + (index % 40)}/h` : `Supply packs x${12 + (index % 26)}/h`, zone === "Commercial" ? `Clean cash tickets x${24 + (index % 18)}/h` : `Trap kits x${4 + (index % 8)}/h`],
          rumorFeed: [`${prefix} route is under watch.`, isWar ? "Rival scouts are mapping district edges." : "Fast session crews are preparing a late push."],
          bountyMarker: heat > (isWar ? 220 : 100) ? "Bounty marker active" : "No active bounty marker"
        });
      }
    });
  });

  return districts;
}

function rebuildDistrictDatasetWithPinnedLayouts(mockData, options = {}) {
  const currentByServer = new Map();
  (Array.isArray(mockData.districts) ? mockData.districts : []).forEach((district) => {
    const serverId = String(district?.server || "");
    if (!serverId) return;
    if (!currentByServer.has(serverId)) currentByServer.set(serverId, []);
    currentByServer.get(serverId).push(district);
  });
  const pinnedServers = new Set();
  currentByServer.forEach((districts, serverId) => {
    const hasPolygon = districts.some((district) => Array.isArray(district?.polygon) && district.polygon.length >= 3);
    if (hasPolygon) pinnedServers.add(serverId);
  });
  const rebuilt = buildDistrictDataset(mockData, options);
  const merged = rebuilt.filter((district) => !pinnedServers.has(String(district?.server || "")));
  pinnedServers.forEach((serverId) => {
    const pinnedDistricts = currentByServer.get(serverId) || [];
    merged.push(...pinnedDistricts);
  });
  mockData.districts = merged;
}



return Object.freeze({
  buildDistrictDataset,
  rebuildDistrictDatasetWithPinnedLayouts,
  districtZonePlans,
  districtNamePools,
  districtPrefixes,
  districtBuildingPools
});
})();
