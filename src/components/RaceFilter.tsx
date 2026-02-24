import { Button } from './ui/button'
import { Checkbox } from './ui/checkbox'
import { Label } from './ui/label'
import { Popover, PopoverContent, PopoverTrigger } from './ui/popover'

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
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="outline">
          Races ({selectedRaces.size}/{races.length})
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
              {selectedRaces.size === races.length ? 'Clear All' : 'Select All'}
            </Button>
            {selectedRaces.size > 0 && (
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
            {races.map(race => (
              <div key={race} className="flex items-center gap-2">
                <Checkbox
                  id={`race-${race}`}
                  checked={selectedRaces.has(race)}
                  onCheckedChange={() => handleRaceToggle(race)}
                />
                <Label htmlFor={`race-${race}`} className="cursor-pointer flex-1">
                  {race}
                </Label>
              </div>
            ))}
          </div>
        </div>
      </PopoverContent>
    </Popover>
  )
}

