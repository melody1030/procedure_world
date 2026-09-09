import { createBaseNoise2D } from './baseNoise'
import { fbm } from './fbm'
import { SHAPES } from './shaping'

// Builds one sample(x, y) -> height-in-[0,1] function from the current
// control panel params. The 3D grid and the 2D preview both call this,
// so they always show the same field.
export function makeHeightSampler({ seed, noiseType, frequency, octaves, lacunarity, persistence, shape, shapeParam }) {
  const noise2D = createBaseNoise2D(noiseType, seed)
  const shaper = SHAPES[shape] ?? SHAPES.linear

  return function sample(x, y) {
    const raw = fbm(noise2D, x * frequency, y * frequency, { octaves, lacunarity, persistence })
    // Perlin/simplex aren't strictly bounded to [-1, 1] the way white/cellular
    // are, so clamp before shaping — an out-of-range value here (e.g. slightly
    // negative) turns into NaN through Math.pow() in the Power shaping op.
    const normalized = Math.min(1, Math.max(0, (raw + 1) / 2))
    const shaped = shaper.apply(normalized, shapeParam)
    return Math.min(1, Math.max(0, shaped))
  }
}
