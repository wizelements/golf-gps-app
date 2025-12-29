// ============================================
// Golf GPS Tracker - Home Screen
// ============================================

import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import type { Round, Course } from '@/types';
import { getActiveRound, getCourse, listCourses, getRounds } from '@/services/storage';
import { useAppStore } from '@/services/store';
import { useGPSStore, useCurrentPosition } from '@/services/gps';
import { GPSIndicator } from '@/ui/components/Navigation';

export function HomeScreen() {
  const navigate = useNavigate();
  const { accuracy, isWatching, error } = useCurrentPosition();
  const startWatching = useGPSStore((s) => s.startWatching);
  const startNewRound = useAppStore((s) => s.startNewRound);

  const [activeRound, setActiveRound] = useState<Round | null>(null);
  const [activeCourse, setActiveCourse] = useState<Course | null>(null);
  const [courses, setCourses] = useState<Course[]>([]);
  const [recentRoundsCount, setRecentRoundsCount] = useState(0);

  useEffect(() => {
    startWatching();
    loadData();
  }, []);

  const loadData = async () => {
    const active = await getActiveRound();
    setActiveRound(active || null);

    if (active) {
      const course = await getCourse(active.courseId);
      setActiveCourse(course || null);
    }

    const allCourses = await listCourses();
    setCourses(allCourses);

    const allRounds = await getRounds();
    setRecentRoundsCount(allRounds.filter((r) => r.isComplete).length);
  };

  const handleContinueRound = () => {
    if (activeRound) {
      navigate(`/round/${activeRound.id}`);
    }
  };

  const handleQuickStart = async (courseId: string) => {
    const round = await startNewRound(courseId);
    navigate(`/round/${round.id}`);
  };

  return (
    <div className="app-container">
      <header className="screen-header">
        <h1 className="screen-title">Golf GPS</h1>
        <GPSIndicator accuracy={accuracy} isWatching={isWatching} error={error} />
      </header>

      <div className="screen">
        {activeRound && activeCourse && (
          <div
            className="card"
            style={{
              background: 'linear-gradient(135deg, var(--color-primary) 0%, var(--color-fairway) 100%)',
              cursor: 'pointer'
            }}
            onClick={handleContinueRound}
          >
            <div style={{ fontSize: 14, opacity: 0.9 }}>Active Round</div>
            <div style={{ fontSize: 20, fontWeight: 700, marginTop: 4 }}>
              {activeCourse.name}
            </div>
            <div style={{ fontSize: 14, marginTop: 8, opacity: 0.9 }}>
              Hole {activeRound.currentHole} of {activeCourse.holesCount}
            </div>
            <button className="btn btn-secondary mt-md" style={{ width: '100%' }}>
              Continue Round →
            </button>
          </div>
        )}

        <div className="stat-grid mb-md">
          <div className="stat-card" onClick={() => navigate('/courses')}>
            <div className="stat-value">{courses.length}</div>
            <div className="stat-label">Courses</div>
          </div>
          <div className="stat-card" onClick={() => navigate('/rounds')}>
            <div className="stat-value">{recentRoundsCount}</div>
            <div className="stat-label">Rounds</div>
          </div>
        </div>

        {!activeRound && courses.length > 0 && (
          <>
            <h3 className="mb-sm">Quick Start</h3>
            {courses.slice(0, 3).map((course) => (
              <div
                key={course.id}
                className="course-item"
                onClick={() => handleQuickStart(course.id)}
              >
                <div className="course-icon">⛳</div>
                <div className="course-info">
                  <div className="course-name">{course.name}</div>
                  <div className="course-holes">{course.holesCount} holes</div>
                </div>
                <span style={{ color: 'var(--color-primary-light)' }}>▶</span>
              </div>
            ))}
          </>
        )}

        {courses.length === 0 && (
          <div className="empty-state">
            <div className="empty-icon">⛳</div>
            <h3 className="empty-title">Welcome to Golf GPS</h3>
            <p className="empty-text">
              Create your first course to start tracking your rounds offline.
            </p>
            <button className="btn btn-primary btn-large" onClick={() => navigate('/courses/new')}>
              Create Course
            </button>
          </div>
        )}

        <div className="card mt-lg">
          <div className="card-title">Offline Ready</div>
          <p className="text-muted" style={{ fontSize: 14, lineHeight: 1.5 }}>
            This app works fully offline in airplane mode. GPS tracking uses your device's
            built-in GPS receiver - no internet required.
          </p>
        </div>
      </div>
    </div>
  );
}
