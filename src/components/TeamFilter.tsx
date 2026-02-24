import { useState } from 'react'
import './TeamFilter.css'

interface TeamFilterProps {
  teams: string[]
  selectedTeams: Set<string>
  onTeamsChange: (teams: Set<string>) => void
}

function TeamFilter({ teams, selectedTeams, onTeamsChange }: TeamFilterProps) {
  const [isExpanded, setIsExpanded] = useState(false)

  const handleToggleTeam = (team: string) => {
    const newTeams = new Set(selectedTeams)
    if (newTeams.has(team)) {
      newTeams.delete(team)
    } else {
      newTeams.add(team)
    }
    onTeamsChange(newTeams)
  }

  const handleSelectAll = () => {
    if (selectedTeams.size === teams.length) {
      onTeamsChange(new Set())
    } else {
      onTeamsChange(new Set(teams))
    }
  }

  const handleClearAll = () => {
    onTeamsChange(new Set())
  }

  return (
    <div className="team-filter">
      <div className="filter-header">
        <h3>Teams ({selectedTeams.size}/{teams.length})</h3>
        <button
          className="expand-toggle"
          onClick={() => setIsExpanded(!isExpanded)}
        >
          {isExpanded ? '▼' : '▶'}
        </button>
      </div>

      {isExpanded && (
        <>
          <div className="filter-actions">
            <button
              className="action-btn"
              onClick={handleSelectAll}
            >
              {selectedTeams.size === teams.length ? 'Deselect All' : 'Select All'}
            </button>
            <button
              className="action-btn clear-btn"
              onClick={handleClearAll}
              disabled={selectedTeams.size === 0}
            >
              Clear
            </button>
          </div>

          <div className="teams-list">
            {teams.map(team => (
              <label key={team} className="team-checkbox">
                <input
                  type="checkbox"
                  checked={selectedTeams.has(team)}
                  onChange={() => handleToggleTeam(team)}
                />
                <span className="team-name">{team}</span>
              </label>
            ))}
          </div>
        </>
      )}
    </div>
  )
}

export default TeamFilter
