window.Empire = window.Empire || {};

window.Empire.Map = (() => {
  const state = {
    canvas: null,
    ctx: null,
    tooltip: null,
    modal: null,
    districts: [],
    roads: [],
    hoverId: null,
    selectedId: null,
    scale: 1,
    offsetX: 0,
    offsetY: 0,
    isPanning: false,
    panStart: { x: 0, y: 0 },
    viewStart: { x: 0, y: 0 },
    mapImage: null,
    mapSize: { width: 1400, height: 900 }
  };

  const parkImages = [
    "../img/park/u6568429269_abandoned_cyberpunk_city_park_at_night_overgrown__cd9ea708-7c9a-4e69-b5be-3a6fef6c66f8_0.png",
    "../img/park/u6568429269_ultra_realistic_cyberpunk_city_park_at_night_neon_917cc19e-b454-41b6-94aa-86d5b38f751f_0.png",
    "../img/park/u6568429269_ultra_realistic_cyberpunk_city_park_at_night_neon_917cc19e-b454-41b6-94aa-86d5b38f751f_2.png",
    "../img/park/u6568429269_ultra_realistic_cyberpunk_city_park_at_night_neon_917cc19e-b454-41b6-94aa-86d5b38f751f_3.png",
    "../img/park/u6568429269_ultra_realistic_cyberpunk_park_in_the_middle_of_a_1bcdf12d-0e40-43da-8917-5671e6fdafc6_0.png",
    "../img/park/u6568429269_ultra_realistic_cyberpunk_park_in_the_middle_of_a_bba7cad8-8fa0-45eb-8f08-b10ca754da9f_3.png",
    "../img/park/u6568429269_ultra_realistic_cyberpunk_park_in_the_middle_of_a_ca05a4a0-8207-478c-a7fb-2e315210fa60_2.png",
    "../img/park/u6568429269_ultra_realistic_cyberpunk_park_in_the_middle_of_a_cfb7f673-84fa-469c-8158-40911aae18a6_0.png",
    "../img/park/u6568429269_ultra_realistic_cyberpunk_underground_city_park_h_6cc910b5-951d-4778-96c4-33ce2a4b2d96_0.png",
    "../img/park/u6568429269_ultra_realistic_cyberpunk_underground_city_park_h_6cc910b5-951d-4778-96c4-33ce2a4b2d96_2.png",
    "../img/park/u6568429269_ultra_realistic_cyberpunk_underground_city_park_h_da845c2d-83a4-4e5e-927d-fbab08a2e6f2_0.png",
    "../img/park/u6568429269_ultra_realistic_futuristic_cyberpunk_city_park_at_4e6e39a1-7ff7-4445-9365-b559a33df0ba_0.png"
  ];

  const downtownImages = [
    "../img/downtown/u6568429269_ultra_realistic_cyberpunk_downtown_district_at_ni_84a7bf7c-e03a-420b-9857-c421d73f33a8_1.png",
    "../img/downtown/u6568429269_ultra_realistic_cyberpunk_luxury_commercial_distr_dc550711-88c1-45c7-8ddb-316de1b5fd2a_3.png",
    "../img/downtown/u6568429269_ultra_realistic_futuristic_cyberpunk_corporate_co_97954e9e-ca7b-408f-900d-96dcfa46b674_1.png",
    "../img/downtown/u6568429269_ultra_realistic_futuristic_cyberpunk_corporate_co_97954e9e-ca7b-408f-900d-96dcfa46b674_2.png",
    "../img/downtown/u6568429269_ultra_realistic_futuristic_cyberpunk_corporate_co_97954e9e-ca7b-408f-900d-96dcfa46b674_3.png",
    "../img/downtown/u6568429269_ultra_realistic_futuristic_cyberpunk_downtown_pla_9fd803d9-f679-43c7-b791-40f5f958e092_0.png",
    "../img/downtown/u6568429269_ultra_realistic_futuristic_cyberpunk_downtown_pla_9fd803d9-f679-43c7-b791-40f5f958e092_2.png",
    "../img/downtown/u6568429269_ultra_realistic_futuristic_cyberpunk_downtown_pla_c8027657-4880-4137-acb3-a6b8ac44d0ff_1.png",
    "../img/downtown/u6568429269_ultra_realistic_futuristic_cyberpunk_downtown_pla_c8027657-4880-4137-acb3-a6b8ac44d0ff_2.png",
    "../img/downtown/u6568429269_ultra_realistic_futuristic_cyberpunk_downtown_pla_c8027657-4880-4137-acb3-a6b8ac44d0ff_3.png"
  ];

  const commercialImages = [
    "../img/commercial/u6568429269_ultra_realistic_crowded_cyberpunk_downtown_street_bf83567e-d1a3-4c69-a7d5-a3fb1424a11e_1.png",
    "../img/commercial/u6568429269_ultra_realistic_cyberpunk_commercial_district_at__0bcf500a-879b-4a0d-a670-0b6c262016e7_0.png",
    "../img/commercial/u6568429269_ultra_realistic_cyberpunk_commercial_district_at__0bcf500a-879b-4a0d-a670-0b6c262016e7_2.png",
    "../img/commercial/u6568429269_ultra_realistic_cyberpunk_commercial_district_at__0bcf500a-879b-4a0d-a670-0b6c262016e7_3.png",
    "../img/commercial/u6568429269_ultra_realistic_cyberpunk_low-income_residential__915a91cd-d3c4-4f62-a2b5-9fa9aaeae2f6_3.png",
    "../img/commercial/u6568429269_ultra_realistic_cyberpunk_luxury_commercial_distr_b75e77b8-4c90-473c-95c0-ba4c6c1456eb_0.png",
    "../img/commercial/u6568429269_ultra_realistic_cyberpunk_luxury_commercial_distr_b75e77b8-4c90-473c-95c0-ba4c6c1456eb_1.png",
    "../img/commercial/u6568429269_ultra_realistic_cyberpunk_luxury_commercial_distr_b75e77b8-4c90-473c-95c0-ba4c6c1456eb_2.png",
    "../img/commercial/u6568429269_ultra_realistic_cyberpunk_luxury_commercial_distr_b75e77b8-4c90-473c-95c0-ba4c6c1456eb_3.png",
    "../img/commercial/u6568429269_ultra_realistic_cyberpunk_luxury_commercial_distr_dc550711-88c1-45c7-8ddb-316de1b5fd2a_1.png",
    "../img/commercial/u6568429269_ultra_realistic_cyberpunk_luxury_commercial_distr_dc550711-88c1-45c7-8ddb-316de1b5fd2a_2.png",
    "../img/commercial/u6568429269_ultra_realistic_cyberpunk_residential_district_at_ebf246bf-a944-47da-9d77-35cd0c8cb70f_3.png",
    "../img/commercial/u6568429269_ultra_realistic_futuristic_cyberpunk_corporate_co_32d9d42c-9397-4a7a-b58a-1d29d6a49940_1.png",
    "../img/commercial/u6568429269_ultra_realistic_futuristic_cyberpunk_corporate_co_32d9d42c-9397-4a7a-b58a-1d29d6a49940_3.png",
    "../img/commercial/u6568429269_ultra_realistic_futuristic_cyberpunk_downtown_pla_c8027657-4880-4137-acb3-a6b8ac44d0ff_3.png"
  ];

  const residentialImages = [
    "../img/residental/u6568429269_ultra_realistic_cyberpunk_low-income_residential__915a91cd-d3c4-4f62-a2b5-9fa9aaeae2f6_0.png",
    "../img/residental/u6568429269_ultra_realistic_cyberpunk_low-income_residential__915a91cd-d3c4-4f62-a2b5-9fa9aaeae2f6_1.png",
    "../img/residental/u6568429269_ultra_realistic_cyberpunk_low-income_residential__915a91cd-d3c4-4f62-a2b5-9fa9aaeae2f6_2.png",
    "../img/residental/u6568429269_ultra_realistic_cyberpunk_low-income_residential__915a91cd-d3c4-4f62-a2b5-9fa9aaeae2f6_3.png",
    "../img/residental/u6568429269_ultra_realistic_cyberpunk_residential_district_at_43c96961-b974-45bc-be97-11174e6e52f3_0.png",
    "../img/residental/u6568429269_ultra_realistic_cyberpunk_residential_district_at_43c96961-b974-45bc-be97-11174e6e52f3_1.png",
    "../img/residental/u6568429269_ultra_realistic_cyberpunk_residential_district_at_43c96961-b974-45bc-be97-11174e6e52f3_2.png",
    "../img/residental/u6568429269_ultra_realistic_cyberpunk_residential_district_at_43c96961-b974-45bc-be97-11174e6e52f3_3.png",
    "../img/residental/u6568429269_ultra_realistic_cyberpunk_residential_district_at_ebf246bf-a944-47da-9d77-35cd0c8cb70f_0.png",
    "../img/residental/u6568429269_ultra_realistic_cyberpunk_residential_district_at_ebf246bf-a944-47da-9d77-35cd0c8cb70f_1.png",
    "../img/residental/u6568429269_ultra_realistic_cyberpunk_residential_district_at_ebf246bf-a944-47da-9d77-35cd0c8cb70f_2.png",
    "../img/residental/u6568429269_ultra_realistic_cyberpunk_residential_district_wi_cffdadea-d0bc-4bb6-b888-64e83e9d1a03_1.png",
    "../img/residental/u6568429269_ultra_realistic_cyberpunk_residential_district_wi_cffdadea-d0bc-4bb6-b888-64e83e9d1a03_3.png",
    "../img/residental/u6568429269_ultra_realistic_futuristic_cyberpunk_residential__f7a77fe8-ab6b-4dda-9a87-ce74f484cba5_0.png",
    "../img/residental/u6568429269_ultra_realistic_futuristic_cyberpunk_residential__f7a77fe8-ab6b-4dda-9a87-ce74f484cba5_1.png",
    "../img/residental/u6568429269_ultra_realistic_futuristic_cyberpunk_residential__f7a77fe8-ab6b-4dda-9a87-ce74f484cba5_2.png",
    "../img/residental/u6568429269_ultra_realistic_futuristic_cyberpunk_residential__f7a77fe8-ab6b-4dda-9a87-ce74f484cba5_3.png"
  ];

  const industrialImages = [
    "../img/industrial/u6568429269_abandoned_cyberpunk_industrial_district_rusted_fa_ffa1ef94-6abe-4ea8-8522-43d3820a31a1_1.png",
    "../img/industrial/u6568429269_abandoned_cyberpunk_industrial_district_rusted_fa_ffa1ef94-6abe-4ea8-8522-43d3820a31a1_2.png",
    "../img/industrial/u6568429269_abandoned_cyberpunk_industrial_district_rusted_fa_ffa1ef94-6abe-4ea8-8522-43d3820a31a1_3.png",
    "../img/industrial/u6568429269_ultra_realistic_cyberpunk_industrial_district_at__4d2b0b70-40d2-409a-9c48-f1e775e647a0_0.png",
    "../img/industrial/u6568429269_ultra_realistic_cyberpunk_industrial_district_at__4d2b0b70-40d2-409a-9c48-f1e775e647a0_1.png",
    "../img/industrial/u6568429269_ultra_realistic_cyberpunk_industrial_district_at__4d2b0b70-40d2-409a-9c48-f1e775e647a0_2.png",
    "../img/industrial/u6568429269_ultra_realistic_cyberpunk_industrial_district_at__4d2b0b70-40d2-409a-9c48-f1e775e647a0_3.png",
    "../img/industrial/u6568429269_ultra_realistic_cyberpunk_industrial_harbor_distr_a663b49c-fa89-417d-b6c4-923679ae9fe7_1.png",
    "../img/industrial/u6568429269_ultra_realistic_cyberpunk_industrial_harbor_distr_a663b49c-fa89-417d-b6c4-923679ae9fe7_2.png",
    "../img/industrial/u6568429269_ultra_realistic_cyberpunk_industrial_harbor_distr_a663b49c-fa89-417d-b6c4-923679ae9fe7_3.png",
    "../img/industrial/u6568429269_ultra_realistic_futuristic_cyberpunk_industrial_c_a28bf0fd-ad5d-4eb8-bcb5-1ae5d11fc967_0.png",
    "../img/industrial/u6568429269_ultra_realistic_futuristic_cyberpunk_industrial_c_a28bf0fd-ad5d-4eb8-bcb5-1ae5d11fc967_1.png",
    "../img/industrial/u6568429269_ultra_realistic_futuristic_cyberpunk_industrial_c_a28bf0fd-ad5d-4eb8-bcb5-1ae5d11fc967_2.png",
    "../img/industrial/u6568429269_ultra_realistic_futuristic_cyberpunk_industrial_c_a28bf0fd-ad5d-4eb8-bcb5-1ae5d11fc967_3.png"
  ];

  function init() {
    state.canvas = document.getElementById("city-map");
    state.tooltip = document.getElementById("map-tooltip");
    if (!state.canvas) return;
    state.ctx = state.canvas.getContext("2d");

    loadMapImage();
    generateCity();
    initModal();
    bindEvents();
    resizeCanvas();
  }

  function generateCity() {
    const seed = "empire-city-v1";
    const width = state.mapSize.width;
    const height = state.mapSize.height;
    const districtCount = 130;
    const city = window.Empire.CityGen.generate({ seed, width, height, districtCount });
    const enrichedDistricts = window.Empire.UI?.assignDistrictMetadata
      ? window.Empire.UI.assignDistrictMetadata(city.districts)
      : city.districts;
    state.districts = enrichedDistricts;
    state.roads = city.roads;
    window.Empire.districts = enrichedDistricts;
  }

  function bindEvents() {
    state.canvas.addEventListener("mousemove", onMouseMove);
    state.canvas.addEventListener("mouseleave", onMouseLeave);
    state.canvas.addEventListener("mousedown", onMouseDown);
    state.canvas.addEventListener("mouseup", onMouseUp);
    state.canvas.addEventListener("wheel", onWheel, { passive: false });
    window.addEventListener("resize", resizeCanvas);
  }

  function resizeCanvas() {
    const rect = state.canvas.getBoundingClientRect();
    state.canvas.width = rect.width * window.devicePixelRatio;
    state.canvas.height = rect.height * window.devicePixelRatio;
    state.ctx.setTransform(window.devicePixelRatio, 0, 0, window.devicePixelRatio, 0, 0);
    const minScale = Math.max(
      rect.width / state.mapSize.width,
      rect.height / state.mapSize.height
    );
    if (state.scale < minScale) state.scale = minScale;
    clampPan();
    render();
  }

  function toWorld(x, y) {
    return {
      x: (x - state.offsetX) / state.scale,
      y: (y - state.offsetY) / state.scale
    };
  }

  function onMouseMove(event) {
    if (state.isPanning) {
      const dx = event.clientX - state.panStart.x;
      const dy = event.clientY - state.panStart.y;
      state.offsetX = state.viewStart.x + dx;
      state.offsetY = state.viewStart.y + dy;
      clampPan();
      render();
      return;
    }

    const rect = state.canvas.getBoundingClientRect();
    const point = toWorld(event.clientX - rect.left, event.clientY - rect.top);
    const hovered = pickDistrict(point.x, point.y);
    state.hoverId = hovered ? hovered.id : null;
    updateTooltip(hovered, event.clientX, event.clientY);
    render();
  }

  function onMouseLeave() {
    state.hoverId = null;
    hideTooltip();
    render();
  }

  function onMouseDown(event) {
    if (event.button !== 0) return;
    state.isPanning = true;
    state.panStart = { x: event.clientX, y: event.clientY };
    state.viewStart = { x: state.offsetX, y: state.offsetY };
  }

  function onMouseUp(event) {
    if (event.button !== 0) return;
    const moved = Math.hypot(
      event.clientX - state.panStart.x,
      event.clientY - state.panStart.y
    );
    state.isPanning = false;
    if (moved > 6) return;

    const rect = state.canvas.getBoundingClientRect();
    const point = toWorld(event.clientX - rect.left, event.clientY - rect.top);
    const picked = pickDistrict(point.x, point.y);
    if (picked) {
      state.selectedId = picked.id;
      window.Empire.selectedDistrict = picked;
      showModal(picked);
      render();
    }
  }

  function onWheel(event) {
    event.preventDefault();
    const delta = -event.deltaY * 0.0015;
    const minScale = Math.max(
      state.canvas.width / window.devicePixelRatio / state.mapSize.width,
      state.canvas.height / window.devicePixelRatio / state.mapSize.height
    );
    const newScale = clamp(state.scale * (1 + delta), minScale, 2.5);

    const rect = state.canvas.getBoundingClientRect();
    const mx = event.clientX - rect.left;
    const my = event.clientY - rect.top;
    const worldBefore = toWorld(mx, my);

    state.scale = newScale;
    const worldAfter = toWorld(mx, my);

    state.offsetX += (worldAfter.x - worldBefore.x) * state.scale;
    state.offsetY += (worldAfter.y - worldBefore.y) * state.scale;
    clampPan();
    render();
  }

  function pickDistrict(x, y) {
    for (let i = 0; i < state.districts.length; i += 1) {
      const district = state.districts[i];
      if (pointInPolygon([x, y], district.polygon)) {
        return district;
      }
    }
    return null;
  }

  function pointInPolygon(point, polygon) {
    let inside = false;
    for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
      const xi = polygon[i][0];
      const yi = polygon[i][1];
      const xj = polygon[j][0];
      const yj = polygon[j][1];

      const intersect = yi > point[1] !== yj > point[1] &&
        point[0] < ((xj - xi) * (point[1] - yi)) / (yj - yi) + xi;

      if (intersect) inside = !inside;
    }
    return inside;
  }

  function render() {
    const ctx = state.ctx;
    const canvas = state.canvas;
    if (!ctx || !canvas) return;

    ctx.save();
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.translate(state.offsetX, state.offsetY);
    ctx.scale(state.scale, state.scale);

    drawBackground(ctx);
    drawDistricts(ctx);
    ctx.restore();
  }

  function drawBackground(ctx) {
    ctx.fillStyle = "#0b1119";
    ctx.fillRect(-2000, -2000, 6000, 6000);
    if (state.mapImage && state.mapImage.complete) {
      ctx.drawImage(state.mapImage, 0, 0, state.mapSize.width, state.mapSize.height);
    }
  }

  function drawDistricts(ctx) {
    state.districts.forEach((district) => {
      const fill = districtFill(district);
      ctx.fillStyle = fill;
      ctx.strokeStyle = "rgba(15,23,42,0.7)";
      ctx.lineWidth = 1;

      ctx.beginPath();
      district.polygon.forEach(([x, y], index) => {
        if (index === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      });
      ctx.closePath();
      ctx.fill();
      ctx.stroke();

      if (district.id === state.hoverId || district.id === state.selectedId) {
        ctx.strokeStyle = district.id === state.selectedId ? "#facc15" : "#38bdf8";
        ctx.lineWidth = 3;
        ctx.stroke();
      }
    });
  }

  function districtFill(district) {
    if (district.owner) return "rgba(34,197,94,0.35)";
    switch (district.type) {
      case "downtown":
        return "rgba(248,113,113,0.28)";
      case "industrial":
        return "rgba(148,163,184,0.28)";
      case "commercial":
        return "rgba(56,189,248,0.28)";
      case "park":
        return "rgba(34,197,94,0.22)";
      case "residential":
      default:
        return "rgba(253,186,116,0.24)";
    }
  }

  function updateDistrictGallery(district) {
    const gallery = document.getElementById("modal-park-gallery");
    const grid = document.getElementById("modal-park-images");
    const title = document.querySelector("#modal-park-gallery .modal__gallery-title");
    if (!gallery || !grid) return;

    if (!district) {
      gallery.classList.add("hidden");
      grid.innerHTML = "";
      return;
    }

    const imageSets = {
      park: { title: "Atmosféra parku", images: parkImages },
      downtown: { title: "Atmosféra downtownu", images: downtownImages },
      commercial: { title: "Atmosféra komerce", images: commercialImages },
      residential: { title: "Atmosféra rezidenční zóny", images: residentialImages },
      industrial: { title: "Atmosféra industriální zóny", images: industrialImages }
    };
    const set = imageSets[district.type];
    if (!set) {
      gallery.classList.add("hidden");
      grid.innerHTML = "";
      return;
    }

    const total = set.images.length;
    if (total === 0) {
      gallery.classList.add("hidden");
      return;
    }

    const seedSource = typeof district.id === "number"
      ? district.id
      : String(district.id || "")
        .split("")
        .reduce((sum, char) => sum + char.charCodeAt(0), 0);
    const picks = [set.images[seedSource % total]];
    if (title) title.textContent = set.title;

    grid.innerHTML = picks
      .map((src, index) => `
        <img src="${src}" alt="${set.title} ${index + 1}" loading="lazy" />
      `)
      .join("");
    gallery.classList.remove("hidden");
  }



  function polygonCentroid(poly) {
    let area = 0;
    let cx = 0;
    let cy = 0;
    const len = poly.length;
    for (let i = 0; i < len; i += 1) {
      const [x0, y0] = poly[i];
      const [x1, y1] = poly[(i + 1) % len];
      const a = x0 * y1 - x1 * y0;
      area += a;
      cx += (x0 + x1) * a;
      cy += (y0 + y1) * a;
    }
    area *= 0.5;
    if (Math.abs(area) < 1e-6) return [poly[0][0], poly[0][1]];
    return [cx / (6 * area), cy / (6 * area)];
  }

  function updateTooltip(district, clientX, clientY) {
    if (!state.tooltip) return;
    if (!district) {
      hideTooltip();
      return;
    }

    const buildingLine =
      Array.isArray(district.buildings) && district.buildings.length
        ? `
          <div class="map-tooltip__section">
            <div class="map-tooltip__label">Budovy</div>
            <div class="map-tooltip__tags">
              ${district.buildings.map((building) => `<span class="map-tooltip__tag">${building}</span>`).join("")}
            </div>
          </div>
        `
        : "";
    const setLine = district.buildingSetTitle
      ? `<div class="map-tooltip__section"><div class="map-tooltip__label">Set</div><div>${district.buildingSetTitle}</div></div>`
      : "";

    state.tooltip.classList.remove("hidden");
    state.tooltip.innerHTML = `
      <div class="map-tooltip__title">${district.name}</div>
      <div>Typ: ${district.type}</div>
      <div>Vlastník: ${district.owner || "Neobsazeno"}</div>
      <div>Příjem: $${district.income}/hod</div>
      <div>Vliv: ${district.influence}</div>
      ${setLine}
      ${buildingLine}
    `;
    state.tooltip.style.left = `${clientX + 12}px`;
    state.tooltip.style.top = `${clientY + 12}px`;
  }

  function hideTooltip() {
    if (!state.tooltip) return;
    state.tooltip.classList.add("hidden");
  }

  function applyUpdate(update) {
    if (!update || !Array.isArray(update.districts)) return;
    setDistricts(update.districts);
  }

  function setDistricts(districts) {
    if (!Array.isArray(districts) || districts.length < 1) return;
    let normalized = districts.map((district, index) => ({
      id: district.id,
      name: district.name || `${district.type} #${index + 1}`,
      type: district.type || "residential",
      owner: district.owner || null,
      influence: Number(district.influence || 0),
      income: Number(district.income || 0),
      polygon: district.polygon,
      buildings: Array.isArray(district.buildings) ? district.buildings : [],
      buildingTier: district.buildingTier || null,
      buildingSetKey: district.buildingSetKey || null,
      buildingSetTitle: district.buildingSetTitle || null
    }));

    if (window.Empire.UI?.assignDistrictMetadata) {
      normalized = window.Empire.UI.assignDistrictMetadata(normalized);
    }

    const hasPolygons = normalized.every((d) => Array.isArray(d.polygon));
    if (!hasPolygons) return;

    state.districts = normalized;
    state.roads = buildRoadNetworkFromDistricts(normalized);
    window.Empire.districts = normalized;
    render();
  }

  function initModal() {
    const root = document.getElementById("district-modal");
    const backdrop = document.getElementById("modal-backdrop");
    const closeBtn = document.getElementById("modal-close");
    if (!root) return;
    state.modal = { root, backdrop, closeBtn };
    if (backdrop) backdrop.addEventListener("click", hideModal);
    root.addEventListener("click", (event) => {
      if (event.target === root || event.target === backdrop) {
        hideModal();
      }
    });
    if (closeBtn) closeBtn.addEventListener("click", hideModal);
    document.addEventListener("keydown", (event) => {
      if (event.key === "Escape") hideModal();
      if (event.key === "Enter" && !state.modal?.root?.classList.contains("hidden")) {
        const attack = document.getElementById("attack-btn");
        if (attack) attack.click();
      }
    });
  }

  function showModal(district) {
    if (!state.modal?.root) return;
    document.getElementById("modal-name").textContent = district.name || "Distrikt";
    document.getElementById("modal-type").textContent = district.type || "-";
    document.getElementById("modal-owner").textContent = district.owner || "Neobsazeno";
    document.getElementById("modal-income").textContent = `$${district.income || 0}/hod`;
    document.getElementById("modal-influence").textContent = district.influence || 0;
    updateDistrictBuildings(district);
    updateDistrictGallery(district);
    state.modal.root.classList.remove("hidden");
  }

  function hideModal() {
    if (!state.modal?.root) return;
    state.modal.root.classList.add("hidden");
  }

  function updateDistrictBuildings(district) {
    const root = document.getElementById("modal-buildings");
    const title = document.getElementById("modal-buildings-title");
    const list = document.getElementById("modal-buildings-list");
    if (!root || !title || !list) return;

    const buildings = Array.isArray(district.buildings) ? district.buildings : [];
    if (!buildings.length) {
      root.classList.add("hidden");
      list.innerHTML = "";
      return;
    }

    title.textContent = district.buildingSetTitle
      ? `Budovy v distriktu • ${district.buildingSetTitle} (${district.buildingTier || "set"})`
      : "Budovy v distriktu";
    list.innerHTML = buildings
      .map((building) => `<div class="district-buildings__item">${building}</div>`)
      .join("");
    root.classList.remove("hidden");
  }

  function clampPan() {
    const viewW = state.canvas.width / window.devicePixelRatio;
    const viewH = state.canvas.height / window.devicePixelRatio;
    const mapW = state.mapSize.width * state.scale;
    const mapH = state.mapSize.height * state.scale;

    const minX = Math.min(0, viewW - mapW);
    const minY = Math.min(0, viewH - mapH);

    state.offsetX = clamp(state.offsetX, minX, 0);
    state.offsetY = clamp(state.offsetY, minY, 0);
  }

  function loadMapImage() {
    const img = new Image();
    img.src = "../img/mapa.png";
    img.onload = () => render();
    state.mapImage = img;
  }

  function buildRoadNetworkFromDistricts(districts) {
    const centroids = districts.map((district) => ({
      id: district.id,
      point: polygonCentroid(district.polygon)
    }));

    const roads = [];
    centroids.forEach((node) => {
      const nearest = centroids
        .filter((other) => other.id !== node.id)
        .map((other) => ({
          other,
          dist: Math.hypot(
            other.point[0] - node.point[0],
            other.point[1] - node.point[1]
          )
        }))
        .sort((a, b) => a.dist - b.dist)
        .slice(0, 2);

      nearest.forEach((edge) => {
        roads.push({ from: node.point, to: edge.other.point });
      });
    });

    return roads;
  }

  function clamp(value, min, max) {
    return Math.min(max, Math.max(min, value));
  }

  return { init, render, setDistricts, applyUpdate };
})();
