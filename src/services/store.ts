// ============================================
// Golf GPS Tracker - App State Store (Zustand)
// ============================================

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { Round, Course, Hole, Shot, Club } from '@/types';
import * as storage from './storage';

interface AppStore {
  // Active state
  activeRound: Round | null;
  activeCourse: Course | null;
  currentHoleData: Hole | null;
  currentHoleShots: Shot[];

  // UI state
  showShotModal: boolean;
  pendingShotLocation: { lat: number; lng: number } | null;

  // Settings
  distanceUnit: 'yards' | 'meters';
  favoriteClubs: Club[];

  // Actions
  setActiveRound: (round: Round | null) => void;
  setActiveCourse: (course: Course | null) => void;
  setCurrentHoleData: (hole: Hole | null) => void;
  loadCurrentHoleShots: (roundId: string, holeNumber: number) => Promise<void>;
  addShot: (shot: Shot) => void;
  removeLastShot: () => void;
  setShotModal: (show: boolean, location?: { lat: number; lng: number }) => void;
  setDistanceUnit: (unit: 'yards' | 'meters') => void;
  setFavoriteClubs: (clubs: Club[]) => void;

  // Complex operations
  startNewRound: (courseId: string, teeSetName?: string) => Promise<Round>;
  advanceHole: () => Promise<void>;
  previousHole: () => Promise<void>;
  endCurrentRound: (notes?: string) => Promise<void>;
}

export const useAppStore = create<AppStore>()(
  persist(
    (set, get) => ({
      activeRound: null,
      activeCourse: null,
      currentHoleData: null,
      currentHoleShots: [],
      showShotModal: false,
      pendingShotLocation: null,
      distanceUnit: 'yards',
      favoriteClubs: ['driver', '7iron', 'pw', 'putter'],

      setActiveRound: (round) => set({ activeRound: round }),
      setActiveCourse: (course) => set({ activeCourse: course }),
      setCurrentHoleData: (hole) => set({ currentHoleData: hole }),

      loadCurrentHoleShots: async (roundId, holeNumber) => {
        const shots = await storage.getShotsForHole(roundId, holeNumber);
        set({ currentHoleShots: shots });
      },

      addShot: (shot) => set((state) => ({
        currentHoleShots: [...state.currentHoleShots, shot]
      })),

      removeLastShot: () => set((state) => ({
        currentHoleShots: state.currentHoleShots.slice(0, -1)
      })),

      setShotModal: (show, location) => set({
        showShotModal: show,
        pendingShotLocation: location || null
      }),

      setDistanceUnit: (unit) => set({ distanceUnit: unit }),
      setFavoriteClubs: (clubs) => set({ favoriteClubs: clubs }),

      startNewRound: async (courseId, teeSetName) => {
        const course = await storage.getCourse(courseId);
        const round = await storage.startRound(courseId, teeSetName);
        const holes = await storage.getHoles(courseId);
        const firstHole = holes.find((h) => h.holeNumber === 1);

        set({
          activeRound: round,
          activeCourse: course || null,
          currentHoleData: firstHole || null,
          currentHoleShots: []
        });

        return round;
      },

      advanceHole: async () => {
        const { activeRound, activeCourse } = get();
        if (!activeRound || !activeCourse) return;

        const nextHoleNum = Math.min(activeRound.currentHole + 1, activeCourse.holesCount);
        await storage.updateRound(activeRound.id, { currentHole: nextHoleNum });

        const nextHole = await storage.getHole(activeCourse.id, nextHoleNum);
        const shots = await storage.getShotsForHole(activeRound.id, nextHoleNum);

        set({
          activeRound: { ...activeRound, currentHole: nextHoleNum },
          currentHoleData: nextHole || null,
          currentHoleShots: shots
        });
      },

      previousHole: async () => {
        const { activeRound, activeCourse } = get();
        if (!activeRound || !activeCourse) return;

        const prevHoleNum = Math.max(activeRound.currentHole - 1, 1);
        await storage.updateRound(activeRound.id, { currentHole: prevHoleNum });

        const prevHole = await storage.getHole(activeCourse.id, prevHoleNum);
        const shots = await storage.getShotsForHole(activeRound.id, prevHoleNum);

        set({
          activeRound: { ...activeRound, currentHole: prevHoleNum },
          currentHoleData: prevHole || null,
          currentHoleShots: shots
        });
      },

      endCurrentRound: async (notes) => {
        const { activeRound } = get();
        if (!activeRound) return;

        await storage.endRound(activeRound.id, notes);

        set({
          activeRound: null,
          activeCourse: null,
          currentHoleData: null,
          currentHoleShots: []
        });
      }
    }),
    {
      name: 'golf-gps-settings',
      partialize: (state) => ({
        distanceUnit: state.distanceUnit,
        favoriteClubs: state.favoriteClubs
      })
    }
  )
);
