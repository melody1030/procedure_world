// Fractal Brownian Motion: layers several frequencies of the same noise2D
// function to build the "noise equation" the sliders control.
export function fbm(noise2D, x, y, { octaves = 4, lacunarity = 2, persistence = 0.5 } = {}) {
  let amplitude = 1
  let frequency = 1
  let sum = 0
  let maxAmplitude = 0

  for (let o = 0; o < octaves; o++) {
    sum += noise2D(x * frequency, y * frequency) * amplitude
    maxAmplitude += amplitude
    amplitude *= persistence
    frequency *= lacunarity
  }

  return sum / maxAmplitude // normalized back to roughly [-1, 1]
}
