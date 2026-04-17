document.addEventListener("DOMContentLoaded", () => {
  const runtimeConfig = window.Empire?.RuntimeConfig || null;
  const API_BASE = runtimeConfig?.apiBaseUrl || "http://localhost:3000";
  const buildApiUrl = runtimeConfig?.buildApiUrl || ((path) => `${API_BASE}${path}`);
  const TOKEN_KEY = runtimeConfig?.storageKeys?.token || "empire_token";
  const STRUCTURE_KEY = runtimeConfig?.storageKeys?.structure || "empire_structure";
  const AVATAR_KEY = runtimeConfig?.storageKeys?.avatar || "empire_avatar";
  const GANG_COLOR_KEY = runtimeConfig?.storageKeys?.gangColor || "empire_gang_color";
  const matrixCanvas = document.getElementById("matrix-canvas");
  if (matrixCanvas) {
    const ctx = matrixCanvas.getContext("2d");
    const letters = "アカサタナハマヤラワ0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ";
    let width = 0;
    let height = 0;
    let columns = 0;
    let drops = [];
    let animationId = null;
    let lastTime = 0;

    const setSize = () => {
      width = window.innerWidth;
      height = window.innerHeight;
      matrixCanvas.width = Math.floor(width * window.devicePixelRatio);
      matrixCanvas.height = Math.floor(height * window.devicePixelRatio);
      ctx.setTransform(window.devicePixelRatio, 0, 0, window.devicePixelRatio, 0, 0);
      const fontSize = 14;
      columns = Math.floor(width / fontSize);
      drops = Array.from({ length: columns }, () => Math.random() * height);
    };

    const draw = (time) => {
      if (time - lastTime < 50) {
        animationId = requestAnimationFrame(draw);
        return;
      }
      lastTime = time;
      ctx.fillStyle = "rgba(7, 8, 15, 0.15)";
      ctx.fillRect(0, 0, width, height);
      ctx.fillStyle = "rgba(34, 211, 238, 0.85)";
      ctx.font = "14px 'IBM Plex Mono', monospace";
      for (let i = 0; i < drops.length; i += 1) {
        const text = letters[Math.floor(Math.random() * letters.length)];
        const x = i * 14;
        const y = drops[i];
        ctx.fillText(text, x, y);
        drops[i] += 16;
        if (drops[i] > height + Math.random() * 200) {
          drops[i] = -Math.random() * 200;
        }
      }
      animationId = requestAnimationFrame(draw);
    };

    setSize();
    animationId = requestAnimationFrame(draw);
    window.addEventListener("resize", setSize);

    document.addEventListener("visibilitychange", () => {
      if (document.hidden && animationId) {
        cancelAnimationFrame(animationId);
        animationId = null;
        return;
      }
      if (!document.hidden && !animationId) {
        lastTime = 0;
        animationId = requestAnimationFrame(draw);
      }
    });
  }

  const currentMode = window.Empire?.mode || "war";
  const resolveGameEntryHref = (mode) => {
    const normalizedMode = window.Empire?.GameModes?.normalizeMode?.(mode) || "war";
    return `index.html?mode=${normalizedMode}`;
  };
  const backToLogin = document.querySelector('.faction-link--secondary[href="login.html"]');
  let authToken = localStorage.getItem(TOKEN_KEY);

  const grid = document.getElementById("structure-grid");
  const note = document.getElementById("structure-note");
  const detail = document.getElementById("faction-detail");
  const factionShell = document.querySelector(".auth-card--faction");
  const title = document.getElementById("faction-title");
  const desc = document.getElementById("faction-desc");
  const bonus = document.getElementById("faction-bonus");
  const goGame = document.getElementById("go-game");
  const avatarGrid = document.getElementById("avatar-grid");
  const avatarLeft = document.getElementById("avatar-left");
  const avatarRight = document.getElementById("avatar-right");
  const gangColorGrid = document.getElementById("gang-color-grid");
  const gangColorValue = document.getElementById("gang-color-value");
  const lightbox = document.getElementById("avatar-lightbox");
  const lightboxImg = document.getElementById("avatar-lightbox-img");
  const lightboxCaption = document.getElementById("avatar-lightbox-caption");
  const lightboxPrev = document.getElementById("avatar-lightbox-prev");
  const lightboxNext = document.getElementById("avatar-lightbox-next");
  const lightboxConfirm = document.getElementById("avatar-lightbox-confirm");
  const lightboxClose = document.getElementById("avatar-lightbox-close");
  const lightboxBackdrop = document.querySelector("#avatar-lightbox .avatar-lightbox__backdrop");
  const isCoarsePointer = window.matchMedia("(pointer: coarse)").matches;
  const marquee = avatarGrid?.closest(".avatar-marquee") || null;

  let selectedStructure = localStorage.getItem(STRUCTURE_KEY);
  let selectedAvatar = localStorage.getItem(AVATAR_KEY);
  let selectedGangColor = localStorage.getItem(GANG_COLOR_KEY);
  let hoverPause = false;
  let marqueeTouchState = {
    active: false,
    moved: false,
    startX: 0
  };
  let marqueeLoopWidth = 0;
  let gangColorSyncRevision = 0;
  let mobileStructureTapState = {
    structure: null,
    at: 0
  };
  const selectionConfirmed = {
    structure: false,
    avatar: false,
    gangColor: false
  };
  const MOBILE_STRUCTURE_DOUBLE_TAP_MS = 360;

  const factionData = window.Empire?.FactionData || {};
  const factionAvatarPools = factionData.factionAvatarPools || {};
  const data = factionData.data || {};
  const factionOrder = Array.isArray(factionData.factionOrder) ? factionData.factionOrder : [];
  const factionLegendNamePrefix = factionData.factionLegendNamePrefix || {};
  const factionLegendBios = factionData.factionLegendBios || {};
  const factionLegendMotivations = factionData.factionLegendMotivations || {};
  const gangColorOptions = Array.isArray(factionData.gangColorOptions) ? factionData.gangColorOptions : [];
  const gangColorValueSet = new Set(gangColorOptions.map((item) => item.value));
  const gangColorByValue = new Map(gangColorOptions.map((item) => [item.value, item.name]));

  selectedGangColor = normalizeHexColor(selectedGangColor);
  if (selectedGangColor && !gangColorValueSet.has(selectedGangColor)) {
    selectedGangColor = null;
    localStorage.removeItem(GANG_COLOR_KEY);
  }

  function normalizeHexColor(value) {
    const raw = String(value || "").trim().toLowerCase();
    if (!raw) return null;
    if (/^#[0-9a-f]{3}$/.test(raw)) {
      return `#${raw[1]}${raw[1]}${raw[2]}${raw[2]}${raw[3]}${raw[3]}`;
    }
    if (/^#[0-9a-f]{6}$/.test(raw)) return raw;
    return null;
  }

  function escapeHtml(value) {
    return String(value || "")
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/\"/g, "&quot;")
      .replace(/'/g, "&#39;");
  }

  function getAvailableAvatars() {
    if (!selectedStructure) return [];
    const avatars = factionAvatarPools[selectedStructure];
    return Array.isArray(avatars) ? avatars : [];
  }

  function resolveGangColorName(color) {
    const normalized = normalizeHexColor(color);
    if (!normalized) return "Nevybráno";
    return gangColorByValue.get(normalized) || normalized.toUpperCase();
  }

  function renderGangColorOptions() {
    if (!gangColorGrid) return;
    gangColorGrid.innerHTML = gangColorOptions
      .map(
        ({ name, value }) => `
          <button
            class="gang-color-swatch"
            type="button"
            data-gang-color="${value}"
            style="--swatch:${value}"
            aria-label="${name}"
            title="${name}"
          ></button>
        `
      )
      .join("");
  }

  function updateContinueState() {
    if (!goGame) return;
    if (
      selectedStructure
      && selectedAvatar
      && selectedGangColor
      && selectionConfirmed.structure
      && selectionConfirmed.avatar
      && selectionConfirmed.gangColor
    ) {
      goGame.classList.remove("faction-link--disabled");
      goGame.setAttribute("aria-disabled", "false");
      goGame.tabIndex = 0;
    } else {
      goGame.classList.add("faction-link--disabled");
      goGame.setAttribute("aria-disabled", "true");
      goGame.tabIndex = -1;
    }
  }

  function updateNote() {
    if (!note) return;
    if (
      selectedStructure
      && selectedAvatar
      && selectedGangColor
      && selectionConfirmed.structure
      && selectionConfirmed.avatar
      && selectionConfirmed.gangColor
    ) {
      note.textContent = `Vybráno: ${selectedStructure} • ${resolveGangColorName(selectedGangColor)} • avatar.`;
      return;
    }
    const missing = [];
    if (!selectedStructure || !selectionConfirmed.structure) missing.push("frakci");
    if (!selectedGangColor || !selectionConfirmed.gangColor) missing.push("barvu gangu");
    if (!selectedAvatar || !selectionConfirmed.avatar) missing.push("avatara");
    note.textContent = `Chybí vybrat: ${missing.join(", ")}.`;
  }

  function applyAuthToken(nextToken) {
    const safeToken = String(nextToken || "").trim();
    if (!safeToken) return;
    authToken = safeToken;
    localStorage.setItem(TOKEN_KEY, safeToken);
  }

  async function postAuthed(path, body) {
    if (!authToken) return { error: "missing_token" };
    try {
      const res = await fetch(buildApiUrl(path), {
        method: "POST",
        headers: {
          Authorization: `Bearer ${authToken}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify(body || {})
      });
      return res.json();
    } catch {
      return { error: "network_error" };
    }
  }

  function renderGangColorSelectionState(normalizedColor) {
    if (gangColorGrid) {
      gangColorGrid.querySelectorAll("[data-gang-color]").forEach((button) => {
        const buttonColor = normalizeHexColor(button.dataset.gangColor);
        button.classList.toggle("is-selected", buttonColor === normalizedColor);
      });
    }
    if (!gangColorValue) return;
    if (normalizedColor) {
      const colorName = resolveGangColorName(normalizedColor);
      gangColorValue.textContent = colorName;
      gangColorValue.style.color = normalizedColor;
      return;
    }
    gangColorValue.textContent = "Nevybráno";
    gangColorValue.style.color = "";
  }

  function clearGangColorSelection() {
    selectedGangColor = null;
    localStorage.removeItem(GANG_COLOR_KEY);
    renderGangColorSelectionState(null);
    updateContinueState();
  }

  function getAvatarLabel(src) {
    if (!src) return "Neznámý agent";
    const match = src.match(/(\d{6,})/);
    if (match) {
      const id = match[1].slice(-4);
      return `Agent ${id}`;
    }
    return "Neznámý agent";
  }

  function resolveAvatarLegend(src) {
    const avatars = getAvailableAvatars();
    const index = avatars.indexOf(src);
    const idx = index >= 0 ? index : 0;
    const factionKey = selectedStructure && data[selectedStructure] ? selectedStructure : null;
    const prefix = factionLegendNamePrefix[factionKey] || "Agent";
    const bioPool = factionLegendBios[factionKey] || ["Neznámá postava, která čeká na svůj příběh."];
    const motivePool = factionLegendMotivations[factionKey] || [
      "Chce přežít ve Vortex City a získat vlastní místo u moci."
    ];
    return {
      name: `${prefix} ${idx + 1}`,
      bio: bioPool[idx % bioPool.length],
      motivation: motivePool[idx % motivePool.length]
    };
  }

  function isLightboxOpen() {
    return Boolean(lightbox && !lightbox.classList.contains("hidden"));
  }

  function updateLightboxNavigation() {
    if (!lightboxPrev || !lightboxNext) return;
    const canNavigate = getAvailableAvatars().length > 1;
    lightboxPrev.disabled = !canNavigate;
    lightboxNext.disabled = !canNavigate;
  }

  function openLightbox(src) {
    if (!lightbox || !lightboxImg) return;
    lightboxImg.src = src;
    lightboxImg.dataset.avatar = src || "";
    if (lightboxCaption) {
      const legend = resolveAvatarLegend(src);
      lightboxCaption.innerHTML = `
        <div class="avatar-lightbox__legend-name">${escapeHtml(legend.name)}</div>
        <div class="avatar-lightbox__legend-bio">${escapeHtml(legend.bio)}</div>
        <div class="avatar-lightbox__legend-motive">
          <strong>Motivace:</strong> ${escapeHtml(legend.motivation)}
        </div>
      `;
    }
    lightbox.classList.remove("hidden");
    updateLightboxNavigation();
  }

  function closeLightbox() {
    if (!lightbox) return;
    lightbox.classList.add("hidden");
  }

  function shiftLightboxAvatar(direction) {
    const avatars = getAvailableAvatars();
    if (!avatars.length) return;
    const step = Number(direction) < 0 ? -1 : 1;
    const currentSrc = String(lightboxImg?.dataset?.avatar || selectedAvatar || avatars[0]);
    let currentIndex = avatars.indexOf(currentSrc);
    if (currentIndex < 0) currentIndex = 0;
    const nextIndex = (currentIndex + step + avatars.length) % avatars.length;
    const nextSrc = avatars[nextIndex];
    applyAvatarSelection(nextSrc, { openPreview: false });
    openLightbox(nextSrc);
  }

  async function applyGangColorSelection(color, options = {}) {
    const normalized = normalizeHexColor(color);
    if (!normalized || !gangColorValueSet.has(normalized)) return false;
    const previousColor = normalizeHexColor(selectedGangColor);
    const previousGangColorConfirmed = selectionConfirmed.gangColor;
    const shouldConfirmSelection = options?.confirm !== false;
    const shouldSyncServer = Boolean(authToken) && !options?.skipServerSync;
    const isSameAsPrevious = previousColor === normalized;

    if (shouldConfirmSelection) {
      selectionConfirmed.gangColor = true;
    }

    if (!isSameAsPrevious) {
      selectedGangColor = normalized;
      localStorage.setItem(GANG_COLOR_KEY, normalized);
      renderGangColorSelectionState(normalized);
      updateContinueState();
      updateNote();
    } else if (!options?.silent) {
      updateNote();
    }

    if (!shouldSyncServer) return true;

    if (!isSameAsPrevious || options?.forceServerSync) {
      const syncRevision = ++gangColorSyncRevision;
      const result = await postAuthed("/players/gang-color", { color: normalized });
      if (syncRevision !== gangColorSyncRevision) {
        return false;
      }
      const confirmedColor = normalizeHexColor(result?.gangColor);
      if (confirmedColor) {
        selectedGangColor = confirmedColor;
        localStorage.setItem(GANG_COLOR_KEY, confirmedColor);
        renderGangColorSelectionState(confirmedColor);
        if (result?.token) applyAuthToken(result.token);
        if (!options?.silent) updateNote();
        return true;
      }

      if (previousColor && previousColor !== normalized) {
        selectedGangColor = previousColor;
        localStorage.setItem(GANG_COLOR_KEY, previousColor);
        renderGangColorSelectionState(previousColor);
      } else if (previousColor) {
        selectedGangColor = previousColor;
        localStorage.setItem(GANG_COLOR_KEY, previousColor);
        renderGangColorSelectionState(previousColor);
      } else {
        clearGangColorSelection();
      }
      selectionConfirmed.gangColor = previousGangColorConfirmed;
      updateContinueState();
      if (!options?.silent && note) {
        if (result?.error === "gang_color_taken") {
          note.textContent = `Barva ${resolveGangColorName(normalized)} je už obsazená jiným hráčem. Vyber jinou.`;
        } else {
          note.textContent = "Barvu gangu se nepodařilo uložit na server.";
        }
      }
      return false;
    }

    return true;
  }

  function applyStructureSelection(choice, options = {}) {
    if (!choice || !grid) return;
    const shouldConfirmSelection = options?.confirm !== false;
    grid.querySelectorAll(".structure-card").forEach((btn) => {
      btn.classList.toggle("structure-card--active", btn.dataset.structure === choice);
    });
    const activeButton = grid.querySelector(`.structure-card[data-structure="${choice}"]`);
    if (activeButton) {
      const activeButtonStyles = window.getComputedStyle(activeButton);
      const accent = activeButtonStyles.getPropertyValue("--structure-accent").trim();
      const accentSoft = activeButtonStyles.getPropertyValue("--structure-accent-soft").trim();
      const accentAlt = activeButtonStyles.getPropertyValue("--structure-accent-alt").trim();
      if (accent) {
        if (detail) detail.style.setProperty("--faction-accent", accent);
        if (factionShell) factionShell.style.setProperty("--faction-accent", accent);
      }
      if (accentSoft) {
        if (detail) detail.style.setProperty("--faction-accent-soft", accentSoft);
        if (factionShell) factionShell.style.setProperty("--faction-accent-soft", accentSoft);
      }
      if (accentAlt) {
        if (detail) detail.style.setProperty("--faction-accent-alt", accentAlt);
        if (factionShell) factionShell.style.setProperty("--faction-accent-alt", accentAlt);
      }
    }
    selectedStructure = choice;
    localStorage.setItem(STRUCTURE_KEY, choice);
    if (shouldConfirmSelection) {
      selectionConfirmed.structure = true;
    }

    const availableAvatars = getAvailableAvatars();
    if (!availableAvatars.includes(selectedAvatar)) {
      selectedAvatar = null;
      selectionConfirmed.avatar = false;
      localStorage.removeItem(AVATAR_KEY);
    }

    renderAvatars();
    if (isLightboxOpen()) {
      if (selectedAvatar && availableAvatars.includes(selectedAvatar)) {
        openLightbox(selectedAvatar);
      } else {
        closeLightbox();
      }
    }

    const info = data[choice];
    if (info) {
      if (detail) detail.classList.add("is-active");
      if (title) title.textContent = info.title;
      if (desc) desc.textContent = info.desc;
      if (bonus) bonus.innerHTML = info.bonus;
    }
    updateContinueState();
    updateNote();
    if (authToken) {
      fetch(buildApiUrl("/players/structure"), {
        method: "POST",
        headers: {
          Authorization: `Bearer ${authToken}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ structure: choice })
      })
        .then((res) => res.json())
        .then((data) => {
          if (data?.token) {
            applyAuthToken(data.token);
          }
        })
        .catch(() => {});
    }
  }

  function applyAvatarSelection(src, options = {}) {
    if (!src || !avatarGrid) return;
    const shouldConfirmSelection = options?.confirm !== false;
    const availableAvatars = getAvailableAvatars();
    if (!availableAvatars.includes(src)) return;
    avatarGrid.querySelectorAll(".avatar-item").forEach((btn) => {
      btn.classList.toggle("is-selected", btn.dataset.avatar === src);
    });
    selectedAvatar = src;
    localStorage.setItem(AVATAR_KEY, src);
    if (shouldConfirmSelection) {
      selectionConfirmed.avatar = true;
    }
    updateContinueState();
    updateNote();
    if (options.openPreview) {
      openLightbox(src);
    }
  }

  function normalizeMarqueeLoop() {
    if (!marquee || marqueeLoopWidth <= 0) return;
    while (marquee.scrollLeft >= marqueeLoopWidth) {
      marquee.scrollLeft -= marqueeLoopWidth;
    }
    while (marquee.scrollLeft < 0) {
      marquee.scrollLeft += marqueeLoopWidth;
    }
  }

  function updateMarqueeLoopWidth() {
    if (!marquee) return;
    marqueeLoopWidth = isCoarsePointer ? 0 : marquee.scrollWidth / 2;
    normalizeMarqueeLoop();
  }

  function renderAvatars() {
    if (!avatarGrid) return;
    const availableAvatars = getAvailableAvatars();
    if (!availableAvatars.length) {
      avatarGrid.innerHTML = '<div class="avatar-track__hint">Nejdřív vyber frakci. Pak se zobrazí její avatary.</div>';
      marqueeLoopWidth = 0;
      if (isLightboxOpen()) closeLightbox();
      return;
    }
    const looped = isCoarsePointer ? availableAvatars : availableAvatars.concat(availableAvatars);
    const imageLoading = isCoarsePointer ? "eager" : "lazy";
    avatarGrid.innerHTML = looped
      .map((src) => `
        <button class="avatar-item" data-avatar="${src}" aria-label="Vybrat avatara">
          <img src="${src}" alt="Avatar" loading="${imageLoading}" />
        </button>
      `)
      .join("");

    avatarGrid.querySelectorAll(".avatar-item").forEach((item) => {
      const src = item.dataset.avatar;
      if (src && src === selectedAvatar) item.classList.add("is-selected");
      if (!isCoarsePointer) {
        item.addEventListener("mouseenter", () => {
          if (src) {
            const existing = document.getElementById("avatar-hover-preview");
            if (existing) existing.remove();
            const preview = document.createElement("div");
            preview.id = "avatar-hover-preview";
            preview.className = "avatar-hover-preview";
            const img = document.createElement("img");
            img.src = src;
            img.alt = "Avatar preview";
            preview.appendChild(img);
            document.body.appendChild(preview);
          }
        });
        item.addEventListener("mouseleave", () => {
          const existing = document.getElementById("avatar-hover-preview");
          if (existing) existing.remove();
        });
      }
      item.addEventListener("click", (event) => {
        if (isCoarsePointer && marqueeTouchState.moved) {
          event.preventDefault();
          return;
        }
        applyAvatarSelection(src, { openPreview: true });
      });
    });
    if (marquee) marquee.scrollLeft = 0;
    updateMarqueeLoopWidth();
    updateLightboxNavigation();
  }

  renderGangColorOptions();

  if (grid) {
    grid.querySelectorAll(".structure-card").forEach((card) => {
      const selectCard = () => applyStructureSelection(card.dataset.structure);
      if (isCoarsePointer) {
        card.addEventListener("touchend", (event) => {
          event.preventDefault();
          const now = Date.now();
          const structure = card.dataset.structure;
          const isDoubleTap = mobileStructureTapState.structure === structure
            && (now - mobileStructureTapState.at) <= MOBILE_STRUCTURE_DOUBLE_TAP_MS;
          if (isDoubleTap) {
            mobileStructureTapState = { structure: null, at: 0 };
            selectCard();
            return;
          }
          mobileStructureTapState = { structure, at: now };
        }, { passive: false });
      } else {
        card.addEventListener("click", selectCard);
      }
    });
  }

  if (gangColorGrid) {
    gangColorGrid.querySelectorAll("[data-gang-color]").forEach((swatch) => {
      const selectColor = () => {
        void applyGangColorSelection(swatch.dataset.gangColor);
      };
      swatch.addEventListener("click", selectColor);
      swatch.addEventListener("touchend", (event) => {
        event.preventDefault();
        selectColor();
      }, { passive: false });
    });
  }

  renderAvatars();
  updateContinueState();
  updateNote();

  if (avatarLeft && avatarRight && avatarGrid && marquee) {
    const scrollByAmount = () => (marquee ? marquee.clientWidth * 0.6 : 220);
    const autoSpeedPxPerMs = 0.038;
    const mobileDriftPxPerMs = 0.009;
    let holdDirection = 0;
    let mobileDriftDirection = 1;
    let lastTime = 0;
    marquee.style.scrollBehavior = "auto";

    const step = (time) => {
      if (!marquee) return;
      if (!lastTime) lastTime = time;
      const delta = Math.min(34, Math.max(0, time - lastTime));
      lastTime = time;
      if (!hoverPause) {
        if (isCoarsePointer) {
          const maxScroll = Math.max(0, marquee.scrollWidth - marquee.clientWidth);
          if (maxScroll > 0) {
            if (marquee.scrollLeft <= 1) mobileDriftDirection = 1;
            if (marquee.scrollLeft >= maxScroll - 1) mobileDriftDirection = -1;
            marquee.scrollLeft = Math.max(
              0,
              Math.min(maxScroll, marquee.scrollLeft + mobileDriftDirection * mobileDriftPxPerMs * delta)
            );
          }
        } else if (marqueeLoopWidth > 0) {
          const speed = holdDirection !== 0 ? holdDirection * autoSpeedPxPerMs * 5.2 : autoSpeedPxPerMs;
          marquee.scrollLeft += speed * delta;
          normalizeMarqueeLoop();
        }
      }
      requestAnimationFrame(step);
    };

    if (marquee) requestAnimationFrame(step);

    const startHold = (dir) => {
      holdDirection = dir;
    };
    const stopHold = () => {
      holdDirection = 0;
    };

    const jumpBy = (delta) => {
      if (!marquee) return;
      marquee.scrollLeft += delta;
      normalizeMarqueeLoop();
    };

    const jumpLeft = () => jumpBy(-scrollByAmount());
    const jumpRight = () => jumpBy(scrollByAmount());

    avatarLeft.addEventListener("click", jumpLeft);
    avatarRight.addEventListener("click", jumpRight);

    if (isCoarsePointer) {
      avatarLeft.addEventListener("touchend", (event) => {
        event.preventDefault();
        jumpLeft();
      }, { passive: false });
      avatarRight.addEventListener("touchend", (event) => {
        event.preventDefault();
        jumpRight();
      }, { passive: false });
    }
    window.addEventListener("resize", updateMarqueeLoopWidth);

    if (!isCoarsePointer) {
      marquee.addEventListener("mouseenter", () => {
        hoverPause = true;
      });
      marquee.addEventListener("mouseleave", () => {
        hoverPause = false;
        const existing = document.getElementById("avatar-hover-preview");
        if (existing) existing.remove();
      });
      avatarLeft.addEventListener("mousedown", () => startHold(-1));
      avatarRight.addEventListener("mousedown", () => startHold(1));
      document.addEventListener("mouseup", stopHold);
      avatarLeft.addEventListener("mouseleave", stopHold);
      avatarRight.addEventListener("mouseleave", stopHold);
    }

    if (isCoarsePointer && marquee) {
      marquee.addEventListener("touchstart", (event) => {
        const touch = event.touches[0];
        if (!touch) return;
        marqueeTouchState.active = true;
        marqueeTouchState.moved = false;
        marqueeTouchState.startX = touch.clientX;
        hoverPause = true;
      }, { passive: true });

      marquee.addEventListener("touchmove", (event) => {
        if (!marqueeTouchState.active) return;
        const touch = event.touches[0];
        if (!touch) return;
        if (Math.abs(touch.clientX - marqueeTouchState.startX) > 8) {
          marqueeTouchState.moved = true;
        }
      }, { passive: true });

      const endDrag = () => {
        marqueeTouchState.active = false;
        hoverPause = false;
        window.setTimeout(() => {
          marqueeTouchState.moved = false;
        }, 80);
      };

      marquee.addEventListener("touchend", endDrag);
      marquee.addEventListener("touchcancel", endDrag);
    }
  }

  if (selectedStructure) {
    applyStructureSelection(selectedStructure, { confirm: false });
  }

  if (selectedAvatar) {
    applyAvatarSelection(selectedAvatar, { confirm: false });
  }

  if (selectedGangColor) {
    void applyGangColorSelection(selectedGangColor, {
      confirm: false,
      silent: true,
      forceServerSync: Boolean(authToken)
    });
  } else if (gangColorValue) {
    gangColorValue.textContent = "Nevybráno";
    gangColorValue.style.color = "";
  }

  if (lightboxBackdrop) {
    lightboxBackdrop.addEventListener("click", closeLightbox);
  }

  if (lightboxClose) {
    lightboxClose.addEventListener("click", (event) => {
      event.preventDefault();
      event.stopPropagation();
      closeLightbox();
    });
    lightboxClose.addEventListener("touchend", (event) => {
      event.preventDefault();
      event.stopPropagation();
      closeLightbox();
    }, { passive: false });
  }

  if (lightboxPrev) {
    lightboxPrev.addEventListener("click", (event) => {
      event.stopPropagation();
      shiftLightboxAvatar(-1);
    });
    lightboxPrev.addEventListener("touchend", (event) => {
      event.preventDefault();
      event.stopPropagation();
      shiftLightboxAvatar(-1);
    }, { passive: false });
  }

  if (lightboxNext) {
    lightboxNext.addEventListener("click", (event) => {
      event.stopPropagation();
      shiftLightboxAvatar(1);
    });
    lightboxNext.addEventListener("touchend", (event) => {
      event.preventDefault();
      event.stopPropagation();
      shiftLightboxAvatar(1);
    }, { passive: false });
  }

  if (lightboxConfirm) {
    lightboxConfirm.addEventListener("click", (event) => {
      event.preventDefault();
      event.stopPropagation();
      closeLightbox();
    });
    lightboxConfirm.addEventListener("touchend", (event) => {
      event.preventDefault();
      event.stopPropagation();
      closeLightbox();
    }, { passive: false });
  }

  if (lightbox) {
    lightbox.addEventListener("click", (event) => {
      if (event.target === lightbox) closeLightbox();
    });
  }

  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape") {
      closeLightbox();
      return;
    }
    if (!isLightboxOpen()) return;
    if (event.key === "ArrowLeft") {
      event.preventDefault();
      shiftLightboxAvatar(-1);
    }
    if (event.key === "ArrowRight") {
      event.preventDefault();
      shiftLightboxAvatar(1);
    }
  });

  if (goGame) {
    goGame.href = resolveGameEntryHref(currentMode);
    goGame.addEventListener("click", async (event) => {
      if (
        !selectedStructure
        || !selectedAvatar
        || !selectedGangColor
        || !selectionConfirmed.structure
        || !selectionConfirmed.avatar
        || !selectionConfirmed.gangColor
      ) {
        event.preventDefault();
        updateNote();
        return;
      }
      event.preventDefault();
      if (authToken) {
        await applyGangColorSelection(selectedGangColor, {
          forceServerSync: true
        });
      }
      const targetHref = String(goGame.getAttribute("href") || resolveGameEntryHref(currentMode));
      window.location.href = targetHref;
    });
  }

  if (backToLogin) {
    backToLogin.href = window.Empire?.getGameModeUrl?.("login", currentMode) || `/login.html?mode=${currentMode}`;
  }
});



