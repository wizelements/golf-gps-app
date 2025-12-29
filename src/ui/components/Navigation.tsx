// ============================================
// Golf GPS Tracker - Bottom Navigation
// ============================================

import { useLocation, useNavigate } from 'react-router-dom';

interface NavItem {
  path: string;
  label: string;
  icon: string;
}

const NAV_ITEMS: NavItem[] = [
  { path: '/', label: 'Home', icon: '🏠' },
  { path: '/courses', label: 'Courses', icon: '⛳' },
  { path: '/rounds', label: 'Rounds', icon: '📊' },
  { path: '/stats', label: 'Stats', icon: '📈' }
];

export function BottomNav() {
  const location = useLocation();
  const navigate = useNavigate();

  return (
    <nav className="bottom-nav">
      {NAV_ITEMS.map((item) => (
        <div
          key={item.path}
          className={`nav-item ${location.pathname === item.path ? 'active' : ''}`}
          onClick={() => navigate(item.path)}
        >
          <span className="nav-icon">{item.icon}</span>
          <span>{item.label}</span>
        </div>
      ))}
    </nav>
  );
}

interface HeaderProps {
  title: string;
  onBack?: () => void;
  rightAction?: React.ReactNode;
}

export function Header({ title, onBack, rightAction }: HeaderProps) {
  const navigate = useNavigate();

  return (
    <header className="screen-header">
      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        {onBack && (
          <button
            className="btn btn-icon btn-secondary"
            onClick={onBack || (() => navigate(-1))}
            style={{ padding: 8, minWidth: 40, minHeight: 40 }}
          >
            ←
          </button>
        )}
        <h1 className="screen-title">{title}</h1>
      </div>
      {rightAction}
    </header>
  );
}

interface GPSIndicatorProps {
  accuracy: number | null;
  isWatching: boolean;
  error: string | null;
}

export function GPSIndicator({ accuracy, isWatching, error }: GPSIndicatorProps) {
  const getStatus = () => {
    if (error) return { text: 'No GPS', color: 'var(--color-danger)' };
    if (!isWatching) return { text: 'GPS Off', color: 'var(--color-text-muted)' };
    if (accuracy === null) return { text: 'Searching...', color: 'var(--color-accent)' };
    if (accuracy <= 5) return { text: `±${Math.round(accuracy)}m`, color: 'var(--color-success)' };
    if (accuracy <= 15) return { text: `±${Math.round(accuracy)}m`, color: 'var(--color-success)' };
    return { text: `±${Math.round(accuracy)}m`, color: 'var(--color-accent)' };
  };

  const status = getStatus();

  return (
    <div className="gps-status">
      <div
        className={`gps-dot ${isWatching && accuracy !== null && !error ? 'active' : ''}`}
        style={{ background: status.color }}
      />
      <span style={{ color: status.color }}>{status.text}</span>
    </div>
  );
}
