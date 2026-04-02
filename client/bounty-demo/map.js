(function () {
  "use strict";

  function applyBountyVisualsToMap(container, state) {
    const activeBountyTargets = new Map();
    (state.bounties || []).forEach((bounty) => {
      if (bounty.status !== "active") return;
      activeBountyTargets.set(bounty.targetPlayerId, bounty);
    });

    Array.from(container.querySelectorAll(".district-card")).forEach((cardElement) => {
      const districtId = String(cardElement.dataset.districtId || "");
      const district = state.districts.find((entry) => entry.id === districtId);
      const activeBounty = district ? activeBountyTargets.get(district.ownerPlayerId) : null;
      cardElement.classList.toggle("district--bounty", Boolean(activeBounty));
      cardElement.classList.toggle("district--hunt-mode", Boolean(activeBounty && activeBounty.huntModeActive));
    });
  }

  function createDistrictMap(options) {
    const container = options.container;
    const onOpenBounty = typeof options.onOpenBounty === "function" ? options.onOpenBounty : function () {};

    function renderDistricts(state) {
      const activeBountyTargets = new Map();
      (state.bounties || []).forEach((bounty) => {
        if (bounty.status !== "active") return;
        activeBountyTargets.set(bounty.targetPlayerId, bounty);
      });

      container.innerHTML = state.districts.map((district) => {
        const owner = state.players.find((player) => player.id === district.ownerPlayerId);
        const activeBounty = activeBountyTargets.get(district.ownerPlayerId) || null;
        const classes = [
          "district-card",
          activeBounty ? "district--bounty" : "",
          activeBounty && activeBounty.huntModeActive ? "district--hunt-mode" : ""
        ].filter(Boolean).join(" ");

        return `
          <article class="${classes}" data-district-id="${district.id}">
            <div class="district-card__header">
              <div>
                <div class="district-card__name">${district.name}</div>
                <div class="district-card__zone">${district.zone}</div>
              </div>
              ${activeBounty ? '<div class="district__bounty-icon" title="Aktivní bounty">🎯</div>' : ""}
            </div>
            <div class="district-card__owner">${owner ? owner.name : "Unknown"}</div>
            <div class="district-card__footer">
              <span>#${district.id}</span>
              <button class="btn btn--tiny" type="button" data-open-bounty="${district.ownerPlayerId}">Bounty</button>
            </div>
          </article>
        `;
      }).join("");
    }

    container.addEventListener("click", (event) => {
      const openButton = event.target.closest("[data-open-bounty]");
      if (!openButton) return;
      onOpenBounty(String(openButton.getAttribute("data-open-bounty") || ""));
    });

    return {
      renderDistricts,
      applyBountyVisualsToMap(state) {
        applyBountyVisualsToMap(container, state);
      }
    };
  }

  window.EmpireBountyMap = {
    createDistrictMap,
    applyBountyVisualsToMap
  };
})();
