(function () {
  "use strict";

  const {
    HUNT_MODE_THRESHOLD,
    BOUNTY_CREATION_COOLDOWN_MS,
    DRUG_UNIT_VALUE,
    MATERIAL_UNIT_VALUE,
    BOUNTY_TYPES,
    BOUNTY_DURATION_OPTIONS
  } = window.EmpireBountyDemoData;

  /**
   * @typedef {Object} Bounty
   * @property {string} id
   * @property {string} targetPlayerId
   * @property {string} issuerPlayerId
   * @property {boolean} isAnonymous
   * @property {number} rewardCash
   * @property {number} rewardDrugs
   * @property {number} rewardMaterials
   * @property {number} totalValue
   * @property {string} bountyType
   * @property {number} createdAt
   * @property {number} expiresAt
   * @property {"active"|"expired"|"completed"} status
   * @property {Array<{playerId:string,contributionDamage:number,contributionScore:number}>} contributors
   * @property {string|null} claimedBy
   * @property {boolean} huntModeActive
   */

  function nowMs() {
    return Date.now();
  }

  function clampWholeNumber(value) {
    return Math.max(0, Math.floor(Number(value) || 0));
  }

  function createId(prefix) {
    return `${prefix}-${nowMs()}-${Math.floor(Math.random() * 100000)}`;
  }

  function calculateBountyTotalValue(rewardCash, rewardDrugs, rewardMaterials) {
    return clampWholeNumber(rewardCash)
      + clampWholeNumber(rewardDrugs) * DRUG_UNIT_VALUE
      + clampWholeNumber(rewardMaterials) * MATERIAL_UNIT_VALUE;
  }

  function isHuntModeActive(totalValue) {
    return clampWholeNumber(totalValue) >= HUNT_MODE_THRESHOLD;
  }

  function distributeByRatio(totalAmount, recipientEntries, valueKey) {
    const safeTotal = clampWholeNumber(totalAmount);
    const safeEntries = (Array.isArray(recipientEntries) ? recipientEntries : [])
      .map((entry) => ({
        playerId: String(entry?.playerId || ""),
        value: Math.max(0, Number(entry?.[valueKey] || 0))
      }))
      .filter((entry) => entry.playerId && entry.value > 0);

    if (safeTotal <= 0 || !safeEntries.length) return [];

    const totalWeight = safeEntries.reduce((sum, entry) => sum + entry.value, 0);
    if (totalWeight <= 0) return [];

    let allocated = 0;
    const distributions = safeEntries.map((entry) => {
      const amount = Math.floor((safeTotal * entry.value) / totalWeight);
      allocated += amount;
      return { playerId: entry.playerId, amount };
    });

    let remainder = safeTotal - allocated;
    let index = 0;
    while (remainder > 0 && distributions.length) {
      distributions[index % distributions.length].amount += 1;
      remainder -= 1;
      index += 1;
    }

    return distributions.filter((entry) => entry.amount > 0);
  }

  function distributeCashReward(totalCash, recipientEntries, valueKey) {
    return distributeByRatio(totalCash, recipientEntries, valueKey);
  }

  function distributeDrugsReward(totalDrugs, recipientEntries, valueKey) {
    return distributeByRatio(totalDrugs, recipientEntries, valueKey);
  }

  function distributeMaterialsReward(totalMaterials, recipientEntries, valueKey) {
    return distributeByRatio(totalMaterials, recipientEntries, valueKey);
  }

  function createBountyService(options) {
    const state = options.state;
    const pushFeedMessage = typeof options.pushFeedMessage === "function" ? options.pushFeedMessage : function () {};

    function getPlayerById(playerId) {
      return state.players.find((player) => player.id === playerId) || null;
    }

    function getActiveBounties() {
      expireBounties();
      return state.bounties.filter((bounty) => bounty.status === "active");
    }

    function getActiveBountiesForPlayer(playerId) {
      return getActiveBounties().filter((bounty) => bounty.targetPlayerId === playerId);
    }

    function validateBountyPayload(payload) {
      const issuerPlayer = getPlayerById(payload.issuerPlayerId);
      const targetPlayer = getPlayerById(payload.targetPlayerId);
      const rewardCash = clampWholeNumber(payload.rewardCash);
      const rewardDrugs = clampWholeNumber(payload.rewardDrugs);
      const rewardMaterials = clampWholeNumber(payload.rewardMaterials);
      const totalValue = calculateBountyTotalValue(rewardCash, rewardDrugs, rewardMaterials);
      const bountyType = String(payload.bountyType || "");
      const durationHours = Number(payload.durationHours || 0);

      if (!issuerPlayer) return { ok: false, error: "Issuer neexistuje." };
      if (!targetPlayer) return { ok: false, error: "Target neexistuje." };
      if (issuerPlayer.id === targetPlayer.id) return { ok: false, error: "Bounty nelze vypsat na sebe." };
      if (!BOUNTY_DURATION_OPTIONS.includes(durationHours)) return { ok: false, error: "Neplatná délka bounty." };
      if (!Object.values(BOUNTY_TYPES).includes(bountyType)) return { ok: false, error: "Neplatný typ bounty." };
      if (totalValue <= 0) return { ok: false, error: "Bounty musí mít hodnotu větší než 0." };
      if (issuerPlayer.resources.cash < rewardCash) return { ok: false, error: "Nedostatek cash." };
      if (issuerPlayer.resources.drugs < rewardDrugs) return { ok: false, error: "Nedostatek drog." };
      if (issuerPlayer.resources.materials < rewardMaterials) return { ok: false, error: "Nedostatek materiálů." };

      const duplicateBounty = getActiveBounties().find((bounty) =>
        bounty.issuerPlayerId === payload.issuerPlayerId
        && bounty.targetPlayerId === payload.targetPlayerId
        && bounty.bountyType === bountyType
        && nowMs() - bounty.createdAt < BOUNTY_CREATION_COOLDOWN_MS
      );
      if (duplicateBounty) {
        return { ok: false, error: "Na stejný target máš ještě cooldown 30 minut." };
      }

      return {
        ok: true,
        issuerPlayer,
        targetPlayer,
        rewardCash,
        rewardDrugs,
        rewardMaterials,
        totalValue,
        bountyType,
        durationHours
      };
    }

    function createBounty(payload) {
      const validation = validateBountyPayload(payload);
      if (!validation.ok) return validation;

      const bounty = {
        id: createId("bounty"),
        targetPlayerId: validation.targetPlayer.id,
        issuerPlayerId: validation.issuerPlayer.id,
        isAnonymous: Boolean(payload.isAnonymous),
        rewardCash: validation.rewardCash,
        rewardDrugs: validation.rewardDrugs,
        rewardMaterials: validation.rewardMaterials,
        totalValue: validation.totalValue,
        bountyType: validation.bountyType,
        createdAt: nowMs(),
        expiresAt: nowMs() + validation.durationHours * 60 * 60 * 1000,
        status: "active",
        contributors: [],
        claimedBy: null,
        huntModeActive: isHuntModeActive(validation.totalValue)
      };

      validation.issuerPlayer.resources.cash -= validation.rewardCash;
      validation.issuerPlayer.resources.drugs -= validation.rewardDrugs;
      validation.issuerPlayer.resources.materials -= validation.rewardMaterials;
      state.bounties.unshift(bounty);

      pushFeedMessage(
        bounty.isAnonymous
          ? `Na hráče ${validation.targetPlayer.name} byla vypsána odměna.`
          : `${validation.issuerPlayer.name} vypsal odměnu na hráče ${validation.targetPlayer.name}.`
      );
      pushFeedMessage(`Target ${validation.targetPlayer.name}: Někdo tě označil jako cíl.`);
      if (bounty.huntModeActive) {
        pushFeedMessage("Město ucítilo krev. HUNT MODE je aktivní.");
      }

      return { ok: true, bounty };
    }

    function registerBountyContribution(bountyId, attackerId, contributionValue) {
      const bounty = state.bounties.find((entry) => entry.id === bountyId && entry.status === "active");
      if (!bounty) return null;
      const safeContributionValue = Math.max(0, Number(contributionValue || 0));
      if (safeContributionValue <= 0) return bounty;

      const existingContribution = bounty.contributors.find((entry) => entry.playerId === attackerId);
      if (existingContribution) {
        existingContribution.contributionDamage += safeContributionValue;
        existingContribution.contributionScore += safeContributionValue;
      } else {
        bounty.contributors.push({
          playerId: attackerId,
          contributionDamage: safeContributionValue,
          contributionScore: safeContributionValue
        });
      }
      return bounty;
    }

    function applyRewardDistributions(distributions, resourceKey) {
      distributions.forEach((entry) => {
        const player = getPlayerById(entry.playerId);
        if (!player) return;
        player.resources[resourceKey] += entry.amount;
      });
    }

    function completeBounty(bountyId, claimedByPlayerId) {
      const bounty = state.bounties.find((entry) => entry.id === bountyId && entry.status === "active");
      if (!bounty) return { ok: false, error: "Bounty neexistuje." };

      bounty.status = "completed";
      bounty.claimedBy = claimedByPlayerId;

      const contributors = Array.isArray(bounty.contributors) ? bounty.contributors.map((entry) => ({ ...entry })) : [];
      if (!contributors.find((entry) => entry.playerId === claimedByPlayerId)) {
        contributors.push({ playerId: claimedByPlayerId, contributionDamage: 1, contributionScore: 1 });
      }

      let cashDistributions = [];
      let drugsDistributions = [];
      let materialsDistributions = [];

      if (bounty.bountyType === BOUNTY_TYPES.CAPTURE_DISTRICT) {
        const otherContributors = contributors.filter((entry) => entry.playerId !== claimedByPlayerId);
        const claimerShareCash = Math.floor(bounty.rewardCash * 0.5);
        const claimerShareDrugs = Math.floor(bounty.rewardDrugs * 0.5);
        const claimerShareMaterials = Math.floor(bounty.rewardMaterials * 0.5);

        cashDistributions = [{ playerId: claimedByPlayerId, amount: claimerShareCash }];
        drugsDistributions = [{ playerId: claimedByPlayerId, amount: claimerShareDrugs }];
        materialsDistributions = [{ playerId: claimedByPlayerId, amount: claimerShareMaterials }];

        if (otherContributors.length) {
          cashDistributions = cashDistributions.concat(distributeCashReward(bounty.rewardCash - claimerShareCash, otherContributors, "contributionScore"));
          drugsDistributions = drugsDistributions.concat(distributeDrugsReward(bounty.rewardDrugs - claimerShareDrugs, otherContributors, "contributionScore"));
          materialsDistributions = materialsDistributions.concat(distributeMaterialsReward(bounty.rewardMaterials - claimerShareMaterials, otherContributors, "contributionScore"));
        } else {
          cashDistributions[0].amount = bounty.rewardCash;
          drugsDistributions[0].amount = bounty.rewardDrugs;
          materialsDistributions[0].amount = bounty.rewardMaterials;
        }
      } else if (bounty.bountyType === BOUNTY_TYPES.SUCCESSFUL_ATTACK) {
        cashDistributions = distributeCashReward(bounty.rewardCash, contributors, "contributionDamage");
        drugsDistributions = distributeDrugsReward(bounty.rewardDrugs, contributors, "contributionDamage");
        materialsDistributions = distributeMaterialsReward(bounty.rewardMaterials, contributors, "contributionDamage");
      } else {
        cashDistributions = distributeCashReward(bounty.rewardCash, contributors, "contributionScore");
        drugsDistributions = distributeDrugsReward(bounty.rewardDrugs, contributors, "contributionScore");
        materialsDistributions = distributeMaterialsReward(bounty.rewardMaterials, contributors, "contributionScore");
      }

      applyRewardDistributions(cashDistributions, "cash");
      applyRewardDistributions(drugsDistributions, "drugs");
      applyRewardDistributions(materialsDistributions, "materials");

      const targetPlayer = getPlayerById(bounty.targetPlayerId);
      pushFeedMessage(`Odměna za hráče ${targetPlayer ? targetPlayer.name : "Unknown"} byla vyplacena.`);

      return { ok: true, bounty };
    }

    function resolveBountyAfterAttack(attackResult) {
      expireBounties();
      const matchingBounties = getActiveBountiesForPlayer(attackResult.targetPlayerId)
        .filter((bounty) => bounty.bountyType === attackResult.bountyType);

      if (!matchingBounties.length) {
        return { ok: true, resolvedBounties: [] };
      }

      const resolvedBounties = [];
      matchingBounties.forEach((bounty) => {
        registerBountyContribution(bounty.id, attackResult.attackerId, attackResult.contributionValue);

        if (bounty.bountyType === BOUNTY_TYPES.CAPTURE_DISTRICT && attackResult.success && attackResult.capturedDistrictId) {
          const district = state.districts.find((entry) => entry.id === attackResult.capturedDistrictId && entry.ownerPlayerId === bounty.targetPlayerId);
          if (!district) return;
          district.ownerPlayerId = attackResult.attackerId;
          const result = completeBounty(bounty.id, attackResult.attackerId);
          if (result.ok) resolvedBounties.push(result.bounty);
        }

        if (bounty.bountyType === BOUNTY_TYPES.SUCCESSFUL_ATTACK && attackResult.success) {
          const result = completeBounty(bounty.id, attackResult.attackerId);
          if (result.ok) resolvedBounties.push(result.bounty);
        }

        if (bounty.bountyType === BOUNTY_TYPES.DESTROY_UNITS && clampWholeNumber(attackResult.destroyedUnits) > 0) {
          registerBountyContribution(bounty.id, attackResult.attackerId, attackResult.destroyedUnits);
          const result = completeBounty(bounty.id, attackResult.attackerId);
          if (result.ok) resolvedBounties.push(result.bounty);
        }
      });

      return { ok: true, resolvedBounties };
    }

    function expireBounties() {
      state.bounties.forEach((bounty) => {
        if (bounty.status !== "active") return;
        if (bounty.expiresAt <= nowMs()) {
          bounty.status = "expired";
        }
      });
    }

    return {
      BOUNTY_TYPES,
      createBounty,
      calculateBountyTotalValue,
      isHuntModeActive,
      getActiveBountiesForPlayer,
      registerBountyContribution,
      resolveBountyAfterAttack,
      completeBounty,
      expireBounties,
      distributeCashReward,
      distributeDrugsReward,
      distributeMaterialsReward
    };
  }

  window.EmpireBountySystem = {
    createBountyService,
    calculateBountyTotalValue,
    isHuntModeActive,
    distributeCashReward,
    distributeDrugsReward,
    distributeMaterialsReward
  };
})();
