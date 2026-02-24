import './RaceFilter.css'

interface RaceFilterProps {
  races: string[]
  selectedRaces: Set<string>
  onRacesChange: (races: Set<string>) => void
}

export default function RaceFilter({ races, selectedRaces, onRacesChange }: RaceFilterProps) {
  const handleRaceToggle = (race: string) => {
    const newSelected = new Set(selectedRaces)
    if (newSelected.has(race)) {
      newSelected.delete(race)
    } else {
      newSelected.add(race)
    }
    onRacesChange(newSelected)
  }

  const handleSelectAll = () => {
    if (selectedRaces.size === races.length) {
      onRacesChange(new Set())
    } else {
      onRacesChange(new Set(races))
    }
  }

  const handleClearAll = () => {
    onRacesChange(new Set())
  }

  return (
    <div className="race-filter">
      <div className="filter-header">
        <h2>Filter by Races</h2>
        <div className="filter-actions">
          <button 
            className="btn btn-secondary" 
            onClick={handleSelectAll}
          >
            {selectedRaces.size === races.length ? 'Clear All' : 'Select All'}
          </button>
          {selectedRaces.size > 0 && (
            <button 
              className="btn btn-secondary" 
              onClick={handleClearAll}
            >
              Clear Selection
            </button>
          )}
        </div>
      </div>

      <div className="races-grid">
        {races.map(race => (
          <label key={race} className="race-checkbox">
            <input
              type="checkbox"
              checked={selectedRaces.has(race)}
              onChange={() => handleRaceToggle(race)}
            />
            <span>{race}</span>
          </label>
        ))}
      </div>

      {selectedRaces.size > 0 && (
        <div className="filter-status">
          <p>Filtering by {selectedRaces.size} race{selectedRaces.size !== 1 ? 's' : ''}</p>
        </div>
      )}
    </div>
  )
}
