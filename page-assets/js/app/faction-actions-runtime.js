const PAGE_SELECTOR = "[data-client-surface='game-shell']";

const FACTION_ACTIONS = [
  {
    name: "Mafián",
    code: "Omerta Lock",
    effect: "Zamkne další police pressure tick a sníží heat z jedné špinavé akce.",
    cost: "2 influence"
  },
  {
    name: "Kartel",
    code: "Supply Flood",
    effect: "Další produkce drog doběhne rychleji a přidá bonusový dirty cash pulse.",
    cost: "1 lab slot"
  },
  {
    name: "Kult",
    code: "Fanatic Surge",
    effect: "Dočasně zvýší vliv a posílí obranu districtu s nejnižším morale.",
    cost: "4 influence"
  },
  {
    name: "Tajná organizace",
    code: "Black File",
    effect: "Odhalí slabinu cíle a zvýší kvalitu příští spy akce.",
    cost: "1 intel token"
  },
  {
    name: "Hackeři",
    code: "Grid Breach",
    effect: "Na krátkou dobu zrychlí event reakce a oslabí digitální obranu soupeře.",
    cost: "2 tech cores"
  },
  {
    name: "Motorkářský gang",
    code: "Road Rush",
    effect: "Další raid nebo attack dostane rychlostní bonus a menší návratové ztráty.",
    cost: "1 fuel route"
  },
  {
    name: "Soukromá armáda",
    code: "Hard Shield",
    effect: "Přidá bojový shield na první napadený district a posílí obranné výpočty.",
    cost: "2 combat modules"
  },
  {
    name: "Korporace",
    code: "Legal Cover",
    effect: "Zvedne čistý cash income a sníží viditelnost příští ekonomické akce.",
    cost: "$7,500 clean"
  }
];

function escapeHtml(value) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function renderFactionActions(grid) {
  grid.innerHTML = FACTION_ACTIONS.map((action, index) => `
    <article class="faction-action-card" style="--faction-action-index: ${index}">
      <div class="faction-action-card__mark" aria-hidden="true">F</div>
      <div class="faction-action-card__copy">
        <div class="faction-action-card__name">${escapeHtml(action.name)}</div>
        <div class="faction-action-card__code">${escapeHtml(action.code)}</div>
        <p>${escapeHtml(action.effect)}</p>
        <div class="faction-action-card__meta">
          <span>${escapeHtml(action.cost)}</span>
          <button type="button" class="faction-action-card__button" data-faction-action="${escapeHtml(action.code)}" data-faction-name="${escapeHtml(action.name)}">
            Připravit
          </button>
        </div>
      </div>
    </article>
  `).join("");
}

function initFactionActionsRuntime() {
  const root = document.querySelector(PAGE_SELECTOR);
  if (!root) {
    return;
  }

  const modal = document.getElementById("faction-actions-modal");
  const backdrop = document.getElementById("faction-actions-modal-backdrop");
  const closeBtn = document.getElementById("faction-actions-modal-close");
  const grid = document.getElementById("faction-actions-modal-grid");
  const status = document.getElementById("faction-actions-modal-status");
  const openButtons = Array.from(document.querySelectorAll("[data-faction-actions-open-trigger]"));

  if (!modal || !grid || openButtons.length <= 0) {
    return;
  }

  const open = () => {
    renderFactionActions(grid);
    if (status) {
      status.textContent = "Frakční protokoly připravené.";
    }
    modal.classList.remove("hidden");
  };

  const close = () => {
    modal.classList.add("hidden");
  };

  openButtons.forEach((button) => button.addEventListener("click", open));
  backdrop?.addEventListener("click", close);
  closeBtn?.addEventListener("click", close);

  modal.addEventListener("click", (event) => {
    const target = event.target;
    if (!(target instanceof HTMLElement)) {
      return;
    }

    const button = target.closest("[data-faction-action]");
    if (!(button instanceof HTMLButtonElement) || !status) {
      return;
    }

    const factionName = button.dataset.factionName || "Frakce";
    const actionCode = button.dataset.factionAction || "Protokol";
    status.textContent = `${factionName}: ${actionCode} je připravený k napojení na herní efekt.`;
  });

  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape" && !modal.classList.contains("hidden")) {
      close();
    }
  });
}

if (typeof document !== "undefined") {
  initFactionActionsRuntime();
}
