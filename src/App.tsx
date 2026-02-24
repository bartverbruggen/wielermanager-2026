import './App.css'
import { useEffect, useState } from 'react'
import RiderTable from './components/RiderTable'
import RaceFilter from './components/RaceFilter'
import TeamFilter from './components/TeamFilter'
import UCIRankFilter from './components/UCIRankFilter'
import RiderSearch from './components/RiderSearch'

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
  const [selectedTeams, setSelectedTeams] = useState<Set<string>>(new Set())
  const [searchQuery, setSearchQuery] = useState<string>('')
  const [maxUCIRank, setMaxUCIRank] = useState<number>(2096)
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

  // Apply race, team, search, and UCI rank filters
  const applyFilters = (races: Set<string>, teams: Set<string>, search: string, uciRank: number) => {
    if (!data) return

    let filtered = data.riders

    // Apply race filter
    if (races.size > 0) {
      filtered = filtered.filter(rider =>
        rider.races && rider.races.some(race => races.has(race))
      )
    }

    // Apply team filter
    if (teams.size > 0) {
      filtered = filtered.filter(rider => teams.has(rider.team))
    }

    // Apply UCI rank filter
    filtered = filtered.filter(rider => {
      const rank = rider.uci_rank || 9999
      return rank <= uciRank
    })

    // Apply search filter
    if (search.trim()) {
      const lowerSearch = search.toLowerCase()
      filtered = filtered.filter(rider =>
        rider.name.toLowerCase().includes(lowerSearch) ||
        rider.team.toLowerCase().includes(lowerSearch)
      )
    }

    setFilteredRiders(filtered)
  }

  // Handle race filter changes
  const handleRaceFilterChange = (races: Set<string>) => {
    setSelectedRaces(races)
    applyFilters(races, selectedTeams, searchQuery, maxUCIRank)
  }

  // Handle team filter changes
  const handleTeamFilterChange = (teams: Set<string>) => {
    setSelectedTeams(teams)
    applyFilters(selectedRaces, teams, searchQuery, maxUCIRank)
  }

  // Handle search changes
  const handleSearchChange = (query: string) => {
    setSearchQuery(query)
    applyFilters(selectedRaces, selectedTeams, query, maxUCIRank)
  }

  // Handle UCI rank filter changes
  const handleUCIRankChange = (rank: number) => {
    setMaxUCIRank(rank)
    applyFilters(selectedRaces, selectedTeams, searchQuery, rank)
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

  // Get all unique teams from riders
  const allTeams = Array.from(
    new Set(data.riders.map(rider => rider.team))
  ).sort()

  return (
    <div className="container">
      <header>
        <h1>Cycling Classics Filter</h1>
        <p className="last-updated">Data updated: {data.updated}</p>
      </header>

      <RiderSearch
        searchQuery={searchQuery}
        onSearchChange={handleSearchChange}
      />

      <div className="filters-container">
        <div className="filter-section">
          <RaceFilter
            races={allRaces}
            selectedRaces={selectedRaces}
            onRacesChange={handleRaceFilterChange}
          />
        </div>
        <div className="filter-section">
          <TeamFilter
            teams={allTeams}
            selectedTeams={selectedTeams}
            onTeamsChange={handleTeamFilterChange}
          />
        </div>
        <div className="filter-section">
          <UCIRankFilter
            maxRank={maxUCIRank}
            onRankChange={handleUCIRankChange}
          />
        </div>
      </div>

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
