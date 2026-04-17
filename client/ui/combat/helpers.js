window.Empire = window.Empire || {};
window.Empire.UICombat = window.Empire.UICombat || {};

window.Empire.UICombat.createHelperController = function createHelperController(deps = {}) {
  const {
    attackWeaponStats = [],
    weaponMeta = { attack: {}, defense: {} },
    readLocalDistrictDefenseAssignments = () => ({}),
    formatDecimalValue = (value) => String(value ?? 0),
    isOnboardingDemoScenarioActive = () => false,
    ONBOARDING_ACTION_DURATION_MS = 0,
    ATTACK_ACTION_DURATION_MS = 0,
    getFitnessCombatSnapshot = () => null
  } = deps;

  function resolveAttackWeaponSpecialText(name) {
    return String(weaponMeta?.attack?.[String(name || "").trim()]?.specialText || "").trim();
  }

  function resolveDefenseWeaponSpecialText(name) {
    return String(weaponMeta?.defense?.[String(name || "").trim()]?.specialText || "").trim();
  }

  function getDistrictDefenseWeaponCounts(districtId) {
    const districtKey = String(Number(districtId));
    if (!districtKey || districtKey === "NaN") return {};
    const store = readLocalDistrictDefenseAssignments();
    const districtStore = store[districtKey] && typeof store[districtKey] === "object"
      ? store[districtKey]
      : {};
    return Object.values(districtStore).reduce((acc, entry) => {
      const weaponCounts = entry?.weaponCounts && typeof entry.weaponCounts === "object"
        ? entry.weaponCounts
        : {};
      Object.entries(weaponCounts).forEach(([weaponName, amount]) => {
        const safeAmount = Math.max(0, Math.floor(Number(amount || 0)));
        if (safeAmount > 0) acc[weaponName] = Math.max(0, Math.floor(Number(acc[weaponName] || 0) + safeAmount));
      });
      return acc;
    }, {});
  }

  function getSelectedAttackWeaponCount(selection, weaponName) {
    return Math.max(0, Math.floor(Number(selection?.[weaponName] || 0)));
  }

  function hasFullAttackWeaponSet(selection) {
    return attackWeaponStats.every((item) => getSelectedAttackWeaponCount(selection, item.name) > 0);
  }

  function getAttackSpecialModifiers(selection) {
    const safeSelection = selection && typeof selection === "object" ? selection : {};
    const grenadeCount = getSelectedAttackWeaponCount(safeSelection, "Granát");
    const smgCount = getSelectedAttackWeaponCount(safeSelection, "Samopal");
    const bazookaCount = getSelectedAttackWeaponCount(safeSelection, "Bazuka");
    const fullSetUsed = hasFullAttackWeaponSet(safeSelection);
    return {
      grenadeDefenseIgnorePct: grenadeCount * 0.3,
      smgBonusPower: fullSetUsed ? smgCount * 0.2 : 0,
      bazookaCatastropheChancePct: bazookaCount * 0.5,
      fullSetUsed
    };
  }

  function calculateAttackPowerFromSelection(selection) {
    const safeSelection = selection && typeof selection === "object" ? selection : {};
    const special = getAttackSpecialModifiers(safeSelection);
    const basePower = attackWeaponStats.reduce((sum, item) => {
      const count = getSelectedAttackWeaponCount(safeSelection, item.name);
      return sum + (count * Number(item.power || 0));
    }, 0) + special.smgBonusPower;
    const fitnessSnapshot = getFitnessCombatSnapshot() || null;
    const fitnessAttackBoostPct = Math.max(0, Number(fitnessSnapshot?.attackBoostPct || 0));
    const rawPower = basePower * Math.max(0, 1 + fitnessAttackBoostPct / 100);
    return {
      rawPower,
      special,
      fitnessAttackBoostPct
    };
  }

  function resolveDistrictDefenseSpecialModifiers(districtId) {
    const weaponCounts = getDistrictDefenseWeaponCounts(districtId);
    const vestCount = Math.max(0, Math.floor(Number(weaponCounts["Neprůstřelná vesta"] || 0)));
    const barricadeCount = Math.max(0, Math.floor(Number(weaponCounts["Ocelové barikády"] || 0)));
    const cameraCount = Math.max(0, Math.floor(Number(weaponCounts["Bezpečnostní kamery"] || 0)));
    const mgNestCount = Math.max(0, Math.floor(Number(weaponCounts["Automatické kulometné stanoviště"] || 0)));
    const alarmCount = Math.max(0, Math.floor(Number(weaponCounts.Alarm || 0)));
    return {
      weaponCounts,
      vestCount,
      barricadeCount,
      cameraCount,
      mgNestCount,
      alarmCount,
      defenderMemberLossReductionPct: vestCount * 0.5,
      attackDurationIncreasePct: barricadeCount * 0.02,
      attackerAttackPenaltyPct: mgNestCount * 0.3,
      spyDetectionBoostActive: cameraCount >= 5,
      raidAlarmBoostActive: alarmCount >= 5
    };
  }

  function resolveAttackDurationMsForDistrict(district) {
    if (isOnboardingDemoScenarioActive()) {
      return ONBOARDING_ACTION_DURATION_MS;
    }
    const defenseSpecial = resolveDistrictDefenseSpecialModifiers(district?.id);
    const durationMultiplier = 1 + Math.max(0, Number(defenseSpecial.attackDurationIncreasePct || 0)) / 100;
    return Math.max(1000, Math.round(ATTACK_ACTION_DURATION_MS * durationMultiplier));
  }

  function resolveActivatedAttackSpecialEffects(selection, district) {
    const attackSpecial = getAttackSpecialModifiers(selection);
    const defenseSpecial = resolveDistrictDefenseSpecialModifiers(district?.id);
    const fitnessSnapshot = getFitnessCombatSnapshot() || null;
    const fitnessAttackBoostPct = Math.max(0, Number(fitnessSnapshot?.attackBoostPct || 0));
    const effects = [];
    if (Number(attackSpecial.grenadeDefenseIgnorePct || 0) > 0) {
      effects.push(`Granát ignoroval ${formatDecimalValue(attackSpecial.grenadeDefenseIgnorePct, 2)} % obrany`);
    }
    if (Number(attackSpecial.smgBonusPower || 0) > 0 && attackSpecial.fullSetUsed) {
      effects.push(`Samopal přidal +${formatDecimalValue(attackSpecial.smgBonusPower, 2)} power za full set`);
    }
    if (Number(attackSpecial.bazookaCatastropheChancePct || 0) > 0) {
      effects.push(`Bazuka přidala +${formatDecimalValue(attackSpecial.bazookaCatastropheChancePct, 2)} % šance na totální destrukci`);
    }
    if (Number(defenseSpecial.attackerAttackPenaltyPct || 0) > 0) {
      effects.push(`Kulometná stanoviště snížila sílu útoku o ${formatDecimalValue(defenseSpecial.attackerAttackPenaltyPct, 2)} %`);
    }
    if (Number(defenseSpecial.attackDurationIncreasePct || 0) > 0) {
      effects.push(`Barikády prodloužily útok o ${formatDecimalValue(defenseSpecial.attackDurationIncreasePct, 2)} %`);
    }
    if (Number(defenseSpecial.defenderMemberLossReductionPct || 0) > 0) {
      effects.push(`Vesty snížily ztráty obránců o ${formatDecimalValue(defenseSpecial.defenderMemberLossReductionPct, 2)} %`);
    }
    if (fitnessAttackBoostPct > 0) {
      effects.push(`Fitness Club boost přidal +${formatDecimalValue(fitnessAttackBoostPct, 2)} % síly útoku`);
    }
    return effects;
  }

  return {
    resolveAttackWeaponSpecialText,
    resolveDefenseWeaponSpecialText,
    getDistrictDefenseWeaponCounts,
    getSelectedAttackWeaponCount,
    hasFullAttackWeaponSet,
    getAttackSpecialModifiers,
    calculateAttackPowerFromSelection,
    resolveDistrictDefenseSpecialModifiers,
    resolveAttackDurationMsForDistrict,
    resolveActivatedAttackSpecialEffects
  };
};
