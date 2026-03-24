window.Empire = window.Empire || {};

window.Empire.CityGen = (() => {
  const types = ["downtown", "residential", "industrial", "commercial", "park"];

  function generate({ seed, width, height, districtCount }) {
    const rng = window.Empire.RNG.create(seed);
    const noise = window.Empire.Noise.valueNoise2D(rng, width, height, 220);

    const sites = generateSites(rng, width, height, districtCount);
    const relaxed = lloydRelaxation(sites, { minX: 0, minY: 0, maxX: width, maxY: height }, 2);

    const cells = window.Empire.Voronoi.computeVoronoi(relaxed, {
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

    const roads = buildRoadNetwork(districts, width, height, rng);

    return {
      seed: rng.seed,
      districts,
      roads
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
      const cells = window.Empire.Voronoi.computeVoronoi(current, bounds);
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
    const downtownCount = 8;
    const typeMap = new Map();

    for (let i = 0; i < downtownCount && i < sortedByDist.length; i += 1) {
      typeMap.set(sortedByDist[i].id, "downtown");
    }

    const remaining = sortedByDist.slice(downtownCount).sort((a, b) =>
      a.angle === b.angle ? a.dist - b.dist : a.angle - b.angle
    );

    const nonDowntownTargets = {
      residential: 42,
      industrial: 36,
      commercial: 30,
      park: 34
    };
    const typeOrder = ["residential", "industrial", "commercial", "park"];
    const typePlan = buildBalancedTypePlan(remaining.length, nonDowntownTargets, typeOrder);

    for (let i = 0; i < remaining.length; i += 1) {
      typeMap.set(remaining[i].id, typePlan[i] || "residential");
    }

    return typeMap;
  }

  function buildBalancedTypePlan(total, targets, order) {
    if (!Number.isFinite(total) || total <= 0) return [];
    const normalizedOrder = Array.isArray(order) ? order.filter(Boolean) : [];
    if (!normalizedOrder.length) return [];

    const baseCounts = normalizedOrder.map((type) =>
      Math.max(0, Math.floor(Number(targets?.[type]) || 0))
    );
    const baseTotal = baseCounts.reduce((sum, count) => sum + count, 0);

    let counts = [];
    if (baseTotal > 0) {
      if (baseTotal === total) {
        counts = [...baseCounts];
      } else {
        const scale = total / baseTotal;
        counts = baseCounts.map((count) => Math.floor(count * scale));
        let assigned = counts.reduce((sum, count) => sum + count, 0);

        const fractions = baseCounts
          .map((count, index) => ({
            index,
            frac: count * scale - Math.floor(count * scale)
          }))
          .sort((a, b) => b.frac - a.frac);

        let cursor = 0;
        while (assigned < total && fractions.length) {
          const targetIndex = fractions[cursor % fractions.length].index;
          counts[targetIndex] += 1;
          assigned += 1;
          cursor += 1;
        }

        while (assigned > total) {
          const removeIndex = counts.findIndex((count) => count > 0);
          if (removeIndex === -1) break;
          counts[removeIndex] -= 1;
          assigned -= 1;
        }
      }
    } else {
      counts = normalizedOrder.map(() => 0);
      for (let i = 0; i < total; i += 1) {
        counts[i % counts.length] += 1;
      }
    }

    const remainingCounts = [...counts];
    const plan = [];
    let guard = 0;
    while (plan.length < total && guard < total * 20) {
      let placed = false;
      for (let i = 0; i < normalizedOrder.length && plan.length < total; i += 1) {
        if (remainingCounts[i] <= 0) continue;
        plan.push(normalizedOrder[i]);
        remainingCounts[i] -= 1;
        placed = true;
      }
      if (!placed) break;
      guard += 1;
    }

    while (plan.length < total) {
      plan.push(normalizedOrder[0]);
    }

    return plan;
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

  function buildRoadNetwork(districts, width, height, rng) {
    const roads = [];

    const primaryCount = 4;
    for (let i = 0; i < primaryCount; i += 1) {
      const x = rng.range(width * 0.2, width * 0.8);
      roads.push({ from: [x, 0], to: [x, height] });
      const y = rng.range(height * 0.2, height * 0.8);
      roads.push({ from: [0, y], to: [width, y] });
    }

    districts.forEach((district) => {
      const centroid = polygonCentroid(district.polygon);
      const dx = centroid[0] - width / 2;
      const dy = centroid[1] - height / 2;
      const offset = 0.15 * Math.hypot(dx, dy);
      const target = [
        width / 2 + dx * 0.4 + rng.range(-offset, offset),
        height / 2 + dy * 0.4 + rng.range(-offset, offset)
      ];
      roads.push({ from: centroid, to: target });
    });

    return roads;
  }

  function clamp(value, min, max) {
    return Math.min(max, Math.max(min, value));
  }

  return { generate, types };
})();
