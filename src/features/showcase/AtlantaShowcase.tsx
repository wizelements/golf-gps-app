// ============================================
// Atlanta Golf Courses Showcase
// Official City of Atlanta Municipal Courses
// Data from cityofatlantagolf.com
// ============================================

import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Header } from '@/ui/components/Navigation';
import { findNearbyGolfCourses, OSMGolfCourse } from '@/services/osmGolf';
import { ATLANTA_MUNICIPAL_COURSES, AtlantaMunicipalCourse } from '@/data/atlantaCourses';

interface CourseWithOSM extends AtlantaMunicipalCourse {
  osmData?: OSMGolfCourse;
  loading: boolean;
  greensCount: number;
  teesCount: number;
}

export function AtlantaShowcase() {
  const navigate = useNavigate();
  const [courses, setCourses] = useState<CourseWithOSM[]>(
    ATLANTA_MUNICIPAL_COURSES.map(c => ({ ...c, loading: true, greensCount: 0, teesCount: 0 }))
  );
  const [selectedCourse, setSelectedCourse] = useState<CourseWithOSM | null>(null);
  const [showScorecard, setShowScorecard] = useState(false);

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
        } catch {
          return { ...course, loading: false };
        }
      })
    );
    setCourses(updatedCourses);
  };

  const handlePlayCourse = (course: CourseWithOSM) => {
    if (course.osmData) {
      navigate(`/quickplay/osm/${encodeURIComponent(JSON.stringify(course.osmData))}`);
    } else {
      navigate(`/quickplay/new/${encodeURIComponent(course.name)}`);
    }
  };

  const handleBookTeeTime = (url: string) => {
    window.open(url, '_blank');
  };

  return (
    <div className="app-container">
      <Header title="Atlanta Municipal Golf" onBack={() => navigate('/')} />
      
      <div className="screen">
        <div className="showcase-header">
          <h2 className="showcase-title">🍑 City of Atlanta Golf</h2>
          <p className="showcase-subtitle">
            4 official municipal courses • cityofatlantagolf.com
          </p>
        </div>

        <div className="showcase-grid">
          {courses.map((course) => (
            <div 
              key={course.id}
              className={`showcase-card ${selectedCourse?.id === course.id ? 'selected' : ''}`}
              onClick={() => {
                setSelectedCourse(course);
                setShowScorecard(false);
              }}
            >
              <div className="showcase-card-header">
                <span className="showcase-emoji">{course.emoji}</span>
                <div className="showcase-card-title">
                  <h3>{course.name}</h3>
                  <span className="showcase-claim">
                    {course.holes} holes • Par {course.par}
                  </span>
                </div>
              </div>

              <p className="showcase-description">{course.description}</p>

              <div className="showcase-tees">
                {course.tees.map((tee) => (
                  <div key={tee.name} className="tee-badge" style={{ borderColor: tee.color }}>
                    <span className="tee-dot" style={{ backgroundColor: tee.color }}></span>
                    <span className="tee-yards">{tee.totalYards} yds</span>
                  </div>
                ))}
              </div>

              {course.loading ? (
                <div className="showcase-loading">
                  <span className="loading-dot">⛳</span>
                  Loading OSM data...
                </div>
              ) : (
                <div className="showcase-stats">
                  <div className="showcase-stat">
                    <span className="stat-icon">🟢</span>
                    <span className="stat-value">{course.greensCount || course.holes}</span>
                    <span className="stat-label">Greens</span>
                  </div>
                  <div className="showcase-stat">
                    <span className="stat-icon">📏</span>
                    <span className="stat-value">{course.tees[0]?.rating || '-'}</span>
                    <span className="stat-label">Rating</span>
                  </div>
                  <div className="showcase-stat">
                    <span className="stat-icon">📐</span>
                    <span className="stat-value">{course.tees[0]?.slope || '-'}</span>
                    <span className="stat-label">Slope</span>
                  </div>
                </div>
              )}

              <div className="showcase-buttons">
                <button 
                  className="btn btn-primary showcase-play-btn"
                  onClick={(e) => {
                    e.stopPropagation();
                    handlePlayCourse(course);
                  }}
                  disabled={course.loading}
                >
                  Play GPS ⛳
                </button>
                <button 
                  className="btn btn-secondary showcase-book-btn"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleBookTeeTime(course.teeTimeUrl);
                  }}
                >
                  Book 📅
                </button>
              </div>
            </div>
          ))}
        </div>

        {selectedCourse && (
          <div className="showcase-detail">
            <div className="detail-header">
              <h3>{selectedCourse.emoji} {selectedCourse.name}</h3>
              <div className="detail-tabs">
                <button 
                  className={`tab-btn ${!showScorecard ? 'active' : ''}`}
                  onClick={() => setShowScorecard(false)}
                >
                  Info
                </button>
                <button 
                  className={`tab-btn ${showScorecard ? 'active' : ''}`}
                  onClick={() => setShowScorecard(true)}
                >
                  Scorecard
                </button>
              </div>
            </div>

            {!showScorecard ? (
              <div className="detail-info">
                <div className="info-row">
                  <span className="info-label">📍 Address</span>
                  <span className="info-value">{selectedCourse.address}</span>
                </div>
                <div className="info-row">
                  <span className="info-label">📞 Phone</span>
                  <span className="info-value">{selectedCourse.phone}</span>
                </div>
                {selectedCourse.yearBuilt && (
                  <div className="info-row">
                    <span className="info-label">📅 Built</span>
                    <span className="info-value">{selectedCourse.yearBuilt}</span>
                  </div>
                )}
                {selectedCourse.architect && (
                  <div className="info-row">
                    <span className="info-label">✏️ Architect</span>
                    <span className="info-value">{selectedCourse.architect}</span>
                  </div>
                )}
                <p className="info-history">{selectedCourse.history}</p>
                
                <div className="tee-details">
                  <h4>Tee Options</h4>
                  {selectedCourse.tees.map((tee) => (
                    <div key={tee.name} className="tee-row">
                      <span className="tee-name" style={{ color: tee.color === '#FFFFFF' ? '#333' : tee.color }}>
                        {tee.name}
                      </span>
                      <span>{tee.totalYards} yds</span>
                      <span>Rating {tee.rating}</span>
                      <span>Slope {tee.slope}</span>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="scorecard">
                <div className="scorecard-header">
                  <span className="hole-col">Hole</span>
                  <span className="par-col">Par</span>
                  <span className="hcp-col">HCP</span>
                  <span className="yds-col">Yds</span>
                </div>
                <div className="scorecard-body">
                  {selectedCourse.holeData.map((hole) => (
                    <div key={hole.number} className="scorecard-row">
                      <span className="hole-col">{hole.number}</span>
                      <span className="par-col">{hole.par}</span>
                      <span className="hcp-col">{hole.handicap}</span>
                      <span className="yds-col">{hole.yardage.blue || hole.yardage.white}</span>
                    </div>
                  ))}
                  <div className="scorecard-row total">
                    <span className="hole-col">Total</span>
                    <span className="par-col">{selectedCourse.par}</span>
                    <span className="hcp-col">-</span>
                    <span className="yds-col">{selectedCourse.tees[0]?.totalYards}</span>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        <div className="showcase-info">
          <div className="info-icon">🏛️</div>
          <div className="info-text">
            <strong>Official City of Atlanta Courses</strong>
            <p>Data from cityofatlantagolf.com. GPS positions powered by OpenStreetMap.</p>
          </div>
        </div>

        <div className="showcase-links">
          <a 
            href="https://www.cityofatlantagolf.com" 
            target="_blank" 
            rel="noopener noreferrer"
            className="btn btn-outline"
          >
            Visit cityofatlantagolf.com →
          </a>
        </div>
      </div>

      <style>{`
        .showcase-tees {
          display: flex;
          gap: 0.5rem;
          margin: 0.75rem 0;
          flex-wrap: wrap;
        }
        
        .tee-badge {
          display: flex;
          align-items: center;
          gap: 0.25rem;
          padding: 0.25rem 0.5rem;
          border-radius: 1rem;
          border: 1px solid;
          font-size: 0.75rem;
          background: rgba(0,0,0,0.3);
        }
        
        .tee-dot {
          width: 8px;
          height: 8px;
          border-radius: 50%;
        }
        
        .showcase-buttons {
          display: flex;
          gap: 0.5rem;
          margin-top: 0.75rem;
        }
        
        .showcase-play-btn {
          flex: 2;
        }
        
        .showcase-book-btn {
          flex: 1;
        }
        
        .detail-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 1rem;
          flex-wrap: wrap;
          gap: 0.5rem;
        }
        
        .detail-tabs {
          display: flex;
          gap: 0.5rem;
        }
        
        .tab-btn {
          padding: 0.5rem 1rem;
          border: 1px solid var(--accent-color);
          background: transparent;
          color: var(--accent-color);
          border-radius: 0.5rem;
          cursor: pointer;
        }
        
        .tab-btn.active {
          background: var(--accent-color);
          color: white;
        }
        
        .detail-info {
          display: flex;
          flex-direction: column;
          gap: 0.5rem;
        }
        
        .info-row {
          display: flex;
          gap: 1rem;
        }
        
        .info-label {
          min-width: 100px;
          color: #999;
        }
        
        .info-history {
          margin-top: 0.5rem;
          font-size: 0.9rem;
          color: #ccc;
          line-height: 1.5;
        }
        
        .tee-details {
          margin-top: 1rem;
          padding-top: 1rem;
          border-top: 1px solid #333;
        }
        
        .tee-details h4 {
          margin-bottom: 0.5rem;
        }
        
        .tee-row {
          display: flex;
          justify-content: space-between;
          padding: 0.5rem 0;
          font-size: 0.85rem;
          border-bottom: 1px solid #222;
        }
        
        .tee-name {
          font-weight: bold;
          min-width: 60px;
        }
        
        .scorecard {
          background: rgba(0,0,0,0.3);
          border-radius: 0.5rem;
          overflow: hidden;
        }
        
        .scorecard-header,
        .scorecard-row {
          display: grid;
          grid-template-columns: 1fr 1fr 1fr 1fr;
          padding: 0.5rem;
          text-align: center;
        }
        
        .scorecard-header {
          background: var(--accent-color);
          font-weight: bold;
        }
        
        .scorecard-row:nth-child(even) {
          background: rgba(255,255,255,0.05);
        }
        
        .scorecard-row.total {
          background: var(--accent-color);
          font-weight: bold;
        }
        
        .showcase-links {
          margin-top: 1rem;
          text-align: center;
        }
        
        .btn-outline {
          background: transparent;
          border: 1px solid var(--accent-color);
          color: var(--accent-color);
          padding: 0.75rem 1.5rem;
          border-radius: 0.5rem;
          text-decoration: none;
          display: inline-block;
        }
      `}</style>
    </div>
  );
}
