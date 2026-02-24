import { Button } from './ui/button'
import { Slider } from './ui/slider'

interface UCIRankFilterProps {
  maxRank: number
  onRankChange: (rank: number) => void
}

function UCIRankFilter({ maxRank, onRankChange }: UCIRankFilterProps) {
  const handleSliderChange = (values: number[]) => {
    onRankChange(values[0])
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
    <div className="bg-white p-5 rounded-lg shadow mb-7">
      <div className="flex justify-between items-center mb-4">
        <h3 className="m-0 text-lg font-semibold">UCI Rank Filter</h3>
        {maxRank < 2096 && (
          <Button variant="outline" size="sm" onClick={handleReset}>
            Reset
          </Button>
        )}
      </div>

      <div className="mb-4 p-3 bg-gray-50 rounded">
        <span className="text-sm text-gray-600">Max Rank:</span>
        <span className="ml-2 font-semibold text-lg">
          {maxRank === 2096 ? 'All Riders' : `#${maxRank}`}
        </span>
      </div>

      <div className="mb-6 px-2">
        <Slider
          min={1}
          max={2096}
          step={1}
          value={[maxRank]}
          onValueChange={handleSliderChange}
          className="w-full"
        />
      </div>

      <div className="flex flex-wrap gap-2">
        {presets.map(preset => (
          <Button
            key={preset.value}
            variant={maxRank === preset.value ? 'default' : 'outline'}
            size="sm"
            onClick={() => onRankChange(preset.value)}
          >
            {preset.label}
          </Button>
        ))}
      </div>
    </div>
  )
}

export default UCIRankFilter
