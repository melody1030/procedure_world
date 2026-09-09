import { createNoise2D as createSimplexNoise2D } from './noise2d'

// Fast deterministic integer hash -> float in [-1, 1]. Used by both the
// white noise and cellular noise generators below.
function hash2(ix, iy, seed) {
  let h = Math.imul(ix, 0x27d4eb2f) ^ Math.imul(iy, 0x165667b1) ^ Math.imul(seed, 0x9e3779b9)
  h = Math.imul(h ^ (h >>> 15), 0x85ebca6b)
  h = Math.imul(h ^ (h >>> 13), 0xc2b2ae35)
  h ^= h >>> 16
  return ((h >>> 0) / 4294967295) * 2 - 1
}

function mulberry32(seed) {
  let a = seed >>> 0
  return function random() {
    a |= 0
    a = (a + 0x6d2b79f5) | 0
    let t = Math.imul(a ^ (a >>> 15), 1 | a)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

// White noise: one independent random value per unit grid cell, no
// interpolation between cells -> blocky, uncorrelated "static" look.
export function createWhiteNoise2D(seed = 1) {
  return function whiteNoise2D(x, y) {
    return hash2(Math.floor(x), Math.floor(y), seed)
  }
}

// Classic Perlin (gradient) noise: unlike simplex it samples on a square
// grid, so it can show faint axis-aligned artifacts at low frequency.
const GRAD2 = [
  [1, 1], [-1, 1], [1, -1], [-1, -1],
  [1, 0], [-1, 0], [0, 1], [0, -1],
]

function fade(t) {
  return t * t * t * (t * (t * 6 - 15) + 10)
}

function lerp(a, b, t) {
  return a + t * (b - a)
}

export function createPerlinNoise2D(seed = 1) {
  const random = mulberry32(seed)
  const p = new Uint8Array(256)
  for (let i = 0; i < 256; i++) p[i] = i
  for (let i = 255; i > 0; i--) {
    const j = Math.floor(random() * (i + 1))
    const tmp = p[i]
    p[i] = p[j]
    p[j] = tmp
  }
  const perm = new Uint8Array(512)
  for (let i = 0; i < 512; i++) perm[i] = p[i & 255]

  function gradAt(ix, iy) {
    return GRAD2[perm[(ix + perm[iy & 255]) & 255] % 8]
  }

  return function perlin2D(x, y) {
    const x0 = Math.floor(x)
    const y0 = Math.floor(y)
    const x1 = x0 + 1
    const y1 = y0 + 1

    const n00 = dot(gradAt(x0, y0), x - x0, y - y0)
    const n10 = dot(gradAt(x1, y0), x - x1, y - y0)
    const n01 = dot(gradAt(x0, y1), x - x0, y - y1)
    const n11 = dot(gradAt(x1, y1), x - x1, y - y1)

    const u = fade(x - x0)
    const v = fade(y - y0)

    return lerp(lerp(n00, n10, u), lerp(n01, n11, u), v) * Math.SQRT2
  }
}

function dot(g, x, y) {
  return g[0] * x + g[1] * y
}

// Cellular (Worley) noise: distance from each point to the nearest of a
// scattered set of random feature points -> mosaic / cracked-earth look.
function jitteredPoint(cellX, cellY, seed) {
  const jx = (hash2(cellX, cellY, seed) + 1) / 2
  const jy = (hash2(cellX + 0x2545f, cellY - 0x1b873, seed ^ 0x5bd1e995) + 1) / 2
  return [cellX + jx, cellY + jy]
}

export function createCellularNoise2D(seed = 1) {
  return function cellular2D(x, y) {
    const ix = Math.floor(x)
    const iy = Math.floor(y)
    let minDist = Infinity

    for (let dx = -1; dx <= 1; dx++) {
      for (let dy = -1; dy <= 1; dy++) {
        const [fx, fy] = jitteredPoint(ix + dx, iy + dy, seed)
        const ddx = fx - x
        const ddy = fy - y
        const dist = Math.sqrt(ddx * ddx + ddy * ddy)
        if (dist < minDist) minDist = dist
      }
    }

    const normalized = Math.min(1, minDist / 1.2)
    return 1 - normalized * 2 // close to a feature point -> ~1, far -> ~-1
  }
}

export const NOISE_TYPES = {
  simplex: {
    label: 'Simplex Noise',
    description: 'Smooth, natural-looking gradient noise with no visible grid artifacts. Good general-purpose default.',
  },
  perlin: {
    label: 'Perlin Noise',
    description: 'Classic gradient noise, similar to simplex but sampled on a square grid — can show faint axis-aligned patterns at low frequency.',
  },
  white: {
    label: 'White Noise',
    description: 'Pure random static: every grid cell is independent with no smoothing, producing a blocky, uncorrelated pattern.',
  },
  cellular: {
    label: 'Cellular Noise',
    description: 'Voronoi/cell-like pattern based on distance to scattered random points. Produces mosaic or cracked-earth patterns.',
  },
}

export function createBaseNoise2D(type, seed) {
  switch (type) {
    case 'perlin':
      return createPerlinNoise2D(seed)
    case 'white':
      return createWhiteNoise2D(seed)
    case 'cellular':
      return createCellularNoise2D(seed)
    case 'simplex':
    default:
      return createSimplexNoise2D(seed)
  }
}
