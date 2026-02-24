import './UCIRankFilter.css'

interface UCIRankFilterProps {
  maxRank: number
  onRankChange: (rank: number) => void
}

function UCIRankFilter({ maxRank, onRankChange }: UCIRankFilterProps) {
  const handleSliderChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onRankChange(parseInt(e.target.value, 10))
  }

  const handleReset = () => {
    onRankChange(2096)
  }

  // Predefined presets for common rank thresholds
  const presets = [
    { label: 'Top 50', value: 50 },
    { label: 'Top 100', value: 100 },
    { label: 'Top 200', value: 200 },
    { label: 'Top 500', value: 500 },
    { label: 'Top 1000', value: 1000 },
    { label: 'All', value: 2096 },
  ]

  return (
    <div className="uci-rank-filter">
      <div className="filter-header">
        <h3>UCI Rank Filter</h3>
        {maxRank < 2096 && (
          <button className="reset-btn" onClick={handleReset}>
            Reset
          </button>
        )}
      </div>

      <div className="rank-display">
        <span className="rank-label">Max Rank:</span>
        <span className="rank-value">
          {maxRank === 2096 ? 'All Riders' : `#${maxRank}`}
        </span>
      </div>

      <input
        type="range"
        min="1"
        max="2096"
        value={maxRank}
        onChange={handleSliderChange}
        className="rank-slider"
      />

      <div className="preset-buttons">
        {presets.map(preset => (
          <button
            key={preset.value}
            className={`preset-btn ${maxRank === preset.value ? 'active' : ''}`}
            onClick={() => onRankChange(preset.value)}
          >
            {preset.label}
          </button>
        ))}
      </div>
    </div>
  )
}

export default UCIRankFilter
