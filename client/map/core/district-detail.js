window.Empire = window.Empire || {};
window.Empire.MapModules = window.Empire.MapModules || {};

window.Empire.MapModules.createDistrictDetailModule = function createDistrictDetailModule(deps = {}) {
  const {
    escapeHtml = (value) => String(value || ""),
    resolveBuildingLockMeta = () => ({ locked: true, label: "" }),
    resolveBuildingDetailInput = () => null,
    openBuildingDetailModal = () => {},
    resolveDistrictNumberLabel = () => "-",
    getDistrictGossipEntries = () => [],
    getDistrictTrapControlState = () => null
  } = deps;

  function resolveDistrictBuildingIconKey(buildingName) {
    const normalized = String(buildingName || "")
      .trim()
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "");
    if (!normalized) return null;
    if (normalized.includes("lekarna")) return "pharmacy";
    if (normalized.includes("drug lab")) return "drug-lab";
    if (normalized.includes("tovarna")) return "factory";
    if (normalized.includes("zbrojovka")) return "armory";
    return null;
  }

  function resolveDistrictBuildingIconSvg(iconKey) {
    switch (iconKey) {
      case "pharmacy": return `<svg viewBox="0 0 24 24" role="presentation" focusable="false"><rect x="3.5" y="3.5" width="17" height="17" rx="4"></rect><path d="M12 7.5v9"></path><path d="M7.5 12h9"></path></svg>`;
      case "drug-lab": return `<svg viewBox="0 0 24 24" role="presentation" focusable="false"><path d="M9 3h6"></path><path d="M10 3v4.4L5.8 15.2a4.7 4.7 0 0 0 4.1 5.8h4.2a4.7 4.7 0 0 0 4.1-5.8L14 7.4V3"></path><path d="M8.2 13h7.6"></path></svg>`;
      case "factory": return `<svg viewBox="0 0 24 24" role="presentation" focusable="false"><path d="M3 21V9l6 3V9l6 3V7l6-3v17"></path><path d="M3 21h18"></path><path d="M7 21v-4"></path><path d="M11 21v-4"></path><path d="M15 21v-4"></path></svg>`;
      case "armory": return `<svg viewBox="0 0 24 24" role="presentation" focusable="false"><path d="M5 5l14 14"></path><path d="M19 5L5 19"></path><path d="M3.8 8.1L8.1 3.8"></path><path d="M15.9 20.2l4.3-4.3"></path><path d="M15.9 3.8l4.3 4.3"></path><path d="M3.8 15.9l4.3 4.3"></path></svg>`;
      default: return "";
    }
  }

  function renderDistrictBuildingName(buildingName, iconKey) {
    if (!iconKey) return `<span class="district-buildings__name">${buildingName}</span>`;
    return `<span class="district-buildings__name-wrap"><span class="district-buildings__icon" aria-hidden="true">${resolveDistrictBuildingIconSvg(iconKey)}</span><span class="district-buildings__name">${buildingName}</span></span>`;
  }

  function updateDistrictBuildings(district, options = {}) {
    const root = document.getElementById("modal-buildings");
    const title = document.getElementById("modal-buildings-title");
    const list = document.getElementById("modal-buildings-list");
    const spyIntel = options?.spyIntel || null;
    if (!root || !title || !list) return;
    if (!district && !spyIntel) {
      root.classList.add("hidden");
      list.classList.remove("district-buildings--trap-wide");
      list.innerHTML = "";
      return;
    }
    const knownFields = spyIntel?.knownFields && typeof spyIntel.knownFields === "object" ? spyIntel.knownFields : {};
    const buildings = district ? (Array.isArray(district.buildings) ? district.buildings : []) : (Array.isArray(spyIntel?.buildings) ? spyIntel.buildings : []);
    const trapControlState = district ? (getDistrictTrapControlState(district) || null) : null;
    const visibleBuildings = district && trapControlState?.buildingVisible ? [...buildings, "__district_trap__"] : buildings;
    if (!district && knownFields.buildings === false) {
      root.classList.remove("hidden");
      title.textContent = "Budovy v distriktu";
      list.classList.remove("district-buildings--trap-wide");
      list.innerHTML = '<div class="district-buildings__empty">Budovy se nepodařilo zjistit.</div>';
      return;
    }
    if (!visibleBuildings.length) {
      root.classList.add("hidden");
      list.classList.remove("district-buildings--trap-wide");
      list.innerHTML = "";
      return;
    }
    const lockMeta = district ? resolveBuildingLockMeta(district) : { locked: true, label: "" };
    list.classList.toggle("district-buildings--trap-wide", Boolean(district && trapControlState?.buildingVisible && buildings.length === 2));
    title.textContent = district?.buildingSetTitle ? `Budovy v distriktu • ${district.buildingSetTitle} (${district.buildingTier || "set"})` : "Budovy v distriktu";
    list.innerHTML = visibleBuildings.map((building, index) => {
      if (building === "__district_trap__") {
        return `<div class="district-buildings__item district-buildings__item--trap"><span class="district-buildings__name">${trapControlState?.buildingLabel || "Past"}</span><span class="district-buildings__lock district-buildings__lock--trap">${trapControlState?.buildingMeta || "aktivní"}</span></div>`;
      }
      const iconKey = resolveDistrictBuildingIconKey(building);
      const iconClass = iconKey ? ` district-buildings__item--icon-${iconKey}` : "";
      return `<button class="district-buildings__item district-buildings__item--interactive${iconClass}${lockMeta.locked ? " district-buildings__item--locked" : ""}" type="button" data-building-index="${index}" ${lockMeta.locked ? 'data-building-locked="1" disabled aria-disabled="true"' : ""}>${renderDistrictBuildingName(building, iconKey)}${lockMeta.locked && lockMeta.label ? `<span class="district-buildings__lock">${lockMeta.label}</span>` : ""}</button>`;
    }).join("");
    if (!district) {
      root.classList.remove("hidden");
      return;
    }
    list.querySelectorAll("[data-building-index]:not([data-building-locked])").forEach((button) => {
      button.addEventListener("click", () => {
        const index = Number(button.getAttribute("data-building-index"));
        const buildingName = visibleBuildings[index];
        if (buildingName === "__district_trap__" || !buildingName) return;
        const detailInput = resolveBuildingDetailInput(district, index, buildingName);
        document.getElementById("district-modal")?.classList.add("hidden");
        document.getElementById("modal-buildings")?.classList.add("hidden");
        openBuildingDetailModal(detailInput, district);
      });
    });
    root.classList.remove("hidden");
  }

  function formatDistrictGossipTimestamp(timestamp) {
    const value = Math.max(0, Math.floor(Number(timestamp) || 0));
    if (!value) return "-";
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return "-";
    return `${String(date.getDate()).padStart(2, "0")}.${String(date.getMonth() + 1).padStart(2, "0")}. ${String(date.getHours()).padStart(2, "0")}:${String(date.getMinutes()).padStart(2, "0")}`;
  }

  function updateDistrictGossip(district) {
    const root = document.getElementById("modal-gossip");
    const list = document.getElementById("modal-gossip-list");
    if (!root || !list) return;
    if (!district) {
      root.classList.add("hidden");
      list.innerHTML = "";
      return;
    }
    const entries = getDistrictGossipEntries(district, 24);
    if (!entries.length) {
      list.innerHTML = `<div class="district-gossip__item district-gossip__item--placeholder"><div class="district-gossip__text">Zatím žádné drby pro tento distrikt.</div></div>`;
      root.classList.remove("hidden");
      return;
    }
    list.innerHTML = entries.map((entry) => `<div class="district-gossip__item"><div class="district-gossip__text">${escapeHtml(entry.text)}</div><div class="district-gossip__meta-row"><div class="district-gossip__meta">${formatDistrictGossipTimestamp(entry.createdAt)}</div></div></div>`).join("");
    root.classList.remove("hidden");
  }

  return {
    resolveDistrictBuildingIconKey,
    renderDistrictBuildingName,
    updateDistrictBuildings,
    formatDistrictGossipTimestamp,
    updateDistrictGossip
  };
};
