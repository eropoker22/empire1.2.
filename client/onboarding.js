window.Empire = window.Empire || {};

window.Empire.Onboarding = (() => {
  const ONBOARDING_SCENARIO_KEY = "onboarding-20-edge";
  const ONBOARDING_NPC_NAME = "Onboarding AI";
  const ONBOARDING_SPY_DISTRICT_ID = 25;
  const ONBOARDING_ATTACK_DISTRICT_ID = 6;
  const GAME_EVENT_NAMES = [
    "empire:scenario-applied",
    "empire:district-selected",
    "empire:district-modal-opened",
    "empire:building-detail-opened",
    "empire:attack-modal-opened",
    "empire:spy-modal-opened",
    "empire:spy-started",
    "empire:occupy-modal-opened",
    "empire:occupy-started"
  ];
  const DISTRICT_TYPE_GUIDE = [
    { key: "commercial", label: "Commercial", summary: "penize" },
    { key: "industrial", label: "Industrial", summary: "produkce" },
    { key: "park", label: "Park", summary: "drogy / ilegalni operace" },
    { key: "residential", label: "Residential", summary: "lide / jednotky" },
    { key: "downtown", label: "Downtown", summary: "vliv / moc" }
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
    const economyDistrict = playerDistrict || neutralDistrict || enemyDistrict || null;

    return {
      ownerName: playerOwnerName,
      districts,
      adjacency,
      playerDistrict,
      enemyDistrict,
      neutralDistrict,
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

  function createSteps() {
    return [
      {
        id: "intro",
        name: "Intro",
        manualAdvance: true,
        primaryActionLabel: "Pokracovat",
        dialog: [
          "Vitej ve Vortex City.",
          "Tady se chyby neodpousti.",
          "Bud se naucis rychle nebo zmizis."
        ],
        target: null,
        onEnter(context) {
          dispatchControllerEvent("empire:onboarding:intro-opened", {
            context
          });
        },
        completionCondition(event) {
          return event.type === "manual-continue";
        },
        onComplete() {}
      },
      {
        id: "spy",
        name: "Spehovani",
        primaryActionLabel: "Cekam na sektor",
        dialog: [
          "Nez neco vezmes sleduj.",
          "Vyber district 25, klikni na Spehovat a akci potvrd."
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
        name: "Dobyvani",
        primaryActionLabel: "Cekam na zabrani",
        dialog: [
          "Ted si vezmi neco, co nikomu nepatri.",
          "Zadny odpor. Cisty zisk."
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
        },
        completionCondition(event, context) {
          return event.type === "empire:occupy-started"
            && Number(event.detail?.districtId) === Number(context.neutralDistrict?.id);
        },
        onComplete() {}
      },
      {
        id: "economy",
        name: "Budovy a ekonomika",
        primaryActionLabel: "Otevri detail",
        dialog: [
          "Kazdy sektor neco produkuje.",
          "Penize. Drogy. Materialy. Vliv.",
          "Nejsi stavitel. Jsi predator."
        ],
        target(context) {
          return {
            districtId: context.economyDistrict?.id ?? null,
            selector: "#district-modal",
            fallbackSelector: "#buildings-open"
          };
        },
        onEnter(context) {
          dispatchControllerEvent("empire:onboarding:economy-focus-request", {
            districtId: context.economyDistrict?.id ?? null
          });
        },
        completionCondition(event) {
          return event.type === "empire:district-modal-opened" || event.type === "empire:building-detail-opened";
        },
        onComplete() {}
      },
      {
        id: "attack",
        name: "Utok",
        primaryActionLabel: "Klikni na utok",
        dialog: [
          "Ted ukaz, jestli mas koule.",
          "Tohle neni tvoje. Zmen to."
        ],
        target(context) {
          return {
            districtId: context.enemyDistrict?.id ?? null,
            selector: "#attack-btn",
            fallbackSelector: "#city-map"
          };
        },
        onEnter(context) {
          dispatchControllerEvent("empire:onboarding:attack-target-request", {
            districtId: context.enemyDistrict?.id ?? null
          });
        },
        completionCondition(event, context) {
          return event.type === "empire:attack-modal-opened"
            && Number(event.detail?.districtId) === Number(context.enemyDistrict?.id);
        },
        onComplete(context) {
          dispatchControllerEvent("empire:onboarding:combat-preview-request", {
            districtId: context.enemyDistrict?.id ?? null,
            scriptedOutcome: "light-win"
          });
        }
      },
      {
        id: "districts",
        name: "Districty",
        manualAdvance: true,
        primaryActionLabel: "Pokracovat",
        dialog: [
          "Mesto je rozdeleny.",
          "Kazda cast te muze zbohatnout nebo zabit."
        ],
        target: {
          selector: "#buildings-open",
          fallbackSelector: "#city-map"
        },
        onEnter() {
          dispatchControllerEvent("empire:onboarding:district-guide-request", {
            districtTypes: DISTRICT_TYPE_GUIDE
          });
        },
        completionCondition(event) {
          return event.type === "manual-continue";
        },
        onComplete() {}
      },
      {
        id: "core-loop",
        name: "Core loop",
        manualAdvance: true,
        primaryActionLabel: "Pokracovat",
        dialog: [
          "Spehujes.",
          "Beres.",
          "Produkujes.",
          "Utocis.",
          "A jedes znovu dokud to cely nepatri tobe."
        ],
        target: null,
        onEnter() {},
        completionCondition(event) {
          return event.type === "manual-continue";
        },
        onComplete() {}
      },
      {
        id: "exit",
        name: "Exit",
        manualAdvance: true,
        primaryActionLabel: "Vstoupit do mesta",
        dialog: [
          "Ted jsi v tom sam.",
          "Vydelavej. Nic lidi.",
          "A hlavne neumri moc brzo."
        ],
        target: null,
        onEnter() {},
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
              <div class="onboarding-overlay__npc">Onboarding AI</div>
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
      document.addEventListener("empire:onboarding:step-changed", (event) => {
        const detail = event.detail || {};
        document.body.classList.remove(
          "onboarding-step-intro",
          "onboarding-step-spy",
          "onboarding-step-spy-selected",
          "onboarding-step-spy-confirm",
          "onboarding-step-occupy",
          "onboarding-step-occupy-selected",
          "onboarding-step-economy",
          "onboarding-step-attack",
          "onboarding-step-districts",
          "onboarding-step-core-loop",
          "onboarding-step-exit"
        );
        if (detail.stepId) {
          document.body.classList.add(`onboarding-step-${detail.stepId}`);
        }
        if (state.continueBtn) {
          state.continueBtn.textContent = detail.primaryActionLabel || "Pokracovat";
          state.continueBtn.disabled = !detail.canManualAdvance;
        }
        hideSidecard();
      });
      document.addEventListener("empire:onboarding:spy-selection-confirmed", () => {
        document.body.classList.add("onboarding-step-spy-selected");
        document.body.classList.remove("onboarding-step-spy-confirm");
        setDialog(
          "Onboarding AI",
          "Spravne. Ted v detailu districtu klikni na Spehovat a akci potvrd."
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
          "Onboarding AI",
          "Spravne. Ted klikni na Obsadit a potvrzenim spust obsazeni districtu 25."
        );
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
        const outcomeLabel = scriptedOutcome === "light-win" ? "Lehka vyhra" : "Simulace";
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
      if (state.title) state.title.textContent = String(name || "Onboarding AI");
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
      document.body.classList.remove(
        "onboarding-step-intro",
        "onboarding-step-spy",
        "onboarding-step-spy-selected",
        "onboarding-step-spy-confirm",
        "onboarding-step-occupy",
        "onboarding-step-occupy-selected",
        "onboarding-step-economy",
        "onboarding-step-attack",
        "onboarding-step-districts",
        "onboarding-step-core-loop",
        "onboarding-step-exit"
      );
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
