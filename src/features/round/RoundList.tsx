// ============================================
// Golf GPS Tracker - Round History List
// ============================================

import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import type { Round } from '@/types';
import { getRounds, getCourse, deleteRound, getShotsForRound } from '@/services/storage';
import { Header } from '@/ui/components/Navigation';

interface RoundWithCourse extends Round {
  courseName: string;
  shotCount: number;
}

export function RoundList() {
  const navigate = useNavigate();
  const [rounds, setRounds] = useState<RoundWithCourse[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadRounds();
  }, []);

  const loadRounds = async () => {
    setLoading(true);
    const allRounds = await getRounds();
    const enriched: RoundWithCourse[] = [];

    for (const round of allRounds) {
      const course = await getCourse(round.courseId);
      const shots = await getShotsForRound(round.id);
      enriched.push({
        ...round,
        courseName: course?.name || 'Unknown Course',
        shotCount: shots.length
      });
    }

    setRounds(enriched);
    setLoading(false);
  };

  const handleDelete = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (confirm('Delete this round?')) {
      await deleteRound(id);
      loadRounds();
    }
  };

  const formatDate = (timestamp: number) => {
    return new Date(timestamp).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  return (
    <div className="app-container">
      <Header title="Rounds" />

      <div className="screen">
        {loading ? (
          <div className="empty-state">
            <div className="empty-text">Loading...</div>
          </div>
        ) : rounds.length === 0 ? (
          <div className="empty-state">
            <div className="empty-icon">📊</div>
            <h3 className="empty-title">No Rounds Yet</h3>
            <p className="empty-text">Start a round from a course to begin tracking.</p>
            <button className="btn btn-primary" onClick={() => navigate('/courses')}>
              View Courses
            </button>
          </div>
        ) : (
          <>
            {rounds.map((round) => (
              <div
                key={round.id}
                className="course-item"
                onClick={() =>
                  round.isComplete
                    ? navigate(`/replay/${round.id}`)
                    : navigate(`/round/${round.id}`)
                }
              >
                <div
                  className="course-icon"
                  style={{
                    background: round.isComplete ? 'var(--color-success)' : 'var(--color-accent)'
                  }}
                >
                  {round.isComplete ? '✓' : '▶'}
                </div>
                <div className="course-info">
                  <div className="course-name">{round.courseName}</div>
                  <div className="course-holes">
                    {formatDate(round.startedAt)} • {round.shotCount} shots •{' '}
                    {round.isComplete
                      ? `${round.currentHole} holes`
                      : `Hole ${round.currentHole}`}
                  </div>
                </div>
                <button
                  className="btn btn-icon btn-secondary"
                  onClick={(e) => handleDelete(round.id, e)}
                  style={{ fontSize: 16, color: 'var(--color-danger)' }}
                >
                  🗑️
                </button>
              </div>
            ))}
          </>
        )}
      </div>
    </div>
  );
}
