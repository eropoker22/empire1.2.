const RNG = (() => {
  function mulberry32(seed) {
    let t = seed >>> 0;
    return function () {
      t += 0x6d2b79f5;
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

const Noise = (() => {
  function smoothstep(t) {
    return t * t * (3 - 2 * t);
  }

  function valueNoise2D(seedRng, width, height, scale) {
    const grid = [];
    const cols = Math.ceil(width / scale) + 2;
    const rows = Math.ceil(height / scale) + 2;

    for (let y = 0; y < rows; y += 1) {
      const row = [];
      for (let x = 0; x < cols; x += 1) {
        row.push(seedRng.next());
      }
      grid.push(row);
    }

    return function (x, y) {
      const gx = x / scale;
      const gy = y / scale;
      const x0 = Math.floor(gx);
      const y0 = Math.floor(gy);
      const x1 = x0 + 1;
      const y1 = y0 + 1;

      const sx = smoothstep(gx - x0);
      const sy = smoothstep(gy - y0);

      const n00 = grid[y0 % rows][x0 % cols];
      const n10 = grid[y0 % rows][x1 % cols];
      const n01 = grid[y1 % rows][x0 % cols];
      const n11 = grid[y1 % rows][x1 % cols];

      const nx0 = n00 + (n10 - n00) * sx;
      const nx1 = n01 + (n11 - n01) * sx;
      return nx0 + (nx1 - nx0) * sy;
    };
  }

  return { valueNoise2D };
})();

const Voronoi = (() => {
  function clipPolygonWithLine(polygon, linePoint, lineNormal) {
    const output = [];
    const len = polygon.length;
    for (let i = 0; i < len; i += 1) {
      const a = polygon[i];
      const b = polygon[(i + 1) % len];

      const da = (a[0] - linePoint[0]) * lineNormal[0] + (a[1] - linePoint[1]) * lineNormal[1];
      const db = (b[0] - linePoint[0]) * lineNormal[0] + (b[1] - linePoint[1]) * lineNormal[1];

      if (da >= 0) {
        output.push(a);
      }

      if ((da >= 0 && db < 0) || (da < 0 && db >= 0)) {
        const t = da / (da - db);
        const ix = a[0] + (b[0] - a[0]) * t;
        const iy = a[1] + (b[1] - a[1]) * t;
        output.push([ix, iy]);
      }
    }
    return output;
  }

  function computeVoronoi(sites, bounds) {
    const { minX, minY, maxX, maxY } = bounds;
    const basePoly = [
      [minX, minY],
      [maxX, minY],
      [maxX, maxY],
      [minX, maxY]
    ];

    return sites.map((site, i) => {
      let poly = basePoly;
      for (let j = 0; j < sites.length; j += 1) {
        if (i === j) continue;
        const other = sites[j];
        const mid = [(site.x + other.x) / 2, (site.y + other.y) / 2];
        const nx = other.x - site.x;
        const ny = other.y - site.y;
        const len = Math.hypot(nx, ny) || 1;
        const normal = [nx / len, ny / len];
        poly = clipPolygonWithLine(poly, mid, normal.map((v) => -v));
        if (poly.length === 0) break;
      }
      return { site, polygon: poly };
    });
  }

  return { computeVoronoi };
})();

const CityGen = (() => {
  function generate({ seed, width, height, districtCount }) {
    const rng = RNG.create(seed);
    const noise = Noise.valueNoise2D(rng, width, height, 220);

    const sites = generateSites(rng, width, height, districtCount);
    const relaxed = lloydRelaxation(sites, { minX: 0, minY: 0, maxX: width, maxY: height }, 2);

    const cells = Voronoi.computeVoronoi(relaxed, {
      minX: 0,
      minY: 0,
      maxX: width,
      maxY: height
    });

    const placements = cells.map((cell, idx) => ({
      id: idx + 1,
      site: cell.site,
      polygon: cell.polygon
    }));

    const typeMap = assignTypes(placements, width, height);

    const districts = placements.map((cell) => {
      const type = typeMap.get(cell.id) || "residential";
      const income = baseIncome(type);
      const influence = baseInfluence(type, noise(cell.site.x, cell.site.y));
      return {
        id: cell.id,
        name: `${type.charAt(0).toUpperCase() + type.slice(1)} ${cell.id}`,
        type,
        owner: null,
        influence,
        income,
        polygon: cell.polygon
      };
    });

    return {
      seed: rng.seed,
      districts
    };
  }

  function generateSites(rng, width, height, count) {
    const sites = [];
    const margin = 40;
    for (let i = 0; i < count; i += 1) {
      sites.push({
        x: rng.range(margin, width - margin),
        y: rng.range(margin, height - margin)
      });
    }
    return sites;
  }

  function lloydRelaxation(sites, bounds, iterations) {
    let current = sites;
    for (let i = 0; i < iterations; i += 1) {
      const cells = Voronoi.computeVoronoi(current, bounds);
      current = cells.map((cell) => {
        const centroid = polygonCentroid(cell.polygon);
        return {
          x: clamp(centroid[0], bounds.minX + 10, bounds.maxX - 10),
          y: clamp(centroid[1], bounds.minY + 10, bounds.maxY - 10)
        };
      });
    }
    return current;
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
    if (Math.abs(area) < 1e-6) {
      return [poly[0][0], poly[0][1]];
    }
    return [cx / (6 * area), cy / (6 * area)];
  }

  function assignTypes(placements, width, height) {
    const centerX = width / 2;
    const centerY = height / 2;
    const entries = placements.map((cell) => {
      const dx = cell.site.x - centerX;
      const dy = cell.site.y - centerY;
      return {
        id: cell.id,
        dist: Math.hypot(dx, dy),
        angle: Math.atan2(dy, dx)
      };
    });

    const sortedByDist = [...entries].sort((a, b) =>
      a.dist === b.dist ? a.angle - b.angle : a.dist - b.dist
    );
    const downtownCount = 10;
    const typeMap = new Map();

    for (let i = 0; i < downtownCount && i < sortedByDist.length; i += 1) {
      typeMap.set(sortedByDist[i].id, "downtown");
    }

    const remaining = sortedByDist.slice(downtownCount).sort((a, b) =>
      a.angle === b.angle ? a.dist - b.dist : a.angle - b.angle
    );

    const cycle = ["residential", "industrial", "commercial", "park"];
    for (let i = 0; i < remaining.length; i += 1) {
      typeMap.set(remaining[i].id, cycle[i % cycle.length]);
    }

    return typeMap;
  }

  function baseIncome(type) {
    switch (type) {
      case "downtown":
        return 24;
      case "industrial":
        return 16;
      case "commercial":
        return 18;
      case "park":
        return 8;
      case "residential":
      default:
        return 12;
    }
  }

  function baseInfluence(type, n) {
    const base = Math.floor(n * 40);
    switch (type) {
      case "downtown":
        return base + 30;
      case "commercial":
        return base + 20;
      case "industrial":
        return base + 15;
      case "residential":
        return base + 10;
      case "park":
      default:
        return Math.max(0, base - 5);
    }
  }

  function clamp(value, min, max) {
    return Math.min(max, Math.max(min, value));
  }

  return { generate };
})();

module.exports = { CityGen };
