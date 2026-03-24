document.addEventListener("DOMContentLoaded", () => {
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

  const token = localStorage.getItem("empire_token");

  const grid = document.getElementById("structure-grid");
  const note = document.getElementById("structure-note");
  const detail = document.getElementById("faction-detail");
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
  const lightboxBackdrop = document.querySelector("#avatar-lightbox .avatar-lightbox__backdrop");
  const isCoarsePointer = window.matchMedia("(pointer: coarse)").matches;
  const marquee = avatarGrid?.closest(".avatar-marquee") || null;

  let selectedStructure = localStorage.getItem("empire_structure");
  let selectedAvatar = localStorage.getItem("empire_avatar");
  let selectedGangColor = localStorage.getItem("empire_gang_color");
  let hoverPause = false;
  let marqueeTouchState = {
    active: false,
    moved: false,
    startX: 0
  };
  let marqueeLoopWidth = 0;

  const allAvatars = [
    "../img/avatars/grok_image_1773615281856.jpg",
    "../img/avatars/grok_image_1773615288781.jpg",
    "../img/avatars/grok_image_1773615384205.jpg",
    "../img/avatars/grok_image_1773615486819.jpg",
    "../img/avatars/grok_image_1773619750005.jpg",
    "../img/avatars/grok_image_1773619765153.jpg",
    "../img/avatars/grok_image_1773619828633.jpg",
    "../img/avatars/grok_image_1773619862866.jpg",
    "../img/avatars/grok_image_1773619917189.jpg",
    "../img/avatars/grok_image_1773619952518.jpg",
    "../img/avatars/grok_image_1773620275790.jpg",
    "../img/avatars/grok_image_1773620278343.jpg",
    "../img/avatars/grok_image_1773620295724.jpg",
    "../img/avatars/grok_image_1773620311309.jpg",
    "../img/avatars/grok_image_1773620316935.jpg",
    "../img/avatars/grok_image_1773620321599.jpg",
    "../img/avatars/grok_image_1773620327962.jpg",
    "../img/avatars/grok_image_1773620346567.jpg",
    "../img/avatars/grok_image_1773620360803.jpg",
    "../img/avatars/grok_image_1773620382664.jpg",
    "../img/avatars/grok_image_1773620392440.jpg",
    "../img/avatars/grok_image_1773620407010.jpg",
    "../img/avatars/grok_image_1773620423483.jpg",
    "../img/avatars/grok_image_1773620455448.jpg",
    "../img/avatars/grok_image_1773620518258.jpg",
    "../img/avatars/grok_image_1773620582542.jpg",
    "../img/avatars/grok_image_1773620589955.jpg",
    "../img/avatars/grok_image_1773620608055.jpg",
    "../img/avatars/grok_image_1773620615836.jpg",
    "../img/avatars/grok_image_1773620629687.jpg",
    "../img/avatars/grok_image_1773620667715.jpg",
    "../img/avatars/grok_image_1773620689157.jpg",
    "../img/avatars/grok_image_1773620695952.jpg",
    "../img/avatars/grok_image_1773620705790.jpg",
    "../img/avatars/grok_image_1773620711786.jpg",
    "../img/avatars/grok_image_1773620750382.jpg",
    "../img/avatars/grok_image_1773620768402.jpg",
    "../img/avatars/grok_image_1773620817709.jpg",
    "../img/avatars/grok_image_1773620842831.jpg",
    "../img/avatars/grok_image_1773620914229.jpg",
    "../img/avatars/grok_image_1773620941001.jpg",
    "../img/avatars/grok_image_1773620945005.jpg",
    "../img/avatars/grok_image_1773620993530.jpg",
    "../img/avatars/grok_image_1773621033620.jpg",
    "../img/avatars/grok_image_1773621108270.jpg",
    "../img/avatars/grok_image_1773621117526.jpg",
    "../img/avatars/grok_image_1773621173474.jpg",
    "../img/avatars/grok_image_1773621230721.jpg",
    "../img/avatars/grok_image_1773621252715.jpg",
    "../img/avatars/grok_image_1773621293469.jpg",
    "../img/avatars/grok_image_1773621379927.jpg",
    "../img/avatars/grok_image_1773621424855.jpg",
    "../img/avatars/grok_image_1773621498552.jpg",
    "../img/avatars/grok_image_1773621517655.jpg",
    "../img/avatars/grok_image_1773621797044.jpg",
    "../img/avatars/grok_image_1773621839967.jpg",
    "../img/avatars/grok_image_1773621943105.jpg",
    "../img/avatars/grok_image_1773622258558.jpg",
    "../img/avatars/grok_image_1773622270979.jpg"
  ];

  const data = {
    "mafián": {
      title: "Mafián",
      desc:
        "Tradiční zločinecká rodina, která ovládá podniky, bary a noční kluby. Jejich síla je v penězích, kontaktech a dlouhodobé kontrole území.",
      bonus: "💰 Protection Network  podniky v jejich sektorech generují +25 % více peněz."
    },
    "kartel": {
      title: "🌴 Kartel",
      desc:
        "Obrovská pašerácká síť, která kontroluje nelegální obchod a drogy. Kartely vydělávají obrovské množství peněz z černého trhu.",
      bonus: "📦 Smuggling Routes  pasivní příjem z černého trhu každou herní hodinu."
    },
    "pouliční gang": {
      title: "🔫 Pouliční gang",
      desc:
        "Agresivní gangy z ulic, které rychle zabírají nové čtvrti. Nemají velkou organizaci, ale jejich počet je obrovský.",
      bonus: "🚀 Street Takeover  obsazování sektorů je o 30 % rychlejší."
    },
    "tajná organizace": {
      title: "🕶 Tajná organizace",
      desc:
        "Stínová skupina manipulující události ve městě z pozadí. Používají špionáž, sabotáž a politický vliv.",
      bonus: "🧠 Shadow Control  mohou převzít oslabený sektor bez přímého útoku."
    },
    "hackeři": {
      title: "💻 Hackeři",
      desc:
        "Digitální kriminálníci, kteří ovládají infrastrukturu města. Hackují banky, systémy i nepřátelské gangy.",
      bonus: "💻 System Breach  mohou krást peníze nebo vypnout sektor na určitou dobu."
    },
    "motorkářský gang": {
      title: "🏍 Motorkářský gang",
      desc:
        "Nomádští jezdci, kteří kontrolují silnice a průmyslové oblasti. Jsou rychlí, agresivní a těžko se chytají.",
      bonus: "🏁 Road Dominance  jednotky se pohybují po mapě o 35 % rychleji."
    },
    "soukromá armáda": {
      title: "🎖 Soukromá armáda",
      desc:
        "Elitní žoldáci s vojenským výcvikem a moderním vybavením. Dražší, ale extrémně efektivní.",
      bonus: "🛡 Elite Training  jednotky mají nejvyšší obranu ve hře."
    },
    "korporace": {
      title: "🏢 Korporace",
      desc:
        "Megakorporace, které ovládají město pomocí peněz, investic a korupce. Válku vyhrávají ekonomicky.",
      bonus: "📈 Corporate Buyout  mohou koupit oslabený sektor místo útoku."
    }
  };

  const factionOrder = [
    "mafián",
    "kartel",
    "pouliční gang",
    "tajná organizace",
    "hackeři",
    "motorkářský gang",
    "soukromá armáda",
    "korporace"
  ];

  const gangColorOptions = [
    { name: "Červená", value: "#ef4444" },
    { name: "Modrá", value: "#3b82f6" },
    { name: "Zelená", value: "#22c55e" },
    { name: "Žlutá", value: "#eab308" },
    { name: "Oranžová", value: "#f97316" },
    { name: "Fialová", value: "#8b5cf6" },
    { name: "Růžová", value: "#ec4899" },
    { name: "Tyrkysová", value: "#14b8a6" },
    { name: "Azurová", value: "#06b6d4" },
    { name: "Purpurová", value: "#a21caf" },
    { name: "Vínová", value: "#7f1d1d" },
    { name: "Olivová", value: "#6b8e23" },
    { name: "Limetková", value: "#84cc16" },
    { name: "Mentolová", value: "#a7f3d0" },
    { name: "Lososová", value: "#fa8072" },
    { name: "Korálová", value: "#ff7f50" },
    { name: "Zlatá", value: "#ffd700" },
    { name: "Stříbrná", value: "#c0c0c0" },
    { name: "Béžová", value: "#f5f5dc" },
    { name: "Hnědá", value: "#8b4513" },
    { name: "Černá", value: "#111111" },
    { name: "Bílá", value: "#ffffff" },
    { name: "Šedá", value: "#9ca3af" },
    { name: "Indigo", value: "#4f46e5" },
    { name: "Safírová", value: "#0f52ba" },
    { name: "Smaragdová", value: "#50c878" },
    { name: "Karmínová", value: "#dc143c" },
    { name: "Levandulová", value: "#e6e6fa" },
    { name: "Broskvová", value: "#ffdab9" },
    { name: "Antracitová", value: "#36454f" }
  ];
  const gangColorValueSet = new Set(gangColorOptions.map((item) => item.value));
  const gangColorByValue = new Map(gangColorOptions.map((item) => [item.value, item.name]));

  selectedGangColor = normalizeHexColor(selectedGangColor);
  if (selectedGangColor && !gangColorValueSet.has(selectedGangColor)) {
    selectedGangColor = null;
    localStorage.removeItem("empire_gang_color");
  }

  const factionAvatarPools = buildFactionAvatarPools(allAvatars, factionOrder, 10);

  function normalizeHexColor(value) {
    const raw = String(value || "").trim().toLowerCase();
    if (!raw) return null;
    if (/^#[0-9a-f]{3}$/.test(raw)) {
      return `#${raw[1]}${raw[1]}${raw[2]}${raw[2]}${raw[3]}${raw[3]}`;
    }
    if (/^#[0-9a-f]{6}$/.test(raw)) return raw;
    return null;
  }

  function buildFactionAvatarPools(avatarList, factionKeys, maxPerFaction) {
    const pools = {};
    const sanitized = Array.isArray(avatarList) ? avatarList.filter(Boolean) : [];
    const keys = Array.isArray(factionKeys) ? factionKeys.filter(Boolean) : [];
    if (!keys.length) return pools;
    const base = Math.floor(sanitized.length / keys.length);
    let remainder = sanitized.length % keys.length;
    let cursor = 0;

    keys.forEach((key) => {
      const desired = base + (remainder > 0 ? 1 : 0);
      const take = Math.min(maxPerFaction, desired);
      pools[key] = sanitized.slice(cursor, cursor + take);
      cursor += take;
      if (remainder > 0) remainder -= 1;
    });

    return pools;
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
    if (selectedStructure && selectedAvatar && selectedGangColor) {
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
    if (selectedStructure && selectedAvatar && selectedGangColor) {
      note.textContent = `Vybráno: ${selectedStructure} • ${resolveGangColorName(selectedGangColor)} • avatar.`;
      return;
    }
    const missing = [];
    if (!selectedStructure) missing.push("frakci");
    if (!selectedGangColor) missing.push("barvu gangu");
    if (!selectedAvatar) missing.push("avatara");
    note.textContent = `Chybí vybrat: ${missing.join(", ")}.`;
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

  function openLightbox(src) {
    if (!lightbox || !lightboxImg) return;
    lightboxImg.src = src;
    if (lightboxCaption) {
      lightboxCaption.textContent = getAvatarLabel(src);
    }
    lightbox.classList.remove("hidden");
  }

  function closeLightbox() {
    if (!lightbox) return;
    lightbox.classList.add("hidden");
  }

  function applyGangColorSelection(color) {
    const normalized = normalizeHexColor(color);
    if (!normalized || !gangColorValueSet.has(normalized)) return;
    selectedGangColor = normalized;
    localStorage.setItem("empire_gang_color", normalized);
    if (gangColorGrid) {
      gangColorGrid.querySelectorAll("[data-gang-color]").forEach((button) => {
        const buttonColor = normalizeHexColor(button.dataset.gangColor);
        button.classList.toggle("is-selected", buttonColor === normalized);
      });
    }
    if (gangColorValue) {
      const colorName = resolveGangColorName(normalized);
      gangColorValue.textContent = `${colorName} (${normalized.toUpperCase()})`;
      gangColorValue.style.color = normalized;
    }
    updateContinueState();
    updateNote();
  }

  function applyStructureSelection(choice) {
    if (!choice || !grid) return;
    grid.querySelectorAll(".structure-card").forEach((btn) => {
      btn.classList.toggle("structure-card--active", btn.dataset.structure === choice);
    });
    selectedStructure = choice;
    localStorage.setItem("empire_structure", choice);

    const availableAvatars = getAvailableAvatars();
    if (!availableAvatars.includes(selectedAvatar)) {
      selectedAvatar = null;
      localStorage.removeItem("empire_avatar");
    }

    renderAvatars();

    const info = data[choice];
    if (info) {
      if (detail) detail.classList.add("is-active");
      if (title) title.textContent = info.title;
      if (desc) desc.textContent = info.desc;
      if (bonus) bonus.textContent = info.bonus;
    }
    updateContinueState();
    updateNote();
    if (token) {
      fetch("http://localhost:3000/players/structure", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ structure: choice })
      })
        .then((res) => res.json())
        .then((data) => {
          if (data?.token) {
            localStorage.setItem("empire_token", data.token);
          }
        })
        .catch(() => {});
    }
  }

  function applyAvatarSelection(src, options = {}) {
    if (!src || !avatarGrid) return;
    const availableAvatars = getAvailableAvatars();
    if (!availableAvatars.includes(src)) return;
    avatarGrid.querySelectorAll(".avatar-item").forEach((btn) => {
      btn.classList.toggle("is-selected", btn.dataset.avatar === src);
    });
    selectedAvatar = src;
    localStorage.setItem("empire_avatar", src);
    updateContinueState();
    updateNote();
    if (options.openPreview && !isCoarsePointer) {
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
          hoverPause = true;
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
          hoverPause = false;
          const existing = document.getElementById("avatar-hover-preview");
          if (existing) existing.remove();
        });
      }
      item.addEventListener("click", (event) => {
        if (isCoarsePointer && marqueeTouchState.moved) {
          event.preventDefault();
          return;
        }
        applyAvatarSelection(src, { openPreview: !isCoarsePointer });
      });
    });
    if (marquee) marquee.scrollLeft = 0;
    updateMarqueeLoopWidth();
  }

  renderGangColorOptions();

  if (grid) {
    grid.querySelectorAll(".structure-card").forEach((card) => {
      const selectCard = () => applyStructureSelection(card.dataset.structure);
      card.addEventListener("click", selectCard);
      card.addEventListener("touchend", (event) => {
        event.preventDefault();
        selectCard();
      }, { passive: false });
    });
  }

  if (gangColorGrid) {
    gangColorGrid.querySelectorAll("[data-gang-color]").forEach((swatch) => {
      const selectColor = () => applyGangColorSelection(swatch.dataset.gangColor);
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

    avatarLeft.addEventListener("click", () => jumpBy(-scrollByAmount()));
    avatarRight.addEventListener("click", () => jumpBy(scrollByAmount()));
    window.addEventListener("resize", updateMarqueeLoopWidth);

    if (!isCoarsePointer) {
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
    applyStructureSelection(selectedStructure);
  }

  if (selectedAvatar) {
    applyAvatarSelection(selectedAvatar);
  }

  if (selectedGangColor) {
    applyGangColorSelection(selectedGangColor);
  } else if (gangColorValue) {
    gangColorValue.textContent = "Nevybráno";
    gangColorValue.style.color = "";
  }

  if (lightboxBackdrop) {
    lightboxBackdrop.addEventListener("click", closeLightbox);
  }

  if (lightbox) {
    lightbox.addEventListener("click", (event) => {
      if (event.target === lightbox) closeLightbox();
    });
  }

  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape") closeLightbox();
  });

  if (goGame) {
    goGame.addEventListener("click", (event) => {
      if (!selectedStructure || !selectedAvatar || !selectedGangColor) {
        event.preventDefault();
      }
    });
  }
});
