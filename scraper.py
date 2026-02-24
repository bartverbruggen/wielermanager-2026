#!/usr/bin/env python3
"""
Script to scrape race participation data from Pro Cycling Stats.
Fetches startlists for races and matches riders from your riders.json.
Uses BeautifulSoup for direct HTML scraping.
"""

import json
import sys
import re
import time
from pathlib import Path
import requests
from bs4 import BeautifulSoup
from urllib.parse import urljoin

# User agent to avoid being blocked
HEADERS = {
    'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36'
}

def extract_rider_slug(rider_url: str) -> str:
    """Extract rider slug from rider URL (e.g., 'tadej-pogacar')."""
    if not rider_url:
        return ""
    return rider_url.split('/rider/')[-1].split('/')[0]

def build_race_startlist_url(race_url: str, year: str = "2026") -> str:
    """Build the full startlist URL for a specific year."""
    # Extract base if present, otherwise add it
    if 'procyclingstats.com' not in race_url:
        race_url = 'https://www.procyclingstats.com' + race_url
    
    # Extract base and race slug
    base_url = race_url.split('/race/')[0]
    race_slug = race_url.split('/race/')[-1].split('/')[0]
    
    return f"{base_url}/race/{race_slug}/{year}/startlist"

def scrape_race_startlist(race_url: str, year: str = "2026"):
    """
    Scrape the startlist for a given race using BeautifulSoup.
    Falls back to previous year if current year not available.
    Returns list of dicts with rider data or None if unavailable.
    """
    # Try the requested year first, then fall back to previous year
    for attempt_year in [year, str(int(year) - 1)]:
        startlist_url = build_race_startlist_url(race_url, attempt_year)
        
        try:
            response = requests.get(startlist_url, headers=HEADERS, timeout=10)
            response.raise_for_status()
            
            soup = BeautifulSoup(response.content, 'html.parser')
            
            # Check if this is actually a startlist page
            page_text = soup.get_text().lower()
            if 'no startlist' in page_text or 'race not found' in page_text:
                if attempt_year == year:
                    print(f"  ℹ No startlist for {year}, trying {attempt_year}...", file=sys.stderr)
                continue
            
            # Find all rider links using broader search
            riders = []
            seen_slugs = set()
            
            # Look for all 'a' tags that contain 'rider' in href (handles both relative and absolute URLs)
            for link in soup.find_all('a', href=True):
                href = link.get('href', '')
                if 'rider' not in href.lower():
                    continue
                
                # Extract slug from various URL formats
                slug = None
                if href.startswith('rider/'):
                    slug = href.replace('rider/', '').split('/')[0]
                elif '/rider/' in href:
                    slug = href.split('/rider/')[-1].split('/')[0]
                
                if slug and slug not in seen_slugs and len(slug) > 2:
                    name = link.get_text(strip=True)
                    if name and len(name) > 2:  # Only add if there's meaningful text
                        riders.append({
                            'slug': slug,
                            'name': name,
                            'url': urljoin('https://www.procyclingstats.com', href)
                        })
                        seen_slugs.add(slug)
            
            if riders:
                if attempt_year != year:
                    print(f"  ℹ Using {attempt_year} startlist ({len(riders)} riders)", file=sys.stderr)
                else:
                    print(f"  ✓ Found {len(riders)} riders ({attempt_year})", file=sys.stderr)
                return riders
            
        except requests.exceptions.RequestException as e:
            if attempt_year == year:
                print(f"  ⚠ Network error fetching {attempt_year}: {e}", file=sys.stderr)
        except Exception as e:
            if attempt_year == year:
                print(f"  ⚠ Parsing error for {attempt_year}: {e}", file=sys.stderr)
    
    print(f"  ✗ No startlist available", file=sys.stderr)
    return None

def load_races(races_file: str):
    """Load races from races.json."""
    with open(races_file, 'r') as f:
        data = json.load(f)
    return data.get('races', [])

def load_riders(riders_file: str):
    """Load riders from riders.json."""
    with open(riders_file, 'r') as f:
        return json.load(f)

def enrich_riders_with_races(riders_data, races):
    """
    Enrich riders data with race participation by scraping race startlists.
    """
    # Create a mapping of rider slug to rider object
    riders_by_slug = {}
    for rider in riders_data.get('riders', []):
        slug = extract_rider_slug(rider.get('url', ''))
        if slug:
            riders_by_slug[slug] = rider
        # Initialize races array (replace existing)
        rider['races'] = []
    
    print(f"✓ Indexed {len(riders_by_slug)} riders by URL slug\n", file=sys.stderr)
    
    # Scrape each race and add to matching riders
    total_races = len(races)
    matched_count = 0
    skipped_count = 0
    
    for idx, race in enumerate(races):
        print(f"[{idx + 1}/{total_races}] {race['name']}", file=sys.stderr)
        
        race_name = race['name']
        race_url = race['url']
        
        try:
            startlist_data = scrape_race_startlist(race_url, year="2026")
            
            if startlist_data is None:
                skipped_count += 1
                time.sleep(1)
                continue
            
            # Match riders from startlist to our riders
            matches_in_race = 0
            for rider_entry in startlist_data:
                if not rider_entry or 'slug' not in rider_entry:
                    continue
                
                rider_slug = rider_entry['slug']
                
                if rider_slug in riders_by_slug:
                    our_rider = riders_by_slug[rider_slug]
                    if race_name not in our_rider.get('races', []):
                        our_rider['races'].append(race_name)
                        matches_in_race += 1
            
            if matches_in_race > 0:
                print(f"  ✓ Matched {matches_in_race} riders", file=sys.stderr)
                matched_count += matches_in_race
            else:
                print(f"  ⚠ No riders matched", file=sys.stderr)
        
        except Exception as e:
            print(f"  ✗ Error: {e}", file=sys.stderr)
            skipped_count += 1
        
        # Add delay to be respectful to the website
        time.sleep(2)
    
    print(f"\n{'='*60}", file=sys.stderr)
    print(f"✓ Matched {matched_count} rider-race combinations", file=sys.stderr)
    print(f"✓ Skipped {skipped_count} races (not available or errors)", file=sys.stderr)
    print(f"{'='*60}\n", file=sys.stderr)
    
    return riders_data

def save_riders(riders_data, output_file: str):
    """Save enriched riders data to file."""
    with open(output_file, 'w') as f:
        json.dump(riders_data, f, indent=2, ensure_ascii=False)
    print(f"✓ Saved enriched riders to {output_file}", file=sys.stderr)

def main():
    script_dir = Path(__file__).parent
    races_file = script_dir / 'data' / 'races.json'
    riders_file = script_dir / 'data' / 'riders.json'
    
    print("\n" + "=" * 60, file=sys.stderr)
    print("Cycling Classics Filter - Race Startlist Scraper", file=sys.stderr)
    print("=" * 60 + "\n", file=sys.stderr)
    
    print("Loading data...", file=sys.stderr)
    races = load_races(str(races_file))
    riders_data = load_riders(str(riders_file))
    
    print(f"✓ Loaded {len(races)} races", file=sys.stderr)
    print(f"✓ Loaded {len(riders_data.get('riders', []))} riders", file=sys.stderr)
    
    print("\nStarting scraper (fetching startlists)...\n", file=sys.stderr)
    
    enriched_data = enrich_riders_with_races(riders_data, races)
    save_riders(enriched_data, str(riders_file))
    
    print("Done! Race data updated successfully.\n", file=sys.stderr)

if __name__ == '__main__':
    main()
