export default function TabBar({ tabs, active, onChange }) {
  return (
    <div className="tab-bar">
      {tabs.map((tab) => (
        <button
          key={tab.key}
          type="button"
          className={`tab-button ${tab.key === active ? 'tab-button-active' : ''}`}
          onClick={() => onChange(tab.key)}
        >
          {tab.label}
        </button>
      ))}
    </div>
  )
}
