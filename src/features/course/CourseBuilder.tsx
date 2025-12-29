// ============================================
// Golf GPS Tracker - Course Builder
// Walk & Mark + Map Tap modes
// ============================================

import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import type { Course, Hole } from '@/types';
import { createCourse, getCourse, getHoles, saveHole } from '@/services/storage';
import { useGPSStore, useCurrentPosition } from '@/services/gps';
import { Header, GPSIndicator } from '@/ui/components/Navigation';
import { GolfMap } from '@/ui/components/Map';
import { calculateDistance, formatDistance } from '@/services/math';

type BuilderStep = 'info' | 'holes';

export function CourseBuilder() {
  const navigate = useNavigate();
  const { courseId } = useParams();
  const { position, accuracy, isWatching, error } = useCurrentPosition();
  const startWatching = useGPSStore((s) => s.startWatching);

  const [step, setStep] = useState<BuilderStep>(courseId ? 'holes' : 'info');
  const [course, setCourse] = useState<Course | null>(null);
  const [holes, setHoles] = useState<Hole[]>([]);
  const [currentHole, setCurrentHole] = useState(1);

  const [name, setName] = useState('');
  const [holesCount, setHolesCount] = useState<9 | 18>(18);

  const [teeSet, setTeeSet] = useState(false);
  const [greenSet, setGreenSet] = useState(false);
  const [tempTee, setTempTee] = useState<{ lat: number; lng: number } | null>(null);
  const [tempGreen, setTempGreen] = useState<{ lat: number; lng: number } | null>(null);
  const [mapTapMode, setMapTapMode] = useState<'tee' | 'green' | null>(null);

  useEffect(() => {
    startWatching();
  }, []);

  useEffect(() => {
    if (courseId) {
      loadCourse(courseId);
    }
  }, [courseId]);

  const loadCourse = async (id: string) => {
    const c = await getCourse(id);
    if (c) {
      setCourse(c);
      setName(c.name);
      setHolesCount(c.holesCount);
      const h = await getHoles(id);
      setHoles(h);
    }
  };

  const handleCreateCourse = async () => {
    if (!name.trim()) return;
    const newCourse = await createCourse(name.trim(), holesCount);
    setCourse(newCourse);
    setStep('holes');
    navigate(`/courses/${newCourse.id}/edit`, { replace: true });
  };

  const handleMarkTee = () => {
    if (!position) return;
    setTempTee({ lat: position.lat, lng: position.lng });
    setTeeSet(true);
  };

  const handleMarkGreen = () => {
    if (!position) return;
    setTempGreen({ lat: position.lat, lng: position.lng });
    setGreenSet(true);
  };

  const handleMapClick = (coord: { lat: number; lng: number }) => {
    if (mapTapMode === 'tee') {
      setTempTee(coord);
      setTeeSet(true);
      setMapTapMode(null);
    } else if (mapTapMode === 'green') {
      setTempGreen(coord);
      setGreenSet(true);
      setMapTapMode(null);
    }
  };

  const handleSaveHole = async () => {
    if (!course || !tempTee || !tempGreen) return;

    const hole: Omit<Hole, 'id'> = {
      courseId: course.id,
      holeNumber: currentHole,
      teeLat: tempTee.lat,
      teeLng: tempTee.lng,
      greenLat: tempGreen.lat,
      greenLng: tempGreen.lng
    };

    await saveHole(hole);
    const updatedHoles = await getHoles(course.id);
    setHoles(updatedHoles);

    if (currentHole < holesCount) {
      setCurrentHole(currentHole + 1);
      setTempTee(null);
      setTempGreen(null);
      setTeeSet(false);
      setGreenSet(false);
    } else {
      navigate(`/courses/${course.id}`);
    }
  };

  const existingHole = holes.find((h) => h.holeNumber === currentHole);

  useEffect(() => {
    if (existingHole) {
      setTempTee({ lat: existingHole.teeLat, lng: existingHole.teeLng });
      setTempGreen({ lat: existingHole.greenLat, lng: existingHole.greenLng });
      setTeeSet(true);
      setGreenSet(true);
    }
  }, [existingHole]);

  if (step === 'info') {
    return (
      <div className="app-container">
        <Header title="New Course" onBack={() => navigate('/courses')} />

        <div className="screen">
          <div className="input-group">
            <label className="input-label">Course Name</label>
            <input
              type="text"
              className="input"
              placeholder="e.g., Pine Valley Golf Club"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </div>

          <div className="input-group">
            <label className="input-label">Number of Holes</label>
            <div className="toggle-group">
              <div
                className={`toggle-option ${holesCount === 9 ? 'active' : ''}`}
                onClick={() => setHolesCount(9)}
              >
                9 Holes
              </div>
              <div
                className={`toggle-option ${holesCount === 18 ? 'active' : ''}`}
                onClick={() => setHolesCount(18)}
              >
                18 Holes
              </div>
            </div>
          </div>

          <button
            className="btn btn-primary btn-large mt-lg"
            onClick={handleCreateCourse}
            disabled={!name.trim()}
          >
            Continue to Hole Setup
          </button>
        </div>
      </div>
    );
  }

  const holeDistance =
    tempTee && tempGreen
      ? calculateDistance(tempTee, tempGreen)
      : existingHole
        ? calculateDistance(
            { lat: existingHole.teeLat, lng: existingHole.teeLng },
            { lat: existingHole.greenLat, lng: existingHole.greenLng }
          )
        : null;

  return (
    <div className="app-container">
      <Header
        title={`Hole ${currentHole} of ${holesCount}`}
        onBack={() => navigate(`/courses/${course?.id || ''}`)}
        rightAction={
          <GPSIndicator accuracy={accuracy} isWatching={isWatching} error={error} />
        }
      />

      <div className="screen">
        <div className="card">
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 12 }}>
            <span>Tee Position</span>
            {teeSet ? (
              <span className="text-success">✓ Set</span>
            ) : (
              <span className="text-muted">Not set</span>
            )}
          </div>
          <div className="card-row">
            <button
              className={`btn ${teeSet ? 'btn-secondary' : 'btn-primary'}`}
              onClick={handleMarkTee}
              disabled={!position}
            >
              📍 Mark Here
            </button>
            <button
              className={`btn ${mapTapMode === 'tee' ? 'btn-primary' : 'btn-secondary'}`}
              onClick={() => setMapTapMode(mapTapMode === 'tee' ? null : 'tee')}
            >
              🗺️ Tap Map
            </button>
          </div>
        </div>

        <div className="card">
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 12 }}>
            <span>Green Position</span>
            {greenSet ? (
              <span className="text-success">✓ Set</span>
            ) : (
              <span className="text-muted">Not set</span>
            )}
          </div>
          <div className="card-row">
            <button
              className={`btn ${greenSet ? 'btn-secondary' : 'btn-primary'}`}
              onClick={handleMarkGreen}
              disabled={!position}
            >
              📍 Mark Here
            </button>
            <button
              className={`btn ${mapTapMode === 'green' ? 'btn-primary' : 'btn-secondary'}`}
              onClick={() => setMapTapMode(mapTapMode === 'green' ? null : 'green')}
            >
              🗺️ Tap Map
            </button>
          </div>
        </div>

        {holeDistance && (
          <div className="card text-center">
            <div className="card-title">Hole Length</div>
            <div className="card-value">{formatDistance(holeDistance)}</div>
          </div>
        )}

        {mapTapMode && (
          <div className="card" style={{ background: 'var(--color-accent)', color: '#000' }}>
            <strong>Tap the map to set {mapTapMode} position</strong>
          </div>
        )}

        <div style={{ flex: 1, minHeight: 300, marginTop: 12 }}>
          <GolfMap
            playerPosition={position}
            hole={
              tempTee && tempGreen
                ? {
                    id: 'temp',
                    courseId: course?.id || '',
                    holeNumber: currentHole,
                    teeLat: tempTee.lat,
                    teeLng: tempTee.lng,
                    greenLat: tempGreen.lat,
                    greenLng: tempGreen.lng
                  }
                : existingHole
            }
            onMapClick={handleMapClick}
            showControls={true}
          />
        </div>

        <div className="card-row mt-md">
          <button
            className="btn btn-secondary"
            onClick={() => {
              if (currentHole > 1) {
                setCurrentHole(currentHole - 1);
                setTempTee(null);
                setTempGreen(null);
                setTeeSet(false);
                setGreenSet(false);
              }
            }}
            disabled={currentHole === 1}
          >
            ← Prev
          </button>
          <button
            className="btn btn-primary"
            onClick={handleSaveHole}
            disabled={!teeSet || !greenSet}
            style={{ flex: 2 }}
          >
            {currentHole < holesCount ? 'Save & Next →' : 'Finish Course'}
          </button>
        </div>

        <div className="chip-group mt-md" style={{ justifyContent: 'center' }}>
          {Array.from({ length: holesCount }, (_, i) => i + 1).map((num) => {
            const isComplete = holes.some((h) => h.holeNumber === num);
            return (
              <div
                key={num}
                className={`chip ${currentHole === num ? 'selected' : ''}`}
                style={{
                  background: isComplete ? 'var(--color-success)' : undefined,
                  minWidth: 36,
                  textAlign: 'center'
                }}
                onClick={() => {
                  setCurrentHole(num);
                  setTempTee(null);
                  setTempGreen(null);
                  setTeeSet(false);
                  setGreenSet(false);
                }}
              >
                {num}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
