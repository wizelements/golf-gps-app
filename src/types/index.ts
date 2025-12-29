// ============================================
// Golf GPS Tracker - Data Model Types
// ============================================

export interface Coordinate {
  lat: number;
  lng: number;
}

export interface Course {
  id: string;
  name: string;
  holesCount: 9 | 18;
  createdAt: number;
  updatedAt: number;
}

export interface Hole {
  id: string;
  courseId: string;
  holeNumber: number;
  par?: number;
  teeLat: number;
  teeLng: number;
  greenLat: number;
  greenLng: number;
  greenPolygon?: Coordinate[];
  hazards?: Hazard[];
}

export interface Hazard {
  id: string;
  type: 'water' | 'bunker' | 'ob';
  coordinates: Coordinate[];
}

export interface Round {
  id: string;
  courseId: string;
  startedAt: number;
  endedAt?: number;
  teeSetName?: string;
  notes?: string;
  currentHole: number;
  isComplete: boolean;
}

export type Club =
  | 'driver'
  | '3wood'
  | '5wood'
  | '7wood'
  | 'hybrid'
  | '2iron'
  | '3iron'
  | '4iron'
  | '5iron'
  | '6iron'
  | '7iron'
  | '8iron'
  | '9iron'
  | 'pw'
  | 'gw'
  | 'sw'
  | 'lw'
  | 'putter';

export type LieType = 'tee' | 'fairway' | 'rough' | 'sand' | 'green' | 'other';

export type MissDirection = 'LEFT' | 'RIGHT' | 'ON_LINE';
export type MissLength = 'SHORT' | 'LONG' | 'OK';

export interface Shot {
  id: string;
  roundId: string;
  holeNumber: number;
  shotNumber: number;
  lat: number;
  lng: number;
  accuracyMeters?: number;
  timestamp: number;
  club?: Club;
  lieType: LieType;
  isPutt: boolean;
  userAdjusted: boolean;
  note?: string;
  missDirection?: MissDirection;
  missLength?: MissLength;
  distanceToNext?: number;
}

export interface ClubStats {
  clubName: Club;
  avgDistance: number;
  medianDistance: number;
  stdDev: number;
  sampleCount: number;
  lastUpdated: number;
  minDistance: number;
  maxDistance: number;
}

export interface HoleStats {
  holeNumber: number;
  totalShots: number;
  totalDistance: number;
  longestShot: number;
  averageMissDirection: MissDirection;
}

export interface RoundSummary {
  roundId: string;
  courseName: string;
  date: number;
  totalShots: number;
  holesPlayed: number;
  avgShotsPerHole: number;
  longestShot: number;
  clubsUsed: Club[];
}

export interface GPSState {
  isAvailable: boolean;
  isWatching: boolean;
  currentPosition: Coordinate | null;
  accuracy: number | null;
  lastUpdate: number | null;
  error: string | null;
}

export interface AppState {
  currentView: 'home' | 'courses' | 'round' | 'replay' | 'analysis' | 'course-builder';
  activeRoundId: string | null;
  activeCourseId: string | null;
  gps: GPSState;
}
