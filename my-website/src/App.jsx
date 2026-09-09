import { useMemo, useState } from 'react'
import Scene3D from './components/Scene3D'
import NoisePreview2D from './components/NoisePreview2D'
import ControlsPanel from './components/ControlsPanel'
import SimulationPanel from './components/SimulationPanel'
import TabBar from './components/TabBar'
import { makeHeightSampler } from './lib/heightField'
import { useTerrainSimulation } from './hooks/useTerrainSimulation'
import './App.css'

const DEFAULT_PARAMS = {
  noiseType: 'simplex',
  seed: 1,
  frequency: 1.2,
  octaves: 4,
  lacunarity: 2.0,
  persistence: 0.5,
  resolution: 48,
  heightScale: 0.8,
  shape: 'linear',
  shapeParam: 0.5,
}

const TABS = [
  { key: 'noise', label: 'Noise' },
  { key: 'simulation', label: 'Simulation' },
]

function App() {
  const [params, setParams] = useState(DEFAULT_PARAMS)
  const [activeTab, setActiveTab] = useState('noise')

  const setParam = (key, value) => setParams((prev) => ({ ...prev, [key]: value }))

  // Deliberately NOT keyed on the whole `params` object: heightScale and
  // resolution don't affect the sampled noise values, and a stray new
  // `sampleHeight` reference on every param change would make the
  // simulation hook think the noise stack changed and rebake (wiping out
  // erosion progress) just from dragging Height Scale mid-simulation.
  const sampleHeight = useMemo(
    () => makeHeightSampler(params),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [params.noiseType, params.seed, params.frequency, params.octaves, params.lacunarity, params.persistence, params.shape, params.shapeParam],
  )

  const sim = useTerrainSimulation({
    sampleHeight,
    resolution: params.resolution,
    heightScale: params.heightScale,
    simMode: activeTab === 'simulation',
  })

  return (
    <div className="app-shell">
      <div className="viewport-3d">
        <Scene3D geometry={sim.geometry} wireframeGeometry={sim.wireframeGeometry} isRunning={sim.isRunning} />
      </div>
      <aside className="side-panel">
        <div className="panel-sticky-header">
          <h1>Procedural Noise Grid</h1>
          <NoisePreview2D
            heightfieldRef={sim.targetHeightfieldRef}
            gridSize={sim.gridSize}
            bakeVersion={sim.bakeVersion}
          />
          <TabBar tabs={TABS} active={activeTab} onChange={setActiveTab} />
        </div>
        {activeTab === 'noise' ? (
          <ControlsPanel params={params} setParam={setParam} />
        ) : (
          <SimulationPanel
            isRunning={sim.isRunning}
            phase={sim.phase}
            start={sim.start}
            stop={sim.stop}
            resetTerrain={sim.resetTerrain}
            erosionParams={sim.erosionParams}
            setErosionParam={sim.setErosionParam}
          />
        )}
      </aside>
    </div>
  )
}

export default App
