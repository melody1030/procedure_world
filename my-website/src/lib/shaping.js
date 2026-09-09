// Shaping operations for the dropdown. Each takes a normalized noise value
// v in [0, 1] and its own single slider param p in [0, 1].
export const SHAPES = {
  linear: {
    label: 'Linear (none)',
    description: 'Passes the noise value through unchanged.',
    paramLabel: null,
    paramDescription: null,
    apply: (v) => v,
  },
  power: {
    label: 'Power',
    description:
      'Raises the noise value to an exponent. Values above 1 sharpen peaks and flatten valleys; below 1 does the opposite.',
    paramLabel: 'Exponent',
    paramDescription: 'Exponent from 0.2 (flattened, plateau-like) to 5 (sharp, spiky peaks).',
    apply: (v, p) => Math.pow(v, 0.2 + p * 4.8), // exponent range ~0.2 - 5
  },
  threshold: {
    label: 'Threshold',
    description: 'Turns the noise into solid mesas: anything above the cutoff becomes flat high ground, everything below becomes flat low ground.',
    paramLabel: 'Cutoff',
    paramDescription: 'The noise level that separates high ground from low ground.',
    apply: (v, p) => (v > p ? 1 : 0),
  },
  smoothstepBand: {
    label: 'Smoothstep Band',
    description: 'Highlights a soft band of noise values, fading smoothly on both sides — useful for coastlines or ridgelines.',
    paramLabel: 'Band Center',
    paramDescription: 'Where the highlighted band is centered, from low noise values to high.',
    apply: (v, p) => {
      const edge0 = Math.max(0, p - 0.1)
      const edge1 = Math.min(1, p + 0.1)
      const t = Math.min(1, Math.max(0, (v - edge0) / (edge1 - edge0 || 1e-6)))
      return t * t * (3 - 2 * t)
    },
  },
  terrace: {
    label: 'Terrace',
    description: 'Quantizes the surface into flat stair-step terraces instead of a smooth gradient.',
    paramLabel: 'Steps',
    paramDescription: 'Number of terrace steps, from 2 (very blocky) to 20 (nearly smooth).',
    apply: (v, p) => {
      const steps = Math.round(2 + p * 18) // 2 - 20 steps
      return Math.round(v * steps) / steps
    },
  },
}
