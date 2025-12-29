// ============================================
// Course Discovery Orchestrator
// The magic that finds your course automatically!
// ============================================

import { findNearbyGolfCourses, OSMGolfCourse } from './osmGolf';
import { searchCoursesByLocation, APICourse } from './courseApi';
import { createCourse, saveHole, listCourses } from './storage';
import type { Course } from '@/types';

export type DiscoveryStatus = 
  | 'detecting'      // Getting GPS
  | 'searching'      // Querying OSM/API
  | 'found'          // Found courses!
  | 'pioneer'        // No data - you're the first!
  | 'error';

export interface DiscoveredCourse {
  id: string;
  name: string;
  source: 'osm' | 'api' | 'local' | 'pioneer';
  lat: number;
  lng: number;
  holesCount: number;
  holesWithData: number;
  distance?: number; // meters from user
  osmData?: OSMGolfCourse;
  apiData?: APICourse;
  localCourse?: Course;
  funFact?: string;
}

// Fun facts to show while loading or for pioneer mode
const GOLF_FACTS = [
  "The longest recorded drive is 515 yards... but who's counting? 🏌️",
  "Golf balls have 300-500 dimples. Yes, someone counted.",
  "The word 'caddie' comes from the French 'cadet'. Fancy!",
  "A regulation golf hole is 4.25 inches in diameter. Tiny target!",
  "The oldest golf course is St Andrews, Scotland (1552). Still no mulligans.",
  "Astronaut Alan Shepard hit a golf ball on the Moon. Beat that!",
  "The odds of making a hole-in-one are 12,500 to 1. You've got this!",
  "Tigers (the animal) have been spotted on golf courses. Stay alert! 🐅"
];

const PIONEER_MESSAGES = [
  "You're charting new territory! 🗺️",
  "No data yet - you're the trailblazer! 🏔️",
  "First one here! Map it for future golfers! 🌟",
  "Unmapped course = instant legend status! 🏆",
  "Be the hero this course needs! 🦸"
];

export function getRandomFact(): string {
  return GOLF_FACTS[Math.floor(Math.random() * GOLF_FACTS.length)];
}

export function getPioneerMessage(): string {
  return PIONEER_MESSAGES[Math.floor(Math.random() * PIONEER_MESSAGES.length)];
}

// Calculate distance between two points (Haversine)
function calculateDistance(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6371000; // Earth's radius in meters
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLng = (lng2 - lng1) * Math.PI / 180;
  const a = 
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLng / 2) * Math.sin(dLng / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

// Main discovery function - the brains of the operation!
export async function discoverNearbyCourses(
  lat: number,
  lng: number,
  onStatusChange?: (status: DiscoveryStatus, message: string) => void
): Promise<DiscoveredCourse[]> {
  const discovered: DiscoveredCourse[] = [];
  
  onStatusChange?.('searching', 'Scanning the fairways... 🔍');

  // Step 1: Check local saved courses first (fastest!)
  try {
    const localCourses = await listCourses();
    for (const course of localCourses) {
      // Check if we have location data and it's nearby (within 5km)
      const holes = course.holesCount || 18;
      // For now, add all local courses - we'll filter by distance if we have coords
      discovered.push({
        id: course.id,
        name: course.name,
        source: 'local',
        lat: lat, // Use current location as approximation
        lng: lng,
        holesCount: holes,
        holesWithData: holes, // Assume local courses have data
        localCourse: course,
        funFact: "Your course, your rules! 🏠"
      });
    }
  } catch (e) {
    console.warn('Error loading local courses:', e);
  }

  // Step 2: Query OpenStreetMap (best free data!)
  onStatusChange?.('searching', 'Consulting the golf gods (OSM)... ⛳');
  
  try {
    const osmCourses = await findNearbyGolfCourses(lat, lng, 5000);
    
    for (const osm of osmCourses) {
      const distance = calculateDistance(lat, lng, osm.lat, osm.lng);
      
      // Don't duplicate if we have it locally
      const existsLocally = discovered.some(
        d => d.source === 'local' && 
        d.name.toLowerCase().includes(osm.name.toLowerCase().split(' ')[0])
      );
      
      if (!existsLocally) {
        discovered.push({
          id: osm.id,
          name: osm.name,
          source: 'osm',
          lat: osm.lat,
          lng: osm.lng,
          holesCount: Math.max(osm.holes.length, 9), // Assume at least 9 if we found any
          holesWithData: osm.holes.filter(h => h.green).length,
          distance,
          osmData: osm,
          funFact: osm.holes.length >= 15 
            ? `${osm.holes.length} holes mapped! Community FTW! 🎉`
            : osm.holes.length > 0
              ? `${osm.holes.length} holes mapped - help complete it! 🗺️`
              : "Course found! Hole data loading... 🔄"
        });
      }
    }
  } catch (e) {
    console.warn('OSM query failed:', e);
  }

  // Step 3: Try GolfCourseAPI as backup
  if (discovered.filter(d => d.source !== 'local').length === 0) {
    onStatusChange?.('searching', 'Checking the backup database... 📚');
    
    try {
      const apiCourses = await searchCoursesByLocation(lat, lng, 5);
      
      for (const api of apiCourses) {
        if (api.lat && api.lng) {
          const distance = calculateDistance(lat, lng, api.lat, api.lng);
          discovered.push({
            id: api.id,
            name: api.name,
            source: 'api',
            lat: api.lat,
            lng: api.lng,
            holesCount: api.holes || 18,
            holesWithData: 0, // API doesn't have hole GPS data
            distance,
            apiData: api,
            funFact: api.par ? `Par ${api.par} - Let's see what you've got! 💪` : undefined
          });
        }
      }
    } catch (e) {
      console.warn('API query failed:', e);
    }
  }

  // Sort by distance (closest first), then by data quality
  discovered.sort((a, b) => {
    // Local courses first
    if (a.source === 'local' && b.source !== 'local') return -1;
    if (b.source === 'local' && a.source !== 'local') return 1;
    
    // Then by data completeness
    if (a.holesWithData !== b.holesWithData) {
      return b.holesWithData - a.holesWithData;
    }
    
    // Then by distance
    return (a.distance || 0) - (b.distance || 0);
  });

  // Update status
  if (discovered.length > 0) {
    onStatusChange?.('found', `Found ${discovered.length} course${discovered.length > 1 ? 's' : ''}! 🎯`);
  } else {
    onStatusChange?.('pioneer', getPioneerMessage());
  }

  return discovered;
}

// Import OSM course data into local storage
export async function importOSMCourse(osmCourse: OSMGolfCourse): Promise<Course> {
  // Create the course
  const course = await createCourse(
    osmCourse.name,
    osmCourse.holes.length >= 15 ? 18 : 9
  );

  // Import hole data
  for (const osmHole of osmCourse.holes) {
    if (osmHole.green && osmHole.holeNumber) {
      await saveHole({
        courseId: course.id,
        holeNumber: osmHole.holeNumber,
        teeLat: osmHole.tee?.lat || osmHole.green.lat - 0.002,
        teeLng: osmHole.tee?.lng || osmHole.green.lng,
        greenLat: osmHole.green.lat,
        greenLng: osmHole.green.lng,
        par: osmHole.par
      });
    }
  }

  return course;
}

// Create a new "pioneer" course (unmapped)
export async function createPioneerCourse(
  name: string,
  _lat: number,
  _lng: number,
  holesCount: 9 | 18 = 18
): Promise<Course> {
  const course = await createCourse(name, holesCount);
  // No hole data yet - user will map as they play!
  // Future: Could store lat/lng for course location
  return course;
}

// Get a fun name suggestion for unmapped courses
export function suggestCourseName(lat: number, lng: number): string {
  const adjectives = ['Sunny', 'Hidden', 'Rolling', 'Misty', 'Golden', 'Secret', 'Lucky'];
  const nouns = ['Hills', 'Valley', 'Links', 'Meadows', 'Pines', 'Oaks', 'Creek'];
  
  const adj = adjectives[Math.floor(Math.abs(lat * 100) % adjectives.length)];
  const noun = nouns[Math.floor(Math.abs(lng * 100) % nouns.length)];
  
  return `${adj} ${noun} Golf`;
}
