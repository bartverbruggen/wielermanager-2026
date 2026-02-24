import './App.css'
import { useEffect, useState } from 'react'
import RiderTable from './components/RiderTable'
import RaceFilter from './components/RaceFilter'

interface Rider {
  name: string
  team: string
  price: number
  url: string
  uci_rank: number
  uci_pts: number
  races: string[]
  [key: string]: unknown
}

interface Data {
  updated: string
  riders: Rider[]
}

function App() {
  const [data, setData] = useState<Data | null>(null)
  const [filteredRiders, setFilteredRiders] = useState<Rider[]>([])
  const [selectedRaces, setSelectedRaces] = useState<Set<string>>(new Set())
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Load riders data
  useEffect(() => {
    const loadData = async () => {
      try {
        const response = await fetch('/data/riders.json')
        if (!response.ok) throw new Error('Failed to load riders data')
        const jsonData: Data = await response.json()
        setData(jsonData)
        setFilteredRiders(jsonData.riders)
        setLoading(false)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Unknown error')
        setLoading(false)
      }
    }

    loadData()
  }, [])

  // Handle race filter changes
  const handleRaceFilterChange = (races: Set<string>) => {
    setSelectedRaces(races)
    
    if (!data) return

    if (races.size === 0) {
      setFilteredRiders(data.riders)
    } else {
      const filtered = data.riders.filter(rider =>
        rider.races && rider.races.some(race => races.has(race))
      )
      setFilteredRiders(filtered)
    }
  }

  if (loading) {
    return <div className="container"><p>Loading data...</p></div>
  }

  if (error) {
    return <div className="container"><p className="error">Error: {error}</p></div>
  }

  if (!data) {
    return <div className="container"><p>No data available</p></div>
  }

  // Get all unique races from riders
  const allRaces = Array.from(
    new Set(data.riders.flatMap(rider => rider.races || []))
  ).sort()

  return (
    <div className="container">
      <header>
        <h1>Cycling Classics Filter</h1>
        <p className="last-updated">Data updated: {data.updated}</p>
      </header>

      <RaceFilter
        races={allRaces}
        selectedRaces={selectedRaces}
        onRacesChange={handleRaceFilterChange}
      />

      <RiderTable
        riders={filteredRiders}
        allRaces={allRaces}
        selectedRaces={selectedRaces}
      />

      <footer>
        <p>Showing {filteredRiders.length} of {data.riders.length} riders</p>
      </footer>
    </div>
  )
}

export default App
