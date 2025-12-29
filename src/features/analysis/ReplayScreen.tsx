// ============================================
// Golf GPS Tracker - Round Replay Screen
// Hole-by-hole replay with shot details
// ============================================

import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import type { Round, Course, Hole, Shot } from '@/types';
import { getRound, getCourse, getHoles, analyzeShotsForHole } from '@/services/storage';
import { calculateDistance, formatDistance } from '@/services/math';
import { Header } from '@/ui/components/Navigation';
import { SimpleCourseView } from '@/ui/components/Map';
import { useAppStore } from '@/services/store';

export function ReplayScreen() {
  const navigate = useNavigate();
  const { roundId } = useParams();
  const distanceUnit = useAppStore((s) => s.distanceUnit);

  const [round, setRound] = useState<Round | null>(null);
  const [course, setCourse] = useState<Course | null>(null);
  const [holes, setHoles] = useState<Hole[]>([]);
  const [currentHole, setCurrentHole] = useState(1);
  const [holeShots, setHoleShots] = useState<Shot[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (roundId) loadData(roundId);
  }, [roundId]);

  useEffect(() => {
    if (round && holes.length > 0) {
      loadHoleShots();
    }
  }, [currentHole, round, holes]);

  const loadData = async (id: string) => {
    setLoading(true);
    const r = await getRound(id);
    if (!r) {
      navigate('/rounds');
      return;
    }
    setRound(r);

    const c = await getCourse(r.courseId);
    setCourse(c || null);

    const h = await getHoles(r.courseId);
    setHoles(h);
    setLoading(false);
  };

  const loadHoleShots = async () => {
    if (!round) return;
    const hole = holes.find((h) => h.holeNumber === currentHole);
    if (hole) {
      const shots = await analyzeShotsForHole(round.id, currentHole, hole);
      setHoleShots(shots);
    }
  };

  if (loading || !round || !course) {
    return (
      <div className="app-container">
        <Header title="Loading..." onBack={() => navigate('/rounds')} />
        <div className="screen flex-center">Loading...</div>
      </div>
    );
  }

  const hole = holes.find((h) => h.holeNumber === currentHole);
  const holeDistance = hole
    ? calculateDistance(
        { lat: hole.teeLat, lng: hole.teeLng },
        { lat: hole.greenLat, lng: hole.greenLng }
      )
    : 0;

  const totalShotsOnHole = holeShots.length;
  const longestShot = holeShots.reduce((max, s) => {
    return s.distanceToNext && s.distanceToNext > max ? s.distanceToNext : max;
  }, 0);

  return (
    <div className="app-container">
      <Header title={`${course.name} - Replay`} onBack={() => navigate('/rounds')} />

      <div className="screen">
        <div className="hole-bar">
          <div>
            <div className="hole-number">Hole {currentHole}</div>
            <div className="hole-par">{formatDistance(holeDistance, distanceUnit)}</div>
          </div>
          <div className="hole-nav">
            <button
              className="btn btn-icon btn-secondary"
              onClick={() => setCurrentHole(Math.max(1, currentHole - 1))}
              disabled={currentHole === 1}
            >
              ←
            </button>
            <button
              className="btn btn-icon btn-secondary"
              onClick={() => setCurrentHole(Math.min(round.currentHole, currentHole + 1))}
              disabled={currentHole >= round.currentHole}
            >
              →
            </button>
          </div>
        </div>

        <div className="stat-grid mb-md">
          <div className="stat-card">
            <div className="stat-value">{totalShotsOnHole}</div>
            <div className="stat-label">Shots</div>
          </div>
          <div className="stat-card">
            <div className="stat-value">
              {longestShot > 0 ? formatDistance(longestShot, distanceUnit) : '--'}
            </div>
            <div className="stat-label">Longest</div>
          </div>
        </div>

        {hole && (
          <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
            <SimpleCourseView hole={hole} shots={holeShots} width={350} height={300} />
          </div>
        )}

        <h3 className="mt-md mb-sm">Shot Details</h3>
        {holeShots.length === 0 ? (
          <div className="card text-center text-muted">No shots recorded for this hole.</div>
        ) : (
          <ul className="shot-list">
            {holeShots.map((shot, index) => (
              <li key={shot.id} className="shot-item">
                <div className={`shot-number ${shot.isPutt ? 'putt' : ''}`}>
                  {shot.shotNumber}
                </div>
                <div className="shot-info" style={{ flex: 1 }}>
                  <div className="shot-club">
                    {shot.club ? shot.club.toUpperCase() : shot.lieType}
                  </div>
                  <div className="shot-distance">
                    {shot.distanceToNext
                      ? formatDistance(shot.distanceToNext, distanceUnit)
                      : index === holeShots.length - 1
                        ? 'Final shot'
                        : '--'}
                  </div>
                </div>
                <div style={{ textAlign: 'right', fontSize: 12 }}>
                  {shot.missDirection && shot.missDirection !== 'ON_LINE' && (
                    <div
                      style={{
                        color:
                          shot.missDirection === 'LEFT'
                            ? 'var(--color-accent)'
                            : 'var(--color-accent)'
                      }}
                    >
                      {shot.missDirection}
                    </div>
                  )}
                  {shot.missLength && shot.missLength !== 'OK' && (
                    <div className="text-muted">{shot.missLength}</div>
                  )}
                </div>
              </li>
            ))}
          </ul>
        )}

        <div className="chip-group mt-md" style={{ justifyContent: 'center' }}>
          {Array.from({ length: round.currentHole }, (_, i) => i + 1).map((num) => (
            <div
              key={num}
              className={`chip ${currentHole === num ? 'selected' : ''}`}
              onClick={() => setCurrentHole(num)}
              style={{ minWidth: 36, textAlign: 'center' }}
            >
              {num}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
