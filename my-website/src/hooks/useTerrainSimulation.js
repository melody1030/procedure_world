import { useCallback, useEffect, useRef, useState } from 'react'
import * as THREE from 'three'
import { erodeDroplets, growTowardTarget, meanAbsDiff, DEFAULT_EROSION_PARAMS } from '../lib/erosion'
import { bakeTerrainGeometry, applyHeightsToGeometry } from '../lib/terrainGeometry'

const FLAT_HEIGHT = 0.5
const GROWTH_DONE_EPSILON = 0.006
// Random particle placement means a few cells (often corners) can lag
// behind by chance — cap how long growth is allowed to run so it always
// hands off to erosion within a bounded time even in that worst case.
const GROWTH_TICK_CAP = 400
// The raw per-frame tick rate felt way too fast even at the minimum Speed
// setting — this throttles the whole simulation (both growing and eroding)
// down to 25% of that pace, independent of what "Speed" is set to.
const PACE_MULTIPLIER = 0.25

// Owns two height fields: `target` (the frozen noise map — see bake())
// and `live` (what's actually rendered). Outside simulation mode, `live`
// just mirrors `target` so the Noise tab keeps showing the live sculpted
// shape as before. The moment simulation mode is entered, `live` resets
// to flat and the running loop grows it toward `target`, then hands off
// to droplet erosion once it's close enough.
export function useTerrainSimulation({ sampleHeight, resolution, heightScale, simMode }) {
  const gridSize = resolution + 1
  const targetHeightfieldRef = useRef(new Float32Array(0))
  const liveHeightfieldRef = useRef(new Float32Array(0))
  const heightScaleRef = useRef(heightScale)
  const phaseRef = useRef('idle') // 'idle' | 'growing' | 'eroding'
  const wasSimModeRef = useRef(false)
  const growthTicksRef = useRef(0)

  const [terrain, setTerrain] = useState({ geometry: null, wireframeGeometry: null })
  const [bakeVersion, setBakeVersion] = useState(0)
  const [isRunning, setIsRunning] = useState(false)
  const [phase, setPhase] = useState('idle')
  const [erosionParams, setErosionParamsState] = useState(DEFAULT_EROSION_PARAMS)

  useEffect(() => {
    heightScaleRef.current = heightScale
  }, [heightScale])

  const setErosionParam = useCallback((key, value) => {
    setErosionParamsState((prev) => ({ ...prev, [key]: value }))
  }, [])

  const refreshWireframe = (geometry) => new THREE.WireframeGeometry(geometry)

  // Re-derive the target from the noise stack. Only ever fires while the
  // Noise tab's controls are reachable (simulation mode hides them), so
  // `live` mirroring `target` here is exactly "show the live noise shape".
  const bake = useCallback(() => {
    const { geometry, heights } = bakeTerrainGeometry(sampleHeight, resolution)
    targetHeightfieldRef.current = heights
    liveHeightfieldRef.current = heights.slice()
    phaseRef.current = 'idle'
    setPhase('idle')
    applyHeightsToGeometry(geometry, liveHeightfieldRef.current, heightScaleRef.current)
    setTerrain({ geometry, wireframeGeometry: refreshWireframe(geometry) })
    setBakeVersion((v) => v + 1)
    setIsRunning(false)
  }, [sampleHeight, resolution])

  useEffect(() => {
    bake()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sampleHeight, resolution])

  // Height Scale only rescales whatever `live` currently holds — never
  // touches the noise stack or resets simulation progress.
  useEffect(() => {
    if (!terrain.geometry) return
    applyHeightsToGeometry(terrain.geometry, liveHeightfieldRef.current, heightScale)
  }, [heightScale, terrain.geometry])

  const startFlat = useCallback(() => {
    if (!terrain.geometry) return
    liveHeightfieldRef.current = new Float32Array(targetHeightfieldRef.current.length).fill(FLAT_HEIGHT)
    phaseRef.current = 'growing'
    growthTicksRef.current = 0
    setPhase('growing')
    setIsRunning(false)
    applyHeightsToGeometry(terrain.geometry, liveHeightfieldRef.current, heightScaleRef.current)
    setTerrain((prev) => ({ ...prev, wireframeGeometry: refreshWireframe(prev.geometry) }))
  }, [terrain.geometry])

  const showFullTarget = useCallback(() => {
    if (!terrain.geometry) return
    liveHeightfieldRef.current = targetHeightfieldRef.current.slice()
    phaseRef.current = 'idle'
    setPhase('idle')
    setIsRunning(false)
    applyHeightsToGeometry(terrain.geometry, liveHeightfieldRef.current, heightScaleRef.current)
    setTerrain((prev) => ({ ...prev, wireframeGeometry: refreshWireframe(prev.geometry) }))
  }, [terrain.geometry])

  // Entering simulation mode freezes the current noise map as the target
  // (it simply stops changing, since the Noise controls are hidden while
  // this tab is open) and resets the visible terrain to flat. Leaving it
  // restores the live noise preview.
  useEffect(() => {
    if (!terrain.geometry) return
    if (simMode && !wasSimModeRef.current) {
      startFlat()
    } else if (!simMode && wasSimModeRef.current) {
      showFullTarget()
    }
    wasSimModeRef.current = simMode
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [simMode, terrain.geometry])

  // The running loop: grows `live` toward `target` first, then switches
  // to droplet erosion once the shape has caught up. Both phases share
  // the same paced tick accumulator.
  useEffect(() => {
    if (!isRunning || !terrain.geometry) return

    let cancelled = false
    let rafId
    let accumulator = 0

    function tick() {
      if (cancelled) return
      accumulator += Math.max(0.05, erosionParams.speed) * PACE_MULTIPLIER
      while (accumulator >= 1) {
        accumulator -= 1
        if (phaseRef.current === 'growing') {
          growTowardTarget(liveHeightfieldRef.current, targetHeightfieldRef.current, gridSize, erosionParams.particlesPerStep)
          growthTicksRef.current += 1
          const closeEnough = meanAbsDiff(liveHeightfieldRef.current, targetHeightfieldRef.current) < GROWTH_DONE_EPSILON
          if (closeEnough || growthTicksRef.current >= GROWTH_TICK_CAP) {
            phaseRef.current = 'eroding'
            setPhase('eroding')
          }
        } else {
          erodeDroplets(liveHeightfieldRef.current, gridSize, erosionParams, erosionParams.particlesPerStep)
        }
      }
      applyHeightsToGeometry(terrain.geometry, liveHeightfieldRef.current, heightScaleRef.current)
      rafId = requestAnimationFrame(tick)
    }

    rafId = requestAnimationFrame(tick)
    return () => {
      cancelled = true
      cancelAnimationFrame(rafId)
    }
  }, [isRunning, terrain.geometry, erosionParams, gridSize])

  const resetTerrain = useCallback(() => {
    startFlat()
  }, [startFlat])

  return {
    geometry: terrain.geometry,
    wireframeGeometry: terrain.wireframeGeometry,
    targetHeightfieldRef,
    gridSize,
    bakeVersion,
    isRunning,
    phase,
    start: useCallback(() => setIsRunning(true), []),
    stop: useCallback(() => setIsRunning(false), []),
    resetTerrain,
    erosionParams,
    setErosionParam,
  }
}
