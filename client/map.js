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
    hasViewportOverride: false,
    isPanning: false,
    isPinching: false,
    touchMoved: false,
    lastTouchAt: 0,
    panStart: { x: 0, y: 0 },
    viewStart: { x: 0, y: 0 },
    pinchStartDistance: 0,
    pinchStartScale: 1,
    pinchWorldCenter: null,
    mapImage: null,
    mapSize: { width: 1400, height: 900 },
    vision: {
      fogPreviewMode: false,
      alliedOwnerNames: new Set(),
      enemyOwnerNames: new Set()
    }
  };

  const ownerPalette = [
    "rgba(244,114,182,0.34)",
    "rgba(168,85,247,0.34)",
    "rgba(45,212,191,0.34)",
    "rgba(56,189,248,0.35)",
    "rgba(250,204,21,0.34)"
  ];

  const enemyPalette = [
    "rgba(244,114,182,0.22)",
    "rgba(168,85,247,0.22)",
    "rgba(45,212,191,0.22)",
    "rgba(56,189,248,0.22)",
    "rgba(250,204,21,0.22)"
  ];

  const allyPalette = [
    "rgba(56,189,248,0.46)",
    "rgba(34,197,94,0.46)",
    "rgba(250,204,21,0.46)",
    "rgba(168,85,247,0.46)"
  ];

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
    "../img/park/1.png",
    "../img/park/u6568429269_ultra_realistic_futuristic_cyberpunk_city_park_at_4e6e39a1-7ff7-4445-9365-b559a33df0ba_0.png"
  ];

  const downtownImages = [
    "../img/downtown/u6568429269_ultra_realistic_cyberpunk_downtown_district_at_ni_84a7bf7c-e03a-420b-9857-c421d73f33a8_1.png",
    "../img/downtown/u6568429269_ultra_realistic_cyberpunk_luxury_commercial_distr_dc550711-88c1-45c7-8ddb-316de1b5fd2a_3.png",
    "../img/downtown/u6568429269_ultra_realistic_futuristic_cyberpunk_corporate_co_97954e9e-ca7b-408f-900d-96dcfa46b674_1.png",
    "../img/downtown/u6568429269_ultra_realistic_futuristic_cyberpunk_corporate_co_97954e9e-ca7b-408f-900d-96dcfa46b674_2.png",
    "../img/downtown/u6568429269_ultra_realistic_futuristic_cyberpunk_corporate_co_97954e9e-ca7b-408f-900d-96dcfa46b674_3.png",
    "../img/downtown/1.png",
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
    "../img/commercial/1.png",
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
    "../img/residental/1.png",
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
    "../img/industrial/1.png"
  ];

  const districtImageOverrides = {
    "park:106": ["../img/park/1.png"],
    "commercial:10": ["../img/commercial/1.png"]
  };

  function init() {
    state.canvas = document.getElementById("city-map");
    state.tooltip = document.getElementById("map-tooltip");
    if (!state.canvas) return;
    state.ctx = state.canvas.getContext("2d");

    loadMapImage();
    generateCity();
    initModal();
    initBuildingDetailModal();
    bindEvents();
    resizeCanvas();
  }

  function generateCity() {
    const seed = "empire-city-v1";
    const width = state.mapSize.width;
    const height = state.mapSize.height;
    const districtCount = 150;
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
    state.canvas.addEventListener("touchstart", onTouchStart, { passive: false });
    state.canvas.addEventListener("touchmove", onTouchMove, { passive: false });
    state.canvas.addEventListener("touchend", onTouchEnd, { passive: false });
    state.canvas.addEventListener("touchcancel", onTouchCancel, { passive: false });
    state.canvas.addEventListener("wheel", onWheel, { passive: false });
    window.addEventListener("mousemove", onWindowMouseMove);
    window.addEventListener("mouseup", onMouseUp);
    window.addEventListener("resize", resizeCanvas);
  }

  function resizeCanvas() {
    const rect = state.canvas.getBoundingClientRect();
    state.canvas.width = rect.width * window.devicePixelRatio;
    state.canvas.height = rect.height * window.devicePixelRatio;
    state.ctx.setTransform(window.devicePixelRatio, 0, 0, window.devicePixelRatio, 0, 0);
    const minScale = getMinScale();
    if (!state.hasViewportOverride) {
      // On fresh load keep map maximally zoomed out (whole city visible).
      state.scale = minScale;
      centerMap();
    } else if (state.scale < minScale) {
      state.scale = minScale;
    }
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
    if (isTouchGhost()) return;
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
    if (isTouchGhost()) return;
    if (state.isPanning) return;
    state.hoverId = null;
    hideTooltip();
    render();
  }

  function onMouseDown(event) {
    if (isTouchGhost()) return;
    if (event.button !== 0) return;
    state.isPanning = true;
    state.hasViewportOverride = true;
    state.panStart = { x: event.clientX, y: event.clientY };
    state.viewStart = { x: state.offsetX, y: state.offsetY };
    state.canvas.style.cursor = "grabbing";
  }

  function onMouseUp(event) {
    if (isTouchGhost()) return;
    if (event.button !== 0) return;
    if (!state.isPanning) return;
    const moved = Math.hypot(
      event.clientX - state.panStart.x,
      event.clientY - state.panStart.y
    );
    state.isPanning = false;
    state.canvas.style.cursor = "grab";
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

  function onWindowMouseMove(event) {
    if (isTouchGhost() || !state.isPanning) return;
    const dx = event.clientX - state.panStart.x;
    const dy = event.clientY - state.panStart.y;
    state.offsetX = state.viewStart.x + dx;
    state.offsetY = state.viewStart.y + dy;
    clampPan();
    render();
  }

  function onWheel(event) {
    if (isTouchGhost()) return;
    event.preventDefault();
    state.hasViewportOverride = true;
    const delta = -event.deltaY * 0.0015;
    const minScale = getMinScale();
    const newScale = clamp(state.scale * (1 + delta), minScale, 2.5);

    const rect = state.canvas.getBoundingClientRect();
    const mx = event.clientX - rect.left;
    const my = event.clientY - rect.top;
    zoomAtPoint(mx, my, newScale);
  }

  function onTouchStart(event) {
    if (!event.touches.length) return;
    state.lastTouchAt = Date.now();
    hideTooltip();

    if (event.touches.length === 1) {
      const touch = event.touches[0];
      state.isPinching = false;
      state.isPanning = true;
      state.touchMoved = false;
      state.hasViewportOverride = true;
      state.panStart = { x: touch.clientX, y: touch.clientY };
      state.viewStart = { x: state.offsetX, y: state.offsetY };
      event.preventDefault();
      return;
    }

    if (event.touches.length >= 2) {
      state.hasViewportOverride = true;
      beginPinch(event.touches[0], event.touches[1]);
      event.preventDefault();
    }
  }

  function onTouchMove(event) {
    if (!event.touches.length) return;
    state.lastTouchAt = Date.now();

    if (event.touches.length >= 2) {
      const first = event.touches[0];
      const second = event.touches[1];
      const distance = distanceBetweenTouches(first, second);
      if (!state.isPinching || !state.pinchStartDistance) {
        beginPinch(first, second);
      }

      const rect = state.canvas.getBoundingClientRect();
      const midpoint = midpointBetweenTouches(first, second);
      const newScale = clamp(
        state.pinchStartScale * (distance / state.pinchStartDistance),
        getMinScale(),
        2.5
      );
      state.scale = newScale;
      state.offsetX = midpoint.x - rect.left - (state.pinchWorldCenter?.x || 0) * newScale;
      state.offsetY = midpoint.y - rect.top - (state.pinchWorldCenter?.y || 0) * newScale;
      clampPan();
      render();
      event.preventDefault();
      return;
    }

    if (!state.isPanning) return;
    const touch = event.touches[0];
    const dx = touch.clientX - state.panStart.x;
    const dy = touch.clientY - state.panStart.y;
    if (Math.hypot(dx, dy) > 4) state.touchMoved = true;
    state.offsetX = state.viewStart.x + dx;
    state.offsetY = state.viewStart.y + dy;
    clampPan();
    render();
    event.preventDefault();
  }

  function onTouchEnd(event) {
    state.lastTouchAt = Date.now();

    if (state.isPinching && event.touches.length >= 2) {
      beginPinch(event.touches[0], event.touches[1]);
      event.preventDefault();
      return;
    }

    if (event.touches.length === 1) {
      const touch = event.touches[0];
      state.isPinching = false;
      state.isPanning = true;
      state.panStart = { x: touch.clientX, y: touch.clientY };
      state.viewStart = { x: state.offsetX, y: state.offsetY };
      state.touchMoved = true;
      event.preventDefault();
      return;
    }

    const changedTouch = event.changedTouches[0];
    const shouldOpenDistrict =
      changedTouch &&
      !state.isPinching &&
      state.isPanning &&
      !state.touchMoved;

    state.isPanning = false;
    state.isPinching = false;

    if (shouldOpenDistrict) {
      const rect = state.canvas.getBoundingClientRect();
      const point = toWorld(changedTouch.clientX - rect.left, changedTouch.clientY - rect.top);
      const picked = pickDistrict(point.x, point.y);
      if (picked) {
        state.selectedId = picked.id;
        window.Empire.selectedDistrict = picked;
        showModal(picked);
        render();
      }
    }

    event.preventDefault();
  }

  function onTouchCancel() {
    state.lastTouchAt = Date.now();
    state.isPanning = false;
    state.isPinching = false;
    state.touchMoved = false;
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
      if (state.vision.fogPreviewMode) {
        ctx.save();
        ctx.filter = "grayscale(1) contrast(1.06)";
        ctx.drawImage(state.mapImage, 0, 0, state.mapSize.width, state.mapSize.height);
        ctx.restore();
      } else {
        ctx.drawImage(state.mapImage, 0, 0, state.mapSize.width, state.mapSize.height);
      }
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
    if (isDistrictOwnedByPlayer(district)) return resolvePlayerOwnedFill();
    if (isDistrictOwnedByAlly(district)) return allyFill(district.owner);
    if (isDistrictOwnedByEnemy(district)) return enemyFill(district.owner);

    if (state.vision.fogPreviewMode) {
      switch (district.type) {
        case "downtown":
          return "rgba(248,113,113,0.4)";
        case "industrial":
          return "rgba(165,172,180,0.28)";
        case "commercial":
          return "rgba(152,160,168,0.28)";
        case "park":
          return "rgba(135,145,154,0.26)";
        case "residential":
        default:
          return "rgba(122,130,140,0.26)";
      }
    }

    if (district.owner) return ownerFill(district.owner);

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

  function ownerFill(owner) {
    const normalized = normalizeName(owner);
    if (!normalized) return "rgba(34,197,94,0.35)";
    const index = hashOwner(normalized) % ownerPalette.length;
    return ownerPalette[index];
  }

  function enemyFill(owner) {
    const normalized = normalizeName(owner);
    if (!normalized) return "rgba(203,213,225,0.22)";
    const index = hashOwner(normalized) % enemyPalette.length;
    return enemyPalette[index];
  }

  function allyFill(owner) {
    const normalized = normalizeName(owner);
    if (!normalized) return allyPalette[0];
    const alliedOwners = Array.from(state.vision.alliedOwnerNames);
    const indexByOrder = alliedOwners.indexOf(normalized);
    if (indexByOrder >= 0) {
      return allyPalette[indexByOrder % allyPalette.length];
    }
    const indexByHash = hashOwner(normalized) % allyPalette.length;
    return allyPalette[indexByHash];
  }

  function resolvePlayerOwnedFill() {
    const stored = normalizeHexColor(localStorage.getItem("empire_gang_color"));
    if (!stored) return "rgba(34,197,94,0.45)";
    return hexToRgba(stored, 0.45);
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

  function hexToRgba(hex, alpha = 1) {
    const normalized = normalizeHexColor(hex);
    if (!normalized) return "rgba(34,197,94,0.45)";
    const r = parseInt(normalized.slice(1, 3), 16);
    const g = parseInt(normalized.slice(3, 5), 16);
    const b = parseInt(normalized.slice(5, 7), 16);
    const safeAlpha = Number.isFinite(alpha) ? Math.max(0, Math.min(1, alpha)) : 1;
    return `rgba(${r},${g},${b},${safeAlpha})`;
  }

  function isPlayerOwner(ownerName) {
    return getPlayerOwnerNames().has(normalizeName(ownerName));
  }

  function isDistrictOwnedByPlayer(district) {
    if (!district?.owner) return false;
    return isPlayerOwner(String(district.owner).trim());
  }

  function isDistrictOwnedByAlly(district) {
    if (!district?.owner) return false;
    const owner = normalizeName(district.owner);
    if (!owner) return false;
    if (isPlayerOwner(owner)) return false;
    return state.vision.alliedOwnerNames.has(owner);
  }

  function isDistrictOwnedByEnemy(district) {
    if (!district?.owner) return false;
    const owner = normalizeName(district.owner);
    if (!owner) return false;
    if (isPlayerOwner(owner)) return false;
    if (state.vision.alliedOwnerNames.has(owner)) return false;
    return state.vision.enemyOwnerNames.has(owner);
  }

  function isDistrictDefendable(district) {
    return isDistrictOwnedByPlayer(district) || isDistrictOwnedByAlly(district);
  }

  function getPlayerOwnerNames() {
    const player = window.Empire.player || {};
    const names = [
      player.gangName,
      player.username,
      localStorage.getItem("empire_gang_name")
    ]
      .map((value) => normalizeName(value))
      .filter(Boolean);
    return new Set(names);
  }

  function normalizeName(value) {
    return String(value || "").trim().toLowerCase();
  }

  function hashOwner(value) {
    let hash = 0;
    for (let i = 0; i < value.length; i += 1) {
      hash = (hash * 31 + value.charCodeAt(i)) >>> 0;
    }
    return hash;
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

    const overrideKey = `${district.type}:${district.id}`;
    const overrideImages = districtImageOverrides[overrideKey];
    if (Array.isArray(overrideImages) && overrideImages.length) {
      grid.innerHTML = overrideImages
        .map((src, index) => `
          <img src="${src}" alt="${set.title} ${index + 1}" loading="lazy" />
        `)
        .join("");
      gallery.classList.remove("hidden");
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
    const defendableByPlayer = isDistrictDefendable(district);
    const isDowntown = district.type === "downtown";
    const ownerRelation = resolveDistrictOwnerRelation(district);
    const ownerIntelSection = buildOwnerIntelSection(district, ownerRelation);

    state.tooltip.classList.remove("hidden");

    if (state.vision.fogPreviewMode && !defendableByPlayer) {
      const districtNumber = resolveDistrictNumberLabel(district);
      state.tooltip.innerHTML = ownerRelation === "enemy"
        ? `
          <div class="map-tooltip__title">Nepřátelský sektor</div>
          <div>Distrikt č.: ${districtNumber}</div>
          ${ownerIntelSection}
          <div>Detailní info sektoru je skryté.</div>
        `
        : isDowntown
          ? `
            <div class="map-tooltip__title">Downtown sektor</div>
            <div>Distrikt č.: ${districtNumber}</div>
            <div>Citlivá zóna města.</div>
          `
          : `
            <div class="map-tooltip__title">Distrikt č. ${districtNumber}</div>
            <div>Informace o cizím distriktu jsou skryté.</div>
          `;
      placeTooltipWithinMap(clientX, clientY);
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

    state.tooltip.innerHTML = `
      <div class="map-tooltip__title">${district.name}</div>
      <div>Typ: ${district.type}</div>
      <div>Vlastník: ${district.owner || "Neobsazeno"}</div>
      <div>Příjem: $${district.income}/hod</div>
      <div>Vliv: ${district.influence}</div>
      ${ownerIntelSection}
      ${setLine}
      ${buildingLine}
    `;
    placeTooltipWithinMap(clientX, clientY);
  }

  function resolveDistrictNumberLabel(district) {
    const numericId = Number(district?.id);
    if (Number.isFinite(numericId)) {
      return `${Math.max(0, Math.floor(numericId))}`;
    }

    const name = String(district?.name || "");
    const fromName = name.match(/(\d+)/);
    if (fromName?.[1]) {
      return fromName[1];
    }

    const rawId = String(district?.id || "").trim();
    if (!rawId) return "?";
    if (rawId.includes("-")) {
      return rawId.split("-")[0];
    }
    return rawId;
  }

  function resolveDistrictOwnerRelation(district) {
    if (isDistrictOwnedByAlly(district)) return "ally";
    if (isDistrictOwnedByEnemy(district)) return "enemy";
    return "other";
  }

  function buildOwnerIntelSection(district, relation) {
    if (!district?.owner) return "";
    if (relation !== "ally" && relation !== "enemy") return "";
    const intel = resolveOwnerIntel(district, relation);
    if (!intel) return "";
    const relationLabel = relation === "ally" ? "Spojenecký hráč" : "Nepřátelský hráč";
    const members = intel.allianceMembers.map((nick) => escapeHtml(nick)).join(", ");
    return `
      <div class="map-tooltip__section">
        <div class="map-tooltip__label">${relationLabel}</div>
        <div>Nick: ${escapeHtml(intel.nick)}</div>
        <div>Gang: ${escapeHtml(intel.gangName)}</div>
        <div>Aliance: ${members}</div>
      </div>
    `;
  }

  function resolveOwnerIntel(district, relation) {
    const owner = normalizeName(district?.owner);
    if (!owner) return null;

    const ownerSeed = hashOwner(`${owner}:${relation}`);
    const nick = generateSyntheticNick(ownerSeed);
    const gangName = generateSyntheticGangName(ownerSeed);
    const allianceMembers = generateSyntheticAllianceMembers(owner, relation, ownerSeed, nick);

    return {
      nick,
      gangName,
      allianceMembers
    };
  }

  function generateSyntheticNick(seed) {
    const prefixes = ["Razor", "Ghost", "Viper", "Nyx", "Cipher", "Blaze", "Nova", "Kane", "Venom", "Sable"];
    const suffixes = ["Hex", "Prime", "Zero", "Fox", "Core", "Volt", "Reign", "Shade", "Drift", "Flux"];
    const first = prefixes[Math.abs(seed) % prefixes.length];
    const second = suffixes[Math.abs(Math.floor(seed / 7)) % suffixes.length];
    const number = 10 + (Math.abs(seed) % 90);
    return `${first} ${second}-${number}`;
  }

  function generateSyntheticGangName(seed) {
    const first = ["Neon", "Iron", "Black", "Shadow", "Obsidian", "Chrome", "Crimson", "Night", "Vortex", "Steel"];
    const second = ["Syndicate", "Cartel", "Legion", "Covenant", "Raiders", "Empire", "Network", "Coalition", "Order", "Circle"];
    return `${first[Math.abs(seed) % first.length]} ${second[Math.abs(Math.floor(seed / 11)) % second.length]}`;
  }

  function generateSyntheticAllianceMembers(owner, relation, seed, ownerNick) {
    const members = [ownerNick];
    const relationOwners = relation === "ally"
      ? Array.from(state.vision.alliedOwnerNames || [])
      : Array.from(state.vision.enemyOwnerNames || []);
    const uniqueOwners = Array.from(new Set(relationOwners.map((name) => normalizeName(name)).filter(Boolean)));

    uniqueOwners.forEach((candidate) => {
      if (members.length >= 3) return;
      if (candidate === owner) return;
      const candidateSeed = hashOwner(`${candidate}:${relation}`);
      const nick = generateSyntheticNick(candidateSeed);
      if (!members.includes(nick)) members.push(nick);
    });

    let fillerIndex = 0;
    while (members.length < 3) {
      const fillerNick = generateSyntheticNick(seed + 97 * (fillerIndex + 1));
      if (!members.includes(fillerNick)) members.push(fillerNick);
      fillerIndex += 1;
    }

    return members.slice(0, 3);
  }

  function escapeHtml(value) {
    return String(value || "")
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/\"/g, "&quot;")
      .replace(/'/g, "&#39;");
  }

  function placeTooltipWithinMap(clientX, clientY) {
    if (!state.tooltip) return;
    const margin = 12;
    const inset = 6;
    let left = Number(clientX || 0) + margin;
    let top = Number(clientY || 0) + margin;

    const mapRect = state.canvas?.getBoundingClientRect?.();
    if (!mapRect) {
      state.tooltip.style.left = `${left}px`;
      state.tooltip.style.top = `${top}px`;
      return;
    }

    const tooltipRect = state.tooltip.getBoundingClientRect();
    const minLeft = mapRect.left + inset;
    const maxLeft = mapRect.right - tooltipRect.width - inset;
    const minTop = mapRect.top + inset;
    const maxTop = mapRect.bottom - tooltipRect.height - inset;

    if (maxLeft < minLeft) {
      left = minLeft;
    } else {
      left = Math.min(maxLeft, Math.max(minLeft, left));
    }

    if (maxTop < minTop) {
      top = minTop;
    } else {
      top = Math.min(maxTop, Math.max(minTop, top));
    }

    state.tooltip.style.left = `${left}px`;
    state.tooltip.style.top = `${top}px`;
  }

  function hideTooltip() {
    if (!state.tooltip) return;
    state.tooltip.classList.add("hidden");
  }

  function applyUpdate(update) {
    if (!update || !Array.isArray(update.districts)) return;
    setDistricts(update.districts);
  }

  function setVisionContext(context = {}) {
    state.vision.fogPreviewMode = Boolean(context.fogPreviewMode);
    const allied = Array.isArray(context.alliedOwnerNames) ? context.alliedOwnerNames : [];
    const enemies = Array.isArray(context.enemyOwnerNames) ? context.enemyOwnerNames : [];
    state.vision.alliedOwnerNames = new Set(
      allied
        .map((value) => normalizeName(value))
        .filter(Boolean)
    );
    state.vision.enemyOwnerNames = new Set(
      enemies
        .map((value) => normalizeName(value))
        .filter(Boolean)
    );
    render();
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
      buildingNameOverrides: Array.isArray(district.buildingNameOverrides) ? district.buildingNameOverrides : [],
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
        const defense = document.getElementById("defense-btn");
        if (defense && !defense.classList.contains("hidden")) {
          defense.click();
          return;
        }
        const attack = document.getElementById("attack-btn");
        if (attack) attack.click();
      }
    });
  }

  function initBuildingDetailModal() {
    const root = document.getElementById("building-detail-modal");
    if (!root) return;

    const backdrop = document.getElementById("building-detail-modal-backdrop");
    const closeBtn = document.getElementById("building-detail-modal-close");
    const tabButtons = Array.from(root.querySelectorAll("[data-building-tab]"));
    const actionButtons = Array.from(root.querySelectorAll("[data-building-action]"));
    const panelStats = document.getElementById("building-detail-panel-stats");
    const panelInfo = document.getElementById("building-detail-panel-info");

    const setTab = (tab) => {
      const showInfo = tab === "info";
      if (panelStats) panelStats.classList.toggle("hidden", showInfo);
      if (panelInfo) panelInfo.classList.toggle("hidden", !showInfo);
      tabButtons.forEach((button) => {
        button.classList.toggle("is-active", button.dataset.buildingTab === tab);
      });
    };

    const close = () => root.classList.add("hidden");

    if (backdrop) backdrop.addEventListener("click", close);
    if (closeBtn) closeBtn.addEventListener("click", close);
    root.addEventListener("click", (event) => {
      if (event.target === root || event.target === backdrop) close();
    });
    tabButtons.forEach((button) => {
      button.addEventListener("click", () => setTab(button.dataset.buildingTab || "stats"));
    });
    actionButtons.forEach((button) => {
      button.addEventListener("click", () => {
        const actionId = button.dataset.buildingAction || "?";
        const buildingName = document.getElementById("building-detail-name")?.textContent || "Budova";
        window.Empire.UI?.pushEvent?.(`${buildingName}: Akce ${actionId} bude doplněna později.`);
      });
    });
    document.addEventListener("keydown", (event) => {
      if (event.key === "Escape") close();
    });
  }

  function openBuildingDetailModal(buildingName, district) {
    const root = document.getElementById("building-detail-modal");
    if (!root) return;

    const details = resolveBuildingDetails(buildingName, district);
    const title = document.getElementById("building-detail-title");
    const name = document.getElementById("building-detail-name");
    const hourly = document.getElementById("building-detail-hourly");
    const daily = document.getElementById("building-detail-daily");
    const info = document.getElementById("building-detail-info-text");
    const panelStats = document.getElementById("building-detail-panel-stats");
    const panelInfo = document.getElementById("building-detail-panel-info");
    const tabButtons = Array.from(root.querySelectorAll("[data-building-tab]"));

    if (title) title.textContent = `Budova: ${details.baseName}`;
    if (name) name.textContent = details.displayName;
    if (hourly) hourly.textContent = `$${details.hourlyIncome} / hod`;
    if (daily) daily.textContent = `$${details.dailyIncome} / den`;
    if (info) info.textContent = details.info;
    if (panelStats) panelStats.classList.remove("hidden");
    if (panelInfo) panelInfo.classList.add("hidden");
    tabButtons.forEach((button) => {
      button.classList.toggle("is-active", button.dataset.buildingTab === "stats");
    });

    root.classList.remove("hidden");
  }

  function showBuildingDetail(buildingName, district) {
    openBuildingDetailModal(buildingName, district || null);
  }

  function resolveBuildingDetails(buildingName, district) {
    const context = resolveBuildingDetailContext(buildingName);
    const safeName = context.baseName;
    const displayName = context.variantName || safeName;
    const districtSeed = district?.id || 0;
    const seed = hashOwner(`${districtSeed}:${safeName}:${context.variantName || ""}`);
    const mallProfiles = {
      "Neon Mall": {
        hourlyIncome: 612,
        info:
          "Neon Mall je high-volume retail uzel. Rychle točí hotovost a zvyšuje tempo příjmů v komerční zóně."
      },
      "Iron Market Plaza": {
        hourlyIncome: 576,
        info:
          "Iron Market Plaza je těžký tržní hub. Má stabilní výnos a bonus pro obchodní operace v širším okolí."
      },
      "Karina shopping center": {
        hourlyIncome: 648,
        info:
          "Karina shopping center je prémiové obchodní centrum s nejvyšším obratem. Je silné na dlouhodobý ekonomický tlak."
      }
    };
    const restaurantProfiles = {
      "Neon Bite": {
        hourlyIncome: 286,
        info: "Rychlá neonová kuchyně. Zvyšuje noční cashflow a pomáhá držet tlak na soupeře."
      },
      "Black Plate": {
        hourlyIncome: 278,
        info: "High-risk gastro front. Vhodné pro tiché praní menších částek při stabilní kontrole."
      },
      "Street Fuel": {
        hourlyIncome: 264,
        info: "Jídlo pro pouliční týmy. Posiluje operativu v okolních sektorech během konfliktu."
      },
      "Blood & Grill": {
        hourlyIncome: 298,
        info: "Agresivní grill point. Přináší vyšší příjem, ale přitahuje větší pozornost."
      },
      "Midnight Diner": {
        hourlyIncome: 272,
        info: "Noční diner s dlouhou provozní dobou. Stabilní income i mimo hlavní špičku."
      },
      "Iron Taste": {
        hourlyIncome: 266,
        info: "Tvrdý industriální styl. Dobře funguje v zónách s častým pohybem posil."
      },
      "Shadow Kitchen": {
        hourlyIncome: 281,
        info: "Skrytá kuchyně pro interní síť. Vhodná pro nenápadný růst vlivu."
      },
      "Dirty Spoon": {
        hourlyIncome: 252,
        info: "Levná frontová kuchyně. Nižší výnos, ale rychlá a spolehlivá rotace peněz."
      },
      "Vice Kitchen": {
        hourlyIncome: 294,
        info: "Silně napojená na noční trh. Zvyšuje obrat v rizikových časech."
      },
      "Urban Hunger": {
        hourlyIncome: 260,
        info: "Městský fast servis. Udržuje stabilní tok zákazníků celý den."
      },
      "Smoke & Meat": {
        hourlyIncome: 288,
        info: "Prémiový smokehouse. Vyšší marže a lepší efekt při dlouhodobém držení sektoru."
      },
      "The Last Bite": {
        hourlyIncome: 257,
        info: "Pozdní provoz pro poslední vlnu klientů. Dobré doplnění ekonomiky distriktu."
      },
      "Gangster Grill": {
        hourlyIncome: 301,
        info: "Silný brand pod kontrolou gangu. Roste rychleji, když je zóna bezpečná."
      },
      "Concrete Kitchen": {
        hourlyIncome: 269,
        info: "Betonový core point. Stabilní příjmy s nízkou volatilitou."
      },
      "Dark Appetite": {
        hourlyIncome: 284,
        info: "Noir restaurace pro VIP kontakty. Pomáhá budovat vliv mezi klíčovými lidmi."
      },
      "Night Feast": {
        hourlyIncome: 276,
        info: "Noční hostiny a eventy. Krátké špičky s výraznějším výdělkem."
      },
      "The Hungry Syndicate": {
        hourlyIncome: 305,
        info: "Syndikátní jídelní uzel. Výborný výkon při propojení více commercial sektorů."
      },
      "Rusty Fork": {
        hourlyIncome: 249,
        info: "Starší podnik s loajální klientelou. Pomalejší, ale velmi stabilní cashflow."
      },
      "Back Alley Bistro": {
        hourlyIncome: 262,
        info: "Bistro v zadních uličkách. Výhodné pro skrytý provoz bez velké publicity."
      },
      "Sinful Kitchen": {
        hourlyIncome: 292,
        info: "Rizikový nightlife spot. Umí tahat vyšší příjmy za cenu většího napětí."
      },
      "Underground Taste": {
        hourlyIncome: 274,
        info: "Podzemní kulinářská síť. Podporuje ekonomiku v konfliktních oblastech."
      },
      "Savage Kitchen": {
        hourlyIncome: 297,
        info: "Tvrdý street koncept. Silný výnos během agresivní expanze."
      },
      "Chrome Diner": {
        hourlyIncome: 267,
        info: "Chromový diner nové generace. Konzistentní příjem s dobrým poměrem rizika."
      },
      "Heat Kitchen": {
        hourlyIncome: 289,
        info: "Horká kuchyně s rychlým obratem. Funguje nejlépe při aktivním trhu."
      },
      "No Mercy Meals": {
        hourlyIncome: 303,
        info: "Bezkompromisní provozní model. Vysoký potenciál výdělku pro ofenzivní hru."
      },
      "Broken Plate": {
        hourlyIncome: 255,
        info: "Low-profile spot. Menší výnos, ale výborná odolnost při výkyvech."
      },
      "Elite Hunger": {
        hourlyIncome: 312,
        info: "Elitní koncept pro horní vrstvu města. Nejvyšší restauranční obrat v síti."
      }
    };
    const activeSpecialProfile =
      context.variantName && safeName === "Obchodní centrum"
        ? mallProfiles[context.variantName] || null
        : context.variantName && safeName === "Restaurace"
          ? restaurantProfiles[context.variantName] || null
          : null;
    const hourlyIncome = activeSpecialProfile
      ? activeSpecialProfile.hourlyIncome
      : 60 + (seed % 31) * 12;
    const dailyIncome = hourlyIncome * 24;
    const infoSamples = [
      "Tahle budova drží lokální cashflow a pomáhá stabilizovat kontrolu sektoru při dlouhých konfliktech.",
      "Budova funguje jako logistický uzel. Je vhodná pro podporu útoku i obrany podle aktuální situace.",
      "Poskytuje operativní zázemí pro lidi v terénu, takže zvyšuje efektivitu gangových aktivit v okolí.",
      "Je to strategický bod pro ekonomiku distriktu. V pozdější fázi hry může výrazně zvednout výnosy.",
      "Budova je vhodná pro tichý růst vlivu. Největší přínos má při držení sektoru delší dobu."
    ];
    const info = activeSpecialProfile?.info || infoSamples[seed % infoSamples.length];
    return { baseName: safeName, displayName, hourlyIncome, dailyIncome, info };
  }

  function showModal(district) {
    if (!state.modal?.root) return;
    const defendableByPlayer = isDistrictDefendable(district);
    const isDowntown = district.type === "downtown";
    const districtNumber = resolveDistrictNumberLabel(district);

    updateModalActionsForDistrict(district);

    if (!state.vision.fogPreviewMode || defendableByPlayer) {
      document.getElementById("modal-name").textContent = district.name || "Distrikt";
      document.getElementById("modal-type").textContent = district.type || "-";
      document.getElementById("modal-owner").textContent = district.owner || "Neobsazeno";
      document.getElementById("modal-income").textContent = `$${district.income || 0}/hod`;
      document.getElementById("modal-influence").textContent = district.influence || 0;
      updateDistrictBuildings(district);
      updateDistrictGallery(district);
    } else {
      document.getElementById("modal-name").textContent = isDowntown
        ? `Downtown sektor #${districtNumber}`
        : `District č. ${districtNumber}`;
      document.getElementById("modal-type").textContent = isDowntown ? "Downtown" : "Skryto";
      document.getElementById("modal-owner").textContent = "Skryto";
      document.getElementById("modal-income").textContent = "Skryto";
      document.getElementById("modal-influence").textContent = "Skryto";
      updateDistrictBuildings(null);
      updateDistrictGallery(null);
    }

    state.modal.root.classList.remove("hidden");
  }

  function updateModalActionsForDistrict(district) {
    const attackBtn = document.getElementById("attack-btn");
    const raidBtn = document.getElementById("raid-btn");
    const spyBtn = document.getElementById("spy-btn");
    const defenseBtn = document.getElementById("defense-btn");
    if (!attackBtn || !raidBtn || !spyBtn || !defenseBtn) return;

    const defendableByPlayer = isDistrictDefendable(district);
    const evaluateAction = window.Empire.UI?.evaluateDistrictActionAvailability;
    const attackState = typeof evaluateAction === "function"
      ? evaluateAction(district, "attack")
      : { allowed: !defendableByPlayer, reason: "" };
    const raidState = typeof evaluateAction === "function"
      ? evaluateAction(district, "raid")
      : { allowed: !defendableByPlayer, reason: "" };
    const spyState = typeof evaluateAction === "function"
      ? evaluateAction(district, "spy")
      : { allowed: !defendableByPlayer, reason: "" };

    const showAttack = !defendableByPlayer && attackState.allowed;
    const showRaid = !defendableByPlayer && raidState.allowed;
    const showSpy = !defendableByPlayer && spyState.allowed;

    attackBtn.classList.toggle("hidden", !showAttack);
    raidBtn.classList.toggle("hidden", !showRaid);
    spyBtn.classList.toggle("hidden", !showSpy);
    defenseBtn.classList.toggle("hidden", !defendableByPlayer);
    attackBtn.disabled = false;
    raidBtn.disabled = false;
    spyBtn.disabled = false;
    attackBtn.setAttribute("aria-disabled", "false");
    raidBtn.setAttribute("aria-disabled", "false");
    spyBtn.setAttribute("aria-disabled", "false");
    attackBtn.title = "";
    raidBtn.title = "";
    spyBtn.title = "";
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
    if (!district) {
      root.classList.add("hidden");
      list.innerHTML = "";
      return;
    }

    const buildings = Array.isArray(district.buildings) ? district.buildings : [];
    if (!buildings.length) {
      root.classList.add("hidden");
      list.innerHTML = "";
      return;
    }
    const lockMeta = resolveBuildingLockMeta(district);

    title.textContent = district.buildingSetTitle
      ? `Budovy v distriktu • ${district.buildingSetTitle} (${district.buildingTier || "set"})`
      : "Budovy v distriktu";
    list.innerHTML = buildings
      .map(
        (building, index) => `
          <button
            class="district-buildings__item district-buildings__item--interactive${lockMeta.locked ? " district-buildings__item--locked" : ""}"
            type="button"
            data-building-index="${index}"
            ${lockMeta.locked ? 'data-building-locked="1" disabled aria-disabled="true"' : ""}
          >
            <span class="district-buildings__name">${building}</span>
            ${lockMeta.locked ? `<span class="district-buildings__lock">${lockMeta.label}</span>` : ""}
          </button>
        `
      )
      .join("");
    list.querySelectorAll("[data-building-index]:not([data-building-locked])").forEach((button) => {
      button.addEventListener("click", () => {
        const index = Number(button.getAttribute("data-building-index"));
        const buildingName = buildings[index];
        if (!buildingName) return;
        const detailInput = resolveBuildingDetailInput(district, index, buildingName);
        openBuildingDetailModal(detailInput, district);
      });
    });
    root.classList.remove("hidden");
  }

  function resolveDistrictBuildingName(district, index, fallbackName) {
    const overrides = Array.isArray(district?.buildingNameOverrides) ? district.buildingNameOverrides : [];
    const named = overrides[index];
    if (typeof named === "string" && named.trim()) {
      return named.trim();
    }
    return String(fallbackName || "Neznámá budova");
  }

  function resolveBuildingDetailInput(district, index, fallbackName) {
    const baseName = String(fallbackName || "Neznámá budova");
    const variantName = resolveDistrictBuildingName(district, index, baseName);
    if (variantName !== baseName) {
      return { baseName, variantName };
    }
    return baseName;
  }

  function resolveBuildingDetailContext(buildingInput) {
    if (buildingInput && typeof buildingInput === "object") {
      const baseName = String(buildingInput.baseName || buildingInput.name || "Neznámá budova");
      const variantRaw = String(buildingInput.variantName || "").trim();
      const variantName = variantRaw && variantRaw !== baseName ? variantRaw : null;
      return { baseName, variantName };
    }
    return { baseName: String(buildingInput || "Neznámá budova"), variantName: null };
  }

  function resolveBuildingLockMeta(district) {
    if (isDistrictOwnedByPlayer(district)) {
      return { locked: false, label: "" };
    }
    if (isDistrictOwnedByAlly(district)) {
      return { locked: true, label: "ALLY LOCKED" };
    }
    return { locked: true, label: "LOCKED" };
  }

  function clampPan() {
    const viewW = state.canvas.width / window.devicePixelRatio;
    const viewH = state.canvas.height / window.devicePixelRatio;
    const mapW = state.mapSize.width * state.scale;
    const mapH = state.mapSize.height * state.scale;

    if (mapW <= viewW) {
      state.offsetX = (viewW - mapW) / 2;
    } else {
      const minX = viewW - mapW;
      state.offsetX = clamp(state.offsetX, minX, 0);
    }

    if (mapH <= viewH) {
      state.offsetY = (viewH - mapH) / 2;
    } else {
      const minY = viewH - mapH;
      state.offsetY = clamp(state.offsetY, minY, 0);
    }
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

  function getMinScale() {
    return Math.max(
      state.canvas.width / window.devicePixelRatio / state.mapSize.width,
      state.canvas.height / window.devicePixelRatio / state.mapSize.height
    );
  }

  function centerMap() {
    const viewW = state.canvas.width / window.devicePixelRatio;
    const viewH = state.canvas.height / window.devicePixelRatio;
    const mapW = state.mapSize.width * state.scale;
    const mapH = state.mapSize.height * state.scale;
    state.offsetX = (viewW - mapW) / 2;
    state.offsetY = (viewH - mapH) / 2;
  }

  function zoomAtPoint(viewX, viewY, newScale) {
    const worldBefore = toWorld(viewX, viewY);
    state.scale = newScale;
    state.offsetX = viewX - worldBefore.x * newScale;
    state.offsetY = viewY - worldBefore.y * newScale;
    clampPan();
    render();
  }

  function beginPinch(firstTouch, secondTouch) {
    const rect = state.canvas.getBoundingClientRect();
    const midpoint = midpointBetweenTouches(firstTouch, secondTouch);
    state.isPinching = true;
    state.isPanning = false;
    state.touchMoved = true;
    state.pinchStartDistance = Math.max(distanceBetweenTouches(firstTouch, secondTouch), 1);
    state.pinchStartScale = state.scale;
    state.pinchWorldCenter = toWorld(midpoint.x - rect.left, midpoint.y - rect.top);
  }

  function distanceBetweenTouches(firstTouch, secondTouch) {
    return Math.hypot(
      secondTouch.clientX - firstTouch.clientX,
      secondTouch.clientY - firstTouch.clientY
    );
  }

  function midpointBetweenTouches(firstTouch, secondTouch) {
    return {
      x: (firstTouch.clientX + secondTouch.clientX) / 2,
      y: (firstTouch.clientY + secondTouch.clientY) / 2
    };
  }

  function isTouchGhost() {
    return Date.now() - state.lastTouchAt < 500;
  }

  return { init, render, setDistricts, applyUpdate, setVisionContext, showBuildingDetail };
})();
