function hash(x, y, seed) {
    let h = (x | 0) * 0x8da6b343 ^ (y | 0) * 0xd8163841 ^ (seed | 0);

    h ^= h >> 15;
    h *= 0x2c1b3c6d;
    h ^= h >> 12;
    h *= 0x297a2d39;
    h ^= h >> 15;

    return h >>> 0;
}

function gradient(ix, iy, seed) {
  const h = hash(ix, iy, seed);
  const angle = (h % 360) * Math.PI / 180;
  return {
    x: Math.cos(angle),
    y: Math.sin(angle)
  };
}

function fade(t) {
  return t * t * t * (t * (t * 6 - 15) + 10);
}

function lerp(a, b, t) {
  return a + t * (b - a);
}

function perlin(x, y, seed) {
  const x0 = Math.floor(x);
  const y0 = Math.floor(y);
  const x1 = x0 + 1;
  const y1 = y0 + 1;

  const sx = fade(x - x0);
  const sy = fade(y - y0);

  const g00 = gradient(x0, y0, seed);
  const g10 = gradient(x1, y0, seed);
  const g01 = gradient(x0, y1, seed);
  const g11 = gradient(x1, y1, seed);

  const dx0 = x - x0, dy0 = y - y0;
  const dx1 = x - x1, dy1 = y - y1;

  const n00 = g00.x * dx0 + g00.y * dy0;
  const n10 = g10.x * dx1 + g10.y * dy0;
  const n01 = g01.x * dx0 + g01.y * dy1;
  const n11 = g11.x * dx1 + g11.y * dy1;

  const nx0 = lerp(n00, n10, sx);
  const nx1 = lerp(n01, n11, sx);
  return lerp(nx0, nx1, sy);
}