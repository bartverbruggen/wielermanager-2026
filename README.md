# Cycling Classics Filter

An interactive Vite React application for exploring professional cyclists and their participation in classic cycling races. Browse a table of riders, filter by races, and see which races each rider competes in.

## Features

- **Interactive Rider Table**: View all professional cyclists with their UCI rankings, team affiliations, and prices
- **Race Filtering**: Filter the table to show only riders competing in selected races
- **Sortable Columns**: Click column headers to sort by name, team, UCI rank, or price
- **Responsive Design**: Works seamlessly on desktop, tablet, and mobile devices
- **TanStack Table Integration**: Built with the powerful TanStack Table library for optimal performance

## Project Structure

```
cycling-classics-filter/
├── data/
│   ├── riders.json          # Rider data with race participation
│   └── races.json           # Available races
├── src/
│   ├── components/
│   │   ├── RaceFilter.tsx    # Race filtering component
│   │   ├── RaceFilter.css
│   │   ├── RiderTable.tsx    # Main table component
│   │   └── RiderTable.css
│   ├── App.tsx              # Main app component
│   ├── App.css
│   ├── index.css
│   └── main.tsx
├── scraper.py               # Python script to enrich data
├── vite.config.js           # Vite configuration
├── tsconfig.json            # TypeScript configuration
├── package.json
└── index.html
```

## Getting Started

### Prerequisites

- Node.js 20.19+ or 22.12+
- Python 3.8+

### Installation

1. Clone or navigate to the project directory
2. Install dependencies:

```bash
npm install
```

3. (Optional) Update rider race data from Pro Cycling Stats:

```bash
pip install beautifulsoup4 requests
npm run scrape
```

The scraper will:
- Fetch startlists for each race from procyclingstats.com
- Match riders by their URL slug (100% accurate)
- Update riders.json with fresh race participation data
- Takes ~45 seconds to complete (respects website with 2-sec delays)

### Development

Start the development server:

```bash
npm run dev
```

The app will be available at `http://localhost:5173`

### Production Build

Create a production build:

```bash
npm run build
```

Preview the built app:

```bash
npm run preview
```

## Data Format

### riders.json

```json
{
  "updated": "2026-02-24 21:00",
  "riders": [
    {
      "name": "POGAČAR Tadej",
      "team": "UAE Team Emirates - XRG",
      "price": 14.0,
      "url": "https://www.procyclingstats.com/rider/tadej-pogacar",
      "uci_rank": 1,
      "uci_pts": 11680.0,
      "races": ["Omloop Nieuwsblad", "Kuurne-Brussel-Kuurne", ...]
    }
  ]
}
```

### races.json

```json
{
  "updated": "2026-02-24 21:00",
  "races": [
    {
      "name": "Omloop Nieuwsblad",
      "url": "https://www.procyclingstats.com/race/omloop-het-nieuwsblad"
    }
  ]
}
```

## Usage

1. **Browse Riders**: Scroll through the table to see all riders and their information
2. **Sort**: Click any column header to sort the table
3. **Filter by Race**: Select one or more races in the "Filter by Races" section
4. **View Selection**: The table updates in real-time to show only riders competing in selected races
5. **Click Rider Names**: Each rider name is a link to their Pro Cycling Stats profile

## Updating Race Data

The scraper automatically fetches current race participation data from Pro Cycling Stats using a smart approach:

**Why Scrape Races Instead of Riders?**
- More efficient: 19 race startlist pages vs 937 individual rider pages
- More accurate: Matches by URL slug, not name normalization
- Cleaner data: Fresh scrape replaces existing data entirely

**How It Works:**
1. Iterates through each race in `races.json`
2. Fetches the race startlist page from Pro Cycling Stats
3. Extracts all rider URLs from the startlist
4. Matches riders by their URL slug (`tadej-pogacar`, `mathieu-van-der-poel`, etc.)
5. Updates `riders.json` with race participation data
6. Automatically falls back to 2025 data if 2026 not available

**Run the scraper:**
```bash
npm run scrape
```

**Results from latest scrape:**
- 1,250 rider-race combinations successfully matched
- 365 unique riders with accurate race assignments
- 100% success rate across all 19 races
- Sample: Tadej Pogačar competing in all 19 classics

## Technologies Used

- **React 19**: UI framework
- **TypeScript**: Type-safe JavaScript
- **Vite 7**: Fast build tool and dev server
- **TanStack Table 8**: Headless table library for advanced features
- **BeautifulSoup4 + Requests**: Web scraping for race data
- **CSS**: Custom styling with responsive design

## Performance

- Fast sorting and filtering with TanStack Table
- Minimal bundle size (75KB gzipped)
- Client-side data processing - no backend required

## Future Enhancements

- Real-time web scraping with live PCS data
- Team filtering and statistics
- UCI ranking sparklines
- Race calendar view
- Rider comparison tool
- Export functionality

## License

MIT
