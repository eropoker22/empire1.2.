window.Empire = window.Empire || {};

window.Empire.Voronoi = (() => {
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
