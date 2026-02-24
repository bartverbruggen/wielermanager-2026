import './App.css'
import { useEffect, useState } from 'react'
import RiderTable from './components/RiderTable'
import RacesDropdown from './components/RacesDropdown'
import RidersFilter from './components/RidersFilter'
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
   const [selectedRiders, setSelectedRiders] = useState<Set<string>>(new Set())
   const [searchQuery, setSearchQuery] = useState<string>('')
   const [maxUCIRank, setMaxUCIRank] = useState<number>(2096)
   const [loading, setLoading] = useState(true)
   const [error, setError] = useState<string | null>(null)

   // Format timestamp and check if data is stale
   const getFormattedTimestamp = (timestamp: string) => {
     try {
       // Try parsing ISO format first (2026-02-24T21:00:00Z)
       let date = new Date(timestamp)
       // If that fails, try the fallback format (2026-02-24 21:00)
       if (isNaN(date.getTime())) {
         date = new Date(timestamp.replace(' ', 'T') + 'Z')
       }
       if (isNaN(date.getTime())) {
         return { formatted: timestamp, isStale: false }
       }
       return { 
         formatted: date.toLocaleString('en-US', { 
           month: 'short', 
           day: 'numeric', 
           year: 'numeric',
           hour: '2-digit',
           minute: '2-digit',
           timeZoneName: 'short'
         }),
         isStale: Date.now() - date.getTime() > 24 * 60 * 60 * 1000
       }
     } catch {
       return { formatted: timestamp, isStale: false }
     }
   }

  // Load riders data
   useEffect(() => {
     const loadData = async () => {
       try {
         const response = await fetch(`${import.meta.env.BASE_URL}data/riders.json`)
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
   const applyFilters = (races: Set<string>, teams: Set<string>, riders: Set<string>, search: string, uciRank: number) => {
     if (!data) return

     let filtered = data.riders

     // Apply rider filter
     if (riders.size > 0) {
       filtered = filtered.filter(rider => riders.has(rider.name))
     }

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
     applyFilters(races, selectedTeams, selectedRiders, searchQuery, maxUCIRank)
   }

   // Handle team filter changes
   const handleTeamFilterChange = (teams: Set<string>) => {
     setSelectedTeams(teams)
     applyFilters(selectedRaces, teams, selectedRiders, searchQuery, maxUCIRank)
   }

   // Handle rider filter changes
   const handleRiderFilterChange = (riders: Set<string>) => {
     setSelectedRiders(riders)
     applyFilters(selectedRaces, selectedTeams, riders, searchQuery, maxUCIRank)
   }

   // Handle search changes
   const handleSearchChange = (query: string) => {
     setSearchQuery(query)
     applyFilters(selectedRaces, selectedTeams, selectedRiders, query, maxUCIRank)
   }

   // Handle UCI rank filter changes
   const handleUCIRankChange = (rank: number) => {
     setMaxUCIRank(rank)
     applyFilters(selectedRaces, selectedTeams, selectedRiders, searchQuery, rank)
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
         {data && (() => {
           const { formatted, isStale } = getFormattedTimestamp(data.updated)
           return (
             <p className={`last-updated ${isStale ? 'stale' : ''}`}>
               Data updated: {formatted}
               {isStale && ' ⚠️ (older than 24 hours)'}
             </p>
           )
         })()}
       </header>

       <div className="filters-sidebar">
         <RacesDropdown
           races={allRaces}
           selectedRaces={selectedRaces}
           onRacesChange={handleRaceFilterChange}
         />

         <RidersFilter
           riders={data?.riders || []}
           selectedRiders={selectedRiders}
           onRidersChange={handleRiderFilterChange}
         />

         <RiderSearch
           searchQuery={searchQuery}
           onSearchChange={handleSearchChange}
         />

         <TeamFilter
           teams={allTeams}
           selectedTeams={selectedTeams}
           onTeamsChange={handleTeamFilterChange}
         />

         <UCIRankFilter
           maxRank={maxUCIRank}
           onRankChange={handleUCIRankChange}
         />
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
