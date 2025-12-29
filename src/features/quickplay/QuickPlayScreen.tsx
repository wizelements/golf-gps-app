// ============================================
// QuickPlay Screen
// The "zero friction" golf experience
// Just show up and play! 🏌️
// ============================================

import { useEffect, useState, useCallback } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useGPSStore, useCurrentPosition } from '@/services/gps';
import { calculateDistance, metersToYards } from '@/services/math';
import { Header, GPSIndicator } from '@/ui/components/Navigation';
import { GolfMap } from '@/ui/components/Map';
import * as storage from '@/services/storage';
import { importOSMCourse, createPioneerCourse } from '@/services/courseDiscovery';
import type { OSMGolfCourse } from '@/services/osmGolf';
import type { Course, Hole, Round } from '@/types';

type PlayMode = 'loading' | 'playing' | 'set-green' | 'scoring';

interface HoleState {
  number: number;
  greenSet: boolean;
  greenLat?: number;
  greenLng?: number;
  par?: number;
  strokes: number;
}

export function QuickPlayScreen() {
  const navigate = useNavigate();
  const { courseId, osmData, newCourseName } = useParams();
  const { position, accuracy, isWatching, error } = useCurrentPosition();
  const startWatching = useGPSStore((s) => s.startWatching);

  const [mode, setMode] = useState<PlayMode>('loading');
  const [course, setCourse] = useState<Course | null>(null);
  const [round, setRound] = useState<Round | null>(null);
  const [holes, setHoles] = useState<Map<number, Hole>>(new Map());
  const [currentHole, setCurrentHole] = useState<HoleState>({
    number: 1,
    greenSet: false,
    strokes: 0
  });
  
  // Score tracking
  const [scores, setScores] = useState<Map<number, number>>(new Map());
  const [totalStrokes, setTotalStrokes] = useState(0);

  // UI state
  const [showEndConfirm, setShowEndConfirm] = useState(false);
  const [tapPrompt, setTapPrompt] = useState<string | null>(null);

  useEffect(() => {
    startWatching();
    initializeCourse();
  }, []);

  const initializeCourse = async () => {
    try {
      if (courseId && !courseId.startsWith('osm/') && !courseId.startsWith('new/')) {
        // Load existing local course
        const existingCourse = await storage.getCourse(courseId);
        if (existingCourse) {
          await setupCourse(existingCourse);
          return;
        }
      }

      if (osmData) {
        // Import from OSM
        const osm: OSMGolfCourse = JSON.parse(decodeURIComponent(osmData));
        const imported = await importOSMCourse(osm);
        await setupCourse(imported);
        return;
      }

      if (newCourseName) {
        // Pioneer mode - create new course
        const name = decodeURIComponent(newCourseName);
        const newCourse = await createPioneerCourse(
          name,
          position?.lat || 0,
          position?.lng || 0,
          18
        );
        await setupCourse(newCourse);
        return;
      }

      // Fallback - shouldn't happen
      navigate('/');
    } catch (e) {
      console.error('Failed to initialize course:', e);
      navigate('/');
    }
  };

  const setupCourse = async (c: Course) => {
    setCourse(c);
    
    // Load existing holes
    const courseHoles = await storage.getHoles(c.id);
    const holesMap = new Map<number, Hole>();
    for (const hole of courseHoles) {
      holesMap.set(hole.holeNumber, hole);
    }
    setHoles(holesMap);

    // Create or resume round
    let activeRound = await storage.getActiveRound();
    if (!activeRound || activeRound.courseId !== c.id) {
      activeRound = await storage.startRound(c.id);
    }
    setRound(activeRound || null);

    // Setup current hole
    const currentHoleNum = activeRound?.currentHole || 1;
    const holeData = holesMap.get(currentHoleNum);
    setCurrentHole({
      number: currentHoleNum,
      greenSet: !!holeData?.greenLat,
      greenLat: holeData?.greenLat,
      greenLng: holeData?.greenLng,
      par: holeData?.par,
      strokes: 0
    });

    // If no green set, prompt to tap
    if (!holeData?.greenLat) {
      setTapPrompt("Tap the green on the map! 🎯");
      setMode('set-green');
    } else {
      setMode('playing');
    }
  };

  const handleMapTap = useCallback(async (coord: { lat: number; lng: number }) => {
    if (mode !== 'set-green' || !course) return;

    // Save the green position
    const holeData: Omit<Hole, 'id'> = {
      courseId: course.id,
      holeNumber: currentHole.number,
      teeLat: position?.lat || coord.lat - 0.002,
      teeLng: position?.lng || coord.lng,
      greenLat: coord.lat,
      greenLng: coord.lng
    };

    await storage.saveHole(holeData);

    // Update state
    const updatedHole = { ...holeData, id: `${course.id}-${currentHole.number}` } as Hole;
    setHoles(prev => new Map(prev).set(currentHole.number, updatedHole));
    
    setCurrentHole(prev => ({
      ...prev,
      greenSet: true,
      greenLat: coord.lat,
      greenLng: coord.lng
    }));

    setTapPrompt(null);
    setMode('playing');
  }, [mode, course, currentHole.number, position]);

  const handleStrokeChange = (delta: number) => {
    setCurrentHole(prev => ({
      ...prev,
      strokes: Math.max(0, prev.strokes + delta)
    }));
  };

  const handleNextHole = async () => {
    if (!round || !course) return;

    // Save score
    const newScores = new Map(scores);
    newScores.set(currentHole.number, currentHole.strokes);
    setScores(newScores);
    setTotalStrokes(prev => prev + currentHole.strokes);

    // Move to next hole
    const nextHoleNum = currentHole.number + 1;
    if (nextHoleNum > course.holesCount) {
      // Round complete!
      await storage.updateRound(round.id, { isComplete: true });
      navigate('/rounds');
      return;
    }

    // Update round
    await storage.updateRound(round.id, { currentHole: nextHoleNum });

    // Setup next hole
    const nextHoleData = holes.get(nextHoleNum);
    setCurrentHole({
      number: nextHoleNum,
      greenSet: !!nextHoleData?.greenLat,
      greenLat: nextHoleData?.greenLat,
      greenLng: nextHoleData?.greenLng,
      par: nextHoleData?.par,
      strokes: 0
    });

    if (!nextHoleData?.greenLat) {
      setTapPrompt("Tap the green for hole " + nextHoleNum + "! 🎯");
      setMode('set-green');
    } else {
      setMode('playing');
    }
  };

  const handlePrevHole = async () => {
    if (!round || currentHole.number <= 1) return;

    const prevHoleNum = currentHole.number - 1;
    await storage.updateRound(round.id, { currentHole: prevHoleNum });

    const prevHoleData = holes.get(prevHoleNum);
    const prevScore = scores.get(prevHoleNum) || 0;

    setCurrentHole({
      number: prevHoleNum,
      greenSet: !!prevHoleData?.greenLat,
      greenLat: prevHoleData?.greenLat,
      greenLng: prevHoleData?.greenLng,
      par: prevHoleData?.par,
      strokes: prevScore
    });

    setMode('playing');
  };

  const handleEndRound = async () => {
    if (round) {
      await storage.updateRound(round.id, { isComplete: true });
    }
    navigate('/rounds');
  };

  // Calculate distance to green
  const distanceToGreen = position && currentHole.greenLat && currentHole.greenLng
    ? calculateDistance(position, { lat: currentHole.greenLat, lng: currentHole.greenLng })
    : null;

  const distanceYards = distanceToGreen ? Math.round(metersToYards(distanceToGreen)) : null;

  // Score relative to par
  const getScoreLabel = (strokes: number, par?: number) => {
    if (!par || strokes === 0) return '';
    const diff = strokes - par;
    if (diff === -2) return '🦅 Eagle!';
    if (diff === -1) return '🐦 Birdie!';
    if (diff === 0) return '👍 Par';
    if (diff === 1) return 'Bogey';
    if (diff === 2) return 'Double';
    if (diff > 2) return `+${diff}`;
    return `${diff}`;
  };

  if (mode === 'loading') {
    return (
      <div className="app-container">
        <div className="screen flex-center">
          <div className="loading-spinner">⛳</div>
          <div className="loading-text">Setting up your round...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="app-container quickplay">
      <Header
        title={course?.name || 'Quick Play'}
        onBack={() => setShowEndConfirm(true)}
        rightAction={
          <GPSIndicator accuracy={accuracy} isWatching={isWatching} error={error} />
        }
      />

      <div className="quickplay-content">
        {/* Hole Header */}
        <div className="hole-header">
          <button 
            className="hole-nav-btn"
            onClick={handlePrevHole}
            disabled={currentHole.number <= 1}
          >
            ←
          </button>
          
          <div className="hole-info">
            <div className="hole-number">Hole {currentHole.number}</div>
            {currentHole.par && (
              <div className="hole-par">Par {currentHole.par}</div>
            )}
          </div>

          <button 
            className="hole-nav-btn"
            onClick={handleNextHole}
            disabled={currentHole.number >= (course?.holesCount || 18)}
          >
            →
          </button>
        </div>

        {/* Distance Display */}
        {mode === 'playing' && distanceYards !== null && (
          <div className="distance-hero">
            <div className="distance-number">{distanceYards}</div>
            <div className="distance-unit">yards</div>
          </div>
        )}

        {/* Set Green Prompt */}
        {mode === 'set-green' && (
          <div className="set-green-prompt">
            <div className="prompt-icon">🎯</div>
            <div className="prompt-text">{tapPrompt}</div>
            <div className="prompt-hint">Tap the center of the green on the map below</div>
          </div>
        )}

        {/* Map */}
        <div className="quickplay-map">
          <GolfMap
            playerPosition={position}
            hole={currentHole.greenLat && currentHole.greenLng ? {
              id: `hole-${currentHole.number}`,
              courseId: course?.id || '',
              holeNumber: currentHole.number,
              teeLat: position?.lat || 0,
              teeLng: position?.lng || 0,
              greenLat: currentHole.greenLat,
              greenLng: currentHole.greenLng
            } : undefined}
            onMapClick={handleMapTap}
            showControls={true}
            interactive={mode === 'set-green'}
          />
          
          {mode === 'set-green' && (
            <div className="map-overlay-hint">
              👆 Tap the green!
            </div>
          )}
        </div>

        {/* Score Section */}
        {mode === 'playing' && (
          <div className="score-section">
            <div className="score-controls">
              <button 
                className="score-btn minus"
                onClick={() => handleStrokeChange(-1)}
                disabled={currentHole.strokes <= 0}
              >
                −
              </button>
              
              <div className="score-display">
                <div className="score-number">{currentHole.strokes || '−'}</div>
                <div className="score-label">
                  {currentHole.strokes > 0 
                    ? getScoreLabel(currentHole.strokes, currentHole.par)
                    : 'strokes'}
                </div>
              </div>

              <button 
                className="score-btn plus"
                onClick={() => handleStrokeChange(1)}
              >
                +
              </button>
            </div>

            {/* Total Score */}
            <div className="total-score">
              Total: {totalStrokes + currentHole.strokes} strokes
            </div>

            {/* Next Hole Button */}
            <button 
              className="btn btn-primary btn-next-hole"
              onClick={handleNextHole}
            >
              {currentHole.number >= (course?.holesCount || 18) 
                ? '🏁 Finish Round' 
                : '➡️ Next Hole'}
            </button>
          </div>
        )}
      </div>

      {/* End Round Confirmation */}
      {showEndConfirm && (
        <div className="modal-overlay" onClick={() => setShowEndConfirm(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2 className="modal-title">End Round?</h2>
              <button className="modal-close" onClick={() => setShowEndConfirm(false)}>
                ✕
              </button>
            </div>
            <p className="text-muted mb-md">
              You're on hole {currentHole.number} with {totalStrokes + currentHole.strokes} strokes.
            </p>
            <div className="modal-actions">
              <button className="btn btn-secondary" onClick={() => setShowEndConfirm(false)}>
                Keep Playing
              </button>
              <button className="btn btn-danger" onClick={handleEndRound}>
                End Round
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
