import { useEffect, useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { apiPost } from '../../lib/api';
import { clearAuthSession, getAuthSession } from '../../lib/auth';
import { Icon } from '../ui/Icon';

interface AppTopNavProps {
  active: 'dashboard' | 'templates';
  searchPlaceholder?: string;
  actionLabel?: string;
  actionTo?: string;
  actionStatus?: string;
  onActionClick?: () => void;
}

export function AppTopNav({
  active,
  searchPlaceholder = 'Search resources...',
  actionLabel = 'Deploy',
  actionStatus,
  actionTo,
  onActionClick,
}: AppTopNavProps) {
  const navigate = useNavigate();
  const settingsRef = useRef<HTMLDivElement | null>(null);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const session = getAuthSession();
  const userName = session?.user.name ?? session?.user.email ?? 'User';
  const userInitial = userName.slice(0, 1).toUpperCase();

  useEffect(() => {
    const handlePointerDown = (event: PointerEvent) => {
      if (!settingsRef.current?.contains(event.target as Node)) {
        setIsSettingsOpen(false);
      }
    };

    document.addEventListener('pointerdown', handlePointerDown);

    return () => {
      document.removeEventListener('pointerdown', handlePointerDown);
    };
  }, []);

  const handleLogout = async () => {
    const token = session?.token;

    if (token) {
      await apiPost('/api/auth/logout', {}, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }).catch(() => undefined);
    }

    clearAuthSession();
    setIsSettingsOpen(false);
    navigate('/login', { replace: true });
  };

  return (
    <header className="topnav">
      <div className="topnav__inner">
        <div className="topnav__left">
          <Link className="topnav__brand" to="/">
            Reflow.io
          </Link>
          <nav className="topnav__nav" aria-label="Primary">
            <Link className={active === 'dashboard' ? 'is-active' : ''} to="/">
              Dashboard
            </Link>
            <Link className={active === 'templates' ? 'is-active' : ''} to="/templates">
              Templates
            </Link>
            <a href="#network">Network</a>
            <a href="#docs">Docs</a>
          </nav>
        </div>

        <div className="topnav__right">
          <label className="topnav__search">
            <Icon className="topnav__search-icon" name="search" />
            <input aria-label="Search" placeholder={searchPlaceholder} type="text" />
          </label>

          <button className="topnav__icon-button" type="button" aria-label="Notifications">
            <Icon name="notifications" />
          </button>
          <div className="topnav__settings" ref={settingsRef}>
            <button
              aria-expanded={isSettingsOpen}
              aria-haspopup="menu"
              aria-label="Settings"
              className="topnav__icon-button"
              type="button"
              onClick={() => setIsSettingsOpen((open) => !open)}
            >
              <Icon name="settings" />
            </button>
            {isSettingsOpen ? (
              <div className="topnav__settings-menu" role="menu">
                <div className="topnav__settings-user">
                  <strong>{userName}</strong>
                  {session?.user.email ? <span>{session.user.email}</span> : null}
                </div>
                <button role="menuitem" type="button" onClick={handleLogout}>
                  <Icon name="logout" />
                  <span>Log out</span>
                </button>
              </div>
            ) : null}
          </div>
          {actionTo ? (
            <Link className="topnav__deploy" to={actionTo}>
              {actionLabel}
            </Link>
          ) : (
            <button className="topnav__deploy" type="button" onClick={onActionClick}>
              {actionLabel}
            </button>
          )}
          {actionStatus ? <span className="topnav__action-status">{actionStatus}</span> : null}
          {session?.user.avatarUrl ? (
            <img alt={`${userName} avatar`} className="topnav__avatar" src={session.user.avatarUrl} />
          ) : (
            <span aria-label={userName} className="topnav__avatar topnav__avatar-fallback">
              {userInitial}
            </span>
          )}
        </div>
      </div>
    </header>
  );
}
