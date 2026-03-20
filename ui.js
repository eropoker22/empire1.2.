window.Empire = window.Empire || {};

window.Empire.UI = (() => {
  const weaponCatalog = [
    "Baseballová pálka",
    "Pistole",
    "Samopal (SMG)",
    "Útočná puška",
    "Explozivní nálož"
  ];

  const attackWeaponStats = [
    { name: "Baseballová pálka", power: 6 },
    { name: "Pistole", power: 12 },
    { name: "Samopal (SMG)", power: 18 },
    { name: "Útočná puška", power: 26 },
    { name: "Explozivní nálož", power: 40 }
  ];

  const defenseCatalog = [
    "Neprůstřelná vesta",
    "Ocelové barikády",
    "Bezpečnostní kamery",
    "Automatické kulometné stanoviště",
    "EMP obranný modul",
    "Kulometná věž",
    "Raketová věž"
  ];

  const defenseWeaponStats = [
    { name: "Neprůstřelná vesta", power: 8 },
    { name: "Ocelové barikády", power: 14 },
    { name: "Bezpečnostní kamery", power: 6 },
    { name: "Automatické kulometné stanoviště", power: 22 },
    { name: "Raketová věž", power: 30 }
  ];

  const SETTINGS_STORAGE_KEY = "empire_settings";
  const DEFAULT_SETTINGS = Object.freeze({
    sound: true,
    music: true,
    notifications: true,
    effectsQuality: "high",
    language: "cs"
  });

  const districtBuildingCatalog = {
    downtown: [
      "Centrální banka",
      "Magistrát",
      "Lobby klub",
      "Burza",
      "Soud",
      "VIP salonek"
    ],
    commercial: [
      "Obchodní centrum",
      "Restaurace",
      "Lékárna",
      "Kasino",
      "Autosalon",
      "Fitness club",
      "Směnárna",
      "Kancelářský blok"
    ],
    residential: [
      "Bytový blok",
      "Rekrutační centrum",
      "Brainwash centrum",
      "Garage",
      "Klinika",
      "Škola"
    ],
    industrial: [
      "Továrna",
      "Zbrojovka",
      "Sklad",
      "Energetická stanice",
      "Datové centrum"
    ],
    park: [
      "Drug lab",
      "Pašovací tunel",
      "Večerka",
      "Strip club",
      "Pouliční dealeři"
    ]
  };

  const buildingDistrictTypes = [
    { key: "commercial", label: "Commercial" },
    { key: "industrial", label: "Industrial" },
    { key: "residential", label: "Resident" },
    { key: "park", label: "Park" },
    { key: "downtown", label: "Downtown" }
  ];

  const districtTypeBackgrounds = {
    commercial: "../img/commercial/1.png",
    industrial: "../img/industrial/1.png",
    residential: "../img/residental/1.png",
    park: "../img/park/1.png",
    downtown: "../img/downtown/1.png"
  };

  const commercialDistrictPools = {
    early: [
      {
        key: "early-stable-1",
        tier: "early",
        title: "Stabilní provoz",
        buildings: ["Restaurace", "Fitness club"]
      },
      {
        key: "early-stable-2",
        tier: "early",
        title: "Civilní utility",
        buildings: ["Restaurace", "Lékárna"]
      },
      {
        key: "early-cash",
        tier: "early",
        title: "Lehký cashflow",
        buildings: ["Restaurace", "Směnárna"]
      },
      {
        key: "early-safe-3",
        tier: "early",
        title: "Bezpečný mix",
        buildings: ["Restaurace", "Lékárna", "Fitness club"]
      },
      {
        key: "early-launder",
        tier: "early",
        title: "Startovní laundering",
        buildings: ["Autosalon", "Restaurace"]
      }
    ],
    mid: [
      {
        key: "mid-balance-1",
        tier: "mid",
        title: "Utility growth",
        buildings: ["Autosalon", "Lékárna"]
      },
      {
        key: "mid-balance-2",
        tier: "mid",
        title: "Finanční uzel",
        buildings: ["Autosalon", "Směnárna"]
      },
      {
        key: "mid-corp-1",
        tier: "mid",
        title: "Korporátní stabilita",
        buildings: ["Kancelářský blok", "Restaurace"]
      },
      {
        key: "mid-corp-2",
        tier: "mid",
        title: "Administrativní utility",
        buildings: ["Kancelářský blok", "Lékárna", "Restaurace"]
      },
      {
        key: "mid-mall-1",
        tier: "mid",
        title: "Hlavní retail",
        buildings: ["Obchodní centrum", "Restaurace"]
      },
      {
        key: "mid-mix-1",
        tier: "mid",
        title: "Vyvážený obchod",
        buildings: ["Restaurace", "Lékárna", "Směnárna"]
      },
      {
        key: "mid-mix-2",
        tier: "mid",
        title: "Prací front",
        buildings: ["Autosalon", "Směnárna", "Restaurace"]
      }
    ],
    top: [
      {
        key: "top-casino-1",
        tier: "top",
        title: "Kasino hotspot",
        buildings: ["Kasino", "Restaurace"]
      },
      {
        key: "top-casino-2",
        tier: "top",
        title: "Shady premium",
        buildings: ["Kasino", "Restaurace", "Lékárna"]
      },
      {
        key: "top-casino-3",
        tier: "top",
        title: "Black cash engine",
        buildings: ["Kasino", "Směnárna", "Autosalon"]
      },
      {
        key: "top-mall-1",
        tier: "top",
        title: "Prémiový retail",
        buildings: ["Obchodní centrum", "Lékárna", "Restaurace"]
      },
      {
        key: "top-mall-2",
        tier: "top",
        title: "Financial boulevard",
        buildings: ["Obchodní centrum", "Směnárna", "Restaurace"]
      }
    ]
  };

  const residentialDistrictPools = {
    early: [
      {
        key: "res-early-1",
        tier: "early",
        title: "Startovní růst",
        buildings: ["Bytový blok", "Garage"]
      },
      {
        key: "res-early-2",
        tier: "early",
        title: "Stabilní základna",
        buildings: ["Bytový blok", "Brainwash centrum"]
      },
      {
        key: "res-early-3",
        tier: "early",
        title: "První nábor",
        buildings: ["Bytový blok", "Rekrutační centrum"]
      },
      {
        key: "res-early-4",
        tier: "early",
        title: "Obytná kontrola",
        buildings: ["Bytový blok", "Brainwash centrum", "Garage"]
      }
    ],
    mid: [
      {
        key: "res-mid-1",
        tier: "mid",
        title: "Mobilní posily",
        buildings: ["Bytový blok", "Rekrutační centrum", "Garage"]
      },
      {
        key: "res-mid-2",
        tier: "mid",
        title: "Udržitelný růst",
        buildings: ["Bytový blok", "Klinika"]
      },
      {
        key: "res-mid-3",
        tier: "mid",
        title: "Disciplína a kvalita",
        buildings: ["Bytový blok", "Škola"]
      },
      {
        key: "res-mid-4",
        tier: "mid",
        title: "Loajalita a výcvik",
        buildings: ["Brainwash centrum", "Škola"]
      },
      {
        key: "res-mid-5",
        tier: "mid",
        title: "Regenerace fronty",
        buildings: ["Rekrutační centrum", "Klinika"]
      },
      {
        key: "res-mid-6",
        tier: "mid",
        title: "Kontrolovaný development",
        buildings: ["Bytový blok", "Brainwash centrum", "Škola"]
      }
    ],
    late: [
      {
        key: "res-late-1",
        tier: "late",
        title: "Válečné zázemí",
        buildings: ["Bytový blok", "Rekrutační centrum", "Klinika"]
      },
      {
        key: "res-late-2",
        tier: "late",
        title: "Mobilní tlak",
        buildings: ["Rekrutační centrum", "Garage", "Klinika"]
      },
      {
        key: "res-late-3",
        tier: "late",
        title: "Loajální populace",
        buildings: ["Bytový blok", "Brainwash centrum", "Klinika"]
      },
      {
        key: "res-late-4",
        tier: "late",
        title: "Elitní rezidenční zóna",
        buildings: ["Bytový blok", "Škola", "Klinika"]
      },
      {
        key: "res-late-5",
        tier: "late",
        title: "Strategická mobilizace",
        buildings: ["Bytový blok", "Rekrutační centrum", "Škola"]
      }
    ]
  };

  const parkDistrictPools = {
    early: [
      {
        key: "park-early-1",
        tier: "early",
        title: "Street cash",
        buildings: ["Pouliční dealeři", "Večerka"]
      },
      {
        key: "park-early-2",
        tier: "early",
        title: "Quick runners",
        buildings: ["Pouliční dealeři", "Pašovací tunel"]
      },
      {
        key: "park-early-3",
        tier: "early",
        title: "Night cover",
        buildings: ["Strip club", "Večerka"]
      }
    ],
    mid: [
      {
        key: "park-mid-1",
        tier: "mid",
        title: "Distribution lane",
        buildings: ["Drug lab", "Pašovací tunel"]
      },
      {
        key: "park-mid-2",
        tier: "mid",
        title: "Vice market",
        buildings: ["Strip club", "Pouliční dealeři"]
      },
      {
        key: "park-mid-3",
        tier: "mid",
        title: "Covered traffic",
        buildings: ["Pašovací tunel", "Večerka"]
      },
      {
        key: "park-mid-4",
        tier: "mid",
        title: "Hidden production",
        buildings: ["Drug lab", "Večerka"]
      },
      {
        key: "park-mid-5",
        tier: "mid",
        title: "Night logistics",
        buildings: ["Strip club", "Pašovací tunel"]
      }
    ],
    top: [
      {
        key: "park-top-1",
        tier: "top",
        title: "Chaos corridor",
        buildings: ["Drug lab", "Pašovací tunel", "Pouliční dealeři"]
      },
      {
        key: "park-top-2",
        tier: "top",
        title: "Vice empire",
        buildings: ["Drug lab", "Strip club"]
      },
      {
        key: "park-top-3",
        tier: "top",
        title: "Black nightlife",
        buildings: ["Strip club", "Pouliční dealeři", "Večerka"]
      },
      {
        key: "park-top-4",
        tier: "top",
        title: "Hot route",
        buildings: ["Drug lab", "Pašovací tunel", "Večerka"]
      }
    ]
  };

  const industrialDistrictPools = {
    early: [
      {
        key: "ind-early-1",
        tier: "early",
        title: "Základní výroba",
        buildings: ["Továrna", "Sklad"]
      },
      {
        key: "ind-early-2",
        tier: "early",
        title: "Napájená produkce",
        buildings: ["Továrna", "Energetická stanice"]
      },
      {
        key: "ind-early-3",
        tier: "early",
        title: "První militarizace",
        buildings: ["Továrna", "Zbrojovka"]
      },
      {
        key: "ind-early-4",
        tier: "early",
        title: "Zásobovací uzel",
        buildings: ["Sklad", "Energetická stanice"]
      }
    ],
    mid: [
      {
        key: "ind-mid-1",
        tier: "mid",
        title: "Vojenská výroba",
        buildings: ["Zbrojovka", "Sklad"]
      },
      {
        key: "ind-mid-2",
        tier: "mid",
        title: "Technický provoz",
        buildings: ["Továrna", "Datové centrum"]
      },
      {
        key: "ind-mid-3",
        tier: "mid",
        title: "Efektivní řetězec",
        buildings: ["Továrna", "Sklad", "Energetická stanice"]
      },
      {
        key: "ind-mid-4",
        tier: "mid",
        title: "Zbrojní logistika",
        buildings: ["Zbrojovka", "Sklad", "Energetická stanice"]
      },
      {
        key: "ind-mid-5",
        tier: "mid",
        title: "Datová výroba",
        buildings: ["Sklad", "Datové centrum"]
      }
    ],
    top: [
      {
        key: "ind-top-1",
        tier: "top",
        title: "Arms grid",
        buildings: ["Továrna", "Zbrojovka", "Sklad"]
      },
      {
        key: "ind-top-2",
        tier: "top",
        title: "Power forge",
        buildings: ["Továrna", "Zbrojovka", "Energetická stanice"]
      },
      {
        key: "ind-top-3",
        tier: "top",
        title: "Hack foundry",
        buildings: ["Zbrojovka", "Datové centrum", "Sklad"]
      },
      {
        key: "ind-top-4",
        tier: "top",
        title: "Critical infrastructure",
        buildings: ["Energetická stanice", "Datové centrum", "Sklad"]
      }
    ]
  };

  const downtownDistrictPools = {
    mid: [
      {
        key: "down-mid-1",
        tier: "mid",
        title: "Městské finance",
        buildings: ["Centrální banka", "Magistrát"]
      },
      {
        key: "down-mid-2",
        tier: "mid",
        title: "Politický vliv",
        buildings: ["Lobby klub", "Magistrát"]
      },
      {
        key: "down-mid-3",
        tier: "mid",
        title: "Právní tlak",
        buildings: ["Soud", "Lobby klub"]
      },
      {
        key: "down-mid-4",
        tier: "mid",
        title: "Volatilní kapitál",
        buildings: ["Burza", "VIP salonek"]
      }
    ],
    high: [
      {
        key: "down-high-1",
        tier: "high",
        title: "Korporátní kontrola",
        buildings: ["Centrální banka", "Lobby klub"]
      },
      {
        key: "down-high-2",
        tier: "high",
        title: "Státní pevnost",
        buildings: ["Magistrát", "Soud"]
      },
      {
        key: "down-high-3",
        tier: "high",
        title: "Elitní arbitráž",
        buildings: ["Soud", "VIP salonek"]
      },
      {
        key: "down-high-4",
        tier: "high",
        title: "Burzovní manipulace",
        buildings: ["Burza", "Lobby klub"]
      },
      {
        key: "down-high-5",
        tier: "high",
        title: "Executive chamber",
        buildings: ["Magistrát", "VIP salonek"]
      }
    ],
    core: [
      {
        key: "down-core-1",
        tier: "core",
        title: "Capital nexus",
        buildings: ["Centrální banka", "Magistrát", "VIP salonek"]
      },
      {
        key: "down-core-2",
        tier: "core",
        title: "Shadow exchange",
        buildings: ["Burza", "Lobby klub", "VIP salonek"]
      },
      {
        key: "down-core-3",
        tier: "core",
        title: "Judicial machine",
        buildings: ["Magistrát", "Soud", "Lobby klub"]
      },
      {
        key: "down-core-4",
        tier: "core",
        title: "System override",
        buildings: ["Centrální banka", "Soud", "Lobby klub"]
      }
    ]
  };

  let cachedProfile = null;
  let cachedEconomy = null;
  let cachedMarket = null;
  let marketRefreshHandler = null;
  let allianceRefreshHandler = null;
  const LOCAL_ALLIANCE_KEY = "empire_local_alliance_state";
  const LOCAL_MARKET_KEY = "empire_local_market_state";

  function init() {
    bindActions();
  }

  function bindActions() {
    initEventsModal();
    initBuildingsModal();
    initAllianceModal();
    initMarketModal();
    initWeaponsModal();
    initWeaponsPopover();
    document.getElementById("attack-btn").addEventListener("click", async () => {
      if (!window.Empire.token) {
        pushEvent("Pro útok je nutné přihlášení.");
        return;
      }
      if (!window.Empire.selectedDistrict) return;
      const result = await window.Empire.API.attackDistrict(
        window.Empire.selectedDistrict.id
      );
      if (result && result.message) {
        pushEvent(result.message);
      }
    });

    const raidBtn = document.getElementById("raid-btn");
    if (raidBtn) {
      raidBtn.addEventListener("click", () => {
        if (!window.Empire.token) {
          pushEvent("Pro vykrádání je nutné přihlášení.");
          return;
        }
        if (!window.Empire.selectedDistrict) return;
        pushEvent("Vykrádání distriktu bylo zahájeno.");
      });
    }

    const spyBtn = document.getElementById("spy-btn");
    if (spyBtn) {
      spyBtn.addEventListener("click", () => {
        if (!window.Empire.token) {
          pushEvent("Pro špehování je nutné přihlášení.");
          return;
        }
        if (!window.Empire.selectedDistrict) return;
        pushEvent("Špehování distriktu bylo zahájeno.");
      });
    }

    const refreshRoundBtn = document.getElementById("refresh-round");
    if (refreshRoundBtn) {
      refreshRoundBtn.addEventListener("click", () => {
        window.Empire.API.refreshRound();
      });
    }

    const navProfile = document.getElementById("nav-profile");
    if (navProfile) {
      navProfile.addEventListener("click", () => {
        showProfileModal();
      });
    }

    document.querySelectorAll("[data-nav-settings]").forEach((button) => {
      button.addEventListener("click", () => {
        showSettingsModal();
      });
    });

    document.querySelectorAll("[data-nav-logout]").forEach((button) => {
      button.addEventListener("click", () => {
        localStorage.removeItem("empire_token");
        localStorage.removeItem("empire_structure");
        window.location.href = "login.html";
      });
    });

    const weaponsAttackBtn = document.getElementById("weapons-attack-btn");
    if (weaponsAttackBtn) {
      weaponsAttackBtn.addEventListener("click", (event) => {
        event.stopPropagation();
        openWeaponsModal("attack");
      });
    }

    const weaponsDefenseBtn = document.getElementById("weapons-defense-btn");
    if (weaponsDefenseBtn) {
      weaponsDefenseBtn.addEventListener("click", (event) => {
        event.stopPropagation();
        openWeaponsModal("defense");
      });
    }
  }

  function initEventsModal() {
    const openBtn = document.getElementById("city-events-open");
    const modal = document.getElementById("events-modal");
    const backdrop = document.getElementById("events-modal-backdrop");
    const closeBtn = document.getElementById("events-modal-close");
    const tasklist = document.getElementById("events-tasklist");
    const agentName = document.getElementById("events-agent-name");
    const agentType = document.getElementById("events-agent-type");
    const agentDesc = document.getElementById("events-agent-desc");
    const agentQuote = document.getElementById("events-agent-quote");
    const agentButtons = Array.from(document.querySelectorAll(".events-agent"));

    if (!modal || !openBtn) return;

    const agents = {
      victor: {
        name: "Victor Grave Kadeř",
        type: "Pouliční boss",
        desc:
          "Bývalý vyhazovač, co si vymlátil vlastní teritorium. Neřeší kecy, jen výsledky. Respekt si bere silou.",
        quote: "Buď to vezmeš nebo to vezme někdo jinej.",
        tasks: [
          { title: "Útok na sektor", desc: "Prolom obranu rivala v průmyslovém pásmu." },
          { title: "Likvidace nepřítele", desc: "Zlikviduj vůdce pouličního gangu v Docklands." },
          { title: "Obsazení území", desc: "Zabrat neutralní blok a držet ho 24 hodin." }
        ]
      },
      leon: {
        name: "Leon Switch Varga",
        type: "Fixer / obchodník",
        desc:
          "Všechno ví, všechno zařídí. Má kontakty v každém sektoru a nikdy nepracuje zadarmo.",
        quote: "Nejde o to, co máš. Jde o to, co z toho vytěžíš.",
        tasks: [
          { title: "Černý obchod", desc: "Vyjednej výměnu drog za zbraně s konkurenční frakcí." },
          { title: "Získání zdrojů", desc: "Získej $50k a 120 drog z bočních operací." },
          { title: "Tichá dohoda", desc: "Uzavři dohodu s dvěma sektory pro pasivní příjem." }
        ]
      },
      nina: {
        name: "Nina Velvet Rojas",
        type: "Informační síť / vliv",
        desc:
          "Vlastní několik klubů a ví o každém všechno. Usmívá se ale tahá za nitky v pozadí.",
        quote: "Informace jsou dražší než krev. A já jich mám dost.",
        tasks: [
          { title: "Sběr informací", desc: "Získej přístup k databázi metra a odposlechům." },
          { title: "Infiltrace sektoru", desc: "Pošli agenta do finanční zóny a získej kompromitující data." },
          { title: "Zvýšení vlivu", desc: "Vytvoř skandál a posuň reputaci o 15 bodů." }
        ]
      }
    };

    const renderTasks = (agentKey) => {
      const agent = agents[agentKey];
      if (!agent || !tasklist) return;
      agentButtons.forEach((btn) => btn.classList.toggle("is-active", btn.dataset.agent === agentKey));
      if (agentName) agentName.textContent = agent.name;
      if (agentType) agentType.textContent = agent.type;
      if (agentDesc) agentDesc.textContent = agent.desc;
      if (agentQuote) agentQuote.textContent = agent.quote;
      tasklist.innerHTML = agent.tasks
        .map(
          (task) => `
          <div class="events-task">
            <div class="events-task__title">${task.title}</div>
            <div class="events-task__desc">${task.desc}</div>
            <div class="events-task__actions">
              <button class="btn btn--primary" data-action="accept" data-title="${task.title}">Accept</button>
              <button class="btn btn--ghost" data-action="decline" data-title="${task.title}">Decline</button>
            </div>
          </div>
        `
        )
        .join("");
    };

    const openModal = () => {
      modal.classList.remove("hidden");
    };
    const closeModal = () => {
      modal.classList.add("hidden");
    };

    openBtn.addEventListener("click", openModal);
    if (backdrop) backdrop.addEventListener("click", closeModal);
    if (closeBtn) closeBtn.addEventListener("click", closeModal);

    agentButtons.forEach((btn) => {
      btn.addEventListener("click", () => {
        renderTasks(btn.dataset.agent);
      });
    });

    if (tasklist) {
      tasklist.addEventListener("click", (event) => {
        const target = event.target;
        if (!(target instanceof HTMLElement)) return;
        const action = target.dataset.action;
        const title = target.dataset.title;
        if (!action || !title) return;
        if (action === "accept") pushEvent(`Přijato: ${title}`);
        if (action === "decline") pushEvent(`Odmítnuto: ${title}`);
      });
    }
  }

  function initBuildingsModal() {
    const openBtn = document.getElementById("buildings-open");
    const root = document.getElementById("buildings-modal");
    const backdrop = document.getElementById("buildings-modal-backdrop");
    const closeBtn = document.getElementById("buildings-modal-close");
    const typeList = document.getElementById("buildings-type-list");
    const detail = document.getElementById("buildings-modal-detail");
    const content = root.querySelector(".buildings-modal__content");

    if (!root || !openBtn || !typeList || !detail || !content) return;

    const closeModal = () => {
      root.classList.add("hidden");
    };

    const renderTypes = (selectedType) => {
      typeList.innerHTML = buildingDistrictTypes
        .map(
          (type) => `
            <button class="buildings-modal__type-btn ${type.key === selectedType ? "is-active" : ""}" data-building-type="${type.key}">
              ${type.label}
            </button>
          `
        )
        .join("");
    };

    const renderDetail = (typeKey) => {
      const selected = buildingDistrictTypes.find((type) => type.key === typeKey) || buildingDistrictTypes[0];
      const backgroundImage = districtTypeBackgrounds[selected.key] || "";

      content.classList.toggle("buildings-modal__content--with-bg", Boolean(backgroundImage));
      content.style.backgroundImage = backgroundImage
        ? `linear-gradient(rgba(3, 7, 18, 0.78), rgba(3, 7, 18, 0.88)), url('${backgroundImage}')`
        : "";

      detail.innerHTML = `
        <section class="buildings-modal__detail-card">
          <div class="buildings-modal__detail-title">${selected.label}</div>
          <div class="buildings-modal__detail-meta">${formatDistrictType(selected.key)}</div>
          ${renderDistrictTypeDetail(selected.key)}
        </section>
      `;
    };

    const renderBuildings = (selectedType = buildingDistrictTypes[0].key) => {
      renderTypes(selectedType);
      renderDetail(selectedType);
    };

    openBtn.addEventListener("click", () => {
      renderBuildings();
      root.classList.remove("hidden");
    });
    typeList.addEventListener("click", (event) => {
      const target = event.target;
      if (!(target instanceof HTMLElement)) return;
      const button = target.closest("[data-building-type]");
      if (!(button instanceof HTMLElement)) return;
      const selectedType = button.dataset.buildingType;
      if (!selectedType) return;
      renderBuildings(selectedType);
    });
    if (backdrop) backdrop.addEventListener("click", closeModal);
    if (closeBtn) closeBtn.addEventListener("click", closeModal);
    document.addEventListener("keydown", (event) => {
      if (event.key === "Escape") closeModal();
    });
  }

  function resolveBuildingsForDistrictType(typeKey) {
    const catalog = districtBuildingCatalog[typeKey] || [
      "Operační základna",
      "Sklad",
      "Kontrolní bod",
      "Garáž",
      "Bezpečný dům"
    ];
    return catalog.map((building, index) => `${index + 1}. ${building}`);
  }

  function renderDistrictTypeDetail(typeKey) {
    const buildings = resolveBuildingsForDistrictType(typeKey);
    return `
      <div class="buildings-modal__building-grid">
        ${buildings
          .map(
            (building) => `
              <button class="buildings-modal__building buildings-modal__building--interactive" type="button">
                ${building}
              </button>
            `
          )
          .join("")}
      </div>
    `;
  }

  function assignDistrictMetadata(districts) {
    if (!Array.isArray(districts) || !districts.length) return districts;
    const nextDistricts = districts.map((district) => ({
      ...district,
      buildings: Array.isArray(district.buildings) ? district.buildings : [],
      buildingTier: district.buildingTier || null,
      buildingSetKey: district.buildingSetKey || null,
      buildingSetTitle: district.buildingSetTitle || null
    }));

    const bounds = getDistrictBounds(nextDistricts);
    assignDistrictTypePools(nextDistricts, bounds, {
      type: "commercial",
      pools: commercialDistrictPools,
      tiers: ["early", "mid", "top"],
      ratios: { low: 0.4, high: 0.2 }
    });
    assignDistrictTypePools(nextDistricts, bounds, {
      type: "residential",
      pools: residentialDistrictPools,
      tiers: ["early", "mid", "late"],
      ratios: { low: 0.45, high: 0.2 }
    });
    assignDistrictTypePools(nextDistricts, bounds, {
      type: "park",
      pools: parkDistrictPools,
      tiers: ["early", "mid", "top"],
      ratios: { low: 0.45, high: 0.25 }
    });
    assignDistrictTypePools(nextDistricts, bounds, {
      type: "industrial",
      pools: industrialDistrictPools,
      tiers: ["early", "mid", "top"],
      ratios: { low: 0.4, high: 0.25 }
    });
    assignDistrictTypePools(nextDistricts, bounds, {
      type: "downtown",
      pools: downtownDistrictPools,
      tiers: ["mid", "high", "core"],
      ratios: { low: 0.4, high: 0.25 }
    });

    return nextDistricts;
  }

  function assignDistrictTypePools(districts, bounds, config) {
    const typedDistricts = districts.filter((district) => district.type === config.type);
    if (!typedDistricts.length) return;

    const ranked = typedDistricts
      .map((district) => ({
        district,
        distance: distanceFromMapCenter(district, bounds)
      }))
      .sort((a, b) => b.distance - a.distance);

    const total = ranked.length;
    const lowCount = Math.max(1, Math.round(total * config.ratios.low));
    const highCount = total >= 5 ? Math.max(1, Math.round(total * config.ratios.high)) : Math.min(1, total);
    const midCount = Math.max(0, total - lowCount - highCount);

    ranked.forEach((entry, index) => {
      let tier = config.tiers[1];
      if (index < lowCount) tier = config.tiers[0];
      else if (index >= lowCount + midCount) tier = config.tiers[2];
      const set = pickDistrictSet(config.pools, entry.district, tier, index);
      entry.district.buildings = set.buildings;
      entry.district.buildingTier = set.tier;
      entry.district.buildingSetKey = set.key;
      entry.district.buildingSetTitle = set.title;
    });
  }

  function pickCommercialSet(district, tier, index) {
    const pool = commercialDistrictPools[tier] || commercialDistrictPools.mid;
    const offset = hashDistrictSeed(district.id, index) % pool.length;
    return pool[offset];
  }

  function pickDistrictSet(pools, district, tier, index) {
    const fallbackTier = Object.keys(pools)[1] || Object.keys(pools)[0];
    const pool = pools[tier] || pools[fallbackTier] || [];
    const offset = hashDistrictSeed(district.id, index) % pool.length;
    return pool[offset];
  }

  function hashDistrictSeed(seed, extra = 0) {
    const text = `${seed || ""}:${extra}`;
    let hash = 0;
    for (let i = 0; i < text.length; i += 1) {
      hash = (hash * 31 + text.charCodeAt(i)) >>> 0;
    }
    return hash;
  }

  function getDistrictBounds(districts) {
    let minX = Number.POSITIVE_INFINITY;
    let minY = Number.POSITIVE_INFINITY;
    let maxX = Number.NEGATIVE_INFINITY;
    let maxY = Number.NEGATIVE_INFINITY;

    districts.forEach((district) => {
      (district.polygon || []).forEach(([x, y]) => {
        minX = Math.min(minX, x);
        minY = Math.min(minY, y);
        maxX = Math.max(maxX, x);
        maxY = Math.max(maxY, y);
      });
    });

    return {
      minX: Number.isFinite(minX) ? minX : 0,
      minY: Number.isFinite(minY) ? minY : 0,
      maxX: Number.isFinite(maxX) ? maxX : 0,
      maxY: Number.isFinite(maxY) ? maxY : 0
    };
  }

  function distanceFromMapCenter(district, bounds) {
    const center = polygonCentroid(district.polygon || []);
    const mapCenterX = (bounds.minX + bounds.maxX) / 2;
    const mapCenterY = (bounds.minY + bounds.maxY) / 2;
    const dx = center.x - mapCenterX;
    const dy = center.y - mapCenterY;
    return Math.sqrt(dx * dx + dy * dy);
  }

  function polygonCentroid(polygon) {
    if (!Array.isArray(polygon) || !polygon.length) {
      return { x: 0, y: 0 };
    }
    const sum = polygon.reduce(
      (acc, point) => {
        acc.x += Number(point[0] || 0);
        acc.y += Number(point[1] || 0);
        return acc;
      },
      { x: 0, y: 0 }
    );
    return {
      x: sum.x / polygon.length,
      y: sum.y / polygon.length
    };
  }

  function formatDistrictType(type) {
    const labels = {
      downtown: "Centrum",
      commercial: "Komerční zóna",
      residential: "Rezidenční zóna",
      industrial: "Průmyslová zóna",
      park: "Park"
    };
    return labels[type] || type || "Neznámý typ";
  }

  async function hydrateAfterAuth() {
    const profile = await window.Empire.API.getProfile();
    const economy = await window.Empire.API.getEconomy();
    const districtData = await window.Empire.API.getDistricts();

    window.Empire.player = profile;
    updateProfile(profile);
    updateEconomy(economy);

    if (districtData && districtData.districts) {
      window.Empire.Map.setDistricts(districtData.districts);
    }

    window.Empire.WS.connect();
  }

  function updateProfile(profile) {
    cachedProfile = profile;
    document.getElementById("profile-gang").textContent = profile.gangName || "-";
    document.getElementById("profile-districts").textContent = profile.districts || 0;
    document.getElementById("profile-alliance").textContent = profile.alliance || "Žádná";
    const structure = document.getElementById("profile-structure");
    const statStructure = document.getElementById("stat-structure");
    if (structure) {
      structure.textContent = profile.structure || localStorage.getItem("empire_structure") || "-";
    }
    if (statStructure) {
      statStructure.textContent = profile.structure || localStorage.getItem("empire_structure") || "-";
    }
    hydrateProfileModal(profile);
    updateWeaponsPopover();
    updateDefensePopover();
  }

  function setGuestMode(isGuest) {
    const banner = document.getElementById("guest-banner");
    if (!banner) return;
    banner.classList.toggle("hidden", !isGuest);
    if (isGuest) {
      const state = getLocalAllianceState();
      renderAllianceChat(state.chat);
      syncGuestAllianceLabel(state.activeAlliance?.name || "Žádná");
      syncGuestEconomyFromMarket();
    }
  }

  function initProfileModal() {
    const root = document.getElementById("profile-modal");
    const backdrop = document.getElementById("profile-modal-backdrop");
    const closeBtn = document.getElementById("profile-modal-close");
    if (!root) return;
    if (backdrop) backdrop.addEventListener("click", () => root.classList.add("hidden"));
    if (closeBtn) closeBtn.addEventListener("click", () => root.classList.add("hidden"));
    document.addEventListener("keydown", (event) => {
      if (event.key === "Escape") root.classList.add("hidden");
    });
  }

  function initAllianceModal() {
    const openBtn = document.getElementById("alliance-btn");
    const root = document.getElementById("alliance-modal");
    const backdrop = document.getElementById("alliance-modal-backdrop");
    const closeBtn = document.getElementById("alliance-modal-close");
    const createBtn = document.getElementById("alliance-create-btn");
    const leaveBtn = document.getElementById("alliance-leave-btn");
    const createName = document.getElementById("alliance-create-name");
    const inviteName = document.getElementById("alliance-invite-name");
    const inviteBtn = document.getElementById("alliance-invite-btn");
    const chatInput = document.getElementById("alliance-chat-input");
    const chatSend = document.getElementById("alliance-chat-send");
    if (!root || !openBtn || !createBtn || !leaveBtn || !createName || !inviteName || !inviteBtn || !chatInput || !chatSend) return;

    const refreshAlliance = async () => {
      if (!window.Empire.token) {
        const localState = getLocalAllianceState();
        renderAllianceState(localState.activeAlliance, localState.alliances);
        renderAllianceChat(localState.chat);
        return;
      }
      const [mine, listing] = await Promise.all([
        window.Empire.API.getAlliance(),
        window.Empire.API.listAlliances()
      ]);
      renderAllianceState(mine.alliance || null, listing.alliances || []);
      renderAllianceChat([]);
    };
    allianceRefreshHandler = refreshAlliance;

    openBtn.addEventListener("click", async () => {
      root.classList.remove("hidden");
      await refreshAlliance();
    });
    createBtn.addEventListener("click", async () => {
      const name = String(createName.value || "").trim();
      if (!name) {
        pushEvent("Zadej název aliance.");
        return;
      }
      if (!window.Empire.token) {
        const state = getLocalAllianceState();
        const newAlliance = createLocalAlliance(state, name);
        saveLocalAllianceState(state);
        pushEvent(`Aliance ${newAlliance.name} byla vytvořena.`);
        await refreshAlliance();
        syncGuestAllianceLabel(newAlliance.name);
        return;
      }
      const result = await window.Empire.API.createAlliance(name);
      if (result.error) {
        pushEvent(`Aliance: ${result.error}`);
        return;
      }
      pushEvent("Aliance byla vytvořena.");
      await refreshAlliance();
      const profile = await window.Empire.API.getProfile();
      updateProfile(profile);
    });
    leaveBtn.addEventListener("click", async () => {
      if (!window.Empire.token) {
        const state = getLocalAllianceState();
        leaveLocalAlliance(state);
        saveLocalAllianceState(state);
        pushEvent("Alianci jsi opustil.");
        await refreshAlliance();
        syncGuestAllianceLabel("Žádná");
        return;
      }
      const result = await window.Empire.API.leaveAlliance();
      if (result.error) {
        pushEvent(`Aliance: ${result.error}`);
        return;
      }
      pushEvent("Alianci jsi opustil.");
      await refreshAlliance();
      const profile = await window.Empire.API.getProfile();
      updateProfile(profile);
    });
    inviteBtn.addEventListener("click", async () => {
      const name = String(inviteName.value || "").trim();
      if (!name) {
        pushEvent("Zadej jméno člena pro pozvánku.");
        return;
      }
      if (!window.Empire.token) {
        const state = getLocalAllianceState();
        const result = inviteLocalAllianceMember(state, name);
        if (result.error) {
          pushEvent(`Aliance: ${result.error}`);
          return;
        }
        saveLocalAllianceState(state);
        pushEvent(`Člen ${name} byl přidán do aliance.`);
        inviteName.value = "";
        await refreshAlliance();
        return;
      }
      pushEvent("Pozvánky do aliance přes backend zatím nejsou napojené.");
    });
    if (backdrop) backdrop.addEventListener("click", () => root.classList.add("hidden"));
    if (closeBtn) closeBtn.addEventListener("click", () => root.classList.add("hidden"));
    document.addEventListener("keydown", (event) => {
      if (event.key === "Escape") root.classList.add("hidden");
    });
    chatSend.addEventListener("click", async () => {
      const text = String(chatInput.value || "").trim();
      if (!text) return;
      if (window.Empire.token) {
        pushEvent("Alliance chat backend zatím není napojený.");
        return;
      }
      const state = getLocalAllianceState();
      appendLocalAllianceChat(state, {
        author: "Ty",
        text
      });
      saveLocalAllianceState(state);
      chatInput.value = "";
      renderAllianceChat(state.chat);
    });
  }

  function renderAllianceState(activeAlliance, alliances) {
    const activePanel = document.getElementById("alliance-active-panel");
    const listPanel = document.getElementById("alliance-list-panel");
    const leaveBtn = document.getElementById("alliance-leave-btn");
    if (!activePanel || !listPanel || !leaveBtn) return;

    leaveBtn.classList.toggle("hidden", !activeAlliance);

    if (activeAlliance) {
      activePanel.innerHTML = `
        <div class="modal__row">
          <span>Aktivní aliance</span>
          <strong>${activeAlliance.name}</strong>
        </div>
        <div class="modal__row">
          <span>Bonus income</span>
          <strong>+${activeAlliance.bonus_income_pct || 0}%</strong>
        </div>
        <div class="modal__row">
          <span>Bonus influence</span>
          <strong>+${activeAlliance.bonus_influence_pct || 0}%</strong>
        </div>
        <div class="modal__row">
          <span>Bonus heat control</span>
          <strong>${activeAlliance.heat_control_text || "-8% heat"}</strong>
        </div>
        <div class="modal__row">
          <span>Členové</span>
          <strong>${activeAlliance.member_count || 0}</strong>
        </div>
        <div class="alliance-members">
          ${(activeAlliance.members || [])
            .map((member) => `<div class="alliance-member">${member.username} • ${member.gang_name}</div>`)
            .join("")}
        </div>
      `;
    } else {
      activePanel.innerHTML = `
        <div class="modal__row">
          <span>Aktivní aliance</span>
          <strong>Žádná</strong>
        </div>
      `;
    }

    listPanel.innerHTML = `
      <div class="alliance-list">
        ${(alliances || [])
          .map(
            (alliance) => `
              <div class="alliance-list__item">
                <div>
                  <div class="alliance-list__name">${alliance.name}</div>
                  <div class="alliance-list__meta">${alliance.member_count || 0} členů • +${alliance.bonus_income_pct || 0}% income • +${alliance.bonus_influence_pct || 0}% influence</div>
                </div>
                <button class="btn btn--ghost" data-alliance-join="${alliance.id}">Připojit</button>
              </div>
            `
          )
          .join("")}
      </div>
    `;

    listPanel.querySelectorAll("[data-alliance-join]").forEach((button) => {
      button.addEventListener("click", async () => {
        const allianceId = button.getAttribute("data-alliance-join");
        if (!allianceId) return;
        if (!window.Empire.token) {
          const state = getLocalAllianceState();
          const joined = joinLocalAlliance(state, allianceId);
          saveLocalAllianceState(state);
          pushEvent(`Připojil ses k alianci ${joined?.name || ""}.`);
          if (allianceRefreshHandler) await allianceRefreshHandler();
          syncGuestAllianceLabel(joined?.name || "Žádná");
          return;
        }
        const result = await window.Empire.API.joinAlliance(allianceId);
        if (result.error) {
          pushEvent(`Aliance: ${result.error}`);
          return;
        }
        pushEvent("Připojil ses k alianci.");
        if (allianceRefreshHandler) await allianceRefreshHandler();
        const profile = await window.Empire.API.getProfile();
        updateProfile(profile);
      });
    });
  }

  function renderAllianceChat(messages) {
    const log = document.getElementById("alliance-chat-log");
    if (!log) return;
    const safeMessages = Array.isArray(messages) && messages.length ? messages : [
      { time: "09:12", author: "Raven", text: "Potřebujeme posily na sever." },
      { time: "09:14", author: "Lira", text: "Posílám tým, 5 minut." }
    ];
    log.innerHTML = safeMessages
      .map((message) => `<div class="alliance-chat__item">[${message.time}] ${message.author}: ${message.text}</div>`)
      .join("");
  }

  function getLocalAllianceState() {
    try {
      const parsed = JSON.parse(localStorage.getItem(LOCAL_ALLIANCE_KEY) || "null");
      if (parsed && Array.isArray(parsed.alliances) && Array.isArray(parsed.chat)) {
        return withActiveAlliance(parsed);
      }
    } catch {}
    const seeded = {
      activeAllianceId: null,
      alliances: [
        {
          id: "alliance-neon-vipers",
          name: "Neon Vipers",
          bonus_income_pct: 8,
          bonus_influence_pct: 4,
          heat_control_text: "-6% heat",
          members: [
            { username: "Raven", gang_name: "North Vultures" },
            { username: "Lira", gang_name: "Chrome Echo" }
          ]
        },
        {
          id: "alliance-black-sun",
          name: "Black Sun Pact",
          bonus_income_pct: 5,
          bonus_influence_pct: 7,
          heat_control_text: "-10% heat",
          members: [
            { username: "Hex", gang_name: "Dusk Syndicate" }
          ]
        }
      ],
      chat: [
        { time: "09:12", author: "Raven", text: "Potřebujeme posily na sever." },
        { time: "09:14", author: "Lira", text: "Posílám tým, 5 minut." }
      ]
    };
    saveLocalAllianceState(seeded);
    return withActiveAlliance(seeded);
  }

  function saveLocalAllianceState(state) {
    localStorage.setItem(
      LOCAL_ALLIANCE_KEY,
      JSON.stringify({
        activeAllianceId: state.activeAllianceId || null,
        alliances: state.alliances || [],
        chat: state.chat || []
      })
    );
  }

  function withActiveAlliance(state) {
    const activeAlliance = (state.alliances || []).find((item) => item.id === state.activeAllianceId) || null;
    return {
      ...state,
      activeAlliance: activeAlliance
        ? {
            ...activeAlliance,
            owner_player_id: "guest-player",
            member_count: (activeAlliance.members || []).length
          }
        : null,
      alliances: (state.alliances || []).map((alliance) => ({
        ...alliance,
        owner_player_id: alliance.owner_player_id || "guest-owner",
        member_count: (alliance.members || []).length
      }))
    };
  }

  function createLocalAlliance(state, name) {
    const alliance = {
      id: `alliance-${Date.now()}`,
      name,
      bonus_income_pct: 6,
      bonus_influence_pct: 5,
      heat_control_text: "-8% heat",
      members: [{ username: "Ty", gang_name: localStorage.getItem("empire_gang_name") || "Guest Crew" }]
    };
    state.alliances.unshift(alliance);
    state.activeAllianceId = alliance.id;
    appendLocalAllianceChat(state, {
      author: "System",
      text: `Aliance ${name} byla založena.`
    });
    return alliance;
  }

  function joinLocalAlliance(state, allianceId) {
    const alliance = (state.alliances || []).find((item) => item.id === allianceId);
    if (!alliance) return null;
    if (!(alliance.members || []).some((member) => member.username === "Ty")) {
      alliance.members = alliance.members || [];
      alliance.members.push({
        username: "Ty",
        gang_name: localStorage.getItem("empire_gang_name") || "Guest Crew"
      });
    }
    state.activeAllianceId = alliance.id;
    appendLocalAllianceChat(state, {
      author: "System",
      text: `Připojil ses k alianci ${alliance.name}.`
    });
    return alliance;
  }

  function leaveLocalAlliance(state) {
    const active = (state.alliances || []).find((item) => item.id === state.activeAllianceId);
    if (active) {
      active.members = (active.members || []).filter((member) => member.username !== "Ty");
      appendLocalAllianceChat(state, {
        author: "System",
        text: `Opustil jsi alianci ${active.name}.`
      });
    }
    state.activeAllianceId = null;
  }

  function inviteLocalAllianceMember(state, name) {
    const active = (state.alliances || []).find((item) => item.id === state.activeAllianceId);
    if (!active) {
      return { error: "no_active_alliance" };
    }
    active.members = active.members || [];
    if (active.members.some((member) => member.username.toLowerCase() === name.toLowerCase())) {
      return { error: "member_exists" };
    }
    active.members.push({
      username: name,
      gang_name: "Guest Wing"
    });
    appendLocalAllianceChat(state, {
      author: "System",
      text: `${name} byl pozván do aliance ${active.name}.`
    });
    return { ok: true };
  }

  function appendLocalAllianceChat(state, message) {
    const now = new Date();
    const time = `${String(now.getHours()).padStart(2, "0")}:${String(now.getMinutes()).padStart(2, "0")}`;
    state.chat = state.chat || [];
    state.chat.unshift({
      time,
      author: message.author,
      text: message.text
    });
    state.chat = state.chat.slice(0, 20);
  }

  function syncGuestAllianceLabel(allianceName) {
    const profileAlliance = document.getElementById("profile-alliance");
    if (profileAlliance && !window.Empire.token) {
      profileAlliance.textContent = allianceName || "Žádná";
    }
  }

  function initSettingsModal() {
    const root = document.getElementById("settings-modal");
    const backdrop = document.getElementById("settings-modal-backdrop");
    const closeBtn = document.getElementById("settings-modal-close");
    const saveBtn = document.getElementById("settings-save-btn");
    const soundInput = document.getElementById("settings-sound");
    const musicInput = document.getElementById("settings-music");
    const notificationsInput = document.getElementById("settings-notifications");
    const effectsQualitySelect = document.getElementById("settings-effects-quality");
    const languageSelect = document.getElementById("settings-language");
    if (!root) return;

    const applySettingsToForm = () => {
      const settings = getSettingsState();
      if (soundInput) soundInput.checked = settings.sound;
      if (musicInput) musicInput.checked = settings.music;
      if (notificationsInput) notificationsInput.checked = settings.notifications;
      if (effectsQualitySelect) effectsQualitySelect.value = settings.effectsQuality;
      if (languageSelect) languageSelect.value = settings.language;
    };

    const saveSettings = () => {
      const settings = {
        sound: Boolean(soundInput?.checked),
        music: Boolean(musicInput?.checked),
        notifications: Boolean(notificationsInput?.checked),
        effectsQuality: effectsQualitySelect?.value || DEFAULT_SETTINGS.effectsQuality,
        language: languageSelect?.value || DEFAULT_SETTINGS.language
      };
      localStorage.setItem(SETTINGS_STORAGE_KEY, JSON.stringify(settings));
      root.classList.add("hidden");
      pushEvent("Nastavení bylo uloženo.");
    };

    applySettingsToForm();
    if (backdrop) backdrop.addEventListener("click", () => root.classList.add("hidden"));
    if (closeBtn) closeBtn.addEventListener("click", () => root.classList.add("hidden"));
    if (saveBtn) saveBtn.addEventListener("click", saveSettings);
    root.addEventListener("settings:open", applySettingsToForm);
    document.addEventListener("keydown", (event) => {
      if (event.key === "Escape") root.classList.add("hidden");
    });
  }

  function initWeaponsModal() {
    const root = document.getElementById("weapons-modal");
    const backdrop = document.getElementById("weapons-modal-backdrop");
    const closeBtn = document.getElementById("weapons-modal-close");
    if (!root) return;
    if (backdrop) backdrop.addEventListener("click", () => root.classList.add("hidden"));
    if (closeBtn) closeBtn.addEventListener("click", () => root.classList.add("hidden"));
    document.addEventListener("keydown", (event) => {
      if (event.key === "Escape") root.classList.add("hidden");
    });
  }

  function initMarketModal() {
    const openBtn = document.getElementById("market-open");
    const root = document.getElementById("market-modal");
    const backdrop = document.getElementById("market-modal-backdrop");
    const closeBtn = document.getElementById("market-modal-close");
    const resourceSelect = document.getElementById("market-resource-select");
    const sideSelect = document.getElementById("market-side-select");
    const quantityInput = document.getElementById("market-quantity-input");
    const priceInput = document.getElementById("market-price-input");
    const createBtn = document.getElementById("market-create-order");

    if (!root || !openBtn || !resourceSelect || !sideSelect || !quantityInput || !priceInput || !createBtn) return;

    const refreshMarket = async () => {
      if (!window.Empire.token) {
        cachedMarket = getLocalMarketState();
        renderMarketState(resourceSelect.value);
        return;
      }
      const market = await window.Empire.API.getMarket();
      if (market.error) {
        pushEvent(`Market: ${market.error}`);
        return;
      }
      cachedMarket = market;
      renderMarketState(resourceSelect.value);
    };
    marketRefreshHandler = refreshMarket;

    openBtn.addEventListener("click", async () => {
      root.classList.remove("hidden");
      await refreshMarket();
    });
    resourceSelect.addEventListener("change", () => renderMarketState(resourceSelect.value));
    createBtn.addEventListener("click", async () => {
      if (!window.Empire.token) {
        const result = createLocalMarketOrder({
          resourceKey: resourceSelect.value,
          side: sideSelect.value,
          quantity: Number(quantityInput.value),
          pricePerUnit: Number(priceInput.value)
        });
        if (result.error) {
          pushEvent(`Market: ${result.error}`);
          return;
        }
        pushEvent("Lokální market příkaz byl vložen.");
        await refreshMarket();
        syncGuestEconomyFromMarket();
        return;
      }
      const result = await window.Empire.API.createMarketOrder({
        resourceKey: resourceSelect.value,
        side: sideSelect.value,
        quantity: Number(quantityInput.value),
        pricePerUnit: Number(priceInput.value)
      });
      if (result.error) {
        pushEvent(`Market: ${result.error}`);
        return;
      }
      pushEvent("Příkaz byl vložen na trh.");
      await refreshMarket();
      const economy = await window.Empire.API.getEconomy();
      updateEconomy(economy);
    });
    root.addEventListener("click", async (event) => {
      const target = event.target;
      if (!(target instanceof HTMLElement)) return;
      const cancelButton = target.closest("[data-market-cancel]");
      if (!(cancelButton instanceof HTMLElement)) return;
      const orderId = cancelButton.dataset.marketCancel;
      if (!orderId) return;
      if (!window.Empire.token) {
        const result = cancelLocalMarketOrder(orderId);
        if (result.error) {
          pushEvent(`Market: ${result.error}`);
          return;
        }
        pushEvent("Lokální market příkaz byl zrušen.");
        await refreshMarket();
        syncGuestEconomyFromMarket();
        return;
      }
      const result = await window.Empire.API.cancelMarketOrder(orderId);
      if (result.error) {
        pushEvent(`Market: ${result.error}`);
        return;
      }
      pushEvent("Příkaz byl zrušen.");
      await refreshMarket();
      const economy = await window.Empire.API.getEconomy();
      updateEconomy(economy);
    });
    if (backdrop) backdrop.addEventListener("click", () => root.classList.add("hidden"));
    if (closeBtn) closeBtn.addEventListener("click", () => root.classList.add("hidden"));
    document.addEventListener("keydown", (event) => {
      if (event.key === "Escape") root.classList.add("hidden");
    });
  }

  function renderMarketState(resourceKey) {
    const summary = document.getElementById("market-balance-summary");
    const sellOrders = document.getElementById("market-sell-orders");
    const buyOrders = document.getElementById("market-buy-orders");
    const myOrders = document.getElementById("market-my-orders");
    const tradeHistory = document.getElementById("market-trade-history");
    const sellCount = document.getElementById("market-sell-count");
    const buyCount = document.getElementById("market-buy-count");
    const myCount = document.getElementById("market-my-count");
    const tradeCount = document.getElementById("market-trade-count");
    if (!summary || !sellOrders || !buyOrders || !myOrders || !tradeHistory || !sellCount || !buyCount || !myCount || !tradeCount) return;

    const market = cachedMarket || { balances: {}, orderBook: [], myOrders: [] };
    const balances = market.balances || {};
    const selectedOrders = (market.orderBook || []).filter((order) => order.resourceKey === resourceKey);
    const sells = selectedOrders.filter((order) => order.side === "sell");
    const buys = selectedOrders.filter((order) => order.side === "buy");
    const mine = (market.myOrders || []).filter((order) => order.resourceKey === resourceKey && order.status === "open");
    const trades = (market.recentTrades || []).filter((trade) => trade.resourceKey === resourceKey);

    summary.innerHTML = `
      <div class="market-balance-pill">Cash: $${balances.money || 0}</div>
      <div class="market-balance-pill">Drogy: ${balances.drugs || 0}</div>
      <div class="market-balance-pill">Zbraně: ${balances.weapons || 0}</div>
      <div class="market-balance-pill">Materiály: ${balances.materials || 0}</div>
      <div class="market-balance-pill">Data: ${balances.dataShards || 0}</div>
      <div class="market-balance-pill">Fee: ${market.marketFeePct || 0}%</div>
    `;

    sellCount.textContent = String(sells.length);
    buyCount.textContent = String(buys.length);
    myCount.textContent = String(mine.length);
    tradeCount.textContent = String(trades.length);

    sellOrders.innerHTML = renderMarketOrdersList(sells, "sell");
    buyOrders.innerHTML = renderMarketOrdersList(buys, "buy");
    myOrders.innerHTML = renderMyOrdersList(mine);
    tradeHistory.innerHTML = renderTradeHistoryList(trades);
  }

  function renderMarketOrdersList(orders, side) {
    if (!orders.length) {
      return '<div class="market-modal__empty">Žádné aktivní příkazy.</div>';
    }
    return orders
      .map(
        (order) => `
          <div class="market-order market-order--${side}">
            <div class="market-order__head">
              <span>${order.username}</span>
              <strong>$${order.pricePerUnit}</strong>
            </div>
            <div class="market-order__meta">${order.remainingQuantity} ks</div>
          </div>
        `
      )
      .join("");
  }

  function renderMyOrdersList(orders) {
    if (!orders.length) {
      return '<div class="market-modal__empty">Nemáš žádné otevřené příkazy.</div>';
    }
    return orders
      .map(
        (order) => `
          <div class="market-order market-order--mine">
            <div class="market-order__head">
              <span>${order.side === "buy" ? "Poptávka" : "Nabídka"}</span>
              <strong>$${order.pricePerUnit}</strong>
            </div>
            <div class="market-order__meta">${order.remainingQuantity}/${order.quantity} ks</div>
            <button class="btn btn--ghost" data-market-cancel="${order.id}">Zrušit</button>
          </div>
        `
      )
      .join("");
  }

  function renderTradeHistoryList(trades) {
    if (!trades.length) {
      return '<div class="market-modal__empty">Žádné nedávné obchody.</div>';
    }
    return trades
      .map(
        (trade) => `
          <div class="market-order market-order--history">
            <div class="market-order__head">
              <span>${trade.quantity} ks</span>
              <strong>$${trade.pricePerUnit}</strong>
            </div>
            <div class="market-order__meta">Fee: $${trade.feePaid}</div>
          </div>
        `
      )
      .join("");
  }

  async function handleMarketUpdate() {
    const root = document.getElementById("market-modal");
    if (!root || root.classList.contains("hidden") || !marketRefreshHandler) return;
    await marketRefreshHandler();
  }

  function getLocalMarketState() {
    try {
      const parsed = JSON.parse(localStorage.getItem(LOCAL_MARKET_KEY) || "null");
      if (parsed && parsed.balances && Array.isArray(parsed.orderBook) && Array.isArray(parsed.myOrders) && Array.isArray(parsed.recentTrades)) {
        return parsed;
      }
    } catch {}
    const seeded = {
      balances: {
        money: 12000,
        drugs: 80,
        weapons: 30,
        materials: 120,
        dataShards: 18
      },
      orderBook: [
        makeSeedOrder("drugs", "sell", 35, 135, "Neon Vipers"),
        makeSeedOrder("drugs", "buy", 20, 128, "Black Sun Pact"),
        makeSeedOrder("weapons", "sell", 12, 260, "Chrome Cartel"),
        makeSeedOrder("weapons", "buy", 10, 235, "Raven"),
        makeSeedOrder("materials", "sell", 60, 78, "Factory 9"),
        makeSeedOrder("materials", "buy", 40, 70, "Steel Dogs"),
        makeSeedOrder("data_shards", "sell", 8, 420, "Hex"),
        makeSeedOrder("data_shards", "buy", 6, 390, "Ghost Wire")
      ],
      myOrders: [],
      recentTrades: [
        { resourceKey: "drugs", quantity: 18, pricePerUnit: 132, feePaid: 118, createdAt: Date.now() - 200000 },
        { resourceKey: "weapons", quantity: 4, pricePerUnit: 248, feePaid: 49, createdAt: Date.now() - 120000 }
      ],
      marketFeePct: 5
    };
    saveLocalMarketState(seeded);
    return seeded;
  }

  function saveLocalMarketState(state) {
    localStorage.setItem(LOCAL_MARKET_KEY, JSON.stringify(state));
  }

  function makeSeedOrder(resourceKey, side, remainingQuantity, pricePerUnit, username) {
    return {
      id: `seed-${resourceKey}-${side}-${username}-${pricePerUnit}`,
      resourceKey,
      side,
      remainingQuantity,
      pricePerUnit,
      username,
      createdAt: Date.now()
    };
  }

  function createLocalMarketOrder({ resourceKey, side, quantity, pricePerUnit }) {
    const state = getLocalMarketState();
    if (!["buy", "sell"].includes(side)) return { error: "invalid_side" };
    if (!Number.isInteger(quantity) || quantity <= 0) return { error: "invalid_quantity" };
    if (!Number.isInteger(pricePerUnit) || pricePerUnit <= 0) return { error: "invalid_price" };

    const balanceKey = resourceKey === "data_shards" ? "dataShards" : resourceKey;
    if (side === "sell" && Number(state.balances[balanceKey] || 0) < quantity) {
      return { error: "insufficient_resource" };
    }
    if (side === "buy" && Number(state.balances.money || 0) < quantity * pricePerUnit) {
      return { error: "insufficient_money" };
    }

    if (side === "sell") {
      state.balances[balanceKey] -= quantity;
    } else {
      state.balances.money -= quantity * pricePerUnit;
    }

    const order = {
      id: `local-${Date.now()}`,
      resourceKey,
      side,
      quantity,
      remainingQuantity: quantity,
      pricePerUnit,
      status: "open",
      createdAt: Date.now()
    };
    state.myOrders.unshift(order);
    matchLocalMarketOrder(state, order);
    saveLocalMarketState(state);
    return { ok: true };
  }

  function cancelLocalMarketOrder(orderId) {
    const state = getLocalMarketState();
    const order = state.myOrders.find((item) => item.id === orderId && item.status === "open");
    if (!order) return { error: "order_not_found" };

    const balanceKey = order.resourceKey === "data_shards" ? "dataShards" : order.resourceKey;
    if (order.side === "sell") {
      state.balances[balanceKey] += order.remainingQuantity;
    } else {
      state.balances.money += order.remainingQuantity * order.pricePerUnit;
    }
    order.remainingQuantity = 0;
    order.status = "cancelled";
    saveLocalMarketState(state);
    return { ok: true };
  }

  function matchLocalMarketOrder(state, order) {
    const candidates = (state.orderBook || []).filter((entry) =>
      entry.resourceKey === order.resourceKey &&
      entry.side !== order.side &&
      ((order.side === "buy" && entry.pricePerUnit <= order.pricePerUnit) ||
        (order.side === "sell" && entry.pricePerUnit >= order.pricePerUnit))
    );

    const sorted = candidates.sort((a, b) =>
      order.side === "buy"
        ? a.pricePerUnit - b.pricePerUnit
        : b.pricePerUnit - a.pricePerUnit
    );

    const balanceKey = order.resourceKey === "data_shards" ? "dataShards" : order.resourceKey;

    sorted.forEach((entry) => {
      if (order.remainingQuantity <= 0) return;
      const traded = Math.min(order.remainingQuantity, entry.remainingQuantity);
      const gross = traded * entry.pricePerUnit;
      const feePaid = Math.floor(gross * 0.05);

      if (order.side === "buy") {
        state.balances[balanceKey] += traded;
        state.balances.money += traded * Math.max(0, order.pricePerUnit - entry.pricePerUnit);
      } else {
        state.balances.money += gross - feePaid;
      }

      order.remainingQuantity -= traded;
      entry.remainingQuantity -= traded;
      state.recentTrades.unshift({
        resourceKey: order.resourceKey,
        quantity: traded,
        pricePerUnit: entry.pricePerUnit,
        feePaid,
        createdAt: Date.now()
      });
    });

    state.orderBook = (state.orderBook || []).filter((entry) => entry.remainingQuantity > 0);
    state.recentTrades = state.recentTrades.slice(0, 30);
    order.status = order.remainingQuantity === 0 ? "filled" : "open";
  }

  function syncGuestEconomyFromMarket() {
    if (window.Empire.token) return;
    const state = getLocalMarketState();
    updateEconomy({
      balance: Number(state.balances.money || 0),
      influence: 0,
      drugs: Number(state.balances.drugs || 0),
      garage: 0,
      weapons: Number(state.balances.weapons || 0),
      defense: 0,
      materials: Number(state.balances.materials || 0),
      dataShards: Number(state.balances.dataShards || 0)
    });
  }

  function initWeaponsPopover() {
    const wrap = document.getElementById("stat-weapons-wrap");
    const popover = document.getElementById("weapons-popover");
    if (!wrap || !popover) return;
    let isOpen = false;

    const open = () => {
      popover.classList.add("is-open");
      isOpen = true;
    };

    const close = () => {
      popover.classList.remove("is-open");
      isOpen = false;
    };

    wrap.addEventListener("click", (event) => {
      const target = event.target;
      if (target instanceof Node && popover.contains(target)) return;
      event.stopPropagation();
      if (isOpen) close();
      else open();
    });
    popover.addEventListener("click", (event) => {
      event.stopPropagation();
      const target = event.target;
      if (!(target instanceof HTMLElement)) return;
      const button = target.closest("[data-weapon-action]");
      if (!button) return;
      const action = button.dataset.weaponAction;
      if (!action) return;
      openWeaponsModal(action);
    });
  }

  function openWeaponsModal(mode) {
    const root = document.getElementById("weapons-modal");
    const list = document.getElementById("weapons-modal-list");
    const title = document.getElementById("weapons-modal-title");
    if (!root || !list || !title) return;
    const isAttack = mode === "attack";
    const stats = isAttack ? attackWeaponStats : defenseWeaponStats;
    const counts = isAttack ? resolveWeaponCounts() : resolveDefenseCounts();
    title.textContent = isAttack ? "Útočné zbraně" : "Obranné zbraně";
    list.innerHTML = stats
      .map((item) => {
        const key = Object.keys(counts).find((k) => k.toLowerCase() === item.name.toLowerCase());
        const value = key ? counts[key] : 0;
        return `
          <div class="weapons-modal__item">
            <span class="weapons-modal__name">${item.name}</span>
            <span class="weapons-modal__count">${value} ks</span>
            <span class="weapons-modal__power">Síla ${item.power}</span>
          </div>
        `;
      })
      .join("");
    root.classList.remove("hidden");
  }

  function hydrateProfileModal(profile) {
    if (!profile) return;
    const setText = (id, value) => {
      const el = document.getElementById(id);
      if (el) el.textContent = value;
    };
    const avatar = localStorage.getItem("empire_avatar");
    const avatarImg = document.getElementById("profile-avatar");
    if (avatarImg) {
      if (avatar) {
        avatarImg.src = avatar;
        avatarImg.classList.remove("hidden");
      } else {
        avatarImg.removeAttribute("src");
        avatarImg.classList.add("hidden");
      }
    }
    setText("profile-modal-username", profile.username || "-");
    setText("profile-modal-gang", profile.gangName || "-");
    setText("profile-modal-structure", profile.structure || localStorage.getItem("empire_structure") || "-");
    setText("profile-modal-alliance", profile.alliance || "Žádná");
    setText("profile-modal-districts", profile.districts || 0);
    setText("profile-modal-cash", `$${profile.money || 0}`);
    setText("profile-modal-drugs", profile.drugs || 0);
    setText("profile-modal-garage", profile.garage || 0);
    setText("profile-modal-weapons", profile.weapons || 0);
    setText("profile-modal-defense", profile.defense || 0);
  }

  function showProfileModal() {
    const root = document.getElementById("profile-modal");
    if (!root) return;
    root.classList.remove("hidden");
  }

  function showSettingsModal() {
    const root = document.getElementById("settings-modal");
    if (!root) return;
    root.dispatchEvent(new CustomEvent("settings:open"));
    root.classList.remove("hidden");
  }

  function getSettingsState() {
    try {
      const parsed = JSON.parse(localStorage.getItem(SETTINGS_STORAGE_KEY) || "null");
      return {
        ...DEFAULT_SETTINGS,
        ...(parsed && typeof parsed === "object" ? parsed : {})
      };
    } catch {
      return { ...DEFAULT_SETTINGS };
    }
  }

  function updateEconomy(economy) {
    cachedEconomy = economy;
    document.getElementById("stat-cash").textContent = `$${economy.balance || 0}`;
    document.getElementById("stat-influence").textContent = economy.influence || 0;
    const drugs = document.getElementById("stat-drugs");
    const garage = document.getElementById("stat-garage");
    const weapons = document.getElementById("stat-weapons");
    const defense = document.getElementById("stat-defense");
    if (drugs) drugs.textContent = economy.drugs || 0;
    if (garage) garage.textContent = economy.garage || 0;
    if (weapons) weapons.textContent = economy.weapons || 0;
    if (defense) defense.textContent = economy.defense || 0;
    updateWeaponsPopover();
    updateDefensePopover();
  }

  function resolveWeaponCounts() {
    const fromProfile = cachedProfile?.weaponsDetail;
    const fromEconomy = cachedEconomy?.weaponsDetail;
    const fromStorage = (() => {
      try {
        return JSON.parse(localStorage.getItem("empire_weapons_detail") || "null");
      } catch {
        return null;
      }
    })();
    return fromProfile || fromEconomy || fromStorage || {
      "Baseballová pálka": 7,
      Pistole: 14,
      "Samopal (SMG)": 6,
      "Útočná puška": 3,
      "Explozivní nálož": 2,
      "Neprůstřelná vesta": 9,
      "Ocelové barikády": 4,
      "Bezpečnostní kamery": 8,
      "Automatické kulometné stanoviště": 1,
      "EMP obranný modul": 1,
      "Kulometná věž": 2,
      "Raketová věž": 1
    };
  }

  function updateWeaponsPopover() {
    const list = document.getElementById("weapons-popover-list");
    if (!list) return;
    const counts = resolveWeaponCounts();
    list.innerHTML = weaponCatalog
      .map((name) => {
        const key = Object.keys(counts).find((k) => k.toLowerCase() === name.toLowerCase());
        const value = key ? counts[key] : 0;
        return `
          <div class="stat__popover-item">
            <span>${name}</span>
            <strong>${value}</strong>
          </div>
        `;
      })
      .join("");
  }

  function resolveDefenseCounts() {
    const fromProfile = cachedProfile?.defenseDetail;
    const fromEconomy = cachedEconomy?.defenseDetail;
    const fromStorage = (() => {
      try {
        return JSON.parse(localStorage.getItem("empire_defense_detail") || "null");
      } catch {
        return null;
      }
    })();
    return fromProfile || fromEconomy || fromStorage || {
      "Neprůstřelná vesta": 9,
      "Ocelové barikády": 4,
      "Bezpečnostní kamery": 8,
      "Automatické kulometné stanoviště": 1,
      "EMP obranný modul": 1,
      "Kulometná věž": 2,
      "Raketová věž": 1
    };
  }

  function updateDefensePopover() {
    const list = document.getElementById("defense-popover-list");
    if (!list) return;
    const counts = resolveDefenseCounts();
    list.innerHTML = defenseCatalog
      .map((name) => {
        const key = Object.keys(counts).find((k) => k.toLowerCase() === name.toLowerCase());
        const value = key ? counts[key] : 0;
        return `
          <div class="stat__popover-item">
            <span>${name}</span>
            <strong>${value}</strong>
          </div>
        `;
      })
      .join("");
  }

  function updateDistrict(district) {
    if (!district) return;
    const name = document.getElementById("district-name");
    if (!name) return;
    const displayName = district.name || `${district.type} #${district.id}`;
    document.getElementById("district-owner").textContent = district.owner || "Neobsazeno";
    document.getElementById("district-income").textContent = `$${district.income || 0}/hod`;
    document.getElementById("district-influence").textContent = district.influence || 0;
    name.textContent = displayName;
  }

  function updateRound(round) {
    if (!round) return;
    const roundEnds = document.getElementById("round-ends");
    const roundDays = document.getElementById("round-days");
    if (roundEnds) {
      roundEnds.textContent = round.roundEndsAt || "-";
    }
    if (roundDays) {
      roundDays.textContent = round.daysRemaining != null ? round.daysRemaining : "-";
    }
  }

  function pushEvent(text) {
    const container = document.getElementById("event-items");
    if (!container) return;
    const div = document.createElement("div");
    div.className = "ticker__item";
    div.textContent = text;
    container.prepend(div);
  }

  return {
    assignDistrictMetadata,
    init,
    hydrateAfterAuth,
    updateProfile,
    updateEconomy,
    updateDistrict,
    updateRound,
    pushEvent,
    handleMarketUpdate,
    setGuestMode,
    initProfileModal,
    initSettingsModal
  };
})();
