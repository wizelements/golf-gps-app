// ============================================
// Golf GPS Tracker - Math Utilities
// Haversine distance, bearing, cross-track error
// ============================================

import type { Coordinate, MissDirection, MissLength } from '@/types';

const EARTH_RADIUS_METERS = 6371000;

function toRadians(degrees: number): number {
  return (degrees * Math.PI) / 180;
}

function toDegrees(radians: number): number {
  return (radians * 180) / Math.PI;
}

/**
 * Calculate distance between two coordinates using Haversine formula
 * @returns Distance in meters
 */
export function calculateDistance(from: Coordinate, to: Coordinate): number {
  const lat1 = toRadians(from.lat);
  const lat2 = toRadians(to.lat);
  const deltaLat = toRadians(to.lat - from.lat);
  const deltaLng = toRadians(to.lng - from.lng);

  const a =
    Math.sin(deltaLat / 2) * Math.sin(deltaLat / 2) +
    Math.cos(lat1) * Math.cos(lat2) * Math.sin(deltaLng / 2) * Math.sin(deltaLng / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return EARTH_RADIUS_METERS * c;
}

/**
 * Calculate bearing from one coordinate to another
 * @returns Bearing in degrees (0-360, 0 = North)
 */
export function calculateBearing(from: Coordinate, to: Coordinate): number {
  const lat1 = toRadians(from.lat);
  const lat2 = toRadians(to.lat);
  const deltaLng = toRadians(to.lng - from.lng);

  const y = Math.sin(deltaLng) * Math.cos(lat2);
  const x = Math.cos(lat1) * Math.sin(lat2) - Math.sin(lat1) * Math.cos(lat2) * Math.cos(deltaLng);

  const bearing = toDegrees(Math.atan2(y, x));
  return (bearing + 360) % 360;
}

/**
 * Calculate cross-track distance (perpendicular distance from point to line)
 * Positive = right of line, Negative = left of line
 * @param point The point to measure from
 * @param lineStart Start of the reference line (e.g., tee)
 * @param lineEnd End of the reference line (e.g., green)
 * @returns Cross-track distance in meters (+ right, - left)
 */
export function calculateCrossTrackDistance(
  point: Coordinate,
  lineStart: Coordinate,
  lineEnd: Coordinate
): number {
  const distanceToStart = calculateDistance(lineStart, point) / EARTH_RADIUS_METERS;
  const bearingToPoint = toRadians(calculateBearing(lineStart, point));
  const bearingToEnd = toRadians(calculateBearing(lineStart, lineEnd));

  const crossTrack = Math.asin(Math.sin(distanceToStart) * Math.sin(bearingToPoint - bearingToEnd));

  return crossTrack * EARTH_RADIUS_METERS;
}

/**
 * Calculate along-track distance (distance along line from start to perpendicular intersection)
 * @returns Along-track distance in meters
 */
export function calculateAlongTrackDistance(
  point: Coordinate,
  lineStart: Coordinate,
  lineEnd: Coordinate
): number {
  const distanceToStart = calculateDistance(lineStart, point) / EARTH_RADIUS_METERS;
  const crossTrack = calculateCrossTrackDistance(point, lineStart, lineEnd) / EARTH_RADIUS_METERS;

  const alongTrack = Math.acos(Math.cos(distanceToStart) / Math.cos(crossTrack));

  return alongTrack * EARTH_RADIUS_METERS;
}

/**
 * Classify shot miss direction relative to tee→green line
 */
export function classifyMissDirection(
  crossTrackDistance: number,
  threshold: number = 5
): MissDirection {
  if (Math.abs(crossTrackDistance) < threshold) return 'ON_LINE';
  return crossTrackDistance > 0 ? 'RIGHT' : 'LEFT';
}

/**
 * Classify shot miss length relative to expected distance
 */
export function classifyMissLength(
  shotEndpoint: Coordinate,
  tee: Coordinate,
  green: Coordinate,
  threshold: number = 10
): MissLength {
  const totalHoleDistance = calculateDistance(tee, green);
  const distanceToGreen = calculateDistance(shotEndpoint, green);
  const alongTrack = calculateAlongTrackDistance(shotEndpoint, tee, green);

  if (alongTrack > totalHoleDistance + threshold) return 'LONG';
  if (distanceToGreen < threshold) return 'OK';
  if (alongTrack < totalHoleDistance - threshold && distanceToGreen > threshold) return 'SHORT';
  return 'OK';
}

/**
 * Calculate distance in yards (for display)
 */
export function metersToYards(meters: number): number {
  return meters * 1.09361;
}

/**
 * Format distance for display
 */
export function formatDistance(meters: number, unit: 'meters' | 'yards' = 'yards'): string {
  if (unit === 'yards') {
    return `${Math.round(metersToYards(meters))} yds`;
  }
  return `${Math.round(meters)} m`;
}

/**
 * Calculate statistics for a set of distances
 */
export function calculateDistanceStats(distances: number[]): {
  avg: number;
  median: number;
  stdDev: number;
  min: number;
  max: number;
} {
  if (distances.length === 0) {
    return { avg: 0, median: 0, stdDev: 0, min: 0, max: 0 };
  }

  const sorted = [...distances].sort((a, b) => a - b);
  const sum = distances.reduce((a, b) => a + b, 0);
  const avg = sum / distances.length;

  const median =
    sorted.length % 2 === 0
      ? (sorted[sorted.length / 2 - 1] + sorted[sorted.length / 2]) / 2
      : sorted[Math.floor(sorted.length / 2)];

  const squaredDiffs = distances.map((d) => Math.pow(d - avg, 2));
  const avgSquaredDiff = squaredDiffs.reduce((a, b) => a + b, 0) / distances.length;
  const stdDev = Math.sqrt(avgSquaredDiff);

  return {
    avg,
    median,
    stdDev,
    min: sorted[0],
    max: sorted[sorted.length - 1]
  };
}

/**
 * Get destination point given start, bearing, and distance
 */
export function getDestination(start: Coordinate, bearingDeg: number, distanceMeters: number): Coordinate {
  const lat1 = toRadians(start.lat);
  const lng1 = toRadians(start.lng);
  const bearing = toRadians(bearingDeg);
  const angularDistance = distanceMeters / EARTH_RADIUS_METERS;

  const lat2 = Math.asin(
    Math.sin(lat1) * Math.cos(angularDistance) +
      Math.cos(lat1) * Math.sin(angularDistance) * Math.cos(bearing)
  );

  const lng2 =
    lng1 +
    Math.atan2(
      Math.sin(bearing) * Math.sin(angularDistance) * Math.cos(lat1),
      Math.cos(angularDistance) - Math.sin(lat1) * Math.sin(lat2)
    );

  return {
    lat: toDegrees(lat2),
    lng: toDegrees(lng2)
  };
}
