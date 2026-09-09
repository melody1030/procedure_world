export default function Dropdown({ label, value, options, onChange, description }) {
  return (
    <label className="control-row">
      <span className="control-label">
        <span>{label}</span>
      </span>
      <select value={value} onChange={(e) => onChange(e.target.value)} title={description}>
        {Object.entries(options).map(([key, opt]) => (
          <option key={key} value={key} title={opt.description}>
            {opt.label}
          </option>
        ))}
      </select>
      {description && <span className="tooltip-bubble">{description}</span>}
    </label>
  )
}
