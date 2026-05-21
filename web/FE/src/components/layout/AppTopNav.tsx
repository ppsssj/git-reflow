import type { FormEvent } from "react";
import { useEffect, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { apiGet, apiPost } from "../../lib/api";
import { clearAuthSession, getAuthSession } from "../../lib/auth";
import type { TemplateRecord } from "../../types/template";
import { Icon } from "../ui/Icon";

interface AppTopNavProps {
  active: "dashboard" | "templates" | "network";
  searchPlaceholder?: string;
  actionLabel?: string;
  actionTo?: string;
  actionStatus?: string;
  onActionClick?: () => void;
}

interface NotificationItem {
  id: string;
  type: "network_import" | "network_like" | string;
  actorName: string;
  actorAvatarUrl?: string;
  templateName: string;
  templateId: string;
  networkTemplateId: string;
  createdAt: string;
  readAt?: string | null;
}

interface NotificationListResponse {
  ok: true;
  notifications: NotificationItem[];
  unreadCount: number;
}

interface TemplateListResponse {
  ok: true;
  templates: TemplateRecord[];
}

interface SearchResultItem extends TemplateRecord {
  searchScope: "workspace" | "network";
}

function formatNotificationTime(value: string) {
  const timestamp = new Date(value).getTime();

  if (!Number.isFinite(timestamp)) {
    return "Just now";
  }

  const diffMinutes = Math.max(0, Math.round((Date.now() - timestamp) / 60000));

  if (diffMinutes < 1) return "Just now";
  if (diffMinutes < 60) return `${diffMinutes}m`;

  const diffHours = Math.round(diffMinutes / 60);
  if (diffHours < 24) return `${diffHours}h`;

  const diffDays = Math.round(diffHours / 24);
  return `${diffDays}d`;
}

function getNotificationCopy(notification: NotificationItem) {
  const actorName = notification.actorName || "Someone";
  const templateName = notification.templateName || "your template";

  if (notification.type === "network_import") {
    return {
      icon: "archive",
      text: `${actorName} imported ${templateName} from the Network.`,
    };
  }

  if (notification.type === "network_import_summary") {
    return {
      icon: "archive",
      text: `${actorName} imported ${templateName} from the Network.`,
    };
  }

  if (notification.type === "network_like") {
    return {
      icon: "star",
      text: `${actorName} liked ${templateName}.`,
    };
  }

  if (notification.type === "template_imported") {
    return {
      icon: "archive",
      text: `${templateName} was imported into your workspace.`,
    };
  }

  return {
    icon: "notifications",
    text: `${actorName} interacted with ${templateName}.`,
  };
}

function getTemplateSearchText(template: TemplateRecord) {
  return [
    template.name,
    template.description,
    template.owner,
    template.publisherName,
    ...(template.highlights ?? []),
    ...(template.sections ?? []).map((section) => `${section.label} ${section.description}`),
  ].join(" ").toLowerCase();
}

function getSearchPath(result: SearchResultItem) {
  return result.networkTemplateId
    ? `/templates/network/${encodeURIComponent(result.networkTemplateId)}`
    : `/templates/${encodeURIComponent(result.id)}`;
}

export function AppTopNav({
  active,
  searchPlaceholder = "Search resources...",
  actionLabel = "Deploy",
  actionStatus,
  actionTo,
  onActionClick,
}: AppTopNavProps) {
  const navigate = useNavigate();
  const settingsRef = useRef<HTMLDivElement | null>(null);
  const notificationsRef = useRef<HTMLDivElement | null>(null);
  const searchRef = useRef<HTMLFormElement | null>(null);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [workspaceSearchTemplates, setWorkspaceSearchTemplates] = useState<TemplateRecord[]>([]);
  const [networkSearchTemplates, setNetworkSearchTemplates] = useState<TemplateRecord[]>([]);
  const [hasLoadedSearchTemplates, setHasLoadedSearchTemplates] = useState(false);
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [unreadNotificationCount, setUnreadNotificationCount] = useState(0);
  const [copyStatus, setCopyStatus] = useState("");
  const session = getAuthSession();
  const userName = session?.user.name ?? session?.user.email ?? "User";
  const userInitial = userName.slice(0, 1).toUpperCase();

  useEffect(() => {
    const handlePointerDown = (event: PointerEvent) => {
      if (!settingsRef.current?.contains(event.target as Node)) {
        setIsSettingsOpen(false);
      }

      if (!notificationsRef.current?.contains(event.target as Node)) {
        setIsNotificationsOpen(false);
      }

      if (!searchRef.current?.contains(event.target as Node)) {
        setIsSearchOpen(false);
      }
    };

    document.addEventListener("pointerdown", handlePointerDown);

    return () => {
      document.removeEventListener("pointerdown", handlePointerDown);
    };
  }, []);

  useEffect(() => {
    if (!session?.token) {
      return;
    }

    let cancelled = false;

    const refreshNotifications = () => {
      apiGet<NotificationListResponse>("/api/notifications")
        .then((result) => {
          if (!cancelled) {
            setNotifications(result.notifications);
            setUnreadNotificationCount(result.unreadCount);
          }
        })
        .catch(() => {
          if (!cancelled) {
            setNotifications([]);
            setUnreadNotificationCount(0);
          }
        });
    };

    const handleVisibilityChange = () => {
      if (document.visibilityState === "visible") {
        refreshNotifications();
      }
    };

    refreshNotifications();
    const refreshInterval = window.setInterval(refreshNotifications, 15000);
    window.addEventListener("focus", refreshNotifications);
    document.addEventListener("visibilitychange", handleVisibilityChange);

    return () => {
      cancelled = true;
      window.clearInterval(refreshInterval);
      window.removeEventListener("focus", refreshNotifications);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, [session?.token]);

  const loadSearchTemplates = async () => {
    if (!session?.token || hasLoadedSearchTemplates) {
      return;
    }

    const [workspaceResult, networkResult] = await Promise.all([
      apiGet<TemplateListResponse>("/api/templates").catch(() => ({ ok: true as const, templates: [] })),
      apiGet<TemplateListResponse>("/api/templates/network").catch(() => ({ ok: true as const, templates: [] })),
    ]);

    setWorkspaceSearchTemplates(workspaceResult.templates);
    setNetworkSearchTemplates(networkResult.templates);
    setHasLoadedSearchTemplates(true);
  };

  const handleLogout = async () => {
    const token = session?.token;

    if (token) {
      await apiPost(
        "/api/auth/logout",
        {},
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      ).catch(() => undefined);
    }

    clearAuthSession();
    setIsSettingsOpen(false);
    navigate("/login", { replace: true });
  };

  const handleCopyExtensionToken = async () => {
    if (!session?.token) {
      return;
    }

    await navigator.clipboard.writeText(session.token);
    setCopyStatus("Copied");
    window.setTimeout(() => setCopyStatus(""), 1600);
  };

  const handleToggleNotifications = async () => {
    const nextOpen = !isNotificationsOpen;

    setIsNotificationsOpen(nextOpen);
    setIsSettingsOpen(false);

    if (nextOpen && unreadNotificationCount > 0) {
      setUnreadNotificationCount(0);
      setNotifications((current) =>
        current.map((notification) => ({
          ...notification,
          readAt: notification.readAt ?? new Date().toISOString(),
        })),
      );
      await apiPost("/api/notifications/read", {}).catch(() => undefined);
    }
  };

  const trimmedSearchQuery = searchQuery.trim();
  const searchResults = trimmedSearchQuery
    ? [
        ...workspaceSearchTemplates.map((template) => ({
          ...template,
          searchScope: "workspace" as const,
        })),
        ...networkSearchTemplates.map((template) => ({
          ...template,
          searchScope: "network" as const,
        })),
      ]
        .filter((template) => getTemplateSearchText(template).includes(trimmedSearchQuery.toLowerCase()))
        .slice(0, 6)
    : [];
  const searchTargetPath = active === "network" ? "/templates/discover" : "/templates";

  const handleSearchSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!trimmedSearchQuery) {
      return;
    }

    if (searchResults[0]) {
      navigate(getSearchPath(searchResults[0]));
    } else {
      navigate(`${searchTargetPath}?search=${encodeURIComponent(trimmedSearchQuery)}`);
    }

    setIsSearchOpen(false);
  };

  return (
    <header className="topnav">
      <div className="topnav__inner">
        <div className="topnav__left">
          <Link className="topnav__brand" to="/" aria-label="GIT-Reflow home">
            <span className="topnav__logo-mark" aria-hidden="true">
              <img
                className="topnav__logo"
                src="/assets/logo512.png"
                alt=""
              />
            </span>
            <span>GIT-Reflow</span>
          </Link>
          <nav className="topnav__nav" aria-label="Primary">
            <Link className={active === "dashboard" ? "is-active" : ""} to="/">
              Dashboard
            </Link>
            <Link
              className={active === "templates" ? "is-active" : ""}
              to="/templates"
            >
              Templates
            </Link>
            <Link
              className={active === "network" ? "is-active" : ""}
              to="/templates/discover"
            >
              Network
            </Link>
          </nav>
        </div>

        <div className="topnav__right">
          <form
            className="topnav__search"
            ref={searchRef}
            role="search"
            onSubmit={handleSearchSubmit}
          >
            <Icon className="topnav__search-icon" name="search" />
            <input
              aria-label="Search"
              placeholder={searchPlaceholder}
              type="text"
              value={searchQuery}
              onChange={(event) => {
                setSearchQuery(event.target.value);
                setIsSearchOpen(true);
              }}
              onFocus={() => {
                setIsSearchOpen(true);
                void loadSearchTemplates();
              }}
            />
            {isSearchOpen && trimmedSearchQuery ? (
              <div className="topnav__search-panel">
                {searchResults.length ? (
                  searchResults.map((result) => (
                    <Link
                      className="topnav__search-result"
                      key={`${result.searchScope}-${result.id}`}
                      to={getSearchPath(result)}
                      onClick={() => {
                        setSearchQuery("");
                        setIsSearchOpen(false);
                      }}
                    >
                      <span className="topnav__search-result-icon">
                        <Icon name={result.searchScope === "network" ? "explore" : "folder"} />
                      </span>
                      <span>
                        <strong>{result.name}</strong>
                        <em>{result.searchScope === "network" ? "Network" : "Workspace"} · {result.owner}</em>
                      </span>
                    </Link>
                  ))
                ) : (
                  <button className="topnav__search-empty" type="submit">
                    <Icon name="search" />
                    <span>Search "{trimmedSearchQuery}" in {active === "network" ? "Network" : "Templates"}</span>
                  </button>
                )}
              </div>
            ) : null}
          </form>

          <div className="topnav__notifications" ref={notificationsRef}>
            <button
              aria-expanded={isNotificationsOpen}
              aria-haspopup="dialog"
              className="topnav__icon-button"
              type="button"
              aria-label="Notifications"
              onClick={handleToggleNotifications}
            >
              <Icon name="notifications" />
              {unreadNotificationCount > 0 ? (
                <span className="topnav__notification-badge">
                  {unreadNotificationCount > 9 ? "9+" : unreadNotificationCount}
                </span>
              ) : null}
            </button>
            {isNotificationsOpen ? (
              <section className="topnav__notification-panel" aria-label="Notifications">
                <header className="topnav__notification-header">
                  <div>
                    <strong>Notifications</strong>
                    <span>Network activity</span>
                  </div>
                  <Link to="/templates/published" onClick={() => setIsNotificationsOpen(false)}>
                    View shared
                  </Link>
                </header>
                <div className="topnav__notification-list">
                  {notifications.length ? (
                    notifications.map((notification) => {
                      const copy = getNotificationCopy(notification);
                      const notificationPath = notification.networkTemplateId
                        ? `/templates/network/${encodeURIComponent(notification.networkTemplateId)}`
                        : "/templates/published";

                      return (
                        <Link
                          className={[
                            "topnav__notification-item",
                            notification.readAt ? "" : "is-unread",
                          ].join(" ").trim()}
                          key={notification.id}
                          to={notificationPath}
                          onClick={() => setIsNotificationsOpen(false)}
                        >
                          {notification.actorAvatarUrl ? (
                            <img src={notification.actorAvatarUrl} alt="" />
                          ) : (
                            <span className="topnav__notification-avatar">
                              {(notification.actorName || "U").slice(0, 1).toUpperCase()}
                            </span>
                          )}
                          <span className="topnav__notification-body">
                            <span>{copy.text}</span>
                            <time dateTime={notification.createdAt}>
                              {formatNotificationTime(notification.createdAt)}
                            </time>
                          </span>
                          <Icon name={copy.icon} />
                        </Link>
                      );
                    })
                  ) : (
                    <div className="topnav__notification-empty">
                      <Icon name="notifications" />
                      <strong>No notifications yet</strong>
                      <span>Likes and imports on your shared templates will show up here.</span>
                    </div>
                  )}
                </div>
              </section>
            ) : null}
          </div>
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
                  {session?.user.email ? (
                    <span>{session.user.email}</span>
                  ) : null}
                </div>
                {session?.token ? (
                  <button
                    role="menuitem"
                    type="button"
                    onClick={handleCopyExtensionToken}
                  >
                    <Icon name="extension" />
                    <span>{copyStatus || "Copy extension token"}</span>
                  </button>
                ) : null}
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
            <button
              className="topnav__deploy"
              type="button"
              onClick={onActionClick}
            >
              {actionLabel}
            </button>
          )}
          {actionStatus ? (
            <span className="topnav__action-status">{actionStatus}</span>
          ) : null}
          {session?.user.avatarUrl ? (
            <img
              alt={`${userName} avatar`}
              className="topnav__avatar"
              src={session.user.avatarUrl}
            />
          ) : (
            <span
              aria-label={userName}
              className="topnav__avatar topnav__avatar-fallback"
            >
              {userInitial}
            </span>
          )}
        </div>
      </div>
    </header>
  );
}
