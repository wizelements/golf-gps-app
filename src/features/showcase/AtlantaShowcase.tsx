// ============================================
// Atlanta Golf Courses Showcase
// Demonstrating OSM data integration
// ============================================

import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Header } from '@/ui/components/Navigation';
import { findNearbyGolfCourses, OSMGolfCourse } from '@/services/osmGolf';

interface AtlantaCourse {
  name: string;
  lat: number;
  lng: number;
  description: string;
  claim: string;
  emoji: string;
  website?: string;
}

const ATLANTA_COURSES: AtlantaCourse[] = [
  {
    name: "East Lake Golf Club",
    lat: 33.7423,
    lng: -84.3024,
    description: "Home of the TOUR Championship. Bobby Jones' home course.",
    claim: "The birthplace of Bobby Jones",
    emoji: "🏆",
    website: "https://www.eastlakegolfclub.com/"
  },
  {
    name: "Druid Hills Golf Club",
    lat: 33.7807,
    lng: -84.3287,
    description: "Historic private club in the Druid Hills neighborhood.",
    claim: "Classic Southern charm since 1912",
    emoji: "🌳",
    website: "https://www.druidhillsgc.org/"
  },
  {
    name: "Bobby Jones Golf Club",
    lat: 33.8165,
    lng: -84.4026,
    description: "Municipal course named after the legendary golfer.",
    claim: "Public golf for everyone",
    emoji: "⛳",
    website: "https://www.bobbyjonesgc.com/"
  },
  {
    name: "College Park Golf Course",
    lat: 33.6533,
    lng: -84.4665,
    description: "Affordable public course near the airport.",
    claim: "Great golf, great value",
    emoji: "✈️",
    website: "https://www.collegeparkgolf.com/"
  }
];

interface CourseData extends AtlantaCourse {
  osmData?: OSMGolfCourse;
  loading: boolean;
  greensCount: number;
  teesCount: number;
}

export function AtlantaShowcase() {
  const navigate = useNavigate();
  const [courses, setCourses] = useState<CourseData[]>(
    ATLANTA_COURSES.map(c => ({ ...c, loading: true, greensCount: 0, teesCount: 0 }))
  );
  const [selectedCourse, setSelectedCourse] = useState<CourseData | null>(null);

  useEffect(() => {
    loadAllCourseData();
  }, []);

  const loadAllCourseData = async () => {
    const updatedCourses = await Promise.all(
      courses.map(async (course) => {
        try {
          const osmCourses = await findNearbyGolfCourses(course.lat, course.lng, 2000);
          const osmData = osmCourses.find(c => 
            c.name.toLowerCase().includes(course.name.split(' ')[0].toLowerCase())
          ) || osmCourses[0];
          
          return {
            ...course,
            osmData,
            loading: false,
            greensCount: osmData?.holes.filter(h => h.green).length || 0,
            teesCount: osmData?.holes.filter(h => h.tee).length || 0
          };
        } catch (e) {
          return { ...course, loading: false };
        }
      })
    );
    setCourses(updatedCourses);
  };

  const handlePlayCourse = (course: CourseData) => {
    if (course.osmData) {
      navigate(`/quickplay/osm/${encodeURIComponent(JSON.stringify(course.osmData))}`);
    } else {
      navigate(`/quickplay/new/${encodeURIComponent(course.name)}`);
    }
  };

  return (
    <div className="app-container">
      <Header title="Atlanta Showcase" onBack={() => navigate('/')} />
      
      <div className="screen">
        <div className="showcase-header">
          <h2 className="showcase-title">🍑 Atlanta Golf</h2>
          <p className="showcase-subtitle">
            4 iconic courses powered by OpenStreetMap
          </p>
        </div>

        <div className="showcase-grid">
          {courses.map((course) => (
            <div 
              key={course.name}
              className={`showcase-card ${selectedCourse?.name === course.name ? 'selected' : ''}`}
              onClick={() => setSelectedCourse(course)}
            >
              <div className="showcase-card-header">
                <span className="showcase-emoji">{course.emoji}</span>
                <div className="showcase-card-title">
                  <h3>{course.name}</h3>
                  <span className="showcase-claim">{course.claim}</span>
                </div>
              </div>

              <p className="showcase-description">{course.description}</p>

              {course.loading ? (
                <div className="showcase-loading">
                  <span className="loading-dot">⛳</span>
                  Loading OSM data...
                </div>
              ) : (
                <div className="showcase-stats">
                  <div className="showcase-stat">
                    <span className="stat-icon">🟢</span>
                    <span className="stat-value">{course.greensCount}</span>
                    <span className="stat-label">Greens</span>
                  </div>
                  <div className="showcase-stat">
                    <span className="stat-icon">🏌️</span>
                    <span className="stat-value">{course.teesCount}</span>
                    <span className="stat-label">Tees</span>
                  </div>
                  <div className="showcase-stat">
                    <span className="stat-icon">{course.greensCount >= 18 ? '✅' : '🔄'}</span>
                    <span className="stat-value">{course.greensCount >= 18 ? 'Full' : 'Partial'}</span>
                    <span className="stat-label">Data</span>
                  </div>
                </div>
              )}

              <button 
                className="btn btn-primary showcase-play-btn"
                onClick={(e) => {
                  e.stopPropagation();
                  handlePlayCourse(course);
                }}
                disabled={course.loading}
              >
                Play This Course →
              </button>
            </div>
          ))}
        </div>

        <div className="showcase-info">
          <div className="info-icon">🗺️</div>
          <div className="info-text">
            <strong>Powered by OpenStreetMap</strong>
            <p>Course data is community-contributed and free. 
            Missing holes? Play once and we'll remember!</p>
          </div>
        </div>

        {selectedCourse && selectedCourse.osmData && (
          <div className="showcase-detail">
            <h3>📊 {selectedCourse.name} - Hole Data</h3>
            <div className="hole-grid">
              {Array.from({ length: 18 }, (_, i) => i + 1).map(holeNum => {
                const hole = selectedCourse.osmData?.holes.find(h => h.holeNumber === holeNum);
                const hasGreen = !!hole?.green;
                const hasTee = !!hole?.tee;
                return (
                  <div 
                    key={holeNum} 
                    className={`hole-chip ${hasGreen && hasTee ? 'complete' : hasGreen ? 'partial' : 'missing'}`}
                  >
                    {holeNum}
                  </div>
                );
              })}
            </div>
            <div className="hole-legend">
              <span className="legend-item"><span className="dot complete"></span> Complete</span>
              <span className="legend-item"><span className="dot partial"></span> Green only</span>
              <span className="legend-item"><span className="dot missing"></span> Missing</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
