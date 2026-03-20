window.Empire = window.Empire || {};

window.Empire.Noise = (() => {
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
