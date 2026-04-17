window.Empire = window.Empire || {};
window.Empire.UIPlayer = window.Empire.UIPlayer || {};

window.Empire.UIPlayer.createPopulationController = function createPopulationController(deps = {}) {
  const {
    localGangMembersKey = "",
    localGangMembersSpentKey = "",
    getProfileStateController = () => null,
    getCachedProfile = () => null,
    getPlayer = () => null,
    getDistricts = () => [],
    getPlayerOwnerNameSet = () => new Set(),
    getActiveAllianceOwnerNames = () => [],
    normalizeOwnerName = (value) => String(value || "").trim().toLowerCase()
  } = deps;

  function readCounter(key) {
    const parsed = Number(localStorage.getItem(key) || 0);
    if (!Number.isFinite(parsed)) return 0;
    return Math.max(0, Math.floor(parsed));
  }

  function writeCounter(key, value) {
    const safeValue = Number.isFinite(Number(value)) ? Math.max(0, Math.floor(Number(value))) : 0;
    localStorage.setItem(key, String(safeValue));
    return safeValue;
  }

  function getLocalGangMembersBonus() {
    return readCounter(localGangMembersKey);
  }

  function setLocalGangMembersBonus(value) {
    return writeCounter(localGangMembersKey, value);
  }

  function getLocalGangMembersSpent() {
    return readCounter(localGangMembersSpentKey);
  }

  function setLocalGangMembersSpent(value) {
    return writeCounter(localGangMembersSpentKey, value);
  }

  function countAllianceControlledSectors() {
    const districts = Array.isArray(getDistricts()) ? getDistricts() : [];
    if (!districts.length) return 0;
    const ownerNames = new Set(getPlayerOwnerNameSet());
    getActiveAllianceOwnerNames().forEach((owner) => ownerNames.add(owner));
    if (!ownerNames.size) return 0;
    return districts.reduce((sum, district) => {
      const owner = normalizeOwnerName(district?.owner);
      return owner && ownerNames.has(owner) ? sum + 1 : sum;
    }, 0);
  }

  function countPlayerControlledPopulation(profile) {
    const activeProfile = profile || getCachedProfile() || getPlayer() || {};
    const bonusMembers = getLocalGangMembersBonus();
    const spentMembers = getLocalGangMembersSpent();
    const player = getPlayer() || {};
    const persistedRaidLosses = Math.max(
      0,
      Math.floor(
        Number(
          activeProfile?.raidMemberLosses
          ?? activeProfile?.raid_member_losses
          ?? player?.raidMemberLosses
          ?? player?.raid_member_losses
          ?? 0
        ) || 0
      )
    );
    const districts = Array.isArray(getDistricts()) ? getDistricts() : [];
    if (!districts.length) {
      return Math.max(0, Number(activeProfile?.population || 0) + bonusMembers - spentMembers - persistedRaidLosses);
    }

    const weights = {
      downtown: 3600,
      commercial: 2600,
      residential: 5400,
      industrial: 1900,
      park: 1300
    };
    const playerOwners = getPlayerOwnerNameSet();
    if (!playerOwners.size) {
      return Math.max(0, Number(activeProfile?.population || 0) + bonusMembers - spentMembers - persistedRaidLosses);
    }

    const total = districts.reduce((sum, district) => {
      const owner = normalizeOwnerName(district?.owner);
      if (!owner || !playerOwners.has(owner)) return sum;
      const typeKey = String(district?.type || "").trim().toLowerCase();
      const fallback = 2200;
      const population = Number(district?.population);
      if (Number.isFinite(population) && population > 0) {
        return sum + Math.floor(population);
      }
      return sum + (weights[typeKey] || fallback);
    }, 0);

    if (total > 0) return Math.max(0, total + bonusMembers - spentMembers - persistedRaidLosses);
    return Math.max(0, Number(activeProfile?.population || 0) + bonusMembers - spentMembers - persistedRaidLosses);
  }

  function refreshProfilePopulation() {
    const controller = getProfileStateController();
    if (controller?.refreshProfilePopulation) {
      return controller.refreshProfilePopulation();
    }
    return countPlayerControlledPopulation(getCachedProfile() || getPlayer() || {});
  }

  function consumeGangMembers(amount) {
    const delta = Number.isFinite(Number(amount)) ? Math.max(0, Math.floor(Number(amount))) : 0;
    if (delta <= 0) return countPlayerControlledPopulation(getCachedProfile() || getPlayer() || {});
    const spent = getLocalGangMembersSpent();
    const nextSpent = setLocalGangMembersSpent(spent + delta);
    refreshProfilePopulation();
    return nextSpent;
  }

  function addGangMembers(amount) {
    const delta = Number.isFinite(Number(amount)) ? Math.max(0, Math.floor(Number(amount))) : 0;
    if (delta <= 0) {
      return refreshProfilePopulation();
    }
    const spent = getLocalGangMembersSpent();
    if (spent > 0) {
      const recovered = Math.min(spent, delta);
      setLocalGangMembersSpent(spent - recovered);
      const leftover = delta - recovered;
      if (leftover > 0) {
        setLocalGangMembersBonus(getLocalGangMembersBonus() + leftover);
      }
    } else {
      setLocalGangMembersBonus(getLocalGangMembersBonus() + delta);
    }
    refreshProfilePopulation();
    return countPlayerControlledPopulation(getCachedProfile() || getPlayer() || {});
  }

  function getCurrentGangMembers() {
    return getLocalGangMembersBonus();
  }

  return {
    getLocalGangMembersBonus,
    setLocalGangMembersBonus,
    getLocalGangMembersSpent,
    setLocalGangMembersSpent,
    consumeGangMembers,
    refreshProfilePopulation,
    addGangMembers,
    getCurrentGangMembers,
    countAllianceControlledSectors,
    countPlayerControlledPopulation
  };
};
