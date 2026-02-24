import { Badge } from "./ui/badge";
import { X } from "lucide-react";

interface FilterBarProps {
  selectedRaces: Set<string>;
  selectedTeams: Set<string>;
  selectedRiders: Set<string>;
  maxUCIRank: number;
  onRemoveRace: (race: string) => void;
  onRemoveTeam: (team: string) => void;
  onRemoveRider: (rider: string) => void;
  onClearAll: () => void;
}

export default function FilterBar({
  selectedRaces,
  selectedTeams,
  selectedRiders,
  maxUCIRank,
  onRemoveRace,
  onRemoveTeam,
  onRemoveRider,
  onClearAll,
}: FilterBarProps) {
  const hasActiveFilters =
    selectedRaces.size > 0 ||
    selectedTeams.size > 0 ||
    selectedRiders.size > 0 ||
    maxUCIRank < 2096;

  if (!hasActiveFilters) {
    return null;
  }

  return (
    <div className="bg-white p-4 rounded-lg shadow border border-gray-200">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-semibold text-gray-700">Active Filters</h3>
        <button
          onClick={onClearAll}
          className="text-xs text-gray-600 hover:text-gray-900 hover:underline"
        >
          Clear all
        </button>
      </div>

      <div className="flex flex-wrap gap-2">
        {/* Races - Blue badges */}
        {Array.from(selectedRaces).map((race) => (
          <Badge
            key={`race-${race}`}
            className="bg-blue-100 text-blue-900 hover:bg-blue-200 cursor-pointer flex items-center gap-1"
            onClick={() => onRemoveRace(race)}
          >
            {race}
            <X size={14} />
          </Badge>
        ))}

        {/* Teams - Green badges */}
        {Array.from(selectedTeams).map((team) => (
          <Badge
            key={`team-${team}`}
            className="bg-green-100 text-green-900 hover:bg-green-200 cursor-pointer flex items-center gap-1"
            onClick={() => onRemoveTeam(team)}
          >
            {team}
            <X size={14} />
          </Badge>
        ))}

        {/* Riders - Purple badges */}
        {Array.from(selectedRiders).map((rider) => (
          <Badge
            key={`rider-${rider}`}
            className="bg-purple-100 text-purple-900 hover:bg-purple-200 cursor-pointer flex items-center gap-1"
            onClick={() => onRemoveRider(rider)}
          >
            {rider}
            <X size={14} />
          </Badge>
        ))}

        {/* UCI Rank - Orange badge */}
        {maxUCIRank < 2096 && (
          <Badge className="bg-orange-100 text-orange-900 hover:bg-orange-200 flex items-center gap-1">
            UCI Rank ≤ {maxUCIRank}
          </Badge>
        )}
      </div>
    </div>
  );
}
