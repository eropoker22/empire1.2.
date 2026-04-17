window.Empire = window.Empire || {};
window.Empire.MapModules = window.Empire.MapModules || {};

window.Empire.MapModules.createViewportModule = function createViewportModule(deps) {
  const state = deps.state;
  const toWorld = deps.toWorld;
  const render = deps.render;

  function clamp(value, min, max) {
    return Math.min(max, Math.max(min, value));
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

  function isTouchGhost() {
    return Date.now() - state.lastTouchAt < 500;
  }

  return {
    clamp,
    clampPan,
    getMinScale,
    centerMap,
    zoomAtPoint,
    beginPinch,
    distanceBetweenTouches,
    midpointBetweenTouches,
    isTouchGhost
  };
};
