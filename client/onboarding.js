window.Empire = window.Empire || {};

window.Empire.Onboarding = (() => {
  const ONBOARDING_SCENARIO_KEY = "onboarding-20-edge";
  const ONBOARDING_NPC_NAME = "Průvodce městem";
  const ONBOARDING_SPY_DISTRICT_ID = 25;
  const ONBOARDING_ATTACK_DISTRICT_ID = 6;
  const GAME_EVENT_NAMES = [
    "empire:scenario-applied",
    "empire:district-selected",
    "empire:district-modal-opened",
    "empire:building-detail-opened",
    "empire:buildings-modal-opened",
    "empire:attack-confirm-modal-opened",
    "empire:attack-modal-opened",
    "empire:attack-started",
    "empire:attack-resolved",
    "empire:spy-modal-opened",
    "empire:spy-started",
    "empire:spy-resolved",
    "empire:occupy-modal-opened",
    "empire:occupy-started",
    "empire:occupy-resolved",
    "empire:raid-started",
    "empire:raid-resolved",
    "empire:city-events-opened",
    "empire:city-events-agent-selected",
    "empire:market-modal-opened",
    "empire:alliance-modal-opened",
    "empire:alliance-ready-clicked",
    "empire:topbar-resource-toggle",
    "empire:trap-modal-opened",
    "empire:trap-placed",
    "empire:bounty-button-clicked",
    "empire:map-mode-changed",
    "empire:gang-heat-dirty-reduced",
    "empire:police-action-started"
  ];
  const DISTRICT_TYPE_GUIDE = [
    { key: "commercial", label: "Commercial", summary: "+3 clean +1 dirty cash / min" },
    { key: "industrial", label: "Industrial", summary: "+3 clean +1 dirty cash / min" },
    { key: "park", label: "Park", summary: "+2 clean +1 dirty cash / min" },
    { key: "residential", label: "Residential", summary: "+2 clean +0.5 dirty cash / min" },
    { key: "downtown", label: "Downtown", summary: "+5 clean +2 dirty cash / min" }
  ];

  const fallbackUI = {
    showOverlay() {},
    hideOverlay() {},
    setDialog() {},
    setStep() {},
    highlightElement() {},
    clearHighlight() {},
    lockGameUI() {},
    unlockGameUI() {}
  };

  const state = {
    active: false,
    currentIndex: -1,
    steps: [],
    context: null,
    lastScenario: null,
    listenersBound: false,
    stepRuntime: {}
  };

  function resolveUILayer() {
    const source = window.Empire.OnboardingUI;
    if (!source || typeof source !== "object") {
      // Fallback: onboarding UI vrstva zatim neni zapojena. Controller zustava funkcni a
      // lze ho napojit pres window.Empire.OnboardingUI se stejnymi verejnymi metodami.
      return fallbackUI;
    }
    return {
      showOverlay: typeof source.showOverlay === "function" ? source.showOverlay.bind(source) : fallbackUI.showOverlay,
      hideOverlay: typeof source.hideOverlay === "function" ? source.hideOverlay.bind(source) : fallbackUI.hideOverlay,
      setDialog: typeof source.setDialog === "function" ? source.setDialog.bind(source) : fallbackUI.setDialog,
      setStep: typeof source.setStep === "function" ? source.setStep.bind(source) : fallbackUI.setStep,
      highlightElement: typeof source.highlightElement === "function" ? source.highlightElement.bind(source) : fallbackUI.highlightElement,
      clearHighlight: typeof source.clearHighlight === "function" ? source.clearHighlight.bind(source) : fallbackUI.clearHighlight,
      lockGameUI: typeof source.lockGameUI === "function" ? source.lockGameUI.bind(source) : fallbackUI.lockGameUI,
      unlockGameUI: typeof source.unlockGameUI === "function" ? source.unlockGameUI.bind(source) : fallbackUI.unlockGameUI
    };
  }

  function dispatchControllerEvent(name, detail = {}) {
    document.dispatchEvent(new CustomEvent(name, { detail }));
  }

  function normalizeName(value) {
    return String(value || "")
      .trim()
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "");
  }

  function isUnownedDistrict(district) {
    const owner = normalizeName(district?.owner);
    return !owner || owner === "neobsazeno" || owner === "nikdo";
  }

  function resolvePlayerOwnerName(options = {}) {
    const candidateValues = [
      options.ownerName,
      state.lastScenario?.ownerName,
      window.Empire.player?.gangName,
      window.Empire.player?.username,
      window.Empire.player?.owner
    ];
    return candidateValues
      .map((value) => String(value || "").trim())
      .find(Boolean) || "";
  }

  function normalizeEdgeKey(from, to) {
    const first = `${Number(from?.[0] || 0).toFixed(4)},${Number(from?.[1] || 0).toFixed(4)}`;
    const second = `${Number(to?.[0] || 0).toFixed(4)},${Number(to?.[1] || 0).toFixed(4)}`;
    return first < second ? `${first}|${second}` : `${second}|${first}`;
  }

  function buildDistrictAdjacency(districts) {
    const adjacency = new Map((districts || []).map((district) => [district.id, new Set()]));
    const edgeOwners = new Map();
    (districts || []).forEach((district) => {
      const polygon = Array.isArray(district?.polygon) ? district.polygon : [];
      if (polygon.length < 2) return;
      for (let index = 0; index < polygon.length; index += 1) {
        const from = polygon[index];
        const to = polygon[(index + 1) % polygon.length];
        const edgeKey = normalizeEdgeKey(from, to);
        if (!edgeOwners.has(edgeKey)) edgeOwners.set(edgeKey, []);
        edgeOwners.get(edgeKey).push(district.id);
      }
    });
    edgeOwners.forEach((districtIds) => {
      if (districtIds.length < 2) return;
      for (let index = 0; index < districtIds.length; index += 1) {
        for (let neighborIndex = index + 1; neighborIndex < districtIds.length; neighborIndex += 1) {
          const firstId = districtIds[index];
          const secondId = districtIds[neighborIndex];
          adjacency.get(firstId)?.add(secondId);
          adjacency.get(secondId)?.add(firstId);
        }
      }
    });
    return adjacency;
  }

  function resolveTutorialContext(options = {}) {
    const districts = Array.isArray(options.districts)
      ? options.districts
      : (Array.isArray(window.Empire.districts) ? window.Empire.districts : []);
    const adjacency = buildDistrictAdjacency(districts);
    const playerOwnerName = resolvePlayerOwnerName(options);
    const normalizedPlayerOwner = normalizeName(playerOwnerName);
    const playerDistrict = districts.find((district) => normalizeName(district?.owner) === normalizedPlayerOwner) || null;
    const neighbors = playerDistrict ? Array.from(adjacency.get(playerDistrict.id) || []) : [];
    const districtsById = new Map(districts.map((district) => [district.id, district]));
    const scriptedSpyDistrict = districtsById.get(ONBOARDING_SPY_DISTRICT_ID) || null;
    const scriptedAttackDistrict = districtsById.get(ONBOARDING_ATTACK_DISTRICT_ID) || null;
    const neighborDistricts = neighbors
      .map((districtId) => districtsById.get(districtId))
      .filter(Boolean);
    const enemyDistrict = scriptedAttackDistrict
      || neighborDistricts.find((district) => !isUnownedDistrict(district) && normalizeName(district?.owner) !== normalizedPlayerOwner)
      || null;
    const neutralDistrict = scriptedSpyDistrict
      || neighborDistricts.find((district) => isUnownedDistrict(district))
      || districts.find((district) => isUnownedDistrict(district))
      || null;
    const raidDistrict = districts.find((district) =>
      isUnownedDistrict(district) && Number(district?.id) !== Number(scriptedSpyDistrict?.id)
    ) || neutralDistrict || scriptedSpyDistrict || null;
    const economyDistrict = playerDistrict || neutralDistrict || enemyDistrict || null;

    return {
      ownerName: playerOwnerName,
      districts,
      adjacency,
      playerDistrict,
      enemyDistrict,
      neutralDistrict,
      raidDistrict,
      productionDistrict: playerDistrict || economyDistrict || null,
      economyDistrict
    };
  }

  function resolveDefenseLabel(district) {
    const snapshot = window.Empire.UI?.getDistrictDefenseSnapshot?.(district?.id) || null;
    const self = snapshot?.self || null;
    if (self?.hasData) {
      return `Zbrane ${Math.max(0, Math.floor(Number(self.weapons) || 0))} • Sila ${Math.max(0, Math.floor(Number(self.power) || 0))}`;
    }
    return "Bez potvrzene obrany";
  }

  function resolveProductionLabel(district) {
    if (!district) return "Neznamy vykon";
    const income = Math.max(0, Math.floor(Number(district.income || 0)));
    const influence = Math.max(0, Math.floor(Number(district.influence || 0)));
    const buildings = Array.isArray(district.buildings) ? district.buildings.length : 0;
    return `$${income}/h • Budovy ${buildings} • Vliv ${influence}`;
  }

  function buildIntelPreviewPayload(district) {
    return {
      districtId: district?.id ?? null,
      owner: district?.owner || "Neobsazeno",
      defense: resolveDefenseLabel(district),
      production: resolveProductionLabel(district)
    };
  }

  function resolveHighlightElement(target) {
    if (!target) return null;
    if (target.selector) {
      const node = document.querySelector(target.selector);
      if (node) return node;
    }
    if (target.fallbackSelector) {
      const fallbackNode = document.querySelector(target.fallbackSelector);
      if (fallbackNode) return fallbackNode;
    }
    if (target.districtId != null) {
      // Fallback: jednotlive distrikty zatim nejsou samostatne DOM elementy,
      // proto pro highlight pouzivame canvas mapy a doplnkovy event pro UI vrstvu.
      return document.getElementById("city-map");
    }
    return null;
  }

  function highlightStepTarget(step, context, ui) {
    const target = typeof step.target === "function" ? step.target(context) : step.target;
    const element = resolveHighlightElement(target);
    if (target?.districtId != null) {
      dispatchControllerEvent("empire:onboarding:focus-district", {
        stepId: step.id,
        districtId: target.districtId,
        focusMode: target.focusMode || "full"
      });
    }
    if (element) {
      ui.highlightElement(element);
      return;
    }
    ui.clearHighlight();
  }

  function renderStep(step, ui) {
    const lines = Array.isArray(step.dialog) ? step.dialog : [String(step.dialog || "")];
    ui.setDialog(step.speaker || ONBOARDING_NPC_NAME, lines.filter(Boolean).join("\n"));
    ui.setStep(state.currentIndex + 1, state.steps.length);
    dispatchControllerEvent("empire:onboarding:step-changed", {
      active: state.active,
      stepId: step.id,
      stepName: step.name,
      index: state.currentIndex,
      total: state.steps.length,
      dialog: [...lines],
      canSkip: true,
      canManualAdvance: Boolean(step.manualAdvance),
      primaryActionLabel: step.primaryActionLabel || "Pokracovat"
    });
  }

  function dispatchTopicCard(stepId, title, intro, points = [], footer = "") {
    dispatchControllerEvent("empire:onboarding:topic-card", {
      stepId,
      title,
      intro,
      points: Array.isArray(points) ? points.filter(Boolean) : [],
      footer
    });
  }

  function createSteps() {
    return [
      {
        id: "welcome",
        name: "Vítej",
        manualAdvance: true,
        primaryActionLabel: "Pokračovat",
        dialog: [
          "Vítej ve Vortex City, kde se jede tvrdý bordel.",
          "Tenhle onboarding tě povede za ruku, ale nečekej žádné mazání medu kolem huby.",
          "Každý krok musíš odkliknout nebo rozjet akcí."
        ],
        target: null,
        onEnter() {
          dispatchTopicCard(
            "welcome",
            "Vitej v empirovce",
            "Nejdřív dostaneš rychlý přehled, pak si to všechno osaháš na vlastní kůži.",
            [
              "Kroky navazují jeden na druhý.",
              "Akce v onboardingu mají 100 % úspěch.",
              "Poctivě si to projdi, ať pak nepláčeš, že nevíš, co a jak."
            ],
            "Klikni na Pokračovat a jdeme do města."
          );
        },
        completionCondition(event) {
          return event.type === "manual-continue";
        },
        onComplete() {}
      },
      {
        id: "vortex",
        name: "Vortex",
        manualAdvance: true,
        primaryActionLabel: "Pokračovat",
        dialog: [
          "Vortex je město rozsekané na distrikty a každý z nich má svůj bordel.",
          "Nejedeš na fair play, jede tlak, kontrola a rychlá rozhodnutí.",
          "Cíl je jasný: pochopit loop a začít brát území."
        ],
        target: null,
        onEnter() {
          dispatchTopicCard(
            "vortex",
            "Město Vortex",
            "Tady se z území tahají prachy, vliv i suroviny. Kdo nesleduje mapu, ten dostane přes držku.",
            [
              "Sleduj vlastní teritorium.",
              "Hlídej si nepřátele kolem sebe.",
              "Každá akce má návaznost na další krok."
            ],
            "Až budeš ready, pokračuj dál."
          );
        },
        completionCondition(event) {
          return event.type === "manual-continue";
        },
        onComplete() {}
      },
      {
        id: "time",
        name: "Čas města",
        primaryActionLabel: "Přepínám mapu",
        dialog: [
          "Město běží v reálném čase.",
          "Den a noc mění produkci, akce i to, co se ve městě děje.",
          "Nad mapou klikni mezi DEN a NOC a pak pokračuj."
        ],
        target() {
          return {
            selector: "#map-mode-switch",
            fallbackSelector: "#map-mode-switch"
          };
        },
        onEnter() {
          const currentMode = String(window.Empire.Map?.getMapMode?.() || "night").trim().toLowerCase();
          state.stepRuntime.timeVisitedDay = currentMode === "day";
          state.stepRuntime.timeVisitedNight = currentMode === "night";
          dispatchTopicCard(
            "time",
            "Cas mesta",
            "Město jede v reálném čase a podle fáze se mění produkce, dostupnost akcí i vibe celé mapy.",
            [
              "Den = civilní provoz a víc běžných akcí.",
              "Noc = větší tlak, jiný timing a ostřejší pohyb.",
              "Klikni na DEN/NOC nad mapou a vyzkoušej si to."
            ],
            "Až si mapu přepneš, otevře se blackout krok."
          );
        },
        completionCondition(event) {
          return Boolean(state.stepRuntime.timeVisitedDay && state.stepRuntime.timeVisitedNight);
        },
        onComplete() {}
      },
      {
        id: "blackout",
        name: "Blackout",
        primaryActionLabel: "Pokračovat",
        manualAdvance: true,
        dialog: [
          "Noc je ready, teď to shodíme do blackoutu.",
          "Tady se mění tlak, produkce i akce ve městě.",
          "Tohle je stav, se kterým budeš počítat."
        ],
        target() {
          return {
            selector: "#map-mode-switch",
            fallbackSelector: "#map-mode-switch"
          };
        },
        onEnter() {
          dispatchTopicCard(
            "blackout",
            "Blackout",
            "Blackout je noc na steroidech. Větší bordel, jiné tempo a jiné poměry ve městě.",
            [
              "Produkce se překlápí podle blackout pravidel.",
              "Akce ve městě se posunou do jiného režimu.",
              "Tady už jede město v tvaru, co bolí."
            ],
            "Blackout se teď zapne a pak pokračuj dál."
          );
          window.Empire.Map?.setMapMode?.("blackout");
        },
        completionCondition(event) {
          return event.type === "manual-continue";
        },
        onComplete() {}
      },
      {
        id: "city-events",
        name: "City Events",
        primaryActionLabel: "Vyber postavu",
        dialog: [
          "Začni u City Events.",
          "Vyber si postavu podle toho, co zrovna chceš rozbít nebo vydolovat.",
          "Tady se učíš základní styl města i typy jobů."
        ],
        target() {
          return {
            selector: "#city-events-open",
            fallbackSelector: "#city-events-open"
          };
        },
        onEnter() {
          dispatchTopicCard(
            "city-events",
            "City Events",
            "Každá postava ti otevře jiný pohled na město a jiný druh úderu.",
            [
              "Victor: tlak, útoky a agresivní loop.",
              "Leon: obchod, dealy a tahání zdrojů.",
              "Nina: info, vliv a tichý pohyb."
            ],
            "Klikni na City Events a pak si vyber jednu postavu."
          );
        },
        completionCondition(event) {
          return event.type === "empire:city-events-agent-selected";
        },
        onComplete() {
          window.setTimeout(() => {
            document.getElementById("events-modal")?.classList.add("hidden");
          }, 350);
        }
      },
      {
        id: "spy",
        name: "Spehovani",
        primaryActionLabel: "Čekám na sektor",
        dialog: [
          "Než něco vezmeš, nejdřív si to očíhni.",
          "Vyber district 25, klikni na Špehovat a potvrď to."
        ],
        target(context) {
          return {
            districtId: context.neutralDistrict?.id ?? null,
            selector: "#city-map",
            focusMode: "full"
          };
        },
        onEnter(context) {
          state.stepRuntime.spyDistrictSelected = false;
          dispatchControllerEvent("empire:onboarding:intel-preview-reset", {
            districtId: context.neutralDistrict?.id ?? null
          });
          dispatchTopicCard(
            "spy",
            "Špehování",
            "Bez informací se nehni ani o krok. Špeh ti řekne, co je v districtu a jak moc je to hlídané.",
            [
              "Vybereš cíl na mapě.",
              "Spustíš špehování v detailu districtu.",
              "V onboardingu tohle vyjde na jistotu."
            ],
            "Dostaneš i náhled toho, co bys jinak musel vytlouct vlastní hlavou."
          );
        },
        completionCondition(event, context) {
          return event.type === "empire:spy-started"
            && Number(event.detail?.districtId) === Number(context.neutralDistrict?.id);
        },
        onComplete(context) {
          dispatchControllerEvent("empire:onboarding:intel-preview-request", {
            districtId: context.neutralDistrict?.id ?? null,
            intel: buildIntelPreviewPayload(context.neutralDistrict)
          });
        }
      },
      {
        id: "occupy",
        name: "Dobývání",
        primaryActionLabel: "Čekám na zabrání",
        dialog: [
          "Teď si vezmi něco, co nikomu nepatří.",
          "Žádný odpor, jen čistý zisk."
        ],
        target(context) {
          return {
            districtId: context.neutralDistrict?.id ?? null,
            selector: "#city-map",
            focusMode: "full"
          };
        },
        onEnter(context) {
          state.stepRuntime.occupyDistrictSelected = false;
          dispatchControllerEvent("empire:onboarding:occupy-target-request", {
            districtId: context.neutralDistrict?.id ?? null
          });
          dispatchTopicCard(
            "occupy",
            "Obsazení districtu",
            "Špehovaný district můžeš pak klidně obsadit, když je volný nebo splní podmínky akce.",
            [
              "Stejné místo nejdřív prozkoumáš a pak převezmeš.",
              "Akce je v onboardingu nastavená jako stoprocentní.",
              "Po dokončení se district přepíše na tvoje jméno."
            ],
            "Otevři detail districtu a spusť obsazení."
          );
        },
        completionCondition(event, context) {
          return event.type === "empire:occupy-started"
            && Number(event.detail?.districtId) === Number(context.neutralDistrict?.id);
        },
        onComplete() {}
      },
      {
        id: "raid",
        name: "Vykradení",
        primaryActionLabel: "Čekám na krádež",
        dialog: [
          "Vykrást district je další tah.",
          "Není to jen o síle, ale i o načasování a odměně za risk."
        ],
        target(context) {
          return {
            districtId: context.raidDistrict?.id ?? context.neutralDistrict?.id ?? null,
            selector: "#city-map",
            focusMode: "full"
          };
        },
        onEnter(context) {
          dispatchTopicCard(
            "raid",
            "Krádež districtu",
            "Raid je rychlá akce na zdroje. V onboardingu ti vyjde čistě, aby bylo jasné, jak vypadá výsledek.",
            [
              "Spustíš akci z detailu districtu.",
              "Po doběhnutí se ukáže výsledek a loot.",
              "Tady chápeš rozdíl mezi průnikem a útokem."
            ],
            `Cílem je ${context.raidDistrict?.name || "vybraný district"}.`
          );
        },
        completionCondition(event, context) {
          return event.type === "empire:raid-started"
            && (!context.raidDistrict?.id || Number(event.detail?.districtId) === Number(context.raidDistrict?.id));
        },
        onComplete() {}
      },
      {
        id: "districts",
        name: "Distrikty",
        primaryActionLabel: "Otevři budovy",
        dialog: [
          "Teď si projdi typy districtů.",
          "Každý typ má jiné budovy a jiné tempo příjmů.",
          "Pak otevři tlačítko Budovy."
        ],
        target() {
          return {
            selector: "#buildings-open",
            fallbackSelector: "#buildings-open"
          };
        },
        onEnter() {
          dispatchTopicCard(
            "districts",
            "Typy districtů",
            "Districty nejsou stejné. Některé tlačí cash, jiné vliv, další materiály nebo obranu.",
            DISTRICT_TYPE_GUIDE.map((entry) => `${entry.label}: ${entry.summary}`),
            "Tlačítko Budovy ti ukáže, co je v districtu postavené."
          );
        },
        completionCondition(event) {
          return event.type === "empire:buildings-modal-opened";
        },
        onComplete() {}
      },
      {
        id: "production",
        name: "Výroba",
        primaryActionLabel: "Otevři detail",
        dialog: [
          "Teď výroba materiálů.",
          "Lékárna, Drug Lab a Zbrojovka jsou tvoje základní produkční uzly.",
          "Otevři detail budovy a koukni, co přesně dělá."
        ],
        target(context) {
          return {
            districtId: context.productionDistrict?.id ?? context.playerDistrict?.id ?? null,
            selector: "#buildings-modal",
            fallbackSelector: "#buildings-open"
          };
        },
        onEnter() {
          dispatchTopicCard(
            "production",
            "Výroba a budovy",
            "Budovy generují materiály, drogy i zbraně. Tady vzniká ekonomická páteř gangu.",
            [
              "Lékárna zvedá užitkovou produkci a podporu.",
              "Drug Lab vyrábí drogy.",
              "Zbrojovka tlačí materiály a výbavu."
            ],
            "Klikni na detail jedné z budov v seznamu."
          );
        },
        completionCondition(event, context) {
          if (event.type !== "empire:building-detail-opened") return false;
          const targetDistrictId = Number(context.productionDistrict?.id || context.playerDistrict?.id || 0);
          if (!targetDistrictId) return true;
          return Number(event.detail?.districtId) === targetDistrictId;
        },
        onComplete() {
          window.setTimeout(() => {
            document.getElementById("building-detail-modal")?.classList.add("hidden");
            document.getElementById("buildings-modal")?.classList.add("hidden");
          }, 350);
        }
      },
      {
        id: "attack",
        name: "Utok",
        primaryActionLabel: "Čekám na útok",
        dialog: [
          "Teď ukaž, jestli máš koule.",
          "Tohle není tvoje. Překopej to."
        ],
        target(context) {
          return {
            districtId: context.enemyDistrict?.id ?? null,
            selector: "#city-map",
            focusMode: "full"
          };
        },
        onEnter(context) {
          dispatchTopicCard(
            "attack",
            "Útok na nepřátelský district",
            "Po špehování a dalších krocích můžeš jít do útoku. V onboardingu se tohle vždycky povede.",
            [
              "Vyber nepřátelský district na mapě.",
              "Otevři detail a použij útok.",
              "Výsledek přijde po doběhnutí animace."
            ],
            `Cílem je ${context.enemyDistrict?.name || "nepřátelský district"}.`
          );
        },
        completionCondition(event, context) {
          return event.type === "empire:attack-started"
            && Number(event.detail?.districtId) === Number(context.enemyDistrict?.id);
        },
        onComplete(context) {
          dispatchControllerEvent("empire:onboarding:combat-preview-request", {
            districtId: context.enemyDistrict?.id ?? null,
            scriptedOutcome: "total-success"
          });
        }
      },
      {
        id: "market",
        name: "Market",
        primaryActionLabel: "Otevři market",
        dialog: [
          "Další krok je market.",
          "Tady řešíš výměny, nabídky a pohyb zdrojů."
        ],
        target() {
          return {
            selector: "#market-open",
            fallbackSelector: "#market-open"
          };
        },
        onEnter() {
          dispatchTopicCard(
            "market",
            "Market",
            "Market je místo, kde se přelévají zdroje a hraje se na nabídku proti poptávce.",
            [
              "Server market je veřejný.",
              "Black market je rizikovější, ale ostřejší.",
              "V onboardingu stačí market otevřít a rozkoukat se."
            ],
            "Otevři market a pak pokračuj."
          );
        },
        completionCondition(event) {
          return event.type === "empire:market-modal-opened";
        },
        onComplete() {
          window.setTimeout(() => {
            document.getElementById("market-modal")?.classList.add("hidden");
          }, 500);
        }
      },
      {
        id: "alliance",
        name: "Aliance",
        primaryActionLabel: "Otevři alianci",
        dialog: [
          "Aliance drží hráče pohromadě.",
          "Ukážu ti max členů, READY a proč je odchod tak drahý."
        ],
        target() {
          return {
            selector: "#alliance-btn",
            fallbackSelector: "#alliance-btn"
          };
        },
        onEnter() {
          dispatchTopicCard(
            "alliance",
            "Aliance",
            "Aliance mají limit hráčů. READY potvrzuje připravenost a odchod z aliance tě stojí dost materiálu.",
            [
              "Max členů je 4.",
              "READY musí kliknout každý aktivní hráč.",
              "Odchod z aliance je ztráta jak prase."
            ],
            "Otevři alianci a klikni na READY."
          );
        },
        completionCondition(event) {
          return event.type === "empire:alliance-ready-clicked";
        },
        onComplete() {
          window.setTimeout(() => {
            document.getElementById("alliance-modal")?.classList.add("hidden");
          }, 500);
        }
      },
      {
        id: "resources",
        name: "Zdroje",
        primaryActionLabel: "Přepnout na špehy",
        dialog: [
          "Zdroje jsou tvoje palivo.",
          "Čisté prachy, špinavé prachy, vliv a špehové.",
          "Teď si ukážeme přepínání na špehy."
        ],
        target() {
          return {
            selector: "#stat-influence-wrap",
            fallbackSelector: "#stat-influence-wrap"
          };
        },
        onEnter() {
          dispatchTopicCard(
            "resources",
            "Zdroje",
            "Čisté peníze jedou na legální provoz, špinavé na prasárny, vliv taháš jako tlak a špehy přepínáš z topbaru.",
            [
              "Clean cash pro normální výdaje.",
              "Dirty cash pro risk a úplatky.",
              "Influence můžeš přepnout na zobrazení špehů."
            ],
            "Klikni na stat vlivu a přepni se na špehy."
          );
        },
        completionCondition(event) {
          return event.type === "empire:topbar-resource-toggle" && String(event.detail?.mode || "") === "spies";
        },
        onComplete() {}
      },
      {
        id: "police",
        name: "Policie",
        primaryActionLabel: "Spustit policii",
        dialog: [
          "Policie reaguje na heat.",
          "Některé akce ji hodí rovnou na tvůj district.",
          "Teď třikrát klikni na snížení heatu špinavými penězi."
        ],
        target() {
          return {
            selector: "#profile-heat-panel",
            fallbackSelector: "#profile-heat-panel"
          };
        },
        onEnter() {
          state.stepRuntime.policeDirtyClicks = 0;
          dispatchTopicCard(
            "police",
            "Policie a heat",
            "Špinavé peníze umí srazit heat, ale po třetím kliknutí se policie spustí na tvém districtu.",
            [
              "Zkontroluj heat panel.",
              "Použij dirty reduction třikrát.",
              "Policie se pak spustí sama."
            ],
            "Klikni na snížení heatu špinavými penězi 3x."
          );
        },
        completionCondition(event, context) {
          return event.type === "empire:police-action-started"
            && String(event.detail?.source || "") === "heat-dirty-reduction"
            && (!context.playerDistrict?.id || Number(event.detail?.districtId) === Number(context.playerDistrict?.id));
        },
        onComplete() {
          window.setTimeout(() => {
            document.getElementById("gang-heat-modal")?.classList.add("hidden");
          }, 350);
        }
      },
      {
        id: "traps",
        name: "Pasti",
        primaryActionLabel: "Polož past",
        dialog: [
          "Past zastavi nebo rozbije cizi akci.",
          "Dulezity je, kam ji hodis a kdy ji presunes."
        ],
        target(context) {
          return {
            districtId: context.playerDistrict?.id ?? context.neutralDistrict?.id ?? null,
            selector: "#city-map",
            focusMode: "full"
          };
        },
        onEnter() {
          dispatchTopicCard(
            "traps",
            "Pasti",
            "Past můžeš vložit do vlastního nebo aliančního districtu. Pak hlídá a blokuje cizí pohyb.",
            [
              "Vyber district, který vlastníš.",
              "Otevři detail a použij Past.",
              "V onboarding scénáři se vložení povede."
            ],
            "Polož past do svého districtu."
          );
        },
        completionCondition(event) {
          return event.type === "empire:trap-placed";
        },
        onComplete() {}
      },
      {
        id: "bounty",
        name: "Bounty",
        primaryActionLabel: "Klikni Bounty",
        dialog: [
          "A nakonec Bounty tlačítko.",
          "Zatím je to jen vizuální krok, text a funkci doplníme pak."
        ],
        target() {
          return {
            selector: "#city-events-target-btn",
            fallbackSelector: "#city-events-target-btn"
          };
        },
        onEnter() {
          dispatchTopicCard(
            "bounty",
            "Bounty",
            "Tlačítko je připravené v rohu kartičky City Events. Funkci i text doplníme později.",
            [
              "Tlačítko už je v UI.",
              "Je to samostatná akce pro další rozšíření.",
              "Teď stačí kliknout."
            ],
            "Kliknutím krok dokončíš."
          );
        },
        completionCondition(event) {
          return event.type === "empire:bounty-button-clicked";
        },
        onComplete() {}
      },
      {
        id: "core-loop",
        name: "Core loop",
        manualAdvance: true,
        primaryActionLabel: "Pokračovat",
        dialog: [
          "Špehuješ.",
          "Bereš.",
          "Produkuješ.",
          "Útočíš.",
          "A jedeš pořád dokola, dokud to celé nepatří tobě."
        ],
        target: null,
        onEnter() {
          dispatchTopicCard(
            "core-loop",
            "Core loop",
            "Celá hra stojí na tom samém: info, tlak, loot, produkce a růst.",
            [
              "Spy.",
              "Occupy.",
              "Raid.",
              "Attack.",
              "Repeat."
            ],
            "Když tomu rozumíš, můžeš jít do hry."
          );
        },
        completionCondition(event) {
          return event.type === "manual-continue";
        },
        onComplete() {}
      },
      {
        id: "exit",
        name: "Exit",
        manualAdvance: true,
        primaryActionLabel: "Vstoupit do města",
        dialog: [
          "Teď jsi v tom sám.",
          "Vydělávej, na lidi sereš a drž si hlavu dole.",
          "A hlavně neumři moc brzo."
        ],
        target: null,
        onEnter() {
          dispatchTopicCard(
            "exit",
            "Hotovo",
            "Onboarding končí. Vstup do města a hraj dál už bez náhrady.",
            [
              "Naučil ses základní loop.",
              "Znáš mapu, budovy, zdroje i policejní reakci.",
              "Další kroky už jsou na tobě."
            ],
            "Pusť se do hry."
          );
        },
        completionCondition(event) {
          return event.type === "manual-continue";
        },
        onComplete() {}
      }
    ];
  }

  function getCurrentStep() {
    return state.steps[state.currentIndex] || null;
  }

  function moveToStep(index) {
    const ui = resolveUILayer();
    const nextStep = state.steps[index] || null;
    if (!nextStep) {
      finish();
      return;
    }
    state.currentIndex = index;
    ui.showOverlay();
    ui.lockGameUI();
    renderStep(nextStep, ui);
    highlightStepTarget(nextStep, state.context, ui);
    if (typeof nextStep.onEnter === "function") {
      nextStep.onEnter(state.context, createRuntimeAPI());
    }
  }

  function completeStep(event) {
    const step = getCurrentStep();
    if (!step) return false;
    if (typeof step.onComplete === "function") {
      step.onComplete(state.context, createRuntimeAPI(), event);
    }
    dispatchControllerEvent("empire:onboarding:step-completed", {
      stepId: step.id,
      stepName: step.name,
      index: state.currentIndex,
      total: state.steps.length
    });
    if (state.currentIndex >= state.steps.length - 1) {
      finish();
      return true;
    }
    moveToStep(state.currentIndex + 1);
    return true;
  }

  function createRuntimeAPI() {
    return {
      next,
      skip,
      finish,
      reset,
      getState
    };
  }

  function handleGameEvent(type, detail = {}) {
    if (!state.active) return;
    const step = getCurrentStep();
    if (!step || typeof step.completionCondition !== "function") return;
    const event = { type, detail };
    if (step.id === "spy" && type === "empire:district-selected") {
      const districtId = Number(event.detail?.districtId);
      const targetId = Number(state.context?.neutralDistrict?.id);
      if (districtId === targetId) {
        state.stepRuntime.spyDistrictSelected = true;
        dispatchControllerEvent("empire:onboarding:spy-selection-confirmed", {
          districtId: targetId
        });
      }
    }
    if (step.id === "occupy" && type === "empire:district-selected") {
      const districtId = Number(event.detail?.districtId);
      const targetId = Number(state.context?.neutralDistrict?.id);
      if (districtId === targetId) {
        state.stepRuntime.occupyDistrictSelected = true;
        dispatchControllerEvent("empire:onboarding:occupy-selection-confirmed", {
          districtId: targetId
        });
      }
    }
    if (step.id === "attack" && type === "empire:district-selected") {
      const districtId = Number(event.detail?.districtId);
      const targetId = Number(state.context?.enemyDistrict?.id);
      if (districtId === targetId) {
        state.stepRuntime.attackDistrictSelected = true;
        dispatchControllerEvent("empire:onboarding:attack-selection-confirmed", {
          districtId: targetId
        });
      }
    }
    if (step.id === "police" && type === "empire:gang-heat-dirty-reduced") {
      const count = Math.max(0, Math.floor(Number(event.detail?.count) || 0));
      const required = Math.max(1, Math.floor(Number(event.detail?.required) || 3));
      const remaining = Math.max(0, required - count);
      state.stepRuntime.policeDirtyClicks = count;
      dispatchControllerEvent("empire:onboarding:police-progress", {
        count,
        required,
        remaining,
        triggered: Boolean(event.detail?.triggered)
      });
    }
    if (step.id === "time" && type === "empire:map-mode-changed") {
      const mapMode = String(event.detail?.mapMode || "").trim().toLowerCase();
      if (mapMode === "day") {
        state.stepRuntime.timeVisitedDay = true;
      }
      if (mapMode === "night") {
        state.stepRuntime.timeVisitedNight = true;
      }
    }
    if (!step.completionCondition(event, state.context, createRuntimeAPI())) return;
    completeStep(event);
  }

  function bindListeners() {
    if (state.listenersBound) return;
    GAME_EVENT_NAMES.forEach((eventName) => {
      document.addEventListener(eventName, (event) => {
        if (eventName === "empire:scenario-applied") {
          state.lastScenario = event.detail || null;
          if (event.detail?.scenarioKey === ONBOARDING_SCENARIO_KEY) {
            start({
              ownerName: event.detail?.ownerName,
              districts: event.detail?.districts
            });
            return;
          }
          if (state.active) {
            reset({ silent: true });
          }
          return;
        }
        handleGameEvent(eventName, event.detail || {});
      });
    });
    state.listenersBound = true;
  }

  function start(options = {}) {
    bindListeners();
    if (state.active) {
      reset({ silent: true });
    }
    state.context = resolveTutorialContext(options);
    state.steps = createSteps();
    state.stepRuntime = {};
    state.active = true;
    dispatchControllerEvent("empire:onboarding:started", {
      scenarioKey: ONBOARDING_SCENARIO_KEY,
      context: state.context
    });
    moveToStep(0);
    return getState();
  }

  function next() {
    const step = getCurrentStep();
    if (!state.active || !step) return false;
    if (!step.manualAdvance) return false;
    return completeStep({ type: "manual-continue", detail: {} });
  }

  function skip() {
    if (!state.active) return false;
    finish({ skipped: true });
    return true;
  }

  function finish(options = {}) {
    const ui = resolveUILayer();
    const skipped = Boolean(options.skipped);
    const completedStepId = getCurrentStep()?.id || null;
    ui.clearHighlight();
    ui.hideOverlay();
    ui.unlockGameUI();
    dispatchControllerEvent("empire:onboarding:finished", {
      skipped,
      completedStepId,
      total: state.steps.length
    });
    state.active = false;
    state.currentIndex = -1;
    state.steps = [];
    state.context = null;
    state.stepRuntime = {};
    return true;
  }

  function reset(options = {}) {
    const ui = resolveUILayer();
    ui.clearHighlight();
    ui.hideOverlay();
    ui.unlockGameUI();
    if (!options.silent) {
      dispatchControllerEvent("empire:onboarding:reset", {});
    }
    state.active = false;
    state.currentIndex = -1;
    state.steps = [];
    state.context = null;
    state.stepRuntime = {};
    return true;
  }

  function getState() {
    const step = getCurrentStep();
    return {
      active: state.active,
      currentIndex: state.currentIndex,
      stepId: step?.id || null,
      stepName: step?.name || null,
      totalSteps: state.steps.length,
      context: state.context
    };
  }

  bindListeners();

  return {
    start,
    next,
    skip,
    finish,
    reset,
    getState
  };
})();

window.Empire.OnboardingController = window.Empire.Onboarding;

if (!window.Empire.OnboardingUI) {
  window.Empire.OnboardingUI = (() => {
    const ONBOARDING_ROOT_ID = "onboarding-overlay";
    const state = {
      root: null,
      step: null,
      title: null,
      text: null,
      sidecard: null,
      sidecardTitle: null,
      sidecardBody: null,
      continueBtn: null,
      skipBtn: null,
      highlightTarget: null,
      highlightChain: []
    };

    function ensureRoot() {
      if (state.root) return state.root;
      const root = document.createElement("div");
      root.id = ONBOARDING_ROOT_ID;
      root.className = "onboarding-overlay hidden";
      root.innerHTML = `
        <div class="onboarding-overlay__fog-layer" aria-hidden="true"></div>
        <div class="onboarding-overlay__rain-layer" aria-hidden="true"></div>
        <div class="onboarding-overlay__flicker-layer" aria-hidden="true"></div>
        <div class="onboarding-overlay__backdrop"></div>
        <div class="onboarding-overlay__panel">
          <div class="onboarding-overlay__meta">
            <span class="onboarding-overlay__badge">ONBOARDING</span>
            <strong id="onboarding-step-label">Krok 0 / 0</strong>
          </div>
          <div class="onboarding-overlay__guide">
            <div class="onboarding-overlay__portrait-shell">
              <img class="onboarding-overlay__portrait" src="../img/onboarding.jpg" alt="Guide portrait" />
            </div>
            <div class="onboarding-overlay__guide-copy">
              <div class="onboarding-overlay__npc">Průvodce městem</div>
              <div class="onboarding-overlay__text" id="onboarding-dialog-text"></div>
            </div>
          </div>
          <div class="onboarding-overlay__actions">
            <button type="button" class="btn btn--ghost onboarding-overlay__skip" id="onboarding-skip-btn">Preskocit</button>
            <button type="button" class="btn btn--primary onboarding-overlay__continue" id="onboarding-continue-btn">Pokracovat</button>
          </div>
        </div>
        <div class="onboarding-overlay__sidecard hidden" id="onboarding-sidecard">
          <div class="onboarding-overlay__sidecard-title" id="onboarding-sidecard-title">Preview</div>
          <div class="onboarding-overlay__sidecard-body" id="onboarding-sidecard-body"></div>
        </div>
      `;
      document.body.appendChild(root);
      state.root = root;
      state.step = root.querySelector("#onboarding-step-label");
      state.title = root.querySelector(".onboarding-overlay__npc");
      state.text = root.querySelector("#onboarding-dialog-text");
      state.sidecard = root.querySelector("#onboarding-sidecard");
      state.sidecardTitle = root.querySelector("#onboarding-sidecard-title");
      state.sidecardBody = root.querySelector("#onboarding-sidecard-body");
      state.continueBtn = root.querySelector("#onboarding-continue-btn");
      state.skipBtn = root.querySelector("#onboarding-skip-btn");
      if (state.continueBtn) {
        state.continueBtn.addEventListener("click", () => {
          window.Empire.Onboarding?.next?.();
        });
      }
      if (state.skipBtn) {
        state.skipBtn.addEventListener("click", () => {
          window.Empire.Onboarding?.skip?.();
        });
      }
      const clearStepClasses = () => {
        Array.from(document.body.classList)
          .filter((className) => className.startsWith("onboarding-step-"))
          .forEach((className) => document.body.classList.remove(className));
      };
      document.addEventListener("empire:onboarding:step-changed", (event) => {
        const detail = event.detail || {};
        clearStepClasses();
        if (detail.stepId) {
          document.body.classList.add(`onboarding-step-${detail.stepId}`);
        }
        if (state.continueBtn) {
          state.continueBtn.textContent = detail.primaryActionLabel || "Pokracovat";
          state.continueBtn.disabled = !detail.canManualAdvance;
        }
        hideSidecard();
        if (detail.stepId !== "time" && detail.stepId !== "blackout") {
          document.body.classList.remove("onboarding-step-time-day", "onboarding-step-time-night");
        }
      });
      document.addEventListener("empire:onboarding:spy-selection-confirmed", () => {
        document.body.classList.add("onboarding-step-spy-selected");
        document.body.classList.remove("onboarding-step-spy-confirm");
        setDialog(
          "Průvodce městem",
          "Správně. Teď v detailu districtu klikni na Špehovat a akci potvrď."
        );
      });
      document.addEventListener("empire:onboarding:attack-selection-confirmed", () => {
        document.body.classList.add("onboarding-step-attack-selected");
        setDialog(
          "Průvodce městem",
          "Správně. Teď otevři útok a potvrď ho. V onboarding scénáři vyjde na 100 %."
        );
      });
      document.addEventListener("empire:spy-modal-opened", (event) => {
        const currentStep = window.Empire.Onboarding?.getState?.()?.stepId;
        if (currentStep !== "spy") return;
        const districtId = Number(event.detail?.districtId);
        if (districtId !== ONBOARDING_SPY_DISTRICT_ID) return;
        document.body.classList.remove("onboarding-step-spy-selected");
        document.body.classList.add("onboarding-step-spy-confirm");
      });
      document.addEventListener("empire:onboarding:occupy-selection-confirmed", () => {
        document.body.classList.add("onboarding-step-occupy-selected");
        setDialog(
          "Průvodce městem",
          "Správně. Teď klikni na Obsadit a potvrzením spusť obsazení districtu 25."
        );
      });
      document.addEventListener("empire:map-mode-changed", (event) => {
        const currentStep = window.Empire.Onboarding?.getState?.()?.stepId;
        if (currentStep !== "time" && currentStep !== "blackout") return;
        const mapMode = String(event.detail?.mapMode || "").trim().toLowerCase();
        if (currentStep === "time") {
          if (mapMode === "day") {
            document.body.classList.add("onboarding-step-time-day");
            document.body.classList.remove("onboarding-step-time-night");
            setDialog(
              "Průvodce městem",
              "Den máš. Teď to přepni na noc, ať vidíš, že se fáze fakt přehazují."
            );
          } else if (mapMode === "night") {
            document.body.classList.add("onboarding-step-time-night");
            document.body.classList.remove("onboarding-step-time-day");
            setDialog(
              "Průvodce městem",
              "Noc máš. Teď už jen potvrď blackout krok a pojď dál."
            );
          }
          return;
        }
        if (currentStep === "blackout" && mapMode === "blackout") {
          setDialog(
            "Průvodce městem",
            "Blackout je aktivní. Tohle je stav města, který budeš řešit pořád dokola."
          );
        }
      });
      document.addEventListener("empire:onboarding:topic-card", (event) => {
        const detail = event.detail || {};
        const points = Array.isArray(detail.points) ? detail.points : [];
        const footer = String(detail.footer || "").trim();
        const bodyMarkup = `
          <div class="onboarding-preview onboarding-preview--stack">
            <div class="onboarding-preview__row onboarding-preview__row--stack">
              <span>${escapeHtml(detail.intro || "")}</span>
              <strong>${escapeHtml(detail.stepId || "Krok")}</strong>
            </div>
            ${points.map((point) => `
              <div class="onboarding-preview__row onboarding-preview__row--stack">
                <span>Tip</span>
                <strong>${escapeHtml(point)}</strong>
              </div>
            `).join("")}
            ${footer ? `
              <div class="onboarding-preview__row onboarding-preview__row--stack">
                <span>Poznámka</span>
                <strong>${escapeHtml(footer)}</strong>
              </div>
            ` : ""}
          </div>
        `;
        showSidecard(detail.title || "Preview", bodyMarkup);
      });
      document.addEventListener("empire:onboarding:police-progress", (event) => {
        const currentStep = window.Empire.Onboarding?.getState?.()?.stepId;
        if (currentStep !== "police") return;
        const detail = event.detail || {};
        const remaining = Math.max(0, Number(detail.remaining || 0));
        setDialog(
          "Průvodce městem",
          remaining > 0
            ? `Ještě ${remaining} kliknutí na dirty reduction a policie se spustí na tvůj district.`
            : "Poslední klik už doručí policii přímo na tvůj district."
        );
        showSidecard("Policie", `
          <div class="onboarding-preview onboarding-preview--stack">
            <div class="onboarding-preview__row onboarding-preview__row--stack">
              <span>Dirty redukce</span>
              <strong>${escapeHtml(`${Math.max(0, Number(detail.count || 0))}/${Math.max(1, Number(detail.required || 3))}`)}</strong>
            </div>
            <div class="onboarding-preview__row onboarding-preview__row--stack">
              <span>Stav</span>
              <strong>${detail.triggered ? "Policie spuštěna" : "Ještě čeká"}</strong>
            </div>
          </div>
        `);
      });
      document.addEventListener("empire:onboarding:intel-preview-request", (event) => {
        const intel = event.detail?.intel || {};
        showSidecard("Zpravodajsky vystup", `
          <div class="onboarding-preview">
            <div class="onboarding-preview__row"><span>Vlastnik</span><strong>${escapeHtml(intel.owner || "Neznamy")}</strong></div>
            <div class="onboarding-preview__row"><span>Obrana</span><strong>${escapeHtml(intel.defense || "Neznama")}</strong></div>
            <div class="onboarding-preview__row"><span>Produkce</span><strong>${escapeHtml(intel.production || "Neznama")}</strong></div>
          </div>
        `);
      });
      document.addEventListener("empire:onboarding:combat-preview-request", (event) => {
        const scriptedOutcome = String(event.detail?.scriptedOutcome || "light-win").trim();
        const outcomeLabel = scriptedOutcome === "total-success"
          ? "100% vyhra"
          : scriptedOutcome === "light-win"
            ? "Lehka vyhra"
            : "Simulace";
        showSidecard("Combat Preview", `
          <div class="onboarding-preview">
            <div class="onboarding-preview__row"><span>Cil</span><strong>Nepratelsky sektor</strong></div>
            <div class="onboarding-preview__row"><span>Prognoza</span><strong>${escapeHtml(outcomeLabel)}</strong></div>
            <div class="onboarding-preview__row"><span>Vysledek</span><strong>Obrana se prolomi, tlak zustava na tve strane.</strong></div>
          </div>
        `);
      });
      document.addEventListener("empire:onboarding:district-guide-request", (event) => {
        const districtTypes = Array.isArray(event.detail?.districtTypes) ? event.detail.districtTypes : [];
        showSidecard("Typy districtu", `
          <div class="onboarding-preview onboarding-preview--stack">
            ${districtTypes.map((entry) => `
              <div class="onboarding-preview__row onboarding-preview__row--stack">
                <span>${escapeHtml(entry.label || entry.key || "District")}</span>
                <strong>${escapeHtml(entry.summary || "-")}</strong>
              </div>
            `).join("")}
          </div>
        `);
      });
      document.addEventListener("empire:onboarding:finished", clearHighlight);
      document.addEventListener("empire:onboarding:reset", clearHighlight);
      return root;
    }

    function escapeHtml(value) {
      return String(value || "")
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#39;");
    }

    function showSidecard(title, bodyMarkup) {
      ensureRoot();
      if (state.sidecardTitle) state.sidecardTitle.textContent = String(title || "Preview");
      if (state.sidecardBody) state.sidecardBody.innerHTML = String(bodyMarkup || "");
      if (state.sidecard) state.sidecard.classList.remove("hidden");
    }

    function hideSidecard() {
      if (state.sidecard) state.sidecard.classList.add("hidden");
      if (state.sidecardBody) state.sidecardBody.innerHTML = "";
    }

    function showOverlay() {
      const root = ensureRoot();
      root.classList.remove("hidden");
    }

    function hideOverlay() {
      const root = ensureRoot();
      root.classList.add("hidden");
      hideSidecard();
    }

    function setDialog(name, text) {
      ensureRoot();
      if (state.title) state.title.textContent = String(name || "Průvodce městem");
      if (state.text) state.text.textContent = String(text || "");
    }

    function setStep(current, total) {
      ensureRoot();
      if (state.step) state.step.textContent = `Krok ${current} / ${total}`;
    }

    function clearHighlight() {
      document.body.classList.remove("onboarding-ui-locked");
      state.highlightChain.forEach((node) => {
        if (!(node instanceof HTMLElement)) return;
        node.classList.remove("onboarding-allowed", "onboarding-highlight");
      });
      if (state.root) {
        state.root.style.removeProperty("--onboarding-focus-x");
        state.root.style.removeProperty("--onboarding-focus-y");
        state.root.style.removeProperty("--onboarding-focus-rx");
        state.root.style.removeProperty("--onboarding-focus-ry");
      }
      state.highlightTarget = null;
      state.highlightChain = [];
    }

    function highlightElement(element) {
      ensureRoot();
      clearHighlight();
      if (!(element instanceof HTMLElement)) return;
      state.highlightTarget = element;
      const chain = [];
      let current = element;
      while (current && current instanceof HTMLElement && current !== document.body) {
        chain.push(current);
        current = current.parentElement;
      }
      const rect = element.getBoundingClientRect();
      if (state.root && rect.width > 0 && rect.height > 0) {
        state.root.style.setProperty("--onboarding-focus-x", `${rect.left + rect.width / 2}px`);
        state.root.style.setProperty("--onboarding-focus-y", `${rect.top + rect.height / 2}px`);
        state.root.style.setProperty("--onboarding-focus-rx", `${Math.max(140, rect.width * 0.62)}px`);
        state.root.style.setProperty("--onboarding-focus-ry", `${Math.max(110, rect.height * 0.62)}px`);
      }
      state.highlightChain = chain;
      chain.forEach((node, index) => {
        node.classList.add("onboarding-allowed");
        if (index === 0) {
          node.classList.add("onboarding-highlight");
        }
      });
      document.body.classList.add("onboarding-ui-locked");
    }

    function lockGameUI() {
      ensureRoot();
      document.body.classList.add("onboarding-active");
    }

    function unlockGameUI() {
      Array.from(document.body.classList)
        .filter((className) => className.startsWith("onboarding-step-"))
        .forEach((className) => document.body.classList.remove(className));
      document.body.classList.remove("onboarding-active", "onboarding-ui-locked");
      clearHighlight();
      hideSidecard();
    }

    return {
      showOverlay,
      hideOverlay,
      setDialog,
      setStep,
      highlightElement,
      clearHighlight,
      lockGameUI,
      unlockGameUI
    };
  })();
}
