// Seedable 2D simplex noise. Self-contained (no dependency) port of the
// standard Gustavson simplex algorithm, seeded with a small PRNG so the
// permutation table is reproducible from a single "seed" slider value.

const F2 = 0.5 * (Math.sqrt(3) - 1)
const G2 = (3 - Math.sqrt(3)) / 6

const GRAD3 = [
  [1, 1, 0], [-1, 1, 0], [1, -1, 0], [-1, -1, 0],
  [1, 0, 1], [-1, 0, 1], [1, 0, -1], [-1, 0, -1],
  [0, 1, 1], [0, -1, 1], [0, 1, -1], [0, -1, -1],
]

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

// Returns a noise2D(x, y) function producing values roughly in [-1, 1]
export function createNoise2D(seed = 1) {
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

  return function noise2D(xin, yin) {
    let n0 = 0
    let n1 = 0
    let n2 = 0

    const s = (xin + yin) * F2
    const i = Math.floor(xin + s)
    const j = Math.floor(yin + s)
    const t = (i + j) * G2
    const X0 = i - t
    const Y0 = j - t
    const x0 = xin - X0
    const y0 = yin - Y0

    let i1
    let j1
    if (x0 > y0) {
      i1 = 1
      j1 = 0
    } else {
      i1 = 0
      j1 = 1
    }

    const x1 = x0 - i1 + G2
    const y1 = y0 - j1 + G2
    const x2 = x0 - 1 + 2 * G2
    const y2 = y0 - 1 + 2 * G2

    const ii = i & 255
    const jj = j & 255

    const gi0 = perm[ii + perm[jj]] % 12
    const gi1 = perm[ii + i1 + perm[jj + j1]] % 12
    const gi2 = perm[ii + 1 + perm[jj + 1]] % 12

    let t0 = 0.5 - x0 * x0 - y0 * y0
    if (t0 >= 0) {
      t0 *= t0
      n0 = t0 * t0 * (GRAD3[gi0][0] * x0 + GRAD3[gi0][1] * y0)
    }

    let t1 = 0.5 - x1 * x1 - y1 * y1
    if (t1 >= 0) {
      t1 *= t1
      n1 = t1 * t1 * (GRAD3[gi1][0] * x1 + GRAD3[gi1][1] * y1)
    }

    let t2 = 0.5 - x2 * x2 - y2 * y2
    if (t2 >= 0) {
      t2 *= t2
      n2 = t2 * t2 * (GRAD3[gi2][0] * x2 + GRAD3[gi2][1] * y2)
    }

    return 70 * (n0 + n1 + n2)
  }
}
