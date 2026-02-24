import { useEffect, useState, useMemo } from "react";
import RiderTable from "./components/RiderTable";
import RacesDropdown from "./components/RacesDropdown";
import RidersFilter from "./components/RidersFilter";
import TeamFilter from "./components/TeamFilter";
import UCIRankFilter from "./components/UCIRankFilter";
import RiderSearch from "./components/RiderSearch";
import FilterBar from "./components/FilterBar";

interface Rider {
  name: string;
  team: string;
  price: number;
  url: string;
  uci_rank: number;
  uci_pts: number;
  races: string[];
  [key: string]: unknown;
}

interface Data {
  updated: string;
  riders: Rider[];
  races?: Array<{
    name: string;
    url: string;
    start_date?: string | null;
    is_uci_wt?: boolean;
  }>;
}

function App() {
  const [data, setData] = useState<Data | null>(null);
  const [raceMetadata, setRaceMetadata] = useState<Record<string, any>>({});
  const [selectedRaces, setSelectedRaces] = useState<Set<string>>(new Set());
  const [selectedTeams, setSelectedTeams] = useState<Set<string>>(new Set());
  const [selectedRiders, setSelectedRiders] = useState<Set<string>>(new Set());
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [maxUCIRank, setMaxUCIRank] = useState<number>(2096);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Format timestamp and check if data is stale
  const getFormattedTimestamp = (timestamp: string) => {
    try {
      // Try parsing ISO format first (2026-02-24T21:00:00Z)
      let date = new Date(timestamp);
      // If that fails, try the fallback format (2026-02-24 21:00)
      if (isNaN(date.getTime())) {
        date = new Date(timestamp.replace(" ", "T") + "Z");
      }
      if (isNaN(date.getTime())) {
        return { formatted: timestamp, isStale: false };
      }
      return {
        formatted: date.toLocaleString("en-US", {
          month: "short",
          day: "numeric",
          year: "numeric",
          hour: "2-digit",
          minute: "2-digit",
          timeZoneName: "short",
        }),
        isStale: Date.now() - date.getTime() > 24 * 60 * 60 * 1000,
      };
    } catch {
      return { formatted: timestamp, isStale: false };
    }
  };

  // Load riders data and race metadata
  useEffect(() => {
    const loadData = async () => {
      try {
        const response = await fetch(
          `${import.meta.env.BASE_URL}data/riders.json`,
        );
        if (!response.ok) throw new Error("Failed to load riders data");
        const jsonData: Data = await response.json();
        setData(jsonData);

        // Load race metadata from races.json
        const racesResponse = await fetch(
          `${import.meta.env.BASE_URL}data/races.json`,
        );
        if (racesResponse.ok) {
          const racesData = await racesResponse.json();
          const metadata: Record<string, any> = {};
          if (racesData.races) {
            racesData.races.forEach((race: any) => {
              metadata[race.name] = {
                name: race.name,
                start_date: race.start_date || null,
                is_uci_wt: race.is_uci_wt || false,
              };
            });
          }
          setRaceMetadata(metadata);
        }

        setLoading(false);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Unknown error");
        setLoading(false);
      }
    };

    loadData();
  }, []);

  // Apply all filters in a single pass for better performance
  const filteredRiders = useMemo(() => {
    if (!data) return [];

    const racesSet = selectedRaces;
    const teamsSet = selectedTeams;
    const ridersSet = selectedRiders;
    const hasRaceFilter = racesSet.size > 0;
    const hasTeamFilter = teamsSet.size > 0;
    const hasRiderFilter = ridersSet.size > 0;
    const hasSearchFilter = searchQuery.trim().length > 0;
    const lowerSearchQuery = searchQuery.toLowerCase();

    return data.riders.filter((rider) => {
      // Apply rider filter
      if (hasRiderFilter && !ridersSet.has(rider.name)) {
        return false;
      }

      // Apply race filter
      if (hasRaceFilter && (!rider.races || !rider.races.some((race) => racesSet.has(race)))) {
        return false;
      }

      // Apply team filter
      if (hasTeamFilter && !teamsSet.has(rider.team)) {
        return false;
      }

      // Apply UCI rank filter
      const rank = rider.uci_rank || 9999;
      if (rank > maxUCIRank) {
        return false;
      }

      // Apply search filter
      if (hasSearchFilter) {
        const lowerName = rider.name.toLowerCase();
        const lowerTeam = rider.team.toLowerCase();
        if (!lowerName.includes(lowerSearchQuery) && !lowerTeam.includes(lowerSearchQuery)) {
          return false;
        }
      }

      return true;
    });
  }, [data, selectedRaces, selectedTeams, selectedRiders, searchQuery, maxUCIRank]);

  // Handle race filter changes
  const handleRaceFilterChange = (races: Set<string>) => {
    setSelectedRaces(races);
  };

  // Handle team filter changes
  const handleTeamFilterChange = (teams: Set<string>) => {
    setSelectedTeams(teams);
  };

  // Handle rider filter changes
  const handleRiderFilterChange = (riders: Set<string>) => {
    setSelectedRiders(riders);
  };

  // Handle search changes
  const handleSearchChange = (query: string) => {
    setSearchQuery(query);
  };

  // Handle UCI rank filter changes
  const handleUCIRankChange = (rank: number) => {
    setMaxUCIRank(rank);
  };

  // Handle remove individual filters from FilterBar
  const handleRemoveRace = (race: string) => {
    const newRaces = new Set(selectedRaces);
    newRaces.delete(race);
    handleRaceFilterChange(newRaces);
  };

  const handleRemoveTeam = (team: string) => {
    const newTeams = new Set(selectedTeams);
    newTeams.delete(team);
    handleTeamFilterChange(newTeams);
  };

  const handleRemoveRider = (rider: string) => {
    const newRiders = new Set(selectedRiders);
    newRiders.delete(rider);
    handleRiderFilterChange(newRiders);
  };

  const handleClearAllFilters = () => {
    setSelectedRaces(new Set());
    setSelectedTeams(new Set());
    setSelectedRiders(new Set());
    setMaxUCIRank(2096);
    setSearchQuery("");
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <p className="text-xl text-gray-600">Loading data...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <p className="text-xl text-red-600">Error: {error}</p>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <p className="text-xl text-gray-600">No data available</p>
      </div>
    );
  }

  // Get all unique races from riders
  const allRaces = Array.from(
    new Set(data.riders.flatMap((rider) => rider.races || [])),
  ).sort();

  // Get all unique teams from riders
  const allTeams = Array.from(
    new Set(data.riders.map((rider) => rider.team)),
  ).sort();

  return (
    <div className="min-h-screen bg-white">
      <header className="bg-white">
        <div className="p-6">
          <h1 className="text-3xl font-bold text-gray-900">
            Cycling Classics Filter
          </h1>
          {data &&
            (() => {
              const { formatted, isStale } = getFormattedTimestamp(
                data.updated,
              );
              return (
                <p
                  className={`text-sm mt-2 ${isStale ? "text-orange-600" : "text-gray-600"}`}
                >
                  Data updated: {formatted}
                  {isStale && " ⚠️ (older than 24 hours)"}
                </p>
              );
            })()}
        </div>
      </header>

      <div className="p-6">
        <div className="flex flex-col gap-6">
          <div className="flex flex-col md:flex-row md:items-center md:gap-4">
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

            {/* <TeamFilter
              teams={allTeams}
              selectedTeams={selectedTeams}
              onTeamsChange={handleTeamFilterChange}
            />

            <UCIRankFilter
              maxRank={maxUCIRank}
              onRankChange={handleUCIRankChange}
            /> */}
          </div>

          <FilterBar
            selectedRaces={selectedRaces}
            selectedTeams={selectedTeams}
            selectedRiders={selectedRiders}
            maxUCIRank={maxUCIRank}
            onRemoveRace={handleRemoveRace}
            onRemoveTeam={handleRemoveTeam}
            onRemoveRider={handleRemoveRider}
            onClearAll={handleClearAllFilters}
          />

          <div className="">
            <RiderTable
              riders={filteredRiders}
              allRaces={allRaces}
              selectedRaces={selectedRaces}
              raceMetadata={raceMetadata}
            />

            <footer className="mt-8 text-center text-gray-600">
              <p>
                Showing {filteredRiders.length} of {data.riders.length} riders
              </p>
            </footer>
          </div>
        </div>
      </div>
    </div>
  );
}

export default App;
