// ============================================
// GolfCourseAPI Fallback Service
// Free tier: 300 requests/day
// ============================================

export interface APICourse {
  id: string;
  name: string;
  address?: string;
  city?: string;
  state?: string;
  country?: string;
  lat?: number;
  lng?: number;
  holes?: number;
  par?: number;
  website?: string;
  phone?: string;
}

// Note: You'll need to sign up at golfcourseapi.com for a free API key
// For now, we'll use a placeholder that can be configured
const API_KEY = import.meta.env.VITE_GOLF_API_KEY || '';
const API_BASE = 'https://api.golfcourseapi.com/v1';

export async function searchCoursesByLocation(
  lat: number,
  lng: number,
  radiusMiles = 10
): Promise<APICourse[]> {
  if (!API_KEY) {
    console.warn('GolfCourseAPI key not configured. Set VITE_GOLF_API_KEY in .env');
    return [];
  }

  try {
    const response = await fetch(
      `${API_BASE}/courses?lat=${lat}&lng=${lng}&radius=${radiusMiles}`,
      {
        headers: {
          'Authorization': `Bearer ${API_KEY}`,
          'Content-Type': 'application/json'
        }
      }
    );

    if (!response.ok) {
      if (response.status === 429) {
        console.warn('GolfCourseAPI rate limit reached');
      }
      return [];
    }

    const data = await response.json();
    return (data.courses || []).map((c: any) => ({
      id: `api-${c.id}`,
      name: c.name,
      address: c.address,
      city: c.city,
      state: c.state,
      country: c.country,
      lat: c.latitude,
      lng: c.longitude,
      holes: c.holes || 18,
      par: c.par,
      website: c.website,
      phone: c.phone
    }));
  } catch (error) {
    console.error('GolfCourseAPI error:', error);
    return [];
  }
}

export async function searchCoursesByName(name: string): Promise<APICourse[]> {
  if (!API_KEY) return [];

  try {
    const response = await fetch(
      `${API_BASE}/courses?search=${encodeURIComponent(name)}`,
      {
        headers: {
          'Authorization': `Bearer ${API_KEY}`,
          'Content-Type': 'application/json'
        }
      }
    );

    if (!response.ok) return [];

    const data = await response.json();
    return (data.courses || []).map((c: any) => ({
      id: `api-${c.id}`,
      name: c.name,
      city: c.city,
      state: c.state,
      holes: c.holes || 18,
      par: c.par
    }));
  } catch (error) {
    console.error('GolfCourseAPI search error:', error);
    return [];
  }
}
