// ============================================
// Golf GPS Tracker - Shot Logging Modal
// Quick club/lie selection with minimal friction
// ============================================

import { useState } from 'react';
import type { Club, LieType } from '@/types';
import { useAppStore } from '@/services/store';

interface ShotModalProps {
  onSave: (data: {
    club?: Club;
    lieType: LieType;
    isPutt: boolean;
    note?: string;
  }) => void;
  onCancel: () => void;
  shotNumber: number;
  isFirstShot?: boolean;
}

const CLUBS: { value: Club; label: string }[] = [
  { value: 'driver', label: 'Driver' },
  { value: '3wood', label: '3 Wood' },
  { value: '5wood', label: '5 Wood' },
  { value: 'hybrid', label: 'Hybrid' },
  { value: '4iron', label: '4 Iron' },
  { value: '5iron', label: '5 Iron' },
  { value: '6iron', label: '6 Iron' },
  { value: '7iron', label: '7 Iron' },
  { value: '8iron', label: '8 Iron' },
  { value: '9iron', label: '9 Iron' },
  { value: 'pw', label: 'PW' },
  { value: 'gw', label: 'GW' },
  { value: 'sw', label: 'SW' },
  { value: 'lw', label: 'LW' },
  { value: 'putter', label: 'Putter' }
];

const LIE_TYPES: { value: LieType; label: string; emoji: string }[] = [
  { value: 'tee', label: 'Tee', emoji: '🏌️' },
  { value: 'fairway', label: 'Fairway', emoji: '✅' },
  { value: 'rough', label: 'Rough', emoji: '🌿' },
  { value: 'sand', label: 'Sand', emoji: '🏖️' },
  { value: 'green', label: 'Green', emoji: '🟢' },
  { value: 'other', label: 'Other', emoji: '📍' }
];

export function ShotModal({ onSave, onCancel, shotNumber, isFirstShot }: ShotModalProps) {
  const favoriteClubs = useAppStore((s) => s.favoriteClubs);
  const [selectedClub, setSelectedClub] = useState<Club | undefined>(
    isFirstShot ? 'driver' : undefined
  );
  const [lieType, setLieType] = useState<LieType>(isFirstShot ? 'tee' : 'fairway');
  const [isPutt, setIsPutt] = useState(false);
  const [note, setNote] = useState('');
  const [showAllClubs, setShowAllClubs] = useState(false);

  const handleSave = () => {
    onSave({
      club: selectedClub,
      lieType: isPutt ? 'green' : lieType,
      isPutt,
      note: note.trim() || undefined
    });
  };

  const displayedClubs = showAllClubs
    ? CLUBS
    : CLUBS.filter((c) => favoriteClubs.includes(c.value));

  return (
    <div className="modal-overlay" onClick={onCancel}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2 className="modal-title">Shot {shotNumber}</h2>
          <button className="modal-close" onClick={onCancel}>
            ✕
          </button>
        </div>

        <div className="toggle-group mb-md">
          <div
            className={`toggle-option ${!isPutt ? 'active' : ''}`}
            onClick={() => setIsPutt(false)}
          >
            Full Shot
          </div>
          <div
            className={`toggle-option ${isPutt ? 'active' : ''}`}
            onClick={() => {
              setIsPutt(true);
              setSelectedClub('putter');
              setLieType('green');
            }}
          >
            Putt
          </div>
        </div>

        {!isPutt && (
          <>
            <div className="input-group">
              <label className="input-label">Club (optional)</label>
              <div className="chip-group">
                {displayedClubs.map((club) => (
                  <div
                    key={club.value}
                    className={`chip ${selectedClub === club.value ? 'selected' : ''}`}
                    onClick={() => setSelectedClub(club.value)}
                  >
                    {club.label}
                  </div>
                ))}
              </div>
              {!showAllClubs && (
                <button
                  className="btn btn-secondary"
                  style={{ padding: '8px 12px', fontSize: 13 }}
                  onClick={() => setShowAllClubs(true)}
                >
                  Show All Clubs
                </button>
              )}
            </div>

            <div className="input-group">
              <label className="input-label">Lie</label>
              <div className="chip-group">
                {LIE_TYPES.filter((l) => l.value !== 'green').map((lie) => (
                  <div
                    key={lie.value}
                    className={`chip ${lieType === lie.value ? 'selected' : ''}`}
                    onClick={() => setLieType(lie.value)}
                  >
                    {lie.emoji} {lie.label}
                  </div>
                ))}
              </div>
            </div>
          </>
        )}

        <div className="input-group">
          <label className="input-label">Note (optional)</label>
          <input
            type="text"
            className="input"
            placeholder="e.g., thin, pushed right..."
            value={note}
            onChange={(e) => setNote(e.target.value)}
          />
        </div>

        <div className="modal-actions">
          <button className="btn btn-secondary" onClick={onCancel}>
            Cancel
          </button>
          <button className="btn btn-primary" onClick={handleSave}>
            Save Shot
          </button>
        </div>
      </div>
    </div>
  );
}
