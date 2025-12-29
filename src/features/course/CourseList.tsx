// ============================================
// Golf GPS Tracker - Course List Screen
// ============================================

import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import type { Course } from '@/types';
import { listCourses, deleteCourse } from '@/services/storage';
import { Header } from '@/ui/components/Navigation';

export function CourseList() {
  const navigate = useNavigate();
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadCourses();
  }, []);

  const loadCourses = async () => {
    setLoading(true);
    const data = await listCourses();
    setCourses(data);
    setLoading(false);
  };

  const handleDelete = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (confirm('Delete this course and all its data?')) {
      await deleteCourse(id);
      loadCourses();
    }
  };

  return (
    <div className="app-container">
      <Header
        title="Courses"
        rightAction={
          <button className="btn btn-primary" onClick={() => navigate('/courses/new')}>
            + New
          </button>
        }
      />

      <div className="screen">
        {loading ? (
          <div className="empty-state">
            <div className="empty-text">Loading...</div>
          </div>
        ) : courses.length === 0 ? (
          <div className="empty-state">
            <div className="empty-icon">⛳</div>
            <h3 className="empty-title">No Courses Yet</h3>
            <p className="empty-text">Create your first course to start tracking rounds.</p>
            <button className="btn btn-primary" onClick={() => navigate('/courses/new')}>
              Create Course
            </button>
          </div>
        ) : (
          <>
            {courses.map((course) => (
              <div
                key={course.id}
                className="course-item"
                onClick={() => navigate(`/courses/${course.id}`)}
              >
                <div className="course-icon">⛳</div>
                <div className="course-info">
                  <div className="course-name">{course.name}</div>
                  <div className="course-holes">{course.holesCount} holes</div>
                </div>
                <button
                  className="btn btn-icon btn-secondary"
                  onClick={(e) => handleDelete(course.id, e)}
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
