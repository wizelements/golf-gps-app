// ============================================
// Golf GPS Tracker - Home Screen
// "Just tap Play. We'll figure out the rest." 🏌️
// ============================================

import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useGPSStore, useCurrentPosition } from '@/services/gps';
import { GPSIndicator } from '@/ui/components/Navigation';
import { getActiveRound, getCourse, listCourses, getRounds } from '@/services/storage';
import { 
  discoverNearbyCourses, 
  DiscoveredCourse, 
  DiscoveryStatus,
  getRandomFact,
  getPioneerMessage,
  suggestCourseName
} from '@/services/courseDiscovery';
import type { Round, Course } from '@/types';

type ViewState = 'home' | 'discovering' | 'select' | 'pioneer';

export function HomeScreen() {
  const navigate = useNavigate();
  const { position, accuracy, isWatching, error } = useCurrentPosition();
  const startWatching = useGPSStore((s) => s.startWatching);

  const [viewState, setViewState] = useState<ViewState>('home');
  const [activeRound, setActiveRound] = useState<Round | null>(null);
  const [activeCourse, setActiveCourse] = useState<Course | null>(null);
  const [courses, setCourses] = useState<Course[]>([]);
  const [roundsCount, setRoundsCount] = useState(0);
  
  // Discovery state
  const [, setDiscoveryStatus] = useState<DiscoveryStatus>('detecting');
  const [discoveryMessage, setDiscoveryMessage] = useState('');
  const [discoveredCourses, setDiscoveredCourses] = useState<DiscoveredCourse[]>([]);
  const [funFact, setFunFact] = useState(getRandomFact());

  useEffect(() => {
    startWatching();
    loadData();
    // Rotate fun facts
    const interval = setInterval(() => setFunFact(getRandomFact()), 5000);
    return () => clearInterval(interval);
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
    setRoundsCount(allRounds.filter((r) => r.isComplete).length);
  };

  const handlePlayNow = async () => {
    if (!position) {
      setDiscoveryStatus('detecting');
      setDiscoveryMessage('Getting your location... 📍');
      setViewState('discovering');
      return;
    }

    setViewState('discovering');
    setDiscoveryStatus('searching');
    setDiscoveryMessage('Scanning for courses... 🔍');

    const found = await discoverNearbyCourses(
      position.lat,
      position.lng,
      (status, message) => {
        setDiscoveryStatus(status);
        setDiscoveryMessage(message);
      }
    );

    setDiscoveredCourses(found);

    if (found.length === 0) {
      setViewState('pioneer');
    } else if (found.length === 1) {
      // Only one course - go directly!
      handleSelectCourse(found[0]);
    } else {
      setViewState('select');
    }
  };

  const handleSelectCourse = async (discovered: DiscoveredCourse) => {
    if (discovered.source === 'local' && discovered.localCourse) {
      navigate(`/quickplay/${discovered.localCourse.id}`);
    } else if (discovered.source === 'osm' && discovered.osmData) {
      // Import from OSM and start
      navigate(`/quickplay/osm/${encodeURIComponent(JSON.stringify(discovered.osmData))}`);
    } else {
      // Pioneer mode with course name
      navigate(`/quickplay/new/${encodeURIComponent(discovered.name)}`);
    }
  };

  const handlePioneerMode = () => {
    const suggestedName = position 
      ? suggestCourseName(position.lat, position.lng)
      : 'My Course';
    navigate(`/quickplay/new/${encodeURIComponent(suggestedName)}`);
  };

  const handleContinueRound = () => {
    if (activeRound) {
      navigate(`/round/${activeRound.id}`);
    }
  };

  // Main home view
  if (viewState === 'home') {
    return (
      <div className="app-container">
        <header className="screen-header">
          <h1 className="screen-title">Golf GPS</h1>
          <GPSIndicator accuracy={accuracy} isWatching={isWatching} error={error} />
        </header>

        <div className="screen">
          {/* Active Round Card */}
          {activeRound && activeCourse && (
            <div
              className="card hero-card"
              onClick={handleContinueRound}
            >
              <div className="hero-badge">⚡ In Progress</div>
              <div className="hero-title">{activeCourse.name}</div>
              <div className="hero-subtitle">
                Hole {activeRound.currentHole} of {activeCourse.holesCount}
              </div>
              <button className="btn btn-secondary mt-md" style={{ width: '100%' }}>
                Continue Round →
              </button>
            </div>
          )}

          {/* Play Now Hero Button */}
          {!activeRound && (
            <button 
              className="btn btn-hero"
              onClick={handlePlayNow}
              disabled={!isWatching}
            >
              <span className="hero-icon">⛳</span>
              <span className="hero-text">Play Now</span>
              <span className="hero-subtext">We'll find your course</span>
            </button>
          )}

          {/* GPS Status */}
          {!isWatching && (
            <div className="card warning-card">
              <div className="warning-icon">📍</div>
              <div className="warning-text">
                Waiting for GPS signal...
              </div>
            </div>
          )}

          {/* Stats Row */}
          <div className="stat-grid mt-lg">
            <div className="stat-card" onClick={() => navigate('/courses')}>
              <div className="stat-value">{courses.length}</div>
              <div className="stat-label">Courses</div>
            </div>
            <div className="stat-card" onClick={() => navigate('/rounds')}>
              <div className="stat-value">{roundsCount}</div>
              <div className="stat-label">Rounds</div>
            </div>
            <div className="stat-card" onClick={() => navigate('/stats')}>
              <div className="stat-value">📊</div>
              <div className="stat-label">Stats</div>
            </div>
          </div>

          {/* Fun Fact */}
          <div className="card fact-card mt-lg">
            <div className="fact-icon">💡</div>
            <div className="fact-text">{funFact}</div>
          </div>

          {/* Atlanta Showcase */}
                  <div 
                    className="card showcase-link mt-lg"
                    onClick={() => navigate('/showcase/atlanta')}
                  >
                    <div className="showcase-link-content">
                      <span className="showcase-link-emoji">🍑</span>
                      <div>
                        <div className="showcase-link-title">Atlanta Showcase</div>
                        <div className="showcase-link-subtitle">4 courses with live OSM data</div>
                      </div>
                      <span className="showcase-link-arrow">→</span>
                    </div>
                  </div>

                  {/* Offline Badge */}
                  <div className="offline-badge mt-lg">
                    <span className="offline-icon">📡</span>
                    <span>Works in Airplane Mode</span>
                  </div>
                </div>
              </div>
            );
  }

  // Discovering view (loading)
  if (viewState === 'discovering') {
    return (
      <div className="app-container">
        <div className="screen discovery-screen">
          <div className="discovery-animation">
            <div className="radar-ring"></div>
            <div className="radar-ring delay-1"></div>
            <div className="radar-ring delay-2"></div>
            <div className="radar-center">🏌️</div>
          </div>
          
          <div className="discovery-status">{discoveryMessage}</div>
          
          <div className="discovery-fact">
            <div className="fact-icon">💡</div>
            <div className="fact-text">{funFact}</div>
          </div>

          <button 
            className="btn btn-secondary mt-lg"
            onClick={() => setViewState('home')}
          >
            Cancel
          </button>
        </div>
      </div>
    );
  }

  // Course selection view
  if (viewState === 'select') {
    return (
      <div className="app-container">
        <header className="screen-header">
          <button className="btn btn-icon" onClick={() => setViewState('home')}>←</button>
          <h1 className="screen-title">Select Course</h1>
          <div></div>
        </header>

        <div className="screen">
          <div className="discovery-results">
            <div className="results-header">
              Found {discoveredCourses.length} course{discoveredCourses.length > 1 ? 's' : ''} nearby! 🎯
            </div>

            {discoveredCourses.map((course) => (
              <div
                key={course.id}
                className="course-card"
                onClick={() => handleSelectCourse(course)}
              >
                <div className="course-card-header">
                  <div className="course-card-icon">
                    {course.source === 'local' ? '🏠' : 
                     course.source === 'osm' ? '🗺️' : '📚'}
                  </div>
                  <div className="course-card-info">
                    <div className="course-card-name">{course.name}</div>
                    <div className="course-card-meta">
                      {course.holesCount} holes
                      {course.distance && ` • ${(course.distance / 1000).toFixed(1)}km away`}
                    </div>
                  </div>
                  <div className="course-card-arrow">→</div>
                </div>
                
                {course.holesWithData > 0 && (
                  <div className="course-card-data">
                    <div className="data-bar">
                      <div 
                        className="data-bar-fill"
                        style={{ width: `${(course.holesWithData / course.holesCount) * 100}%` }}
                      ></div>
                    </div>
                    <div className="data-text">
                      {course.holesWithData}/{course.holesCount} holes mapped
                    </div>
                  </div>
                )}

                {course.funFact && (
                  <div className="course-card-fact">{course.funFact}</div>
                )}
              </div>
            ))}

            <button 
              className="btn btn-secondary mt-lg"
              onClick={handlePioneerMode}
            >
              🗺️ None of these? Start fresh!
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Pioneer mode (no courses found)
  if (viewState === 'pioneer') {
    return (
      <div className="app-container">
        <div className="screen pioneer-screen">
          <div className="pioneer-hero">
            <div className="pioneer-icon">🏔️</div>
            <h2 className="pioneer-title">Pioneer Territory!</h2>
            <p className="pioneer-text">{getPioneerMessage()}</p>
          </div>

          <div className="pioneer-info">
            <p>No mapped courses nearby, but that's okay!</p>
            <p>Just tap the green on the map as you play - we'll learn together.</p>
          </div>

          <button 
            className="btn btn-hero"
            onClick={handlePioneerMode}
          >
            <span className="hero-icon">🗺️</span>
            <span className="hero-text">Start Mapping</span>
            <span className="hero-subtext">Become a legend</span>
          </button>

          <button 
            className="btn btn-secondary mt-md"
            onClick={() => setViewState('home')}
          >
            ← Back
          </button>
        </div>
      </div>
    );
  }

  return null;
}
