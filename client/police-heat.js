      // ==================================================
      // 1) CENTRALIZED CONFIG
      // ==================================================
      const HEAT_TIERS = [
        {
          id: 1,
          name: "Nízký heat",
          minHeat: 0,
          maxHeat: 24,
          policeAggression: 1,
          messageFrequency: 10 * 60 * 1000,
          raidChanceMultiplier: 0.15,
          description: "Lehké sledování. Hráč je téměř pod radarem."
        },
        {
          id: 2,
          name: "Podezřelý",
          minHeat: 25,
          maxHeat: 74,
          policeAggression: 2,
          messageFrequency: 8 * 60 * 1000,
          raidChanceMultiplier: 0.35,
          description: "Občasné kontroly a první varování."
        },
        {
          id: 3,
          name: "Známý problém",
          minHeat: 75,
          maxHeat: 149,
          policeAggression: 3,
          messageFrequency: 6 * 60 * 1000,
          raidChanceMultiplier: 0.6,
          description: "Drobné zásahy, menší razie, častější tlak."
        },
        {
          id: 4,
          name: "Rizikový cíl",
          minHeat: 150,
          maxHeat: 299,
          policeAggression: 4,
          messageFrequency: 4 * 60 * 1000,
          raidChanceMultiplier: 0.9,
          description: "Cílené útoky, prohledávání a pokuty."
        },
        {
          id: 5,
          name: "Prioritní cíl",
          minHeat: 300,
          maxHeat: 499,
          policeAggression: 5,
          messageFrequency: 3 * 60 * 1000,
          raidChanceMultiplier: 1.25,
          description: "Časté razie, uzávěry districtů a zabavování."
        },
        {
          id: 6,
          name: "Veřejný nepřítel",
          minHeat: 500,
          maxHeat: 999,
          policeAggression: 6,
          messageFrequency: 2 * 60 * 1000,
          raidChanceMultiplier: 1.65,
          description: "Agresivní zásahy, blokace a těžké postihy."
        },
        {
          id: 7,
          name: "Totální hon",
          minHeat: 1000,
          maxHeat: Number.POSITIVE_INFINITY,
          policeAggression: 7,
          messageFrequency: 90 * 1000,
          raidChanceMultiplier: 2.15,
          description: "Koordinované operace a téměř permanentní tlak."
        }
      ];

      const BUILDING_POLICE_PRIORITY = {
        "Drug Lab": 10,
        "Street Dealers": 9,
        "Gambling Hall": 8,
        Casino: 7,
        "Exchange Office": 7,
        Warehouse: 6,
        "Apartment Block": 5,
        "Convenience Store": 3,
        Restaurant: 2
      };

      const HEAT_DECAY_BY_TIER = {
        1: 4.0,
        2: 3.0,
        3: 2.0,
        4: 1.5,
        5: 1.0,
        6: 0.6,
        7: 0.25
      };

      const OPERATION_CATEGORIES = {
        minor: { cooldownMs: 2 * 60 * 1000 },
        medium: { cooldownMs: 6 * 60 * 1000 },
        major: { cooldownMs: 12 * 60 * 1000 },
        coordinated: { cooldownMs: 20 * 60 * 1000 }
      };

      const OPERATION_TYPE_CONFIG = {
        warning_notice: { minTier: 1, weight: 11, category: "minor", durationMs: 0, severity: "low" },
        district_control: { minTier: 2, weight: 9, category: "minor", durationMs: 15 * 60 * 1000, severity: "medium" },
        cash_seizure: { minTier: 3, weight: 7, category: "medium", durationMs: 0, severity: "medium" },
        warehouse_raid: { minTier: 4, weight: 6, category: "major", durationMs: 30 * 60 * 1000, severity: "high" },
        district_lock: { minTier: 5, weight: 7, category: "major", durationMs: 40 * 60 * 1000, severity: "high" },
        apartment_search: { minTier: 4, weight: 6, category: "medium", durationMs: 2 * 60 * 60 * 1000, severity: "high" },
        drug_seizure: { minTier: 3, weight: 8, category: "medium", durationMs: 0, severity: "medium" },
        dirty_cash_seizure: { minTier: 4, weight: 8, category: "major", durationMs: 0, severity: "high" },
        building_shutdown: { minTier: 4, weight: 7, category: "major", durationMs: 35 * 60 * 1000, severity: "high" },
        coordinated_operation: { minTier: 6, weight: 10, category: "coordinated", durationMs: 55 * 60 * 1000, severity: "critical" }
      };

      const POLICE_MESSAGE_TEMPLATES = {
        warning_notice: [
          "Policie zaznamenala zvýšenou nelegální aktivitu ve tvých oblastech.",
          "District {districtName} byl zařazen do zvýšeného dohledu.",
          "Bezpečnostní oddělení monitoruje pohyb financí a drog ve tvé síti."
        ],
        district_control: [
          "Policejní hlídky provedly kontrolu districtu {districtName}.",
          "V districtu {districtName} probíhá zvýšená bezpečnostní akce."
        ],
        drug_seizure: [
          "Během noční operace byla zabavena část zakázaných látek.",
          "Narkotická jednotka zasáhla tvůj distribuční řetězec."
        ],
        district_lock: [
          "Policie uzavřela district {districtName} kvůli mimořádné bezpečnostní akci.",
          "District {districtName} je dočasně pod policejní blokádou."
        ],
        building_shutdown: [
          "Jedna z tvých budov byla uzavřena z důvodu podezření na nelegální provoz.",
          "Regulační jednotka dočasně vypnula provoz budovy {buildingType}."
        ],
        apartment_search: [
          "Bytové bloky v districtu {districtName} byly prohledány a část nelegálních obyvatel byla odvezena.",
          "Bezpečnostní jednotka provedla razii v obytné zóně districtu {districtName}."
        ],
        dirty_cash_seizure: [
          "Finanční jednotka zabavila část podezřelých prostředků.",
          "Tok špinavých peněz byl částečně zablokován."
        ],
        coordinated_operation: [
          "Tvé impérium bylo označeno za prioritní cíl. Spuštěna koordinovaná operace.",
          "Probíhá vícefázový zásah proti tvé síti napříč distrikty."
        ]
      };

      const POLICE_TICK_MS = 15 * 1000;
      const MAX_MESSAGES = 80;
      const MAX_OP_LOG = 120;

      // ==================================================
      // 2) DATA MODEL
      // ==================================================
      const state = {
        player: {
          id: "player-1",
          name: "Raven",
          cash: 480000,
          dirtyCash: 355000,
          influence: 740,
          gangMembers: 1260,
          totalHeat: 180,
          heatTier: 4,
          ownedDistrictIds: ["d-1", "d-2", "d-3", "d-4"],
          ownedBuildings: [],
          policeMessages: [],
          activePolicePenalties: [],
          seizedDrugs: 0,
          lockedDistricts: [],
          drugInventory: {
            neonDust: 240,
            pulseShot: 74,
            velvetSmoke: 58,
            ghostSerum: 31,
            overdriveX: 12
          },
          activeDrugEffects: {
            ghostSerum: { endsAt: Date.now() + 30 * 60 * 1000 }
          },
          lastIllegalActionAt: Date.now() - 15 * 60 * 1000,
          _heatDecayRemainder: 0,
          _lastHeatDecayAt: Date.now()
        },
        districts: [
          {
            id: "d-1",
            name: "Neon Bazaar",
            ownerId: "player-1",
            isLockedByPolice: false,
            lockedUntil: 0,
            gossipLog: [],
            policeStatus: "Watch",
            policePressure: 26,
            buildingsInDistrict: [],
            incomeModifier: 1,
            incomePenaltyUntil: 0,
            gangProductionModifier: 1,
            apartmentPenaltyUntil: 0,
            lastPoliceActionAt: 0
          },
          {
            id: "d-2",
            name: "Iron Harbor",
            ownerId: "player-1",
            isLockedByPolice: false,
            lockedUntil: 0,
            gossipLog: [],
            policeStatus: "Watch",
            policePressure: 38,
            buildingsInDistrict: [],
            incomeModifier: 1,
            incomePenaltyUntil: 0,
            gangProductionModifier: 1,
            apartmentPenaltyUntil: 0,
            lastPoliceActionAt: 0
          },
          {
            id: "d-3",
            name: "Violet Spine",
            ownerId: "player-1",
            isLockedByPolice: false,
            lockedUntil: 0,
            gossipLog: [],
            policeStatus: "Watch",
            policePressure: 32,
            buildingsInDistrict: [],
            incomeModifier: 1,
            incomePenaltyUntil: 0,
            gangProductionModifier: 1,
            apartmentPenaltyUntil: 0,
            lastPoliceActionAt: 0
          },
          {
            id: "d-4",
            name: "Shadow Quarter",
            ownerId: "player-1",
            isLockedByPolice: false,
            lockedUntil: 0,
            gossipLog: [],
            policeStatus: "Watch",
            policePressure: 47,
            buildingsInDistrict: [],
            incomeModifier: 1,
            incomePenaltyUntil: 0,
            gangProductionModifier: 1,
            apartmentPenaltyUntil: 0,
            lastPoliceActionAt: 0
          }
        ],
        buildings: [
          { id: "b-1", type: "Drug Lab", districtId: "d-1", ownerId: "player-1", level: 4, isDisabled: false, disabledUntil: 0 },
          { id: "b-2", type: "Street Dealers", districtId: "d-1", ownerId: "player-1", level: 4, isDisabled: false, disabledUntil: 0 },
          { id: "b-3", type: "Gambling Hall", districtId: "d-2", ownerId: "player-1", level: 3, isDisabled: false, disabledUntil: 0 },
          { id: "b-4", type: "Casino", districtId: "d-2", ownerId: "player-1", level: 3, isDisabled: false, disabledUntil: 0 },
          { id: "b-5", type: "Exchange Office", districtId: "d-3", ownerId: "player-1", level: 3, isDisabled: false, disabledUntil: 0 },
          { id: "b-6", type: "Warehouse", districtId: "d-3", ownerId: "player-1", level: 3, isDisabled: false, disabledUntil: 0 },
          { id: "b-7", type: "Apartment Block", districtId: "d-4", ownerId: "player-1", level: 4, isDisabled: false, disabledUntil: 0 },
          { id: "b-8", type: "Restaurant", districtId: "d-4", ownerId: "player-1", level: 2, isDisabled: false, disabledUntil: 0 },
          { id: "b-9", type: "Convenience Store", districtId: "d-1", ownerId: "player-1", level: 2, isDisabled: false, disabledUntil: 0 }
        ],
        policeSystem: {
          globalAlertLevel: 1,
          lastPoliceTick: Date.now(),
          lastMessageTick: 0,
          activeOperations: [],
          operationHistory: [],
          raidCooldownsByPlayer: {},
          policeMessageTemplates: POLICE_MESSAGE_TEMPLATES,
          heatTierConfig: HEAT_TIERS
        },
        autoTick: true
      };

      // ==================================================
      // 3) UTILITY
      // ==================================================
      function nowMs() {
        return Date.now();
      }

      function clamp(value, min, max) {
        return Math.min(max, Math.max(min, value));
      }

      function randomInt(min, max) {
        const lo = Math.ceil(min);
        const hi = Math.floor(max);
        return Math.floor(Math.random() * (hi - lo + 1)) + lo;
      }

      function pickRandom(list) {
        if (!Array.isArray(list) || !list.length) return null;
        return list[randomInt(0, list.length - 1)];
      }

      function weightedPick(items, weightSelector) {
        const pool = Array.isArray(items) ? items : [];
        const weighted = pool
          .map((item) => ({ item, w: Math.max(0, Number(weightSelector(item) || 0)) }))
          .filter((entry) => entry.w > 0);
        const totalWeight = weighted.reduce((sum, entry) => sum + entry.w, 0);
        if (!totalWeight) return null;
        let roll = Math.random() * totalWeight;
        for (let i = 0; i < weighted.length; i += 1) {
          roll -= weighted[i].w;
          if (roll <= 0) return weighted[i].item;
        }
        return weighted[weighted.length - 1].item;
      }

      function formatTime(timestamp) {
        if (!timestamp) return "-";
        const date = new Date(timestamp);
        return date.toLocaleTimeString("cs-CZ", { hour: "2-digit", minute: "2-digit", second: "2-digit" });
      }

      function formatRemaining(ms) {
        const totalSec = Math.max(0, Math.floor(ms / 1000));
        const hh = Math.floor(totalSec / 3600);
        const mm = Math.floor((totalSec % 3600) / 60);
        const ss = totalSec % 60;
        if (hh > 0) return `${hh}h ${mm}m`;
        if (mm > 0) return `${mm}m ${ss}s`;
        return `${ss}s`;
      }

      function getPlayerBuildings(player, buildings) {
        return buildings.filter((building) => building.ownerId === player.id);
      }

      function getDistrictById(districts, districtId) {
        return districts.find((district) => district.id === districtId) || null;
      }

      function getTotalDrugs(player) {
        const inv = player.drugInventory || {};
        return Object.values(inv).reduce((sum, value) => sum + Math.max(0, Number(value || 0)), 0);
      }

      function isGhostSerumActive(player) {
        const effect = player.activeDrugEffects?.ghostSerum;
        return Boolean(effect && Number(effect.endsAt || 0) > nowMs());
      }

      // ==================================================
      // 4) REQUIRED CORE FUNCTIONS
      // ==================================================
      function getHeatTier(totalHeat) {
        const heat = Math.max(0, Number(totalHeat || 0));
        const tier = HEAT_TIERS.find((entry) => heat >= entry.minHeat && heat <= entry.maxHeat);
        return tier || HEAT_TIERS[HEAT_TIERS.length - 1];
      }

      function updateHeatTier(player) {
        const previous = getHeatTier(player.heatTier ? HEAT_TIERS[player.heatTier - 1]?.minHeat : player.totalHeat);
        const next = getHeatTier(player.totalHeat);
        player.heatTier = next.id;
        state.policeSystem.globalAlertLevel = next.policeAggression;

        if (previous.id !== next.id) {
          const escalating = next.id > previous.id;
          createPoliceMessage(player, {
            type: "heat_escalation",
            severity: escalating ? (next.id >= 6 ? "critical" : "high") : "medium",
            title: escalating ? "Heat eskaluje" : "Heat klesá",
            text: escalating
              ? `Tvoje hledanost vstoupila do úrovně "${next.name}". Policie zvyšuje tlak.`
              : `Tvoje hledanost klesla na úroveň "${next.name}". Tlak policie se částečně snižuje.`
          });
        }
      }

      function getHeatProgress(player) {
        const tier = getHeatTier(player.totalHeat);
        const nextTier = HEAT_TIERS.find((entry) => entry.id === tier.id + 1) || null;
        if (!nextTier) {
          return {
            currentTier: tier,
            nextTier: null,
            progressPct: 100,
            remainingHeat: 0
          };
        }
        const currentRangeStart = tier.minHeat;
        const currentRangeEnd = nextTier.minHeat;
        const ratio = (player.totalHeat - currentRangeStart) / Math.max(1, currentRangeEnd - currentRangeStart);
        return {
          currentTier: tier,
          nextTier,
          progressPct: clamp(Math.round(ratio * 100), 0, 100),
          remainingHeat: Math.max(0, nextTier.minHeat - player.totalHeat)
        };
      }

      function getHeatDecayRate(player) {
        const tier = getHeatTier(player.totalHeat);
        let ratePerHour = Number(HEAT_DECAY_BY_TIER[tier.id] || 0);

        const activeOps = state.policeSystem.activeOperations.filter(
          (operation) => operation.playerId === player.id && operation.endsAt > nowMs()
        );
        if (activeOps.length > 0) {
          ratePerHour *= 0.35;
        }

        const inactiveMs = nowMs() - Number(player.lastIllegalActionAt || 0);
        if (inactiveMs < 5 * 60 * 1000) {
          ratePerHour *= 0.3;
        } else if (inactiveMs > 35 * 60 * 1000) {
          ratePerHour *= 1.2;
        }

        if (isGhostSerumActive(player)) {
          ratePerHour += 0.8;
        }

        return Math.max(0, ratePerHour);
      }

      function applyHeatDecay(player) {
        const currentTime = nowMs();
        const lastDecayAt = Number(player._lastHeatDecayAt || currentTime);
        const elapsedHours = Math.max(0, (currentTime - lastDecayAt) / 3600000);
        player._lastHeatDecayAt = currentTime;
        if (elapsedHours <= 0 || player.totalHeat <= 0) return 0;

        const decayRate = getHeatDecayRate(player);
        const rawDecay = decayRate * elapsedHours + Number(player._heatDecayRemainder || 0);
        const decayWhole = Math.floor(rawDecay);
        player._heatDecayRemainder = rawDecay - decayWhole;

        if (decayWhole > 0) {
          player.totalHeat = Math.max(0, player.totalHeat - decayWhole);
          updateHeatTier(player);
        }
        return decayWhole;
      }

      function calculateDistrictPolicePressure(district, player, buildings) {
        if (!district || district.ownerId !== player.id) return 0;
        const districtBuildings = buildings.filter((building) => building.districtId === district.id && building.ownerId === player.id);
        const heatFactor = player.totalHeat * 0.08;
        const buildingFactor = districtBuildings.reduce(
          (sum, building) => sum + Number(BUILDING_POLICE_PRIORITY[building.type] || 1),
          0
        ) * 1.35;
        const disabledFactor = districtBuildings.some((building) => building.isDisabled) ? 8 : 0;
        const lockFactor = district.isLockedByPolice ? 14 : 0;
        const recencyFactor = nowMs() - Number(district.lastPoliceActionAt || 0) < 25 * 60 * 1000 ? 10 : 0;
        const rawPressure = 4 + heatFactor + buildingFactor + disabledFactor + lockFactor + recencyFactor;
        const smoothed = district.policePressure * 0.55 + rawPressure * 0.45;
        return clamp(Math.round(smoothed), 0, 100);
      }

      function updateDistrictPolicePressure(player, districts, buildings) {
        districts.forEach((district) => {
          if (district.ownerId !== player.id) return;
          const pressure = calculateDistrictPolicePressure(district, player, buildings);
          district.policePressure = pressure;
          if (pressure < 20) district.policeStatus = "Calm";
          else if (pressure < 45) district.policeStatus = "Watch";
          else if (pressure < 70) district.policeStatus = "Under Surveillance";
          else district.policeStatus = "High Alert";
        });
      }

      function createPoliceMessage(player, data) {
        const payload = data || {};
        const message = {
          id: `msg-${Date.now()}-${Math.random().toString(16).slice(2, 8)}`,
          playerId: player.id,
          districtId: payload.districtId || null,
          createdAt: nowMs(),
          type: payload.type || "warning_notice",
          title: payload.title || "Policejní hlášení",
          text: payload.text || "Bezpečnostní složky monitorují situaci.",
          severity: payload.severity || "low",
          read: false
        };
        player.policeMessages.unshift(message);
        if (player.policeMessages.length > MAX_MESSAGES) {
          player.policeMessages.length = MAX_MESSAGES;
        }

        if (message.districtId) {
          const district = getDistrictById(state.districts, message.districtId);
          if (district) {
            district.gossipLog.unshift({
              at: message.createdAt,
              text: message.text,
              severity: message.severity
            });
            district.gossipLog = district.gossipLog.slice(0, 30);
          }
        }
        return message;
      }

      function maybeSendPoliceMessage(player) {
        const tier = getHeatTier(player.totalHeat);
        const currentTime = nowMs();
        if (currentTime - state.policeSystem.lastMessageTick < tier.messageFrequency) {
          return null;
        }

        const ownedDistricts = state.districts.filter((district) => district.ownerId === player.id);
        const hottestDistrict = ownedDistricts.sort((a, b) => b.policePressure - a.policePressure)[0] || null;
        const avgPressure = ownedDistricts.length
          ? ownedDistricts.reduce((sum, district) => sum + district.policePressure, 0) / ownedDistricts.length
          : 0;

        const messageChance = clamp(0.16 + tier.policeAggression * 0.07 + avgPressure / 280, 0.05, 0.95);
        if (Math.random() > messageChance) return null;

        const typesByTier = {
          1: ["warning_notice"],
          2: ["warning_notice", "district_control"],
          3: ["warning_notice", "district_control", "drug_seizure"],
          4: ["district_control", "dirty_cash_seizure", "building_shutdown"],
          5: ["district_control", "district_lock", "dirty_cash_seizure", "building_shutdown"],
          6: ["district_lock", "building_shutdown", "apartment_search", "coordinated_operation"],
          7: ["coordinated_operation", "district_lock", "dirty_cash_seizure"]
        };
        const chosenType = pickRandom(typesByTier[tier.id] || ["warning_notice"]);
        const templates = state.policeSystem.policeMessageTemplates[chosenType] || state.policeSystem.policeMessageTemplates.warning_notice;
        const textTemplate = pickRandom(templates) || "Policie sleduje tvoje impérium.";
        const districtName = hottestDistrict ? hottestDistrict.name : "neznámý district";
        const text = textTemplate
          .replaceAll("{districtName}", districtName)
          .replaceAll("{buildingType}", "neznámá budova");

        const severity = tier.id >= 6 ? "high" : tier.id >= 4 ? "medium" : "low";
        const title = chosenType === "coordinated_operation"
          ? "Mimořádná operace"
          : chosenType === "district_lock"
            ? "Uzávěra districtu"
            : chosenType === "building_shutdown"
              ? "Dočasné uzavření budovy"
              : "Policejní varování";

        state.policeSystem.lastMessageTick = currentTime;
        return createPoliceMessage(player, {
          districtId: hottestDistrict?.id || null,
          type: chosenType,
          title,
          text,
          severity
        });
      }

      function choosePoliceTarget(player, districts, buildings) {
        const ownedDistricts = districts.filter((district) => district.ownerId === player.id);
        if (!ownedDistricts.length) return null;

        const district = weightedPick(ownedDistricts, (entry) => 8 + entry.policePressure * 1.7);
        if (!district) return null;

        const districtBuildings = buildings.filter(
          (building) => building.ownerId === player.id && building.districtId === district.id
        );
        const building = weightedPick(districtBuildings, (entry) => {
          const priority = Number(BUILDING_POLICE_PRIORITY[entry.type] || 1);
          const activeBoost = entry.isDisabled ? 0.6 : 1;
          return priority * activeBoost;
        });

        return { district, building };
      }

      function choosePoliceOperationType(player, target, heatTier) {
        const tier = heatTier || getHeatTier(player.totalHeat);
        const candidates = Object.entries(OPERATION_TYPE_CONFIG)
          .filter(([, config]) => tier.id >= config.minTier)
          .map(([type, config]) => {
            let weight = Number(config.weight || 0);
            if (type === "warehouse_raid" && target?.building?.type === "Warehouse") weight *= 1.9;
            if (type === "apartment_search" && target?.building?.type === "Apartment Block") weight *= 2.1;
            if (type === "building_shutdown" && target?.building) {
              weight *= 1 + Number(BUILDING_POLICE_PRIORITY[target.building.type] || 1) / 10;
            }
            if (type === "coordinated_operation" && tier.id >= 7) weight *= 1.45;
            return { type, config, weight };
          })
          .filter((entry) => entry.weight > 0);

        if (!candidates.length) return "warning_notice";
        const picked = weightedPick(candidates, (entry) => entry.weight);
        return picked ? picked.type : "warning_notice";
      }

      function ensureCooldownStore(playerId) {
        if (!state.policeSystem.raidCooldownsByPlayer[playerId]) {
          state.policeSystem.raidCooldownsByPlayer[playerId] = {
            byType: {},
            byCategory: {},
            lastOperationAt: 0
          };
        }
        return state.policeSystem.raidCooldownsByPlayer[playerId];
      }

      function isOperationOffCooldown(player, operationType, force) {
        if (force) return true;
        const currentTime = nowMs();
        const tier = getHeatTier(player.totalHeat);
        const store = ensureCooldownStore(player.id);
        const config = OPERATION_TYPE_CONFIG[operationType];
        if (!config) return false;
        const categoryConfig = OPERATION_CATEGORIES[config.category];
        const minInterval = clamp(9 - tier.policeAggression, 2, 9) * 60 * 1000;
        if (currentTime - Number(store.lastOperationAt || 0) < minInterval) return false;
        if (currentTime - Number(store.byType[operationType] || 0) < categoryConfig.cooldownMs) return false;
        if (currentTime - Number(store.byCategory[config.category] || 0) < categoryConfig.cooldownMs * 0.75) return false;
        return true;
      }

      function markOperationCooldown(player, operationType) {
        const currentTime = nowMs();
        const store = ensureCooldownStore(player.id);
        const config = OPERATION_TYPE_CONFIG[operationType];
        if (!config) return;
        store.lastOperationAt = currentTime;
        store.byType[operationType] = currentTime;
        store.byCategory[config.category] = currentTime;
      }

      function maybeTriggerPoliceOperation(player, districts, buildings, options = {}) {
        const force = Boolean(options.force);
        const tier = getHeatTier(player.totalHeat);

        if (!force) {
          const ownedDistricts = districts.filter((district) => district.ownerId === player.id);
          const averagePressure = ownedDistricts.length
            ? ownedDistricts.reduce((sum, district) => sum + district.policePressure, 0) / ownedDistricts.length
            : 0;
          const pressureFactor = averagePressure / 220;
          const baseChance = (0.045 * tier.policeAggression + pressureFactor * 0.35) * tier.raidChanceMultiplier;
          const chance = clamp(baseChance, 0.03, 0.88);
          if (Math.random() > chance) return null;
        }

        const target = choosePoliceTarget(player, districts, buildings);
        if (!target) return null;
        let operationType = choosePoliceOperationType(player, target, tier);
        if (!isOperationOffCooldown(player, operationType, force)) {
          const fallback = ["warning_notice", "district_control", "drug_seizure"].find((type) =>
            isOperationOffCooldown(player, type, force)
          );
          if (!fallback) return null;
          operationType = fallback;
        }

        const opConfig = OPERATION_TYPE_CONFIG[operationType];
        const operation = {
          id: `op-${Date.now()}-${Math.random().toString(16).slice(2, 8)}`,
          playerId: player.id,
          districtId: target.district?.id || null,
          type: operationType,
          startedAt: nowMs(),
          endsAt: nowMs() + Number(opConfig.durationMs || 0),
          result: "pending",
          severity: opConfig.severity
        };
        executePoliceOperation(player, operation, districts, buildings);
        markOperationCooldown(player, operationType);
        return operation;
      }

      function seizePlayerDrugs(player, severity) {
        const severityRatio = {
          low: 0.08,
          medium: 0.16,
          high: 0.28,
          critical: 0.4
        };
        const totalDrugs = getTotalDrugs(player);
        if (totalDrugs <= 0) return { seized: 0, detail: {} };
        const targetSeize = Math.max(1, Math.floor(totalDrugs * Number(severityRatio[severity] || 0.12)));

        const priorityOrder = ["overdriveX", "ghostSerum", "velvetSmoke", "pulseShot", "neonDust"];
        const detail = {};
        let remaining = targetSeize;

        for (let i = 0; i < priorityOrder.length && remaining > 0; i += 1) {
          const key = priorityOrder[i];
          const available = Math.max(0, Number(player.drugInventory[key] || 0));
          if (!available) continue;
          const step = Math.max(1, Math.ceil(remaining * (i === 0 ? 0.65 : 0.42)));
          const seized = Math.min(available, step, remaining);
          player.drugInventory[key] = available - seized;
          detail[key] = seized;
          remaining -= seized;
        }

        const seizedTotal = targetSeize - remaining;
        player.seizedDrugs = Math.max(0, Number(player.seizedDrugs || 0) + seizedTotal);
        return { seized: seizedTotal, detail };
      }

      function seizePlayerDirtyCash(player, severity) {
        const ratio = {
          low: 0.1,
          medium: 0.16,
          high: 0.28,
          critical: 0.4
        };
        const current = Math.max(0, Number(player.dirtyCash || 0));
        const seized = Math.floor(current * Number(ratio[severity] || 0.14));
        player.dirtyCash = Math.max(0, current - seized);
        return seized;
      }

      function seizePlayerCash(player, severity) {
        const ratio = {
          low: 0.05,
          medium: 0.09,
          high: 0.14,
          critical: 0.2
        };
        const current = Math.max(0, Number(player.cash || 0));
        const seized = Math.floor(current * Number(ratio[severity] || 0.1));
        player.cash = Math.max(0, current - seized);
        return seized;
      }

      function applyPoliceBuildingLock(building, durationMs) {
        if (!building) return;
        building.isDisabled = true;
        building.disabledUntil = nowMs() + Math.max(1, Number(durationMs || 0));
      }

      function applyDistrictLock(district, durationMs) {
        if (!district) return;
        district.isLockedByPolice = true;
        district.lockedUntil = nowMs() + Math.max(1, Number(durationMs || 0));
        district.incomeModifier = 0.4;
        district.lastPoliceActionAt = nowMs();
        if (!state.player.lockedDistricts.includes(district.id)) {
          state.player.lockedDistricts.push(district.id);
        }
      }

      function applyApartmentSearchPenalty(district, buildings) {
        if (!district) return { applied: false, removedMembers: 0 };
        const apartments = buildings.filter(
          (building) => building.districtId === district.id && building.type === "Apartment Block"
        );
        if (!apartments.length) return { applied: false, removedMembers: 0 };

        district.gangProductionModifier = Math.min(district.gangProductionModifier || 1, 0.75);
        district.apartmentPenaltyUntil = nowMs() + 2 * 60 * 60 * 1000;
        district.lastPoliceActionAt = nowMs();

        const removedMembers = Math.max(5, Math.floor(state.player.gangMembers * 0.04));
        state.player.gangMembers = Math.max(0, state.player.gangMembers - removedMembers);

        state.player.activePolicePenalties.push({
          id: `pen-${Date.now()}-${Math.random().toString(16).slice(2, 7)}`,
          type: "apartment_search",
          districtId: district.id,
          startedAt: nowMs(),
          endsAt: district.apartmentPenaltyUntil,
          value: -25
        });

        return { applied: true, removedMembers };
      }

      function executePoliceOperation(player, operation, districts, buildings) {
        const district = getDistrictById(districts, operation.districtId);
        const targetBuilding = district
          ? weightedPick(
              buildings.filter((building) => building.ownerId === player.id && building.districtId === district.id),
              (building) => Number(BUILDING_POLICE_PRIORITY[building.type] || 1)
            )
          : null;

        const applyOperationMessage = (type, title, text, severity, districtId = null) => {
          createPoliceMessage(player, { type, title, text, severity, districtId });
        };

        switch (operation.type) {
          case "warning_notice": {
            operation.result = "Patrol warning issued";
            applyOperationMessage(
              "warning_notice",
              "Zvýšený dohled",
              "Policie hlásí zesílený monitoring tvých aktivit. Další incident spustí zásah.",
              operation.severity
            );
            break;
          }

          case "district_control": {
            if (district) {
              district.incomeModifier = Math.min(district.incomeModifier || 1, 0.75);
              district.incomePenaltyUntil = nowMs() + operation.endsAt - operation.startedAt;
              district.lastPoliceActionAt = nowMs();
              operation.result = `District ${district.name} under control, income reduced`;
              applyOperationMessage(
                "district_control",
                "Kontrola districtu",
                `District ${district.name} je pod policejní kontrolou. Příjem districtu byl dočasně snížen.`,
                operation.severity,
                district.id
              );
            } else {
              operation.result = "Control patrol failed to find district";
            }
            break;
          }

          case "cash_seizure": {
            const seized = seizePlayerCash(player, operation.severity);
            operation.result = `Seized cash: $${seized}`;
            applyOperationMessage(
              "cash_seizure",
              "Zabavení hotovosti",
              `Finanční oddělení zabavilo $${seized.toLocaleString("cs-CZ")} v rámci district kontroly.`,
              operation.severity,
              district?.id || null
            );
            break;
          }

          case "warehouse_raid": {
            const warehouse = buildings.find(
              (building) => building.ownerId === player.id
                && building.districtId === district?.id
                && building.type === "Warehouse"
            ) || targetBuilding;
            if (warehouse) {
              applyPoliceBuildingLock(warehouse, OPERATION_TYPE_CONFIG.warehouse_raid.durationMs);
            }
            const drugLoss = seizePlayerDrugs(player, "high");
            const dirtyLoss = seizePlayerDirtyCash(player, "medium");
            operation.result = `Warehouse raid: drugs ${drugLoss.seized}, dirty cash $${dirtyLoss}`;
            applyOperationMessage(
              "warehouse_raid",
              "Razie na sklad",
              `Policie provedla razii. Zabavené drogy: ${drugLoss.seized} ks, zabavené dirty cash: $${dirtyLoss.toLocaleString("cs-CZ")}.`,
              "high",
              district?.id || null
            );
            break;
          }

          case "district_lock": {
            if (district) {
              applyDistrictLock(district, OPERATION_TYPE_CONFIG.district_lock.durationMs);
              operation.endsAt = district.lockedUntil;
              operation.result = `District ${district.name} locked`;
              applyOperationMessage(
                "district_lock",
                "Uzávěra districtu",
                `District ${district.name} byl uzamčen policejní operací. Provoz je omezen.`,
                "high",
                district.id
              );
            } else {
              operation.result = "District lock failed";
            }
            break;
          }

          case "apartment_search": {
            const res = applyApartmentSearchPenalty(district, buildings);
            operation.endsAt = district ? district.apartmentPenaltyUntil : operation.endsAt;
            operation.result = res.applied
              ? `Apartment search successful, removed members: ${res.removedMembers}`
              : "No apartment block found";
            applyOperationMessage(
              "apartment_search",
              "Prohledání bytových bloků",
              res.applied
                ? `District ${district.name}: policejní prohledání snížilo produkci členů a odvedlo ${res.removedMembers} osob.`
                : "Policie hledala nelegální obyvatele, ale nenašla vhodný cíl.",
              "high",
              district?.id || null
            );
            break;
          }

          case "drug_seizure": {
            const seizure = seizePlayerDrugs(player, operation.severity);
            operation.result = `Drug seizure: ${seizure.seized}`;
            applyOperationMessage(
              "drug_seizure",
              "Zabavení drog",
              `Narkotická jednotka zabavila ${seizure.seized} ks drog během cílené operace.`,
              operation.severity,
              district?.id || null
            );
            break;
          }

          case "dirty_cash_seizure": {
            const seized = seizePlayerDirtyCash(player, operation.severity);
            operation.result = `Dirty cash seized: $${seized}`;
            applyOperationMessage(
              "dirty_cash_seizure",
              "Zabavení dirty cash",
              `Policie zabavila $${seized.toLocaleString("cs-CZ")} špinavých peněz.`,
              operation.severity,
              district?.id || null
            );
            break;
          }

          case "building_shutdown": {
            if (targetBuilding) {
              applyPoliceBuildingLock(targetBuilding, OPERATION_TYPE_CONFIG.building_shutdown.durationMs);
              operation.endsAt = targetBuilding.disabledUntil;
              operation.result = `Building ${targetBuilding.type} disabled`;
              applyOperationMessage(
                "building_shutdown",
                "Uzavření budovy",
                `Budova ${targetBuilding.type} v districtu ${district?.name || "-"} byla dočasně uzavřena.`,
                "high",
                district?.id || null
              );
            } else {
              operation.result = "No building available for shutdown";
            }
            break;
          }

          case "coordinated_operation": {
            const playerDistricts = districts.filter((item) => item.ownerId === player.id);
            const topDistricts = playerDistricts
              .slice()
              .sort((a, b) => b.policePressure - a.policePressure)
              .slice(0, Math.min(3, playerDistricts.length));
            topDistricts.forEach((item, idx) => {
              if (idx === 0) {
                applyDistrictLock(item, 55 * 60 * 1000);
              } else {
                item.incomeModifier = Math.min(item.incomeModifier || 1, 0.5);
                item.incomePenaltyUntil = nowMs() + 45 * 60 * 1000;
              }
              item.lastPoliceActionAt = nowMs();
            });

            const topBuildings = buildings
              .filter((item) => item.ownerId === player.id && !item.isDisabled)
              .sort((a, b) => (BUILDING_POLICE_PRIORITY[b.type] || 1) - (BUILDING_POLICE_PRIORITY[a.type] || 1))
              .slice(0, 2);
            topBuildings.forEach((building) => applyPoliceBuildingLock(building, 50 * 60 * 1000));

            const dirtyLoss = seizePlayerDirtyCash(player, "critical");
            const cashLoss = seizePlayerCash(player, "high");
            const drugLoss = seizePlayerDrugs(player, "critical");
            operation.result = `Coordinated op: dirty $${dirtyLoss}, cash $${cashLoss}, drugs ${drugLoss.seized}, districts ${topDistricts.length}`;

            applyOperationMessage(
              "coordinated_operation",
              "Koordinovaná operace",
              `Policie spustila koordinovaný zásah. Zabaveno dirty cash: $${dirtyLoss.toLocaleString("cs-CZ")}, cash: $${cashLoss.toLocaleString("cs-CZ")}, drogy: ${drugLoss.seized} ks.`,
              "critical",
              topDistricts[0]?.id || null
            );
            break;
          }

          default:
            operation.result = "Unknown operation type";
        }

        state.policeSystem.activeOperations.push(operation);
        state.policeSystem.operationHistory.unshift(operation);
        if (state.policeSystem.operationHistory.length > MAX_OP_LOG) {
          state.policeSystem.operationHistory.length = MAX_OP_LOG;
        }
      }

      function updatePoliceTimedStates(player, districts, buildings) {
        const currentTime = nowMs();

        districts.forEach((district) => {
          if (district.isLockedByPolice && currentTime >= Number(district.lockedUntil || 0)) {
            district.isLockedByPolice = false;
            district.lockedUntil = 0;
            district.incomeModifier = Math.max(district.incomeModifier, 0.75);
          }
          if (district.incomePenaltyUntil && currentTime >= district.incomePenaltyUntil) {
            district.incomePenaltyUntil = 0;
            district.incomeModifier = 1;
          }
          if (district.apartmentPenaltyUntil && currentTime >= district.apartmentPenaltyUntil) {
            district.apartmentPenaltyUntil = 0;
            district.gangProductionModifier = 1;
          }
        });

        buildings.forEach((building) => {
          if (building.isDisabled && currentTime >= Number(building.disabledUntil || 0)) {
            building.isDisabled = false;
            building.disabledUntil = 0;
          }
        });

        player.lockedDistricts = districts
          .filter((district) => district.isLockedByPolice && district.ownerId === player.id)
          .map((district) => district.id);

        player.activePolicePenalties = (player.activePolicePenalties || []).filter(
          (penalty) => Number(penalty.endsAt || 0) > currentTime
        );

        state.policeSystem.activeOperations = state.policeSystem.activeOperations.filter(
          (operation) => Number(operation.endsAt || 0) > currentTime
        );
      }

      function updatePoliceAI(player, districts, buildings) {
        updatePoliceTimedStates(player, districts, buildings);
        applyHeatDecay(player);
        updateHeatTier(player);
        updateDistrictPolicePressure(player, districts, buildings);
        maybeSendPoliceMessage(player);
        maybeTriggerPoliceOperation(player, districts, buildings);
        state.policeSystem.lastPoliceTick = nowMs();
      }

      // ==================================================
      // 5) UI RENDER
      // ==================================================
      function severityClass(severity) {
        const key = String(severity || "low");
        if (key === "critical") return "sev-critical";
        if (key === "high") return "sev-high";
        if (key === "medium") return "sev-medium";
        return "sev-low";
      }

      function renderHeatPanel() {
        const player = state.player;
        const progress = getHeatProgress(player);
        const tier = getHeatTier(player.totalHeat);
        document.getElementById("ui-total-heat").textContent = player.totalHeat.toLocaleString("cs-CZ");
        document.getElementById("ui-heat-tier").textContent = `${tier.id}/7 - ${tier.name}`;
        document.getElementById("ui-alert-level").textContent = String(state.policeSystem.globalAlertLevel);
        document.getElementById("ui-active-ops").textContent = String(state.policeSystem.activeOperations.length);
        document.getElementById("ui-heat-progress").style.width = `${progress.progressPct}%`;
        document.getElementById("ui-heat-caption").textContent = progress.nextTier
          ? `${progress.progressPct}% do tieru "${progress.nextTier.name}" (zbývá ${progress.remainingHeat} heat)`
          : "Max tier dosažen";
        document.getElementById("ui-risk-description").textContent = `Riziko: ${tier.description}`;
        document.getElementById("ui-player-economy").textContent =
          `Cash: $${player.cash.toLocaleString("cs-CZ")} | Dirty Cash: $${player.dirtyCash.toLocaleString("cs-CZ")} | `
          + `Drogy: ${getTotalDrugs(player)} | Gang members: ${player.gangMembers.toLocaleString("cs-CZ")}`;
      }

      function renderDistrictTable() {
        const tbody = document.getElementById("ui-district-table");
        const rows = state.districts
          .filter((district) => district.ownerId === state.player.id)
          .map((district) => {
            const lockLabel = district.isLockedByPolice
              ? `<span class="locked">LOCK (${formatRemaining(district.lockedUntil - nowMs())})</span>`
              : "Open";
            return `
              <tr>
                <td>${district.name}</td>
                <td>${district.policePressure}</td>
                <td>${district.policeStatus}</td>
                <td>${lockLabel}</td>
                <td>x${Number(district.incomeModifier || 1).toFixed(2)}</td>
              </tr>
            `;
          })
          .join("");
        tbody.innerHTML = rows || '<tr><td colspan="5">Žádné districty.</td></tr>';
      }

      function renderMessages() {
        const root = document.getElementById("ui-message-list");
        const list = state.player.policeMessages.slice(0, 40);
        if (!list.length) {
          root.innerHTML = '<div class="small">Zatím žádné policejní zprávy.</div>';
          return;
        }
        root.innerHTML = list
          .map((message) => `
            <div class="msg ${severityClass(message.severity)}">
              <h3>${message.title}</h3>
              <p>${message.text}</p>
              <div class="meta">${message.type} • ${message.severity} • ${formatTime(message.createdAt)}</div>
            </div>
          `)
          .join("");
      }

      function renderOperations() {
        const root = document.getElementById("ui-operation-list");
        const list = state.policeSystem.operationHistory.slice(0, 40);
        if (!list.length) {
          root.innerHTML = '<div class="small">Zatím žádné operace.</div>';
          return;
        }
        root.innerHTML = list
          .map((operation) => {
            const district = getDistrictById(state.districts, operation.districtId);
            return `
              <div class="op ${severityClass(operation.severity)}">
                <h3>${operation.type}</h3>
                <p>${operation.result}</p>
                <div class="meta">
                  district: ${district ? district.name : "-"} • severity: ${operation.severity} •
                  start: ${formatTime(operation.startedAt)} • end: ${formatTime(operation.endsAt)}
                </div>
              </div>
            `;
          })
          .join("");
      }

      function renderAll() {
        document.getElementById("auto-tick-label").textContent = `Auto Tick: ${state.autoTick ? "ON" : "OFF"} (15s)`;
        renderHeatPanel();
        renderDistrictTable();
        renderMessages();
        renderOperations();
      }

      // ==================================================
      // 6) DEBUG ACTIONS + BOOTSTRAP
      // ==================================================
      function addHeat(amount, reasonText) {
        const value = Math.max(0, Math.floor(Number(amount || 0)));
        state.player.totalHeat += value;
        state.player.lastIllegalActionAt = nowMs();
        updateHeatTier(state.player);
        createPoliceMessage(state.player, {
          type: "heat_gain",
          severity: value >= 150 ? "high" : "medium",
          title: "Heat navýšen",
          text: `${reasonText} (+${value} heat).`,
          districtId: null
        });
      }

      function reduceHeat(amount) {
        const value = Math.max(0, Math.floor(Number(amount || 0)));
        state.player.totalHeat = Math.max(0, state.player.totalHeat - value);
        updateHeatTier(state.player);
      }

      function triggerRandomPoliceMessage() {
        maybeSendPoliceMessage(state.player);
      }

      function triggerForcedOperation() {
        maybeTriggerPoliceOperation(state.player, state.districts, state.buildings, { force: true });
      }

      function bindControls() {
        const root = document.getElementById("police-heat-modal");
        if (!root) return;
        root.querySelectorAll("[data-action]").forEach((button) => {
          button.addEventListener("click", () => {
            const action = button.getAttribute("data-action");
            if (action === "heat-10") addHeat(10, "Pouliční obchod");
            else if (action === "heat-50") addHeat(50, "Riskantní ekonomická akce");
            else if (action === "heat-200") addHeat(200, "Masivní nelegální operace");
            else if (action === "heat-minus-40") reduceHeat(40);
            else if (action === "tick") updatePoliceAI(state.player, state.districts, state.buildings);
            else if (action === "message") triggerRandomPoliceMessage();
            else if (action === "forced-op") triggerForcedOperation();
            else if (action === "toggle-auto") state.autoTick = !state.autoTick;
            renderAll();
          });
        });
      }

      function buildOwnershipMaps() {
        state.player.ownedBuildings = getPlayerBuildings(state.player, state.buildings).map((building) => building.id);
        state.districts.forEach((district) => {
          district.buildingsInDistrict = state.buildings
            .filter((building) => building.districtId === district.id && building.ownerId === state.player.id)
            .map((building) => building.id);
        });
      }

      function bootstrap() {
        buildOwnershipMaps();
        updateHeatTier(state.player);
        updateDistrictPolicePressure(state.player, state.districts, state.buildings);
        bindControls();
        renderAll();
      }

      bootstrap();

      setInterval(() => {
        if (!state.autoTick) return;
        updatePoliceAI(state.player, state.districts, state.buildings);
        renderAll();
      }, POLICE_TICK_MS);

      // Volitelný export pro snadné napojení na zbytek hry.
      window.EmpirePoliceCore = {
        state,
        renderAll,
        getHeatTier,
        updateHeatTier,
        getHeatProgress,
        applyHeatDecay,
        calculateDistrictPolicePressure,
        updateDistrictPolicePressure,
        maybeSendPoliceMessage,
        createPoliceMessage,
        maybeTriggerPoliceOperation,
        choosePoliceTarget,
        choosePoliceOperationType,
        executePoliceOperation,
        applyPoliceBuildingLock,
        applyDistrictLock,
        seizePlayerDrugs,
        seizePlayerDirtyCash,
        seizePlayerCash,
        applyApartmentSearchPenalty,
        updatePoliceTimedStates,
        updatePoliceAI
      };

      (function initPoliceHeatModalBridge() {
        window.Empire = window.Empire || {};
        const core = window.EmpirePoliceCore;
        if (!core) return;

        const modalRoot = document.getElementById("police-heat-modal");
        const modalBackdrop = document.getElementById("police-heat-modal-backdrop");
        const modalClose = document.getElementById("police-heat-modal-close");

        function isModalOpen() {
          return Boolean(modalRoot && !modalRoot.classList.contains("hidden"));
        }

        function readHeatFromProfile(profile) {
          const candidates = [
            profile?.wantedLevel,
            profile?.wanted_level,
            profile?.wanted,
            profile?.heat,
            profile?.notoriety,
            profile?.policeHeat,
            profile?.police_heat
          ];
          for (let i = 0; i < candidates.length; i += 1) {
            const parsed = Number(candidates[i]);
            if (Number.isFinite(parsed)) return Math.max(0, Math.floor(parsed));
          }
          return null;
        }

        function syncProfileFields(profile) {
          if (!profile || typeof profile !== "object") return;
          const player = core.state.player;
          player.id = String(profile.id || player.id || "player-1");
          player.name = String(profile.gangName || profile.username || profile.name || player.name || "Gang");
          const influence = Number(profile.influence);
          if (Number.isFinite(influence)) player.influence = Math.max(0, Math.floor(influence));
          const gangMembers = Number(profile.population ?? profile.gangMembers);
          if (Number.isFinite(gangMembers)) player.gangMembers = Math.max(0, Math.floor(gangMembers));
        }

        function syncEconomySnapshot() {
          const snapshot = window.Empire?.UI?.getEconomySnapshot?.();
          if (!snapshot || typeof snapshot !== "object") return;
          const cleanMoney = Number(snapshot.cleanMoney);
          const dirtyMoney = Number(snapshot.dirtyMoney);
          if (Number.isFinite(cleanMoney)) core.state.player.cash = Math.max(0, Math.floor(cleanMoney));
          if (Number.isFinite(dirtyMoney)) core.state.player.dirtyCash = Math.max(0, Math.floor(dirtyMoney));
        }

        function setExternalHeat(heat, profile) {
          syncProfileFields(profile || window.Empire?.player || null);
          syncEconomySnapshot();
          const profileHeat = readHeatFromProfile(profile || window.Empire?.player || null);
          const parsed = Number(heat);
          const resolved = Number.isFinite(parsed) ? parsed : profileHeat;
          if (!Number.isFinite(resolved)) return;
          core.state.player.totalHeat = Math.max(0, Math.floor(resolved));
          core.updateHeatTier(core.state.player);
          core.updateDistrictPolicePressure(core.state.player, core.state.districts, core.state.buildings);
          core.renderAll();
        }

        function open(options = {}) {
          if (modalRoot) modalRoot.classList.remove("hidden");
          setExternalHeat(options?.heat, options?.profile || window.Empire?.player || null);
          core.renderAll();
        }

        function close() {
          if (modalRoot) modalRoot.classList.add("hidden");
        }

        if (modalBackdrop) modalBackdrop.addEventListener("click", close);
        if (modalClose) modalClose.addEventListener("click", close);
        document.addEventListener("keydown", (event) => {
          if (event.key === "Escape" && isModalOpen()) close();
        });

        window.Empire.PoliceHeat = {
          ...core,
          open,
          close,
          setExternalHeat
        };
      })();
