import { NavLink } from 'react-router-dom';
import { Button } from '../ui/Button';

interface SiteHeaderProps {
  context: 'marketing' | 'workspace';
  subtitle?: string;
}

const links = [
  { to: '/', label: 'Intro', end: true },
  { to: '/login', label: 'Login' },
  { to: '/templates', label: 'Templates' },
];

export function SiteHeader({ context, subtitle }: SiteHeaderProps) {
  return (
    <header className="site-header">
      <div className="site-header__inner">
        <div className="site-header__brand">
          <div className="brand-mark">gr</div>
          <div>
            <p className="brand-name">git-reflow</p>
            <p className="brand-subtitle">
              {subtitle ?? 'GitHub layout customization for web + extension sync'}
            </p>
          </div>
        </div>
        <nav className="site-header__nav" aria-label="Primary navigation">
          {links.map((link) => (
            <NavLink
              key={link.to}
              to={link.to}
              end={link.end}
              className={({ isActive }) =>
                ['site-header__link', isActive ? 'is-active' : ''].join(' ').trim()
              }
            >
              {link.label}
            </NavLink>
          ))}
        </nav>
        <div className="site-header__actions">
          {context === 'workspace' ? (
            <>
              <Button variant="secondary">Sync Preview</Button>
              <Button>Publish to Extension</Button>
            </>
          ) : (
            <>
              <Button variant="ghost">Chrome Extension</Button>
              <Button>Open Dashboard</Button>
            </>
          )}
        </div>
      </div>
    </header>
  );
}

