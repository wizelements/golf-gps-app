// ============================================
// Golf GPS Tracker - GPS Service
// Works offline in airplane mode using device GPS
// ============================================

import { create } from 'zustand';
import type { Coordinate, GPSState } from '@/types';

interface GPSStore extends GPSState {
  watchId: number | null;
  startWatching: () => void;
  stopWatching: () => void;
  getCurrentPosition: () => Promise<Coordinate>;
  setError: (error: string | null) => void;
}

const DEFAULT_OPTIONS: PositionOptions = {
  enableHighAccuracy: true,
  timeout: 30000,
  maximumAge: 5000
};

export const useGPSStore = create<GPSStore>((set, get) => ({
  isAvailable: 'geolocation' in navigator,
  isWatching: false,
  currentPosition: null,
  accuracy: null,
  lastUpdate: null,
  error: null,
  watchId: null,

  startWatching: () => {
    const state = get();
    if (!state.isAvailable) {
      set({ error: 'Geolocation not available on this device' });
      return;
    }

    if (state.isWatching && state.watchId !== null) {
      return;
    }

    const watchId = navigator.geolocation.watchPosition(
      (position) => {
        set({
          currentPosition: {
            lat: position.coords.latitude,
            lng: position.coords.longitude
          },
          accuracy: position.coords.accuracy,
          lastUpdate: Date.now(),
          error: null,
          isWatching: true
        });
      },
      (error) => {
        let errorMessage: string;
        switch (error.code) {
          case error.PERMISSION_DENIED:
            errorMessage = 'Location permission denied. Please enable location access.';
            break;
          case error.POSITION_UNAVAILABLE:
            errorMessage = 'Waiting for GPS fix...';
            break;
          case error.TIMEOUT:
            errorMessage = 'GPS timeout. Move to an open area.';
            break;
          default:
            errorMessage = `GPS error: ${error.message}`;
        }
        set({ error: errorMessage, isWatching: true });
      },
      DEFAULT_OPTIONS
    );

    set({ watchId, isWatching: true });
  },

  stopWatching: () => {
    const { watchId } = get();
    if (watchId !== null) {
      navigator.geolocation.clearWatch(watchId);
      set({ watchId: null, isWatching: false });
    }
  },

  getCurrentPosition: (): Promise<Coordinate> => {
    return new Promise((resolve, reject) => {
      if (!get().isAvailable) {
        reject(new Error('Geolocation not available'));
        return;
      }

      navigator.geolocation.getCurrentPosition(
        (position) => {
          const coord: Coordinate = {
            lat: position.coords.latitude,
            lng: position.coords.longitude
          };
          set({
            currentPosition: coord,
            accuracy: position.coords.accuracy,
            lastUpdate: Date.now(),
            error: null
          });
          resolve(coord);
        },
        (error) => {
          let errorMessage: string;
          switch (error.code) {
            case error.PERMISSION_DENIED:
              errorMessage = 'Location permission denied';
              break;
            case error.POSITION_UNAVAILABLE:
              errorMessage = 'Position unavailable';
              break;
            case error.TIMEOUT:
              errorMessage = 'GPS timeout';
              break;
            default:
              errorMessage = error.message;
          }
          set({ error: errorMessage });
          reject(new Error(errorMessage));
        },
        DEFAULT_OPTIONS
      );
    });
  },

  setError: (error) => set({ error })
}));

/**
 * Hook to use current GPS position
 */
export function useCurrentPosition() {
  const position = useGPSStore((state) => state.currentPosition);
  const accuracy = useGPSStore((state) => state.accuracy);
  const error = useGPSStore((state) => state.error);
  const isWatching = useGPSStore((state) => state.isWatching);

  return { position, accuracy, error, isWatching };
}

/**
 * Initialize GPS watching when app starts
 */
export function initializeGPS() {
  useGPSStore.getState().startWatching();
}

/**
 * Get a simulated position for testing
 */
export function getSimulatedPosition(baseLat: number, baseLng: number): Coordinate {
  const offsetLat = (Math.random() - 0.5) * 0.001;
  const offsetLng = (Math.random() - 0.5) * 0.001;
  return {
    lat: baseLat + offsetLat,
    lng: baseLng + offsetLng
  };
}

/**
 * Check if GPS position is accurate enough for logging
 */
export function isPositionAccurate(accuracy: number | null, threshold: number = 20): boolean {
  if (accuracy === null) return false;
  return accuracy <= threshold;
}

/**
 * Format accuracy for display
 */
export function formatAccuracy(accuracy: number | null): string {
  if (accuracy === null) return 'No GPS';
  if (accuracy <= 5) return 'Excellent';
  if (accuracy <= 10) return 'Good';
  if (accuracy <= 20) return 'Fair';
  return 'Poor';
}
