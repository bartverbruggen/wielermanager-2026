import { useState, useMemo, useEffect } from 'react'
import { Button } from './ui/button'
import { Checkbox } from './ui/checkbox'
import { Label } from './ui/label'
import { Input } from './ui/input'
import { Popover, PopoverContent, PopoverTrigger } from './ui/popover'

interface RidersFilterProps {
  riders: Array<{ name: string; team: string }>
  selectedRiders: Set<string>
  onRidersChange: (riders: Set<string>) => void
}

export default function RidersFilter({ riders, selectedRiders, onRidersChange }: RidersFilterProps) {
  const [searchQuery, setSearchQuery] = useState('')
  const [debouncedQuery, setDebouncedQuery] = useState('')

  // Debounce search query (300ms delay)
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedQuery(searchQuery)
    }, 300)

    return () => clearTimeout(timer)
  }, [searchQuery])

  // Memoize filtered riders to prevent unnecessary recalculations
  const filteredRiders = useMemo(() => {
    if (!debouncedQuery.trim()) {
      return riders
    }

    const lowerQuery = debouncedQuery.toLowerCase()
    return riders.filter(rider =>
      rider.name.toLowerCase().includes(lowerQuery) ||
      rider.team.toLowerCase().includes(lowerQuery)
    )
  }, [riders, debouncedQuery])

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
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="default">
          Riders ({selectedRiders.size})
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80">
        <div className="space-y-4">
          <Input
            type="text"
            placeholder="Search riders..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />

          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handleSelectAll}
            >
              {selectedRiders.size === filteredRiders.length && filteredRiders.length > 0 ? 'Clear All' : 'Select All'}
            </Button>
            {selectedRiders.size > 0 && (
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
            {filteredRiders.length > 0 ? (
              filteredRiders.map(rider => (
                <div key={rider.name} className="flex items-start gap-2">
                  <Checkbox
                    id={`rider-${rider.name}`}
                    checked={selectedRiders.has(rider.name)}
                    onCheckedChange={() => handleRiderToggle(rider.name)}
                    className="mt-1"
                  />
                  <Label htmlFor={`rider-${rider.name}`} className="cursor-pointer">
                    <div className="font-medium text-sm">{rider.name}</div>
                    <div className="text-xs text-gray-500">{rider.team}</div>
                  </Label>
                </div>
              ))
            ) : (
              <div className="text-center text-sm text-gray-500 py-2">No riders found</div>
            )}
          </div>
        </div>
      </PopoverContent>
    </Popover>
  )
}

