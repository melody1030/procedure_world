// Droplet-based hydraulic erosion (Beyer 2015 / Lague-style implementation),
// operating directly on a flat Float32Array heightmap in grid-index space.

const EROSION_RADIUS = 3

// A distance-weighted disc of offsets, precomputed once. Both erode and
// deposit spread their amount across this brush rather than a single
// bilinear footprint — a narrow footprint lets sediment pile up onto one
// cell whenever many droplets converge on the same low point, producing
// sharp needle spikes instead of smooth channels.
function buildBrush(radius) {
  const r = Math.ceil(radius)
  const offsets = []
  let weightSum = 0
  for (let dy = -r; dy <= r; dy++) {
    for (let dx = -r; dx <= r; dx++) {
      const dist = Math.sqrt(dx * dx + dy * dy)
      if (dist <= radius) {
        const weight = 1 - dist / radius
        offsets.push([dx, dy, weight])
        weightSum += weight
      }
    }
  }
  return offsets.map(([dx, dy, weight]) => [dx, dy, weight / weightSum])
}

const BRUSH = buildBrush(EROSION_RADIUS)

function heightAndGradient(heights, gridSize, x, y) {
  const col = Math.floor(x)
  const row = Math.floor(y)
  const fx = x - col
  const fy = y - row

  const at = (r, c) => heights[r * gridSize + c]

  const h00 = at(row, col)
  const h10 = at(row, col + 1)
  const h01 = at(row + 1, col)
  const h11 = at(row + 1, col + 1)

  const gradX = (h10 - h00) * (1 - fy) + (h11 - h01) * fy
  const gradY = (h01 - h00) * (1 - fx) + (h11 - h10) * fx
  const height = h00 * (1 - fx) * (1 - fy) + h10 * fx * (1 - fy) + h01 * (1 - fx) * fy + h11 * fx * fy

  return { height, gradX, gradY }
}

function applyBrush(heights, gridSize, x, y, amount) {
  const cx = Math.round(x)
  const cy = Math.round(y)
  for (let b = 0; b < BRUSH.length; b++) {
    const [dx, dy, weight] = BRUSH[b]
    const c = cx + dx
    const r = cy + dy
    if (c < 0 || c >= gridSize || r < 0 || r >= gridSize) continue
    heights[r * gridSize + c] += amount * weight
  }
}

function simulateDroplet(heights, gridSize, params, rng) {
  const {
    inertia,
    sedimentCapacityFactor,
    minSedimentCapacity,
    erodeSpeed,
    depositSpeed,
    evaporateSpeed,
    gravity,
    maxLifetime,
  } = params

  // Keep enough margin that the brush never reads/writes out of bounds.
  const margin = EROSION_RADIUS + 1
  let x = margin + rng() * (gridSize - margin * 2)
  let y = margin + rng() * (gridSize - margin * 2)
  let dirX = 0
  let dirY = 0
  let speed = 1
  let water = 1
  let sediment = 0

  for (let step = 0; step < maxLifetime; step++) {
    const { height: oldHeight, gradX, gradY } = heightAndGradient(heights, gridSize, x, y)

    dirX = dirX * inertia - gradX * (1 - inertia)
    dirY = dirY * inertia - gradY * (1 - inertia)
    const len = Math.sqrt(dirX * dirX + dirY * dirY) || 1
    dirX /= len
    dirY /= len

    x += dirX
    y += dirY

    if (x < margin || x >= gridSize - margin || y < margin || y >= gridSize - margin) break

    const { height: newHeight } = heightAndGradient(heights, gridSize, x, y)
    const deltaHeight = newHeight - oldHeight

    const capacity = Math.max(-deltaHeight * speed * water * sedimentCapacityFactor, minSedimentCapacity)

    if (sediment > capacity || deltaHeight > 0) {
      const deposit = deltaHeight > 0 ? Math.min(deltaHeight, sediment) : (sediment - capacity) * depositSpeed
      sediment -= deposit
      applyBrush(heights, gridSize, x, y, deposit)
    } else {
      const erode = Math.min((capacity - sediment) * erodeSpeed, -deltaHeight)
      applyBrush(heights, gridSize, x, y, -erode)
      sediment += erode
    }

    speed = Math.sqrt(Math.max(0, speed * speed - deltaHeight * gravity))
    water *= 1 - evaporateSpeed

    if (water < 0.01) break
  }
}

export function erodeDroplets(heights, gridSize, params, count, rng = Math.random) {
  for (let i = 0; i < count; i++) {
    simulateDroplet(heights, gridSize, params, rng)
  }
  // Long runs can drift a cell slightly outside [0,1] via repeated
  // deposit/erode — clamp once per batch rather than per-droplet.
  for (let i = 0; i < heights.length; i++) {
    heights[i] = Math.min(1, Math.max(0, heights[i]))
  }
}

export const DEFAULT_EROSION_PARAMS = {
  particlesPerStep: 40,
  speed: 1,
  inertia: 0.05,
  sedimentCapacityFactor: 4,
  minSedimentCapacity: 0.01,
  erodeSpeed: 0.3,
  depositSpeed: 0.3,
  evaporateSpeed: 0.02,
  gravity: 4,
  maxLifetime: 30,
}

// --- Growth phase -----------------------------------------------------
// Before erosion has anything to work with, the terrain starts flat and
// "grows" toward the frozen target (the baked noise map) — random
// particles each nudge a soft, unnormalized falloff disc of cells toward
// their target value, so the shape reveals itself organically rather
// than fading in as one uniform blend.
const GROWTH_RATE = 0.6

const GROWTH_BRUSH = (() => {
  const r = Math.ceil(EROSION_RADIUS)
  const offsets = []
  for (let dy = -r; dy <= r; dy++) {
    for (let dx = -r; dx <= r; dx++) {
      const dist = Math.sqrt(dx * dx + dy * dy)
      if (dist <= EROSION_RADIUS) offsets.push([dx, dy, 1 - dist / EROSION_RADIUS])
    }
  }
  return offsets
})()

function growAt(live, target, gridSize, x, y) {
  const cx = Math.round(x)
  const cy = Math.round(y)
  for (let b = 0; b < GROWTH_BRUSH.length; b++) {
    const [dx, dy, w] = GROWTH_BRUSH[b]
    const c = cx + dx
    const r = cy + dy
    if (c < 0 || c >= gridSize || r < 0 || r >= gridSize) continue
    const idx = r * gridSize + c
    live[idx] += (target[idx] - live[idx]) * GROWTH_RATE * w
  }
}

export function growTowardTarget(live, target, gridSize, count, rng = Math.random) {
  for (let i = 0; i < count; i++) {
    const x = rng() * (gridSize - 1)
    const y = rng() * (gridSize - 1)
    growAt(live, target, gridSize, x, y)
  }
}

// Average remaining gap between the live surface and its target — used
// to decide when growth is "done" and erosion should take over. Mean
// rather than max: random particle placement means a handful of corner/
// edge cells converge slower than the rest by pure chance, and gating on
// the single worst cell could stall the whole transition indefinitely.
export function meanAbsDiff(live, target) {
  let sum = 0
  for (let i = 0; i < live.length; i++) {
    sum += Math.abs(target[i] - live[i])
  }
  return sum / live.length
}
