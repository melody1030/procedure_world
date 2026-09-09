export default function Slider({ label, value, min, max, step, onChange, format, description }) {
  return (
    <label className="control-row">
      <span className="control-label">
        <span>{label}</span>
        <span className="control-value">{format ? format(value) : value}</span>
      </span>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(parseFloat(e.target.value))}
        onPointerUp={(e) => e.currentTarget.blur()}
      />
      {description && <span className="tooltip-bubble">{description}</span>}
    </label>
  )
}
