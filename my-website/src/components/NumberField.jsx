import { useEffect, useState } from 'react'

export default function NumberField({ label, value, min, max, step = 1, onChange, description }) {
  const [text, setText] = useState(String(value))

  // Keep the input in sync if the value changes from elsewhere (e.g. a reset)
  useEffect(() => {
    setText(String(value))
  }, [value])

  const commit = () => {
    let v = parseFloat(text)
    if (Number.isNaN(v)) v = min
    v = Math.min(max, Math.max(min, v))
    setText(String(v))
    onChange(v)
  }

  return (
    <label className="control-row">
      <span className="control-label">
        <span>{label}</span>
        <span className="control-range">
          min {min} &ndash; max {max}
        </span>
      </span>
      <input
        type="number"
        className="number-input"
        min={min}
        max={max}
        step={step}
        value={text}
        onChange={(e) => setText(e.target.value)}
        onBlur={commit}
        onKeyDown={(e) => {
          if (e.key === 'Enter') e.currentTarget.blur()
        }}
      />
      {description && <span className="tooltip-bubble">{description}</span>}
    </label>
  )
}
