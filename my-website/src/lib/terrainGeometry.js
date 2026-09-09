import * as THREE from 'three'
import { WORLD_SIZE } from './constants'

const heightColor = new THREE.Color()

// Writes a heights array (one entry per vertex, 0..1) into a geometry's
// Y position and vertex colors, then recomputes normals. Shared by the
// initial bake and by the erosion loop's per-frame updates.
export function applyHeightsToGeometry(geometry, heights, heightScale) {
  const pos = geometry.attributes.position
  const colorAttr = geometry.attributes.color

  for (let i = 0; i < pos.count; i++) {
    const h = heights[i]
    pos.setY(i, (h - 0.5) * heightScale)

    heightColor.setHSL(0.62 - h * 0.55, 0.65, 0.25 + h * 0.5)
    colorAttr.setXYZ(i, heightColor.r, heightColor.g, heightColor.b)
  }

  pos.needsUpdate = true
  colorAttr.needsUpdate = true
  geometry.computeVertexNormals()
}

// Builds a fresh plane geometry + a freshly-sampled heights array from the
// current noise stack. This is the "bake" step: it throws away any prior
// erosion and re-derives the height field straight from sampleHeight.
export function bakeTerrainGeometry(sampleHeight, resolution) {
  const geometry = new THREE.PlaneGeometry(WORLD_SIZE, WORLD_SIZE, resolution, resolution)
  geometry.rotateX(-Math.PI / 2)

  const pos = geometry.attributes.position
  const heights = new Float32Array(pos.count)
  for (let i = 0; i < pos.count; i++) {
    heights[i] = sampleHeight(pos.getX(i), pos.getZ(i))
  }

  geometry.setAttribute('color', new THREE.BufferAttribute(new Float32Array(pos.count * 3), 3))

  return { geometry, heights }
}
