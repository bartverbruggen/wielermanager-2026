import './RiderSearch.css'

interface RiderSearchProps {
  searchQuery: string
  onSearchChange: (query: string) => void
}

function RiderSearch({ searchQuery, onSearchChange }: RiderSearchProps) {
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onSearchChange(e.target.value)
  }

  const handleClearSearch = () => {
    onSearchChange('')
  }

  return (
    <div className="rider-search">
      <div className="search-input-container">
        <input
          type="text"
          className="search-input"
          placeholder="Search riders by name or team..."
          value={searchQuery}
          onChange={handleInputChange}
        />
        {searchQuery && (
          <button className="clear-button" onClick={handleClearSearch}>
            ✕
          </button>
        )}
      </div>
      {searchQuery && (
        <p className="search-hint">
          Searching for: <strong>{searchQuery}</strong>
        </p>
      )}
    </div>
  )
}

export default RiderSearch
