# Golf GPS Tracker

**Offline-first golf GPS + shot tracking app** that works in airplane mode with device GPS only.

## Features

- **100% Offline**: Works with no internet after initial install
- **GPS in Airplane Mode**: Uses device GPS receiver directly
- **Course Builder**: Walk & Mark mode or Map Tap mode
- **Shot Logging**: One-tap GPS capture with club/lie selection
- **Live Distance**: Real-time distance to green display
- **Shot Analysis**: Club distances, miss patterns, per-hole replay
- **PWA + Native**: Installable PWA and Android app via Capacitor

## Quick Start

### Development (PWA)

```bash
cd golf-gps-app

# Install dependencies
npm install

# Start dev server
npm run dev
```

Open http://localhost:5173 on your device.

### Build for Production

```bash
npm run build
npm run preview
```

## Architecture

```
src/
├── types/           # TypeScript data models
├── services/
│   ├── math.ts      # Haversine, bearing, cross-track
│   ├── storage.ts   # IndexedDB via Dexie
│   ├── gps.ts       # GPS service with Zustand
│   └── store.ts     # App state management
├── ui/
│   ├── styles.css   # Global styles (dark golf theme)
│   └── components/  # Reusable UI components
└── features/
    ├── home/        # Home screen
    ├── course/      # Course list, builder, detail
    ├── round/       # Active round, round list
    └── analysis/    # Replay, club stats
```

## Data Model

### Course
- `id`, `name`, `holesCount` (9/18), timestamps

### Hole
- `courseId`, `holeNumber`, `par`
- `teeLat/Lng`, `greenLat/Lng`
- Optional: `greenPolygon`, `hazards`

### Round
- `courseId`, `startedAt`, `endedAt`
- `currentHole`, `isComplete`

### Shot
- `roundId`, `holeNumber`, `shotNumber`
- `lat`, `lng`, `timestamp`, `accuracyMeters`
- `club`, `lieType`, `isPutt`
- `missDirection` (LEFT/RIGHT/ON_LINE)
- `missLength` (SHORT/LONG/OK)

## Offline Strategy

1. **PWA Service Worker**: Caches app shell and static assets
2. **IndexedDB**: All data stored locally via Dexie
3. **Map Tiles**: OpenStreetMap tiles cached on first view
4. **Vector Fallback**: Canvas-based course view works without tiles

## GPS Math Utilities

```typescript
// Distance between two points (meters)
calculateDistance(from: Coordinate, to: Coordinate): number

// Bearing from A to B (degrees, 0=North)
calculateBearing(from: Coordinate, to: Coordinate): number

// Perpendicular distance from point to tee→green line
calculateCrossTrackDistance(point, tee, green): number

// Classify shot: LEFT/RIGHT/ON_LINE
classifyMissDirection(crossTrackDistance): MissDirection

// Classify shot: SHORT/LONG/OK
classifyMissLength(shotEndpoint, tee, green): MissLength
```

## Termux Build Guide

### Prerequisites

```bash
# Update packages
pkg update && pkg upgrade

# Install Node.js
pkg install nodejs-lts

# Install Java (for Android builds)
pkg install openjdk-17

# Optional: Install Android SDK
# This is complex in Termux; see "Alternative Build Path" below
```

### PWA Development

```bash
# Clone/navigate to project
cd ~/golf-gps-app

# Install dependencies
npm install

# Start development server
npm run dev

# Access on device browser at http://localhost:5173
# Or get your IP: ip addr show wlan0
# Access from another device: http://YOUR_IP:5173
```

### Building PWA

```bash
npm run build

# Serve production build
npm run preview
```

### Capacitor Native Build

#### Option 1: Build APK on Desktop (Recommended)

1. Develop and test PWA in Termux
2. Copy project to a desktop machine with Android Studio
3. Run:
   ```bash
   npm run build
   npx cap sync android
   npx cap open android
   ```
4. Build APK in Android Studio

#### Option 2: Termux + Cloudflare Tunnel

1. Run dev server in Termux:
   ```bash
   npm run dev
   ```
2. Use cloudflared tunnel to expose:
   ```bash
   cloudflared tunnel --url http://localhost:5173
   ```
3. Install PWA on any device via the tunnel URL

#### Option 3: Self-Signed APK (Advanced)

If you have Android SDK in Termux:

```bash
npm run build
npx cap add android
npx cap sync android
cd android
./gradlew assembleDebug
```

APK location: `android/app/build/outputs/apk/debug/app-debug.apk`

### Installing PWA on Android

1. Open Chrome/Edge on your Android device
2. Navigate to your dev server URL
3. Tap the "Install" banner or Menu → "Install app"
4. The app works offline after installation

## User Flows

### Course Setup

1. **Courses** → **+ New**
2. Enter course name, select 9/18 holes
3. For each hole:
   - Stand at tee → tap **Mark Here**
   - Walk to green → tap **Mark Here**
   - OR use **Tap Map** to place points
4. Green checkmarks show completed holes

### Playing a Round

1. **Home** → Select course → **Start Round**
2. View live **distance to green**
3. After each shot, tap **Log Shot**
4. Select club (optional), lie type
5. Tap **→** to advance holes
6. Tap **←** (back) to end round

### Reviewing Rounds

1. **Rounds** tab → Select completed round
2. Navigate holes with arrows
3. View shot dots, distances, miss patterns
4. **Stats** tab shows club averages

## API Reference

### Storage Service

```typescript
// Courses
createCourse(name, holesCount): Promise<Course>
listCourses(): Promise<Course[]>
deleteCourse(id): Promise<void>

// Holes
saveHole(hole): Promise<Hole>
getHoles(courseId): Promise<Hole[]>

// Rounds
startRound(courseId): Promise<Round>
endRound(id): Promise<void>
getRounds(): Promise<Round[]>

// Shots
logShot(roundId, holeNumber, lat, lng, options): Promise<Shot>
getShotsForHole(roundId, holeNumber): Promise<Shot[]>
deleteLastShot(roundId, holeNumber): Promise<boolean>

// Stats
computeAndCacheClubStats(): Promise<void>
getClubStats(): Promise<ClubStats[]>

// Export
exportAllData(): Promise<ExportData>
exportRoundToCSV(roundId): Promise<string>
```

### GPS Service

```typescript
// Zustand store
useGPSStore.getState().startWatching()
useGPSStore.getState().stopWatching()
useGPSStore.getState().getCurrentPosition()

// Hook
const { position, accuracy, error, isWatching } = useCurrentPosition()
```

## Troubleshooting

### GPS Not Working

- Ensure location permission is granted
- In airplane mode, GPS still works (no cellular/WiFi needed)
- Move to open area for better fix
- Check accuracy indicator in header

### Map Tiles Not Loading

- First load requires internet for tile cache
- Use Vector Mode (SimpleCourseView) as fallback
- App functions fully without map tiles

### Build Errors

```bash
# Clear cache and reinstall
rm -rf node_modules
npm install

# TypeScript errors
npm run lint
```

## Version History

### v1.0.0 (MVP)
- Course builder with Walk & Mark
- Round tracking with GPS shot logging
- Distance to green display
- Hole replay and navigation
- Club stats with averages
- PWA offline support
- Dark golf-themed UI

## License

MIT
