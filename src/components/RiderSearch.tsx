import { Input } from "./ui/input";
import { X } from "lucide-react";

interface RiderSearchProps {
  searchQuery: string;
  onSearchChange: (query: string) => void;
}

function RiderSearch({ searchQuery, onSearchChange }: RiderSearchProps) {
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onSearchChange(e.target.value);
  };

  const handleClearSearch = () => {
    onSearchChange("");
  };

  return (
    <div className="flex gap-2">
      <div className="relative">
        <Input
          type="text"
          placeholder="Search riders by name or team..."
          value={searchQuery}
          onChange={handleInputChange}
        />
        {searchQuery && (
          <button
            className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700"
            onClick={handleClearSearch}
            aria-label="Clear search"
          >
            <X size={18} />
          </button>
        )}
      </div>
      {searchQuery && (
        <p className="text-sm text-gray-600 mt-2">
          Searching for: <strong>{searchQuery}</strong>
        </p>
      )}
    </div>
  );
}

export default RiderSearch;
