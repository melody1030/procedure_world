import { SHAPES } from '../lib/shaping'
import { NOISE_TYPES } from '../lib/baseNoise'
import Slider from './Slider'
import NumberField from './NumberField'
import Dropdown from './Dropdown'

export default function ControlsPanel({ params, setParam }) {
  const shape = SHAPES[params.shape]

  return (
    <div className="controls-panel">
      <section>
        <h2>Noise Equation</h2>
        <Dropdown
          label="Noise Type"
          value={params.noiseType}
          options={NOISE_TYPES}
          onChange={(v) => setParam('noiseType', v)}
          description={NOISE_TYPES[params.noiseType].description}
        />
        <Slider
          label="Frequency"
          value={params.frequency}
          min={0.1}
          max={3}
          step={0.01}
          format={(v) => v.toFixed(2)}
          onChange={(v) => setParam('frequency', v)}
          description="How zoomed-in the noise pattern is. Higher values pack more, smaller bumps into the same space."
        />
        <Slider
          label="Octaves"
          value={params.octaves}
          min={1}
          max={8}
          step={1}
          onChange={(v) => setParam('octaves', Math.round(v))}
          description="How many layers of noise are stacked together. More octaves add finer detail on top of the base shape."
        />
        <Slider
          label="Lacunarity"
          value={params.lacunarity}
          min={1}
          max={4}
          step={0.01}
          format={(v) => v.toFixed(2)}
          onChange={(v) => setParam('lacunarity', v)}
          description="How much the frequency multiplies with each added octave. Higher values make the extra detail layers tighter."
        />
        <Slider
          label="Persistence"
          value={params.persistence}
          min={0.1}
          max={1}
          step={0.01}
          format={(v) => v.toFixed(2)}
          onChange={(v) => setParam('persistence', v)}
          description="How much each octave's strength shrinks. Higher values let finer octaves contribute more, making the surface rougher."
        />
        <NumberField
          label="Seed"
          value={params.seed}
          min={1}
          max={9999}
          step={1}
          onChange={(v) => setParam('seed', Math.round(v))}
          description="Changes the random noise pattern while keeping all other settings the same."
        />
      </section>

      <section>
        <h2>Grid</h2>
        <Slider
          label="Resolution"
          value={params.resolution}
          min={4}
          max={128}
          step={1}
          onChange={(v) => setParam('resolution', Math.round(v))}
          description="Number of grid segments per side. Higher values give a smoother, more detailed mesh but take more time to compute."
        />
        <Slider
          label="Height Scale"
          value={params.heightScale}
          min={-1}
          max={1}
          step={0.01}
          format={(v) => v.toFixed(2)}
          onChange={(v) => setParam('heightScale', v)}
          description="Multiplies how tall the peaks and valleys appear in the 3D view. Negative values flip peaks into valleys. Does not affect the 2D preview or the underlying noise values."
        />
      </section>

      <section>
        <h2>Shaping</h2>
        <Dropdown
          label="Operation"
          value={params.shape}
          options={SHAPES}
          onChange={(v) => setParam('shape', v)}
          description={shape.description}
        />
        {shape.paramLabel && (
          <Slider
            label={shape.paramLabel}
            value={params.shapeParam}
            min={0}
            max={1}
            step={0.01}
            format={(v) => v.toFixed(2)}
            onChange={(v) => setParam('shapeParam', v)}
            description={shape.paramDescription}
          />
        )}
      </section>
    </div>
  )
}
