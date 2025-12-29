// ============================================
// OpenStreetMap Golf Data Service
// Free, community-driven golf course data
// ============================================

export interface OSMGolfCourse {
  id: string;
  name: string;
  lat: number;
  lng: number;
  holes: OSMHole[];
  bounds?: { minLat: number; maxLat: number; minLng: number; maxLng: number };
}

export interface OSMHole {
  holeNumber?: number;
  tee?: { lat: number; lng: number };
  green?: { lat: number; lng: number; polygon?: [number, number][] };
  fairway?: [number, number][];
  bunkers?: [number, number][][];
  waterHazards?: [number, number][][];
  par?: number;
}

const OVERPASS_API = 'https://overpass-api.de/api/interpreter';

// Build Overpass QL query for golf data near a location
function buildGolfQuery(lat: number, lng: number, radiusMeters = 3000): string {
  return `
    [out:json][timeout:25];
    (
      // Golf courses
      way["leisure"="golf_course"](around:${radiusMeters},${lat},${lng});
      relation["leisure"="golf_course"](around:${radiusMeters},${lat},${lng});
      // Greens
      way["golf"="green"](around:${radiusMeters},${lat},${lng});
      // Tees
      way["golf"="tee"](around:${radiusMeters},${lat},${lng});
      node["golf"="tee"](around:${radiusMeters},${lat},${lng});
      // Fairways
      way["golf"="fairway"](around:${radiusMeters},${lat},${lng});
      // Bunkers
      way["golf"="bunker"](around:${radiusMeters},${lat},${lng});
      // Water hazards
      way["golf"="water_hazard"](around:${radiusMeters},${lat},${lng});
      way["golf"="lateral_water_hazard"](around:${radiusMeters},${lat},${lng});
      // Pins (hole locations)
      node["golf"="pin"](around:${radiusMeters},${lat},${lng});
    );
    out body geom;
  `;
}

// Parse OSM elements into our golf data structure
function parseOSMResponse(data: any): Map<string, OSMGolfCourse> {
  const courses = new Map<string, OSMGolfCourse>();
  const greens: any[] = [];
  const tees: any[] = [];
  const pins: any[] = [];
  const fairways: any[] = [];
  const bunkers: any[] = [];
  const waterHazards: any[] = [];

  for (const element of data.elements || []) {
    const tags = element.tags || {};

    if (tags.leisure === 'golf_course') {
      // Found a golf course!
      const center = getElementCenter(element);
      courses.set(element.id.toString(), {
        id: `osm-${element.id}`,
        name: tags.name || 'Unnamed Course',
        lat: center.lat,
        lng: center.lng,
        holes: [],
        bounds: getElementBounds(element)
      });
    } else if (tags.golf === 'green') {
      greens.push(element);
    } else if (tags.golf === 'tee') {
      tees.push(element);
    } else if (tags.golf === 'pin') {
      pins.push(element);
    } else if (tags.golf === 'fairway') {
      fairways.push(element);
    } else if (tags.golf === 'bunker') {
      bunkers.push(element);
    } else if (tags.golf === 'water_hazard' || tags.golf === 'lateral_water_hazard') {
      waterHazards.push(element);
    }
  }

  // If we found golf features but no course boundary, create a virtual course
  if (courses.size === 0 && (greens.length > 0 || tees.length > 0)) {
    const allElements = [...greens, ...tees, ...pins];
    if (allElements.length > 0) {
      const center = getElementCenter(allElements[0]);
      courses.set('virtual', {
        id: 'osm-virtual',
        name: 'Nearby Golf Course',
        lat: center.lat,
        lng: center.lng,
        holes: []
      });
    }
  }

  // Assign features to courses and build holes
  for (const course of courses.values()) {
    const courseHoles: Map<number, OSMHole> = new Map();

    // Process greens
    for (const green of greens) {
      if (isWithinCourse(green, course)) {
        const holeNum = parseInt(green.tags?.ref || green.tags?.name?.match(/\d+/)?.[0] || '0');
        const hole = courseHoles.get(holeNum) || { holeNumber: holeNum || undefined };
        const center = getElementCenter(green);
        hole.green = {
          lat: center.lat,
          lng: center.lng,
          polygon: getPolygonCoords(green)
        };
        if (green.tags?.par) {
          hole.par = parseInt(green.tags.par);
        }
        courseHoles.set(holeNum, hole);
      }
    }

    // Process tees
    for (const tee of tees) {
      if (isWithinCourse(tee, course)) {
        const holeNum = parseInt(tee.tags?.ref || tee.tags?.name?.match(/\d+/)?.[0] || '0');
        const hole = courseHoles.get(holeNum) || { holeNumber: holeNum || undefined };
        const center = getElementCenter(tee);
        hole.tee = { lat: center.lat, lng: center.lng };
        courseHoles.set(holeNum, hole);
      }
    }

    // Process pins (more accurate green centers)
    for (const pin of pins) {
      if (isWithinCourse(pin, course)) {
        const holeNum = parseInt(pin.tags?.ref || '0');
        const hole = courseHoles.get(holeNum) || { holeNumber: holeNum || undefined };
        if (hole.green) {
          hole.green.lat = pin.lat;
          hole.green.lng = pin.lon;
        } else {
          hole.green = { lat: pin.lat, lng: pin.lon };
        }
        courseHoles.set(holeNum, hole);
      }
    }

    // Convert map to sorted array
    course.holes = Array.from(courseHoles.values())
      .filter(h => h.green || h.tee)
      .sort((a, b) => (a.holeNumber || 99) - (b.holeNumber || 99));
  }

  return courses;
}

function getElementCenter(element: any): { lat: number; lng: number } {
  if (element.lat && element.lon) {
    return { lat: element.lat, lng: element.lon };
  }
  if (element.geometry && element.geometry.length > 0) {
    const lats = element.geometry.map((p: any) => p.lat);
    const lngs = element.geometry.map((p: any) => p.lon);
    return {
      lat: (Math.min(...lats) + Math.max(...lats)) / 2,
      lng: (Math.min(...lngs) + Math.max(...lngs)) / 2
    };
  }
  if (element.center) {
    return { lat: element.center.lat, lng: element.center.lon };
  }
  return { lat: 0, lng: 0 };
}

function getElementBounds(element: any): { minLat: number; maxLat: number; minLng: number; maxLng: number } | undefined {
  if (element.geometry && element.geometry.length > 0) {
    const lats = element.geometry.map((p: any) => p.lat);
    const lngs = element.geometry.map((p: any) => p.lon);
    return {
      minLat: Math.min(...lats),
      maxLat: Math.max(...lats),
      minLng: Math.min(...lngs),
      maxLng: Math.max(...lngs)
    };
  }
  return undefined;
}

function getPolygonCoords(element: any): [number, number][] | undefined {
  if (element.geometry && element.geometry.length > 0) {
    return element.geometry.map((p: any) => [p.lat, p.lon] as [number, number]);
  }
  return undefined;
}

function isWithinCourse(element: any, course: OSMGolfCourse): boolean {
  if (!course.bounds) return true; // Accept all if no bounds
  const center = getElementCenter(element);
  const buffer = 0.01; // ~1km buffer
  return (
    center.lat >= course.bounds.minLat - buffer &&
    center.lat <= course.bounds.maxLat + buffer &&
    center.lng >= course.bounds.minLng - buffer &&
    center.lng <= course.bounds.maxLng + buffer
  );
}

// Main function: Find golf courses near a location
export async function findNearbyGolfCourses(
  lat: number,
  lng: number,
  radiusMeters = 3000
): Promise<OSMGolfCourse[]> {
  const query = buildGolfQuery(lat, lng, radiusMeters);

  try {
    const response = await fetch(OVERPASS_API, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: `data=${encodeURIComponent(query)}`
    });

    if (!response.ok) {
      throw new Error(`OSM API error: ${response.status}`);
    }

    const data = await response.json();
    const courses = parseOSMResponse(data);

    return Array.from(courses.values()).sort((a, b) => {
      // Sort by completeness (more holes = better)
      return b.holes.length - a.holes.length;
    });
  } catch (error) {
    console.error('OSM Golf fetch error:', error);
    return [];
  }
}

// Get detailed hole data for a specific course area
export async function getDetailedCourseData(
  courseBounds: { minLat: number; maxLat: number; minLng: number; maxLng: number }
): Promise<OSMHole[]> {
  const centerLat = (courseBounds.minLat + courseBounds.maxLat) / 2;
  const centerLng = (courseBounds.minLng + courseBounds.maxLng) / 2;
  const radius = Math.max(
    (courseBounds.maxLat - courseBounds.minLat) * 111000 / 2,
    (courseBounds.maxLng - courseBounds.minLng) * 85000 / 2
  ) * 1.5;

  const courses = await findNearbyGolfCourses(centerLat, centerLng, radius);
  if (courses.length > 0) {
    return courses[0].holes;
  }
  return [];
}
