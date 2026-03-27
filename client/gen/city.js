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
    const halfX = width / 2;
    const halfY = height / 2;
    const quadrantBounds = [
      { minX: margin, minY: margin, maxX: halfX - margin, maxY: halfY - margin }, // top-left
      { minX: halfX + margin, minY: margin, maxX: width - margin, maxY: halfY - margin }, // top-right
      { minX: margin, minY: halfY + margin, maxX: halfX - margin, maxY: height - margin }, // bottom-left
      { minX: halfX + margin, minY: halfY + margin, maxX: width - margin, maxY: height - margin } // bottom-right
    ];
    const quadrantCounts = resolveBalancedQuadrantCounts(count);

    quadrantBounds.forEach((bounds, quadrantIndex) => {
      const targetCount = quadrantCounts[quadrantIndex] || 0;
      for (let i = 0; i < targetCount; i += 1) {
        const minX = Math.min(bounds.minX, bounds.maxX);
        const maxX = Math.max(bounds.minX, bounds.maxX);
        const minY = Math.min(bounds.minY, bounds.maxY);
        const maxY = Math.max(bounds.minY, bounds.maxY);
        sites.push({
          x: rng.range(minX, maxX),
          y: rng.range(minY, maxY),
          quadrant: quadrantIndex
        });
      }
    });

    return sites;
  }

  function lloydRelaxation(sites, bounds, iterations) {
    let current = sites;
    for (let i = 0; i < iterations; i += 1) {
      const cells = window.Empire.Voronoi.computeVoronoi(current, bounds);
      current = cells.map((cell) => {
        const safeQuadrantBounds = resolveQuadrantBoundsByPoint(bounds, cell.site?.quadrant);
        const centroid = polygonCentroid(cell.polygon);
        return {
          x: clamp(centroid[0], safeQuadrantBounds.minX + 10, safeQuadrantBounds.maxX - 10),
          y: clamp(centroid[1], safeQuadrantBounds.minY + 10, safeQuadrantBounds.maxY - 10),
          quadrant: cell.site?.quadrant
        };
      });
    }
    return current;
  }

  function resolveBalancedQuadrantCounts(count) {
    const safeCount = Math.max(0, Math.floor(Number(count) || 0));
    const base = Math.floor(safeCount / 4);
    const counts = [base, base, base, base];
    const remainder = safeCount - base * 4;
    if (remainder >= 1) counts[0] += 1; // top-left
    if (remainder >= 2) counts[3] += 1; // bottom-right
    if (remainder >= 3) counts[1] += 1; // top-right
    return counts;
  }

  function resolveQuadrantBoundsByPoint(bounds, quadrantIndex) {
    const safeBounds = bounds || { minX: 0, minY: 0, maxX: 0, maxY: 0 };
    const halfX = (safeBounds.minX + safeBounds.maxX) / 2;
    const halfY = (safeBounds.minY + safeBounds.maxY) / 2;
    const margin = 20;
    switch (quadrantIndex) {
      case 0:
        return { minX: safeBounds.minX, minY: safeBounds.minY, maxX: halfX - margin, maxY: halfY - margin };
      case 1:
        return { minX: halfX + margin, minY: safeBounds.minY, maxX: safeBounds.maxX, maxY: halfY - margin };
      case 2:
        return { minX: safeBounds.minX, minY: halfY + margin, maxX: halfX - margin, maxY: safeBounds.maxY };
      case 3:
        return { minX: halfX + margin, minY: halfY + margin, maxX: safeBounds.maxX, maxY: safeBounds.maxY };
      default:
        return safeBounds;
    }
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
        site: cell.site,
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

    const downtownEntries = sortedByDist.slice(0, downtownCount);
    const downtownCenter = downtownEntries.length
      ? {
        x: downtownEntries.reduce((sum, entry) => sum + Number(entry.site?.x || 0), 0) / downtownEntries.length,
        y: downtownEntries.reduce((sum, entry) => sum + Number(entry.site?.y || 0), 0) / downtownEntries.length
      }
      : { x: centerX, y: centerY };

    const remaining = sortedByDist.slice(downtownCount);

    const nonDowntownTargets = {
      residential: 42,
      industrial: 36,
      commercial: 30,
      park: 34
    };
    const typeOrder = ["residential", "industrial", "commercial", "park"];
    const typePlan = buildBalancedTypePlan(remaining.length, nonDowntownTargets, typeOrder);
    const balancedByLeftRight = assignTypesBalancedLeftRightDowntown(
      remaining,
      downtownCenter,
      typeOrder,
      typePlan
    );
    if (balancedByLeftRight) {
      for (let i = 0; i < balancedByLeftRight.length; i += 1) {
        typeMap.set(balancedByLeftRight[i].id, balancedByLeftRight[i].type || "residential");
      }
      return typeMap;
    }

    const evenlyDistributed = distributeEntriesAroundDowntown(remaining, downtownCenter, 12);
    for (let i = 0; i < evenlyDistributed.length; i += 1) {
      typeMap.set(evenlyDistributed[i].id, typePlan[i] || "residential");
    }

    return typeMap;
  }

  function normalizeAngleRadians(value) {
    const twoPi = Math.PI * 2;
    let angle = Number(value) || 0;
    while (angle < 0) angle += twoPi;
    while (angle >= twoPi) angle -= twoPi;
    return angle;
  }

  function distributeEntriesAroundDowntown(entries, center, sectorCount = 12) {
    const safeEntries = Array.isArray(entries) ? entries : [];
    if (!safeEntries.length) return [];
    const safeSectorCount = Math.max(4, Math.floor(Number(sectorCount) || 12));
    const sectors = Array.from({ length: safeSectorCount }, () => []);

    safeEntries.forEach((entry) => {
      const dx = Number(entry?.site?.x || 0) - Number(center?.x || 0);
      const dy = Number(entry?.site?.y || 0) - Number(center?.y || 0);
      const angle = normalizeAngleRadians(Math.atan2(dy, dx));
      const sectorIndex = Math.min(
        safeSectorCount - 1,
        Math.floor((angle / (Math.PI * 2)) * safeSectorCount)
      );
      sectors[sectorIndex].push({
        ...entry,
        radialDistance: Math.hypot(dx, dy)
      });
    });

    sectors.forEach((sectorEntries) => {
      sectorEntries.sort((a, b) => {
        if (a.radialDistance === b.radialDistance) return Number(a.id || 0) - Number(b.id || 0);
        return a.radialDistance - b.radialDistance;
      });
    });

    const ordered = [];
    let layer = 0;
    while (ordered.length < safeEntries.length) {
      let progressed = false;
      for (let i = 0; i < sectors.length; i += 1) {
        const candidate = sectors[i][layer];
        if (!candidate) continue;
        ordered.push(candidate);
        progressed = true;
      }
      if (!progressed) break;
      layer += 1;
    }

    return ordered.length === safeEntries.length ? ordered : safeEntries;
  }

  function buildInterleavedTypeTokens(countByType, order) {
    const safeOrder = Array.isArray(order) ? order.filter(Boolean) : [];
    const remainingByType = new Map();
    safeOrder.forEach((type) => {
      remainingByType.set(type, Math.max(0, Math.floor(Number(countByType?.get(type) || 0))));
    });
    const total = Array.from(remainingByType.values()).reduce((sum, value) => sum + value, 0);
    const tokens = [];
    let guard = 0;
    while (tokens.length < total && guard < total * 20) {
      let progressed = false;
      for (let i = 0; i < safeOrder.length; i += 1) {
        const type = safeOrder[i];
        const remaining = remainingByType.get(type) || 0;
        if (remaining < 1) continue;
        tokens.push(type);
        remainingByType.set(type, remaining - 1);
        progressed = true;
      }
      if (!progressed) break;
      guard += 1;
    }
    return tokens;
  }

  function assignTypesBalancedLeftRightDowntown(entries, center, typeOrder, typePlan) {
    const safeEntries = Array.isArray(entries) ? entries : [];
    const safeTypeOrder = Array.isArray(typeOrder) ? typeOrder.filter(Boolean) : [];
    const safeTypePlan = Array.isArray(typePlan) ? typePlan.filter(Boolean) : [];
    if (!safeEntries.length || !safeTypeOrder.length || safeTypePlan.length !== safeEntries.length) {
      return null;
    }

    const leftEntries = safeEntries.filter((entry) => Number(entry?.site?.x || 0) < Number(center?.x || 0));
    const rightEntries = safeEntries.filter((entry) => Number(entry?.site?.x || 0) >= Number(center?.x || 0));

    const totalByType = new Map(safeTypeOrder.map((type) => [type, 0]));
    safeTypePlan.forEach((type) => {
      totalByType.set(type, (totalByType.get(type) || 0) + 1);
    });

    const leftByType = new Map();
    const rightByType = new Map();
    safeTypeOrder.forEach((type) => {
      const total = totalByType.get(type) || 0;
      const left = Math.floor(total / 2);
      leftByType.set(type, left);
      rightByType.set(type, total - left);
    });

    const desiredLeft = Array.from(leftByType.values()).reduce((sum, value) => sum + value, 0);
    const desiredRight = Array.from(rightByType.values()).reduce((sum, value) => sum + value, 0);
    if (leftEntries.length < desiredLeft || rightEntries.length < desiredRight) {
      return null;
    }

    const leftPool = distributeEntriesAroundDowntown(leftEntries, center, 8);
    const rightPool = distributeEntriesAroundDowntown(rightEntries, center, 8);
    const leftTokens = buildInterleavedTypeTokens(leftByType, safeTypeOrder);
    const rightTokens = buildInterleavedTypeTokens(rightByType, safeTypeOrder);
    if (leftTokens.length !== desiredLeft || rightTokens.length !== desiredRight) return null;

    const assigned = [];
    for (let i = 0; i < leftTokens.length; i += 1) {
      const entry = leftPool[i];
      if (!entry) return null;
      assigned.push({ ...entry, type: leftTokens[i] });
    }
    for (let i = 0; i < rightTokens.length; i += 1) {
      const entry = rightPool[i];
      if (!entry) return null;
      assigned.push({ ...entry, type: rightTokens[i] });
    }

    if (assigned.length !== safeEntries.length) return null;
    return assigned;
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
