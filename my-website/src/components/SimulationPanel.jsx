import Slider from './Slider'

const RUNNING_PHASE_LABEL = {
  idle: 'Ready',
  growing: 'Forming terrain from the noise map…',
  eroding: 'Eroding…',
}

function statusLabel(isRunning, phase) {
  if (!isRunning) return phase === 'growing' ? 'Paused — press Start to grow the terrain' : 'Ready'
  return RUNNING_PHASE_LABEL[phase] ?? RUNNING_PHASE_LABEL.idle
}

export default function SimulationPanel({ isRunning, phase, start, stop, resetTerrain, erosionParams, setErosionParam }) {
  return (
    <div className="controls-panel">
      <section>
        <h2>Simulation</h2>
        <div className="sim-buttons">
          <button
            type="button"
            className={`sim-button ${isRunning ? 'sim-button-stop' : 'sim-button-start'}`}
            onClick={isRunning ? stop : start}
          >
            {isRunning ? 'Stop' : 'Start'}
          </button>
          <button type="button" className="sim-button sim-button-reset" onClick={resetTerrain}>
            Reset Terrain
          </button>
        </div>
        <p className="sim-status">{statusLabel(isRunning, phase)}</p>
      </section>

      <section>
        <h2>Pacing</h2>
        <Slider
          label="Particles per Step"
          value={erosionParams.particlesPerStep}
          min={1}
          max={200}
          step={1}
          onChange={(v) => setErosionParam('particlesPerStep', Math.round(v))}
          description="How many water droplets are simulated in each simulation step."
        />
        <Slider
          label="Speed"
          value={erosionParams.speed}
          min={1}
          max={20}
          step={1}
          onChange={(v) => setErosionParam('speed', Math.round(v))}
          description="How many simulation steps run per rendered frame. Higher fast-forwards the erosion."
        />
      </section>

      <section>
        <h2>Droplet Physics</h2>
        <Slider
          label="Inertia"
          value={erosionParams.inertia}
          min={0}
          max={0.9}
          step={0.01}
          format={(v) => v.toFixed(2)}
          onChange={(v) => setErosionParam('inertia', v)}
          description="How much a droplet keeps moving in its previous direction instead of turning to follow the slope. Higher values create longer, more meandering channels."
        />
        <Slider
          label="Erode Speed"
          value={erosionParams.erodeSpeed}
          min={0}
          max={1}
          step={0.01}
          format={(v) => v.toFixed(2)}
          onChange={(v) => setErosionParam('erodeSpeed', v)}
          description="How aggressively a droplet carves into the terrain when it could carry more sediment than it currently has."
        />
        <Slider
          label="Deposit Speed"
          value={erosionParams.depositSpeed}
          min={0}
          max={1}
          step={0.01}
          format={(v) => v.toFixed(2)}
          onChange={(v) => setErosionParam('depositSpeed', v)}
          description="How readily a droplet drops sediment once it's carrying more than it can hold."
        />
        <Slider
          label="Evaporation"
          value={erosionParams.evaporateSpeed}
          min={0.001}
          max={0.1}
          step={0.001}
          format={(v) => v.toFixed(3)}
          onChange={(v) => setErosionParam('evaporateSpeed', v)}
          description="How quickly a droplet dries up. Higher values mean shorter-lived droplets and more localized erosion."
        />
      </section>
    </div>
  )
}
