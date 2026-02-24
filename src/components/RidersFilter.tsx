import { useState } from 'react'
import './RidersFilter.css'

interface RidersFilterProps {
  riders: Array<{ name: string; team: string }>
  selectedRiders: Set<string>
  onRidersChange: (riders: Set<string>) => void
}

export default function RidersFilter({ riders, selectedRiders, onRidersChange }: RidersFilterProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')

  const filteredRiders = riders.filter(rider =>
    rider.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    rider.team.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const handleRiderToggle = (riderName: string) => {
    const newSelected = new Set(selectedRiders)
    if (newSelected.has(riderName)) {
      newSelected.delete(riderName)
    } else {
      newSelected.add(riderName)
    }
    onRidersChange(newSelected)
  }

  const handleSelectAll = () => {
    if (selectedRiders.size === filteredRiders.length) {
      onRidersChange(new Set())
    } else {
      onRidersChange(new Set(filteredRiders.map(r => r.name)))
    }
  }

  const handleClearAll = () => {
    onRidersChange(new Set())
  }

  return (
    <div className="riders-filter">
      <button
        className="dropdown-toggle"
        onClick={() => setIsOpen(!isOpen)}
      >
        Riders ({selectedRiders.size})
        <span className="dropdown-arrow">▼</span>
      </button>

      {isOpen && (
        <div className="dropdown-menu">
          <div className="filter-search">
            <input
              type="text"
              placeholder="Search riders..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="search-input"
            />
          </div>

          <div className="dropdown-actions">
            <button
              className="btn btn-sm btn-secondary"
              onClick={handleSelectAll}
            >
              {selectedRiders.size === filteredRiders.length && filteredRiders.length > 0 ? 'Clear All' : 'Select All'}
            </button>
            {selectedRiders.size > 0 && (
              <button
                className="btn btn-sm btn-secondary"
                onClick={handleClearAll}
              >
                Clear
              </button>
            )}
          </div>

          <div className="dropdown-items">
            {filteredRiders.length > 0 ? (
              filteredRiders.map(rider => (
                <label key={rider.name} className="dropdown-item">
                  <input
                    type="checkbox"
                    checked={selectedRiders.has(rider.name)}
                    onChange={() => handleRiderToggle(rider.name)}
                  />
                  <span className="rider-name">{rider.name}</span>
                  <span className="rider-team">{rider.team}</span>
                </label>
              ))
            ) : (
              <div className="no-results">No riders found</div>
            )}
          </div>
        </div>
      )}

      {selectedRiders.size > 0 && (
        <div className="selected-riders">
          {Array.from(selectedRiders).slice(0, 2).map(riderName => (
            <span key={riderName} className="rider-tag">
              {riderName}
              <button
                className="tag-remove"
                onClick={() => {
                  const newSelected = new Set(selectedRiders)
                  newSelected.delete(riderName)
                  onRidersChange(newSelected)
                }}
              >
                ×
              </button>
            </span>
          ))}
          {selectedRiders.size > 2 && (
            <span className="rider-tag">+{selectedRiders.size - 2} more</span>
          )}
        </div>
      )}
    </div>
  )
}
