// ============================================
// Golf GPS Tracker - Active Round Screen
// Distance to green, shot logging, hole navigation
// ============================================

import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import type { Club, LieType } from '@/types';
import { useAppStore } from '@/services/store';
import { useGPSStore, useCurrentPosition } from '@/services/gps';
import * as storage from '@/services/storage';
import { calculateDistance, formatDistance, metersToYards } from '@/services/math';
import { Header, GPSIndicator } from '@/ui/components/Navigation';
import { GolfMap } from '@/ui/components/Map';
import { ShotModal } from '@/ui/components/ShotModal';

export function RoundScreen() {
  const navigate = useNavigate();
  const { roundId } = useParams();
  const { position, accuracy, isWatching, error } = useCurrentPosition();
  const startWatching = useGPSStore((s) => s.startWatching);

  const activeRound = useAppStore((s) => s.activeRound);
  const activeCourse = useAppStore((s) => s.activeCourse);
  const currentHoleData = useAppStore((s) => s.currentHoleData);
  const currentHoleShots = useAppStore((s) => s.currentHoleShots);
  const distanceUnit = useAppStore((s) => s.distanceUnit);
  const setActiveRound = useAppStore((s) => s.setActiveRound);
  const setActiveCourse = useAppStore((s) => s.setActiveCourse);
  const setCurrentHoleData = useAppStore((s) => s.setCurrentHoleData);
  const loadCurrentHoleShots = useAppStore((s) => s.loadCurrentHoleShots);
  const addShot = useAppStore((s) => s.addShot);
  const removeLastShot = useAppStore((s) => s.removeLastShot);
  const advanceHole = useAppStore((s) => s.advanceHole);
  const previousHole = useAppStore((s) => s.previousHole);
  const endCurrentRound = useAppStore((s) => s.endCurrentRound);

  const [showShotModal, setShowShotModal] = useState(false);
  const [pendingLocation, setPendingLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [showEndConfirm, setShowEndConfirm] = useState(false);

  useEffect(() => {
    startWatching();
  }, []);

  useEffect(() => {
    if (roundId) loadRound(roundId);
  }, [roundId]);

  const loadRound = async (id: string) => {
    const round = await storage.getRound(id);
    if (!round) {
      navigate('/');
      return;
    }

    const course = await storage.getCourse(round.courseId);
    const hole = await storage.getHole(round.courseId, round.currentHole);

    setActiveRound(round);
    setActiveCourse(course || null);
    setCurrentHoleData(hole || null);
    await loadCurrentHoleShots(round.id, round.currentHole);
  };

  const handleLogShot = () => {
    if (!position) {
      alert('Waiting for GPS fix...');
      return;
    }
    setPendingLocation({ lat: position.lat, lng: position.lng });
    setShowShotModal(true);
  };

  const handleMapTapShot = (coord: { lat: number; lng: number }) => {
    setPendingLocation(coord);
    setShowShotModal(true);
  };

  const handleSaveShot = async (data: {
    club?: Club;
    lieType: LieType;
    isPutt: boolean;
    note?: string;
  }) => {
    if (!activeRound || !pendingLocation) return;

    const shot = await storage.logShot(
      activeRound.id,
      activeRound.currentHole,
      pendingLocation.lat,
      pendingLocation.lng,
      {
        accuracyMeters: accuracy || undefined,
        club: data.club,
        lieType: data.lieType,
        isPutt: data.isPutt,
        note: data.note
      }
    );

    addShot(shot);
    setShowShotModal(false);
    setPendingLocation(null);
  };

  const handleUndoShot = async () => {
    if (!activeRound) return;
    const deleted = await storage.deleteLastShot(activeRound.id, activeRound.currentHole);
    if (deleted) {
      removeLastShot();
    }
  };

  const handleEndRound = async () => {
    await endCurrentRound();
    navigate('/rounds');
  };

  if (!activeRound || !activeCourse) {
    return (
      <div className="app-container">
        <Header title="Loading..." onBack={() => navigate('/')} />
        <div className="screen flex-center">Loading round...</div>
      </div>
    );
  }

  const distanceToGreen =
    position && currentHoleData
      ? calculateDistance(position, {
          lat: currentHoleData.greenLat,
          lng: currentHoleData.greenLng
        })
      : null;

  const distanceValue = distanceToGreen
    ? distanceUnit === 'yards'
      ? Math.round(metersToYards(distanceToGreen))
      : Math.round(distanceToGreen)
    : '--';

  return (
    <div className="app-container">
      <Header
        title={activeCourse.name}
        onBack={() => setShowEndConfirm(true)}
        rightAction={
          <GPSIndicator accuracy={accuracy} isWatching={isWatching} error={error} />
        }
      />

      <div className="screen" style={{ paddingBottom: 160 }}>
        <div className="hole-bar">
          <div>
            <div className="hole-number">Hole {activeRound.currentHole}</div>
            {currentHoleData?.par && (
              <div className="hole-par">Par {currentHoleData.par}</div>
            )}
          </div>
          <div className="hole-nav">
            <button
              className="btn btn-icon btn-secondary"
              onClick={previousHole}
              disabled={activeRound.currentHole === 1}
            >
              ←
            </button>
            <button
              className="btn btn-icon btn-secondary"
              onClick={advanceHole}
              disabled={activeRound.currentHole === activeCourse.holesCount}
            >
              →
            </button>
          </div>
        </div>

        <div className="distance-display card">
          <div className="distance-value">{distanceValue}</div>
          <div className="distance-unit">{distanceUnit}</div>
          <div className="distance-label">to Green</div>
        </div>

        <div style={{ flex: 1, minHeight: 250 }}>
          <GolfMap
            playerPosition={position}
            hole={currentHoleData}
            shots={currentHoleShots}
            onMapClick={handleMapTapShot}
          />
        </div>

        {currentHoleShots.length > 0 && (
          <div className="card mt-md">
            <div
              style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}
            >
              <span>Shots: {currentHoleShots.length}</span>
              <button className="btn btn-secondary" onClick={handleUndoShot}>
                Undo Last
              </button>
            </div>
            <ul className="shot-list mt-sm">
              {currentHoleShots.slice(-3).map((shot) => (
                <li key={shot.id} className="shot-item">
                  <div className={`shot-number ${shot.isPutt ? 'putt' : ''}`}>
                    {shot.shotNumber}
                  </div>
                  <div className="shot-info">
                    <div className="shot-club">{shot.club || shot.lieType}</div>
                    {shot.distanceToNext && (
                      <div className="shot-distance">
                        {formatDistance(shot.distanceToNext, distanceUnit)}
                      </div>
                    )}
                  </div>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>

      <button className="btn btn-primary btn-floating" onClick={handleLogShot}>
        📍 Log Shot
      </button>

      {showShotModal && pendingLocation && (
        <ShotModal
          shotNumber={currentHoleShots.length + 1}
          isFirstShot={currentHoleShots.length === 0}
          onSave={handleSaveShot}
          onCancel={() => {
            setShowShotModal(false);
            setPendingLocation(null);
          }}
        />
      )}

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
              You've played {activeRound.currentHole} holes with{' '}
              {currentHoleShots.length} shots on the current hole.
            </p>
            <div className="modal-actions">
              <button className="btn btn-secondary" onClick={() => setShowEndConfirm(false)}>
                Continue Playing
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
