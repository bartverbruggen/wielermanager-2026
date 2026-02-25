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
import logging
from pathlib import Path
from datetime import datetime
import requests
from bs4 import BeautifulSoup
from urllib.parse import urljoin
from typing import Optional, List, Dict

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

# User agent to avoid being blocked
HEADERS = {
    'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36'
}

# Retry configuration
MAX_RETRIES = 3
RETRY_DELAY = 1  # seconds
TIMEOUT = 15  # seconds

def extract_rider_slug(rider_url: str) -> str:
    """Extract rider slug from rider URL (e.g., 'tadej-pogacar')."""
    if not rider_url:
        return ""
    return rider_url.split('/rider/')[-1].split('/')[0]

def fetch_url_with_retry(url: str, max_retries: int = MAX_RETRIES, initial_delay: int = RETRY_DELAY):
    """
    Fetch URL content with exponential backoff retry logic.
    
    Args:
        url: URL to fetch
        max_retries: Maximum number of retry attempts
        initial_delay: Initial delay between retries (seconds)
    
    Returns:
        Response content if successful, None otherwise
    """
    response = None
    for attempt in range(max_retries):
        try:
            response = requests.get(url, headers=HEADERS, timeout=TIMEOUT)
            response.raise_for_status()
            return response.content
        except requests.exceptions.Timeout:
            logger.warning(f"Timeout on attempt {attempt + 1}/{max_retries} for {url}")
        except requests.exceptions.ConnectionError:
            logger.warning(f"Connection error on attempt {attempt + 1}/{max_retries} for {url}")
        except requests.exceptions.HTTPError as e:
            if response and response.status_code == 429:  # Rate limited
                logger.warning(f"Rate limited (429), backing off...")
                delay = initial_delay * (2 ** attempt)
                time.sleep(delay)
                continue
            else:
                logger.warning(f"HTTP error on attempt {attempt + 1}/{max_retries}")
        except requests.exceptions.RequestException as e:
            logger.warning(f"Request error on attempt {attempt + 1}/{max_retries}: {e}")
        
        # Exponential backoff: wait longer between retries
        if attempt < max_retries - 1:
            delay = initial_delay * (2 ** attempt)
            logger.info(f"Retrying in {delay} seconds...")
            time.sleep(delay)
    
    return None

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
    Uses retry logic for robustness.
    Returns list of dicts with rider data or None if unavailable.
    """
    # Try the requested year first, then fall back to previous year
    for attempt_year in [year, str(int(year) - 1)]:
        startlist_url = build_race_startlist_url(race_url, attempt_year)
        
        try:
            # Use retry logic for fetching
            content = fetch_url_with_retry(startlist_url)
            
            if content is None:
                logger.warning(f"Failed to fetch {startlist_url} after {MAX_RETRIES} retries")
                if attempt_year == year:
                    logger.info(f"Trying {int(attempt_year) - 1}...")
                continue
            
            soup = BeautifulSoup(content, 'html.parser')
            
            # Check if this is actually a startlist page
            page_text = soup.get_text().lower()
            if 'no startlist' in page_text or 'race not found' in page_text:
                if attempt_year == year:
                    logger.info(f"No startlist for {year}, trying {int(year) - 1}...")
                continue
            
            # Find all rider links using targeted search
            riders = []
            seen_slugs = set()
            
            # Look for the "Preliminary startlist" or "Startlist" header to find the actual startlist section
            startlist_header = None
            for header in soup.find_all(['h2', 'h3', 'h4']):
                header_text = header.get_text(strip=True).lower()
                if 'startlist' in header_text or 'deelnemers' in header_text:
                    startlist_header = header
                    break
            
            if startlist_header:
                # Get the content after the startlist header
                content_section = startlist_header.find_next(['div', 'table', 'section'])
                if content_section:
                    search_area = content_section
                else:
                    # Fall back to everything after header until next major section
                    search_area = startlist_header
            else:
                # If no header found, use the entire page (less ideal but fallback)
                search_area = soup
            
            # Look for all 'a' tags with 'rider' in href, only within the startlist section
            for link in search_area.find_all('a', href=True):
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
                    logger.info(f"Using {attempt_year} startlist ({len(riders)} riders)")
                else:
                    logger.info(f"Found {len(riders)} riders ({attempt_year})")
                return riders
            
        except Exception as e:
            logger.error(f"Error parsing {attempt_year}: {e}")
    
    logger.error(f"No startlist available")
    return None

def scrape_race_details(race_url: str, year: str = "2026") -> Optional[Dict]:
      """
      Scrape race details including start date and UCI classification from race page.
      Returns dict with 'start_date' and 'is_uci_wt' keys.
      """
      # Build race URL if needed
      if 'procyclingstats.com' not in race_url:
          race_url = 'https://www.procyclingstats.com' + race_url
      
      # Try to get race page (without /startlist)
      base_url = race_url.split('/race/')[0]
      race_slug = race_url.split('/race/')[-1].split('/')[0]
      race_page_url = f"{base_url}/race/{race_slug}/{year}/"
      
      try:
          content = fetch_url_with_retry(race_page_url)
          if content is None:
              return None
          
          soup = BeautifulSoup(content, 'html.parser')
          
          # Extract start date
          start_date = None
          date_pattern = re.compile(r'(\d{1,2}\s+(?:January|February|March|April|May|June|July|August|September|October|November|December))\s+(\d{4})')
          
          # Look for date in common locations
          page_text = soup.get_text()
          date_match = date_pattern.search(page_text)
          if date_match:
              start_date = date_match.group(1)
          
          # Check for UCI WorldTour classification by looking for "Classification: 1.UWT"
          is_uci_wt = False
          
          # Look for the classification line in the page text
          classification_pattern = re.compile(r'Classification:\s*1\.UWT', re.IGNORECASE)
          if classification_pattern.search(page_text):
              is_uci_wt = True
          
          return {
              'start_date': start_date,
              'is_uci_wt': is_uci_wt
          }
      
      except Exception as e:
          logger.warning(f"Failed to scrape race details from {race_page_url}: {e}")
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
     Also enriches races with date and UCI WorldTour info.
     """
     # Create a mapping of rider slug to rider object
     riders_by_slug = {}
     for rider in riders_data.get('riders', []):
         slug = extract_rider_slug(rider.get('url', ''))
         if slug:
             riders_by_slug[slug] = rider
         # Initialize races array (replace existing)
         rider['races'] = []
     
     logger.info(f"Indexed {len(riders_by_slug)} riders by URL slug\n")
     
     # Scrape each race and add to matching riders
     total_races = len(races)
     matched_count = 0
     skipped_count = 0
     
     for idx, race in enumerate(races):
         logger.info(f"[{idx + 1}/{total_races}] {race['name']}")
         
         race_name = race['name']
         race_url = race['url']
         
         try:
             # First, scrape race details (date, UCI classification)
             race_details = scrape_race_details(race_url, year="2026")
             if race_details:
                 race['start_date'] = race_details.get('start_date')
                 race['is_uci_wt'] = race_details.get('is_uci_wt', False)
                 logger.info(f"  Date: {race_details.get('start_date')}, UCI WT: {race_details.get('is_uci_wt')}")
             
             # Then scrape the startlist
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
                 logger.info(f"  ✓ Matched {matches_in_race} riders")
                 matched_count += matches_in_race
             else:
                 logger.warning(f"  ⚠ No riders matched")
         
         except Exception as e:
             logger.error(f"  ✗ Error: {e}")
             skipped_count += 1
         
         # Add delay to be respectful to the website
         time.sleep(2)
     
     logger.info("=" * 60)
     logger.info(f"✓ Matched {matched_count} rider-race combinations")
     logger.info(f"✓ Skipped {skipped_count} races (not available or errors)")
     logger.info("=" * 60)
     
     # Update races in riders_data
     riders_data['races'] = races
     
     return riders_data

def save_riders(riders_data, output_file: str):
    """Save enriched riders data to file with updated timestamp."""
    # Add current timestamp in ISO 8601 format (more universal)
    riders_data['updated'] = datetime.utcnow().isoformat() + 'Z'
    
    with open(output_file, 'w') as f:
        json.dump(riders_data, f, indent=2, ensure_ascii=False)
    logger.info(f"✓ Saved enriched riders to {output_file}")
    logger.info(f"✓ Updated timestamp: {riders_data['updated']}")

def main():
    script_dir = Path(__file__).parent
    races_file = script_dir / 'data' / 'races.json'
    riders_file = script_dir / 'data' / 'riders.json'
    
    print("\n" + "=" * 60)
    print("Cycling Classics Filter - Race Startlist Scraper")
    print("=" * 60 + "\n")
    
    logger.info("Loading data...")
    races = load_races(str(races_file))
    riders_data = load_riders(str(riders_file))
    
    logger.info(f"Loaded {len(races)} races")
    logger.info(f"Loaded {len(riders_data.get('riders', []))} riders")
    
    logger.info("\nStarting scraper (fetching startlists)...\n")
    
    enriched_data = enrich_riders_with_races(riders_data, races)
    save_riders(enriched_data, str(riders_file))
    
    logger.info("Done! Race data updated successfully.\n")

if __name__ == '__main__':
    main()
