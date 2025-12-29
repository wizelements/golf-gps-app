// ============================================
// Golf GPS Tracker - Storage Service (IndexedDB via Dexie)
// ============================================

import Dexie, { type Table } from 'dexie';
import { v4 as uuidv4 } from 'uuid';
import type { Course, Hole, Round, Shot, ClubStats, Club } from '@/types';
import { calculateDistance, calculateDistanceStats, classifyMissDirection, classifyMissLength, calculateCrossTrackDistance } from './math';

class GolfDatabase extends Dexie {
  courses!: Table<Course>;
  holes!: Table<Hole>;
  rounds!: Table<Round>;
  shots!: Table<Shot>;
  clubStats!: Table<ClubStats>;

  constructor() {
    super('GolfGPSDatabase');
    this.version(1).stores({
      courses: 'id, name, createdAt',
      holes: 'id, courseId, holeNumber',
      rounds: 'id, courseId, startedAt, isComplete',
      shots: 'id, roundId, holeNumber, shotNumber, timestamp',
      clubStats: 'clubName, lastUpdated'
    });
  }
}

const db = new GolfDatabase();

// ============================================
// Course Operations
// ============================================

export async function createCourse(name: string, holesCount: 9 | 18): Promise<Course> {
  const course: Course = {
    id: uuidv4(),
    name,
    holesCount,
    createdAt: Date.now(),
    updatedAt: Date.now()
  };
  await db.courses.add(course);
  return course;
}

export async function updateCourse(id: string, updates: Partial<Course>): Promise<void> {
  await db.courses.update(id, { ...updates, updatedAt: Date.now() });
}

export async function deleteCourse(id: string): Promise<void> {
  await db.transaction('rw', [db.courses, db.holes, db.rounds, db.shots], async () => {
    const rounds = await db.rounds.where('courseId').equals(id).toArray();
    for (const round of rounds) {
      await db.shots.where('roundId').equals(round.id).delete();
    }
    await db.rounds.where('courseId').equals(id).delete();
    await db.holes.where('courseId').equals(id).delete();
    await db.courses.delete(id);
  });
}

export async function getCourse(id: string): Promise<Course | undefined> {
  return db.courses.get(id);
}

export async function listCourses(): Promise<Course[]> {
  return db.courses.orderBy('updatedAt').reverse().toArray();
}

// ============================================
// Hole Operations
// ============================================

export async function saveHole(hole: Omit<Hole, 'id'> & { id?: string }): Promise<Hole> {
  const fullHole: Hole = {
    ...hole,
    id: hole.id || uuidv4()
  };
  await db.holes.put(fullHole);
  await db.courses.update(hole.courseId, { updatedAt: Date.now() });
  return fullHole;
}

export async function getHoles(courseId: string): Promise<Hole[]> {
  return db.holes.where('courseId').equals(courseId).sortBy('holeNumber');
}

export async function getHole(courseId: string, holeNumber: number): Promise<Hole | undefined> {
  return db.holes.where({ courseId, holeNumber }).first();
}

export async function deleteHole(id: string): Promise<void> {
  await db.holes.delete(id);
}

// ============================================
// Round Operations
// ============================================

export async function startRound(courseId: string, teeSetName?: string): Promise<Round> {
  const round: Round = {
    id: uuidv4(),
    courseId,
    startedAt: Date.now(),
    teeSetName,
    currentHole: 1,
    isComplete: false
  };
  await db.rounds.add(round);
  return round;
}

export async function updateRound(id: string, updates: Partial<Round>): Promise<void> {
  await db.rounds.update(id, updates);
}

export async function endRound(id: string, notes?: string): Promise<void> {
  await db.rounds.update(id, {
    endedAt: Date.now(),
    isComplete: true,
    notes
  });
  await computeAndCacheClubStats();
}

export async function getRound(id: string): Promise<Round | undefined> {
  return db.rounds.get(id);
}

export async function getRounds(courseId?: string): Promise<Round[]> {
  if (courseId) {
    return db.rounds.where('courseId').equals(courseId).reverse().sortBy('startedAt');
  }
  return db.rounds.orderBy('startedAt').reverse().toArray();
}

export async function getActiveRound(): Promise<Round | undefined> {
  return db.rounds.where('isComplete').equals(0).first();
}

export async function deleteRound(id: string): Promise<void> {
  await db.transaction('rw', [db.rounds, db.shots], async () => {
    await db.shots.where('roundId').equals(id).delete();
    await db.rounds.delete(id);
  });
}

// ============================================
// Shot Operations
// ============================================

export async function logShot(
  roundId: string,
  holeNumber: number,
  lat: number,
  lng: number,
  options: {
    accuracyMeters?: number;
    club?: Club;
    lieType?: Shot['lieType'];
    isPutt?: boolean;
    note?: string;
  } = {}
): Promise<Shot> {
  const existingShots = await db.shots
    .where({ roundId, holeNumber })
    .sortBy('shotNumber');

  const shotNumber = existingShots.length + 1;

  const shot: Shot = {
    id: uuidv4(),
    roundId,
    holeNumber,
    shotNumber,
    lat,
    lng,
    accuracyMeters: options.accuracyMeters,
    timestamp: Date.now(),
    club: options.club,
    lieType: options.lieType || (shotNumber === 1 ? 'tee' : 'fairway'),
    isPutt: options.isPutt || false,
    userAdjusted: false,
    note: options.note
  };

  await db.shots.add(shot);
  return shot;
}

export async function updateShot(id: string, updates: Partial<Shot>): Promise<void> {
  await db.shots.update(id, updates);
}

export async function updateShotLocation(id: string, lat: number, lng: number): Promise<void> {
  await db.shots.update(id, { lat, lng, userAdjusted: true });
}

export async function deleteLastShot(roundId: string, holeNumber: number): Promise<boolean> {
  const shots = await db.shots
    .where({ roundId, holeNumber })
    .sortBy('shotNumber');

  if (shots.length === 0) return false;

  const lastShot = shots[shots.length - 1];
  await db.shots.delete(lastShot.id);
  return true;
}

export async function getShotsForHole(roundId: string, holeNumber: number): Promise<Shot[]> {
  return db.shots.where({ roundId, holeNumber }).sortBy('shotNumber');
}

export async function getShotsForRound(roundId: string): Promise<Shot[]> {
  return db.shots.where('roundId').equals(roundId).sortBy('timestamp');
}

export async function analyzeShotsForHole(
  roundId: string,
  holeNumber: number,
  hole: Hole
): Promise<Shot[]> {
  const shots = await getShotsForHole(roundId, holeNumber);
  const tee = { lat: hole.teeLat, lng: hole.teeLng };
  const green = { lat: hole.greenLat, lng: hole.greenLng };

  const analyzedShots: Shot[] = [];

  for (let i = 0; i < shots.length; i++) {
    const shot = shots[i];
    const shotCoord = { lat: shot.lat, lng: shot.lng };

    let distanceToNext: number | undefined;
    let missDirection: Shot['missDirection'];
    let missLength: Shot['missLength'];

    if (i < shots.length - 1) {
      const nextShot = shots[i + 1];
      distanceToNext = calculateDistance(shotCoord, { lat: nextShot.lat, lng: nextShot.lng });
    }

    const crossTrack = calculateCrossTrackDistance(shotCoord, tee, green);
    missDirection = classifyMissDirection(crossTrack);
    missLength = classifyMissLength(shotCoord, tee, green);

    analyzedShots.push({
      ...shot,
      distanceToNext,
      missDirection,
      missLength
    });
  }

  return analyzedShots;
}

// ============================================
// Club Stats Operations
// ============================================

export async function computeAndCacheClubStats(roundId?: string): Promise<void> {
  const shots = roundId
    ? await db.shots.where('roundId').equals(roundId).toArray()
    : await db.shots.toArray();

  const clubDistances = new Map<Club, number[]>();

  const sortedShots = shots.sort((a, b) => {
    if (a.roundId !== b.roundId) return a.roundId.localeCompare(b.roundId);
    if (a.holeNumber !== b.holeNumber) return a.holeNumber - b.holeNumber;
    return a.shotNumber - b.shotNumber;
  });

  for (let i = 0; i < sortedShots.length - 1; i++) {
    const shot = sortedShots[i];
    const nextShot = sortedShots[i + 1];

    if (
      shot.roundId !== nextShot.roundId ||
      shot.holeNumber !== nextShot.holeNumber ||
      shot.isPutt ||
      !shot.club
    ) {
      continue;
    }

    const distance = calculateDistance(
      { lat: shot.lat, lng: shot.lng },
      { lat: nextShot.lat, lng: nextShot.lng }
    );

    if (distance < 10 || distance > 350) continue;

    if (!clubDistances.has(shot.club)) {
      clubDistances.set(shot.club, []);
    }
    clubDistances.get(shot.club)!.push(distance);
  }

  for (const [clubName, distances] of clubDistances) {
    if (distances.length === 0) continue;

    const stats = calculateDistanceStats(distances);

    const clubStats: ClubStats = {
      clubName,
      avgDistance: stats.avg,
      medianDistance: stats.median,
      stdDev: stats.stdDev,
      sampleCount: distances.length,
      lastUpdated: Date.now(),
      minDistance: stats.min,
      maxDistance: stats.max
    };

    await db.clubStats.put(clubStats);
  }
}

export async function getClubStats(): Promise<ClubStats[]> {
  return db.clubStats.orderBy('avgDistance').reverse().toArray();
}

export async function getClubStat(clubName: Club): Promise<ClubStats | undefined> {
  return db.clubStats.get(clubName);
}

// ============================================
// Export/Import Operations
// ============================================

export interface ExportData {
  version: number;
  exportedAt: number;
  courses: Course[];
  holes: Hole[];
  rounds: Round[];
  shots: Shot[];
  clubStats: ClubStats[];
}

export async function exportAllData(): Promise<ExportData> {
  return {
    version: 1,
    exportedAt: Date.now(),
    courses: await db.courses.toArray(),
    holes: await db.holes.toArray(),
    rounds: await db.rounds.toArray(),
    shots: await db.shots.toArray(),
    clubStats: await db.clubStats.toArray()
  };
}

export async function importData(data: ExportData): Promise<void> {
  await db.transaction('rw', [db.courses, db.holes, db.rounds, db.shots, db.clubStats], async () => {
    await db.courses.bulkPut(data.courses);
    await db.holes.bulkPut(data.holes);
    await db.rounds.bulkPut(data.rounds);
    await db.shots.bulkPut(data.shots);
    await db.clubStats.bulkPut(data.clubStats);
  });
}

export async function exportRoundToCSV(roundId: string): Promise<string> {
  const round = await getRound(roundId);
  if (!round) throw new Error('Round not found');

  const course = await getCourse(round.courseId);
  const shots = await getShotsForRound(roundId);

  const headers = ['Hole', 'Shot', 'Lat', 'Lng', 'Club', 'Lie', 'Putt', 'Timestamp', 'Note'];
  const rows = shots.map((s) => [
    s.holeNumber,
    s.shotNumber,
    s.lat,
    s.lng,
    s.club || '',
    s.lieType,
    s.isPutt ? 'Yes' : 'No',
    new Date(s.timestamp).toISOString(),
    s.note || ''
  ]);

  const csv = [
    `# Round: ${course?.name || 'Unknown'} - ${new Date(round.startedAt).toLocaleDateString()}`,
    headers.join(','),
    ...rows.map((r) => r.join(','))
  ].join('\n');

  return csv;
}

export { db };
