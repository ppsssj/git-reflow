import { Link } from 'react-router-dom';
import { Icon } from '../ui/Icon';

interface AppTopNavProps {
  active: 'dashboard' | 'templates';
  searchPlaceholder?: string;
  actionLabel?: string;
  actionTo?: string;
}

const avatarUrl =
  'https://lh3.googleusercontent.com/aida-public/AB6AXuCJ3PyNuJ1mKlXCRnRfdxhrei8VKtLrQpDUSRieYEL3uk9IbCvaz6xEP3w6TbB9Kb51NOifdcoCKXehBQ-LAatrmu2k5FQb-DHxeEfWH6wIAi4ejaMVKT9mKLzSj-utAOSchRYtDrlCmej7ldAYL8QPC5Kl1sWokptc08SylG8tFD6x5gkjdKHThDUAa6v6OUNXqUsaaFhU0Db5UULx0z4z1FEglBvzxYz3ES3yQjMSHokPXOOlCltXmDLzlHwtsRP-hfie-2QuVyk';

export function AppTopNav({
  active,
  searchPlaceholder = 'Search resources...',
  actionLabel = 'Deploy',
  actionTo,
}: AppTopNavProps) {
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
          <button className="topnav__icon-button" type="button" aria-label="Settings">
            <Icon name="settings" />
          </button>
          {actionTo ? (
            <Link className="topnav__deploy" to={actionTo}>
              {actionLabel}
            </Link>
          ) : (
            <button className="topnav__deploy" type="button">
              {actionLabel}
            </button>
          )}
          <img alt="User avatar" className="topnav__avatar" src={avatarUrl} />
        </div>
      </div>
    </header>
  );
}
