// ============================================
// Golf GPS Tracker - Course Detail Screen
// ============================================

import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import type { Course, Hole } from '@/types';
import { getCourse, getHoles } from '@/services/storage';
import { useAppStore } from '@/services/store';
import { Header } from '@/ui/components/Navigation';
import { formatDistance, calculateDistance } from '@/services/math';

export function CourseDetail() {
  const navigate = useNavigate();
  const { courseId } = useParams();
  const startNewRound = useAppStore((s) => s.startNewRound);

  const [course, setCourse] = useState<Course | null>(null);
  const [holes, setHoles] = useState<Hole[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (courseId) loadData(courseId);
  }, [courseId]);

  const loadData = async (id: string) => {
    setLoading(true);
    const c = await getCourse(id);
    const h = await getHoles(id);
    setCourse(c || null);
    setHoles(h);
    setLoading(false);
  };

  const handleStartRound = async () => {
    if (!course) return;
    const round = await startNewRound(course.id);
    navigate(`/round/${round.id}`);
  };

  const completedHoles = holes.filter(
    (h) => h.teeLat && h.teeLng && h.greenLat && h.greenLng
  ).length;

  if (loading) {
    return (
      <div className="app-container">
        <Header title="Loading..." onBack={() => navigate('/courses')} />
        <div className="screen flex-center">Loading...</div>
      </div>
    );
  }

  if (!course) {
    return (
      <div className="app-container">
        <Header title="Course Not Found" onBack={() => navigate('/courses')} />
        <div className="screen">
          <div className="empty-state">
            <p>This course doesn't exist.</p>
            <button className="btn btn-primary" onClick={() => navigate('/courses')}>
              Back to Courses
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="app-container">
      <Header
        title={course.name}
        onBack={() => navigate('/courses')}
        rightAction={
          <button
            className="btn btn-secondary"
            onClick={() => navigate(`/courses/${course.id}/edit`)}
          >
            Edit
          </button>
        }
      />

      <div className="screen">
        <div className="stat-grid mb-md">
          <div className="stat-card">
            <div className="stat-value">{course.holesCount}</div>
            <div className="stat-label">Holes</div>
          </div>
          <div className="stat-card">
            <div className="stat-value">{completedHoles}</div>
            <div className="stat-label">Configured</div>
          </div>
        </div>

        {completedHoles < course.holesCount && (
          <div
            className="card"
            style={{ background: 'var(--color-accent)', color: '#000', marginBottom: 16 }}
          >
            <strong>Course Setup Incomplete</strong>
            <p style={{ marginTop: 8, fontSize: 14 }}>
              {course.holesCount - completedHoles} holes need tee/green positions.
            </p>
            <button
              className="btn btn-secondary mt-sm"
              onClick={() => navigate(`/courses/${course.id}/edit`)}
            >
              Continue Setup
            </button>
          </div>
        )}

        {completedHoles > 0 && (
          <button className="btn btn-primary btn-large mb-lg" onClick={handleStartRound}>
            Start Round
          </button>
        )}

        <h3 style={{ marginBottom: 12 }}>Holes</h3>
        {holes.length === 0 ? (
          <div className="card text-center text-muted">
            No holes configured yet. Tap Edit to set up hole positions.
          </div>
        ) : (
          <div>
            {Array.from({ length: course.holesCount }, (_, i) => i + 1).map((num) => {
              const hole = holes.find((h) => h.holeNumber === num);
              const isComplete = hole && hole.teeLat && hole.greenLat;
              const distance = hole
                ? calculateDistance(
                    { lat: hole.teeLat, lng: hole.teeLng },
                    { lat: hole.greenLat, lng: hole.greenLng }
                  )
                : null;

              return (
                <div
                  key={num}
                  className="card"
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    opacity: isComplete ? 1 : 0.5
                  }}
                >
                  <div>
                    <strong>Hole {num}</strong>
                    {hole?.par && (
                      <span className="text-muted" style={{ marginLeft: 8 }}>
                        Par {hole.par}
                      </span>
                    )}
                  </div>
                  <div>
                    {isComplete ? (
                      <span className="text-success">{formatDistance(distance!)}</span>
                    ) : (
                      <span className="text-muted">Not set</span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
