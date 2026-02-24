import { Button } from './ui/button'
import { Checkbox } from './ui/checkbox'
import { Label } from './ui/label'
import { Popover, PopoverContent, PopoverTrigger } from './ui/popover'

interface TeamFilterProps {
  teams: string[]
  selectedTeams: Set<string>
  onTeamsChange: (teams: Set<string>) => void
}

function TeamFilter({ teams, selectedTeams, onTeamsChange }: TeamFilterProps) {
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
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="outline" size="sm">
          Teams ({selectedTeams.size}/{teams.length})
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80">
        <div className="space-y-4">
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handleSelectAll}
            >
              {selectedTeams.size === teams.length ? 'Deselect All' : 'Select All'}
            </Button>
            {selectedTeams.size > 0 && (
              <Button
                variant="outline"
                size="sm"
                onClick={handleClearAll}
              >
                Clear
              </Button>
            )}
          </div>

          <div className="max-h-64 overflow-y-auto space-y-2">
            {teams.map(team => (
              <div key={team} className="flex items-center gap-2">
                <Checkbox
                  id={`team-${team}`}
                  checked={selectedTeams.has(team)}
                  onCheckedChange={() => handleToggleTeam(team)}
                />
                <Label htmlFor={`team-${team}`} className="cursor-pointer flex-1">
                  {team}
                </Label>
              </div>
            ))}
          </div>
        </div>
      </PopoverContent>
    </Popover>
  )
}

export default TeamFilter
