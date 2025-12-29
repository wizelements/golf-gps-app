// ============================================
// Golf GPS Tracker - Club Stats & Analysis Screen
// ============================================

import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import type { ClubStats } from '@/types';
import { getClubStats, computeAndCacheClubStats } from '@/services/storage';
import { metersToYards } from '@/services/math';
import { Header } from '@/ui/components/Navigation';
import { useAppStore } from '@/services/store';

export function StatsScreen() {
  const navigate = useNavigate();
  const distanceUnit = useAppStore((s) => s.distanceUnit);
  const [stats, setStats] = useState<ClubStats[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadStats();
  }, []);

  const loadStats = async () => {
    setLoading(true);
    await computeAndCacheClubStats();
    const data = await getClubStats();
    setStats(data);
    setLoading(false);
  };

  const formatDist = (meters: number) => {
    if (distanceUnit === 'yards') {
      return `${Math.round(metersToYards(meters))}`;
    }
    return `${Math.round(meters)}`;
  };

  const clubLabels: Record<string, string> = {
    driver: 'Driver',
    '3wood': '3 Wood',
    '5wood': '5 Wood',
    '7wood': '7 Wood',
    hybrid: 'Hybrid',
    '2iron': '2 Iron',
    '3iron': '3 Iron',
    '4iron': '4 Iron',
    '5iron': '5 Iron',
    '6iron': '6 Iron',
    '7iron': '7 Iron',
    '8iron': '8 Iron',
    '9iron': '9 Iron',
    pw: 'PW',
    gw: 'GW',
    sw: 'SW',
    lw: 'LW',
    putter: 'Putter'
  };

  return (
    <div className="app-container">
      <Header title="Club Stats" />

      <div className="screen">
        {loading ? (
          <div className="empty-state">
            <div className="empty-text">Analyzing shots...</div>
          </div>
        ) : stats.length === 0 ? (
          <div className="empty-state">
            <div className="empty-icon">📈</div>
            <h3 className="empty-title">No Stats Yet</h3>
            <p className="empty-text">
              Play rounds and log shots with club selection to see your distances.
            </p>
            <button className="btn btn-primary" onClick={() => navigate('/courses')}>
              Start Playing
            </button>
          </div>
        ) : (
          <>
            <div className="card mb-md">
              <div className="card-title">Distance Unit</div>
              <div className="toggle-group">
                <div
                  className={`toggle-option ${distanceUnit === 'yards' ? 'active' : ''}`}
                  onClick={() => useAppStore.getState().setDistanceUnit('yards')}
                >
                  Yards
                </div>
                <div
                  className={`toggle-option ${distanceUnit === 'meters' ? 'active' : ''}`}
                  onClick={() => useAppStore.getState().setDistanceUnit('meters')}
                >
                  Meters
                </div>
              </div>
            </div>

            <h3 className="mb-sm">Your Distances</h3>
            {stats.map((stat) => {
              const confidenceLow = Math.max(0, stat.avgDistance - stat.stdDev);
              const confidenceHigh = stat.avgDistance + stat.stdDev;

              return (
                <div key={stat.clubName} className="card">
                  <div
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center'
                    }}
                  >
                    <div>
                      <strong>{clubLabels[stat.clubName] || stat.clubName}</strong>
                      <div className="text-muted" style={{ fontSize: 12 }}>
                        {stat.sampleCount} shot{stat.sampleCount !== 1 ? 's' : ''}
                      </div>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <div style={{ fontSize: 24, fontWeight: 700 }}>
                        {formatDist(stat.avgDistance)}
                      </div>
                      <div className="text-muted" style={{ fontSize: 12 }}>
                        {distanceUnit}
                      </div>
                    </div>
                  </div>

                  <div
                    style={{
                      marginTop: 12,
                      padding: 12,
                      background: 'var(--color-bg-input)',
                      borderRadius: 8
                    }}
                  >
                    <div
                      style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        fontSize: 13
                      }}
                    >
                      <span>Range</span>
                      <span>
                        {formatDist(stat.minDistance)} - {formatDist(stat.maxDistance)}{' '}
                        {distanceUnit}
                      </span>
                    </div>
                    <div
                      style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        fontSize: 13,
                        marginTop: 4
                      }}
                    >
                      <span>Typical</span>
                      <span>
                        {formatDist(confidenceLow)} - {formatDist(confidenceHigh)} {distanceUnit}
                      </span>
                    </div>
                    <div
                      style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        fontSize: 13,
                        marginTop: 4
                      }}
                    >
                      <span>Median</span>
                      <span>
                        {formatDist(stat.medianDistance)} {distanceUnit}
                      </span>
                    </div>
                  </div>

                  <div style={{ marginTop: 12, height: 8, background: 'var(--color-bg-input)', borderRadius: 4, overflow: 'hidden' }}>
                    <div
                      style={{
                        height: '100%',
                        background: 'var(--color-primary)',
                        width: `${Math.min(100, (stat.avgDistance / 300) * 100)}%`,
                        borderRadius: 4
                      }}
                    />
                  </div>
                </div>
              );
            })}
          </>
        )}
      </div>
    </div>
  );
}
