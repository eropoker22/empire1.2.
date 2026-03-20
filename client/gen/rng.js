window.Empire = window.Empire || {};

window.Empire.RNG = (() => {
  function mulberry32(seed) {
    let t = seed >>> 0;
    return function () {
      t += 0x6D2B79F5;
      let r = Math.imul(t ^ (t >>> 15), 1 | t);
      r ^= r + Math.imul(r ^ (r >>> 7), 61 | r);
      return ((r ^ (r >>> 14)) >>> 0) / 4294967296;
    };
  }

  function hashString(str) {
    let h = 2166136261;
    for (let i = 0; i < str.length; i += 1) {
      h ^= str.charCodeAt(i);
      h = Math.imul(h, 16777619);
    }
    return h >>> 0;
  }

  function create(seedInput) {
    const seed = typeof seedInput === "number" ? seedInput : hashString(String(seedInput));
    const rand = mulberry32(seed);

    return {
      seed,
      next: () => rand(),
      range: (min, max) => min + (max - min) * rand(),
      int: (min, max) => Math.floor(min + (max - min + 1) * rand())
    };
  }

  return { create };
})();
