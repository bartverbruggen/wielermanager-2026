import { useState } from 'react'
import './RacesDropdown.css'

interface RacesDropdownProps {
  races: string[]
  selectedRaces: Set<string>
  onRacesChange: (races: Set<string>) => void
}

export default function RacesDropdown({ races, selectedRaces, onRacesChange }: RacesDropdownProps) {
  const [isOpen, setIsOpen] = useState(false)

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
    <div className="races-dropdown">
      <button
        className="dropdown-toggle"
        onClick={() => setIsOpen(!isOpen)}
      >
        Races ({selectedRaces.size})
        <span className="dropdown-arrow">▼</span>
      </button>

      {isOpen && (
        <div className="dropdown-menu">
          <div className="dropdown-actions">
            <button
              className="btn btn-sm btn-secondary"
              onClick={handleSelectAll}
            >
              {selectedRaces.size === races.length ? 'Clear All' : 'Select All'}
            </button>
            {selectedRaces.size > 0 && (
              <button
                className="btn btn-sm btn-secondary"
                onClick={handleClearAll}
              >
                Clear
              </button>
            )}
          </div>

          <div className="dropdown-items">
            {races.map(race => (
              <label key={race} className="dropdown-item">
                <input
                  type="checkbox"
                  checked={selectedRaces.has(race)}
                  onChange={() => handleRaceToggle(race)}
                />
                <span>{race}</span>
              </label>
            ))}
          </div>
        </div>
      )}

      {selectedRaces.size > 0 && (
        <div className="selected-races">
          {Array.from(selectedRaces).slice(0, 3).map(race => (
            <span key={race} className="race-tag">
              {race}
              <button
                className="tag-remove"
                onClick={() => {
                  const newSelected = new Set(selectedRaces)
                  newSelected.delete(race)
                  onRacesChange(newSelected)
                }}
              >
                ×
              </button>
            </span>
          ))}
          {selectedRaces.size > 3 && (
            <span className="race-tag">+{selectedRaces.size - 3} more</span>
          )}
        </div>
      )}
    </div>
  )
}
