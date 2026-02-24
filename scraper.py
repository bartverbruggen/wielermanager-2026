#!/usr/bin/env python3
"""
Script to scrape race participation data from Pro Cycling Stats
and enrich riders.json with race information.
"""

import json
import sys
from pathlib import Path
from procyclingstats import RaceStartlist
import time

def get_race_slug(race_url: str) -> str:
    """Extract race slug from PCS URL."""
    return race_url.split('/race/')[-1]

def scrape_race_startlist(race_url: str):
    """
    Scrape the startlist for a given race and return rider names.
    """
    try:
        race_slug = get_race_slug(race_url)
        startlist = RaceStartlist(f"race/{race_slug}")
        riders = startlist.riders()
        
        # Extract rider names from the startlist
        rider_names = []
        for rider in riders:
            if isinstance(rider, dict) and 'name' in rider:
                rider_names.append(rider['name'])
            elif isinstance(rider, str):
                rider_names.append(rider)
        
        return rider_names
    except Exception as e:
        print(f"Error scraping race {race_url}: {e}", file=sys.stderr)
        return []

def load_races(races_file: str):
    """Load races from races.json."""
    with open(races_file, 'r') as f:
        data = json.load(f)
    return data.get('races', [])

def load_riders(riders_file: str):
    """Load riders from riders.json."""
    with open(riders_file, 'r') as f:
        return json.load(f)

def normalize_name(name: str) -> str:
    """Normalize rider name for matching."""
    return name.upper().strip()

def enrich_riders_with_races(riders_data, races):
    """
    Enrich riders data with race participation.
    """
    # Create a mapping of normalized names to riders
    riders_by_normalized_name = {}
    for rider in riders_data.get('riders', []):
        normalized = normalize_name(rider.get('name', ''))
        riders_by_normalized_name[normalized] = rider
        # Initialize races array if not present
        if 'races' not in rider:
            rider['races'] = []
    
    # Scrape each race and add to matching riders
    total_races = len(races)
    for idx, race in enumerate(races):
        print(f"Scraping {idx + 1}/{total_races}: {race['name']}...", file=sys.stderr)
        
        race_name = race['name']
        race_url = race['url']
        
        try:
            rider_names = scrape_race_startlist(race_url)
            print(f"  Found {len(rider_names)} riders", file=sys.stderr)
            
            # Match scraped riders with our riders list
            for pcs_rider_name in rider_names:
                normalized_pcs_name = normalize_name(pcs_rider_name)
                
                # Try exact match first
                if normalized_pcs_name in riders_by_normalized_name:
                    rider = riders_by_normalized_name[normalized_pcs_name]
                    if race_name not in rider.get('races', []):
                        rider['races'].append(race_name)
                else:
                    # Try partial matching (last name match)
                    for norm_name, rider in riders_by_normalized_name.items():
                        rider_last_name = norm_name.split()[-1] if ' ' in norm_name else norm_name
                        pcs_last_name = normalized_pcs_name.split()[-1] if ' ' in normalized_pcs_name else normalized_pcs_name
                        
                        if rider_last_name == pcs_last_name and len(rider_last_name) > 3:
                            if race_name not in rider.get('races', []):
                                rider['races'].append(race_name)
                            break
        
        except Exception as e:
            print(f"  Error processing race: {e}", file=sys.stderr)
        
        # Add a small delay to be respectful to the website
        time.sleep(1)
    
    return riders_data

def save_riders(riders_data, output_file: str):
    """Save enriched riders data to file."""
    with open(output_file, 'w') as f:
        json.dump(riders_data, f, indent=2, ensure_ascii=False)
    print(f"Saved enriched riders to {output_file}", file=sys.stderr)

def main():
    script_dir = Path(__file__).parent
    races_file = script_dir / 'data' / 'races.json'
    riders_file = script_dir / 'data' / 'riders.json'
    
    print("Loading data...", file=sys.stderr)
    races = load_races(str(races_file))
    riders_data = load_riders(str(riders_file))
    
    print(f"Loaded {len(races)} races and {len(riders_data.get('riders', []))} riders", file=sys.stderr)
    print("Starting scraping...", file=sys.stderr)
    
    enriched_data = enrich_riders_with_races(riders_data, races)
    save_riders(enriched_data, str(riders_file))
    
    print("Done!", file=sys.stderr)

if __name__ == '__main__':
    main()

