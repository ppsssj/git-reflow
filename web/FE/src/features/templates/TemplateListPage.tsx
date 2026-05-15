import type { FormEvent } from 'react';
import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { AppTopNav } from '../../components/layout/AppTopNav';
import { Icon } from '../../components/ui/Icon';
import { apiDelete, apiGet, apiPost } from '../../lib/api';
import type { ExtensionTemplatePayload, TemplateRecord } from '../../types/template';
import { defaultGithubTemplate } from '../editor/templates/defaultGithubTemplate';
import {
  getStarterGithubTemplate,
  isStarterGithubTemplateId,
  starterGithubTemplateRecords,
} from '../editor/templates/starterGithubTemplate';
import { TemplateCard } from './TemplateCard';

const sidebarItems = [
  { icon: 'folder', label: 'Projects', active: true },
  { icon: 'alt_route', label: 'Branches' },
  { icon: 'history', label: 'Commits' },
  { icon: 'merge_type', label: 'Pull Requests' },
  { icon: 'inventory_2', label: 'Assets' },
  { icon: 'analytics', label: 'Analytics' },
];

interface TemplateListResponse {
  ok: true;
  templates: TemplateRecord[];
}

interface CreateTemplateResponse {
  ok: true;
  template: ExtensionTemplatePayload;
}

interface DeleteTemplateResponse {
  ok: true;
}

interface TemplateUsageSummary {
  id: string;
  name: string;
  useCount: number;
  weeklyUseCount: number;
  lastUsedAt: string;
}

interface TemplateUsageEvent {
  id: string;
  name: string;
  usedAt: string;
}

interface TemplateUsageResponse {
  ok: true;
  totalUses: number;
  weeklyUses: number;
  templates: TemplateUsageSummary[];
  recent: TemplateUsageEvent[];
}

const DEFAULT_TEMPLATE_ID = defaultGithubTemplate.id;

function slugify(value: string) {
  const slug = value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');

  return slug || 'github-template';
}

function createTemplateDraft(name: string): ExtensionTemplatePayload {
  const now = new Date().toISOString();

  return {
    ...defaultGithubTemplate,
    id: `${slugify(name)}-${Date.now().toString(36)}`,
    name,
    description: `Custom GitHub home layout based on the default template.`,
    source: 'user',
    version: 1,
    metadata: {
      ...defaultGithubTemplate.metadata,
      updatedAt: now,
    },
    provider: 'github',
    columnLayout: {
      left: 320,
      main: 900,
      right: 315,
    },
    leftSidebarResizeEnabled: true,
    selectedVariationId: 'github-default',
    updatedAt: now,
  };
}

function getUniqueTemplateName(baseName: string, templates: TemplateRecord[]) {
  const existingNames = new Set(templates.map((template) => template.name.trim().toLowerCase()));

  if (!existingNames.has(baseName.trim().toLowerCase())) {
    return baseName;
  }

  let index = 1;
  let nextName = `${baseName} (${index})`;

  while (existingNames.has(nextName.trim().toLowerCase())) {
    index += 1;
    nextName = `${baseName} (${index})`;
  }

  return nextName;
}

function getCopyTemplateName(templateName: string, templates: TemplateRecord[]) {
  const existingNames = new Set(templates.map((template) => template.name.trim().toLowerCase()));
  let index = 1;
  let nextName = `${templateName} (${index})`;

  while (existingNames.has(nextName.trim().toLowerCase())) {
    index += 1;
    nextName = `${templateName} (${index})`;
  }

  return nextName;
}

function createCopiedTemplatePayload(source: ExtensionTemplatePayload, name: string): ExtensionTemplatePayload {
  const now = new Date().toISOString();

  return {
    ...source,
    id: `${slugify(name)}-${Date.now().toString(36)}`,
    name,
    description: source.description || `Copied GitHub home layout based on ${source.name}.`,
    source: 'user',
    version: source.version || 1,
    metadata: {
      ...source.metadata,
      updatedAt: now,
    },
    provider: 'github',
    updatedAt: now,
  };
}

function formatRelativeUsageTime(value?: string) {
  if (!value) {
    return 'No extension previews yet';
  }

  const usedAt = new Date(value).getTime();

  if (!Number.isFinite(usedAt)) {
    return 'Recently previewed';
  }

  const diffMinutes = Math.max(0, Math.round((Date.now() - usedAt) / 60000));

  if (diffMinutes < 1) {
    return 'Just now';
  }

  if (diffMinutes < 60) {
    return `${diffMinutes} min ago`;
  }

  const diffHours = Math.round(diffMinutes / 60);

  if (diffHours < 24) {
    return `${diffHours} hr ago`;
  }

  const diffDays = Math.round(diffHours / 24);

  return `${diffDays} day${diffDays === 1 ? '' : 's'} ago`;
}

function formatCompactTemplateName(name?: string) {
  return name?.replace(/^GitHub Polished /, '').replace(/^GitHub /, '') ?? 'No style yet';
}

function getTopUsageTemplates(templates: TemplateUsageSummary[]) {
  return [...templates].sort((a, b) => b.useCount - a.useCount || a.name.localeCompare(b.name)).slice(0, 5);
}

function getUsageAccent(templateId?: string, templateName?: string) {
  const value = `${templateId ?? ''} ${templateName ?? ''}`.toLowerCase();

  if (value.includes('red')) {
    return {
      background: '#f3d9e0',
      panel: '#7f1d1d',
      soft: '#c45a6b',
      main: '#3a2024',
    };
  }

  if (value.includes('green')) {
    return {
      background: '#d8efe4',
      panel: '#14532d',
      soft: '#3e8b64',
      main: '#183329',
    };
  }

  return {
    background: '#dceafe',
    panel: '#1d4ed8',
    soft: '#5b8def',
    main: '#172033',
  };
}

function createUsageTemplateRecord(usage?: TemplateUsageSummary | TemplateUsageEvent): TemplateRecord | null {
  if (!usage) {
    return null;
  }

  return {
    id: usage.id,
    name: usage.name,
    description: 'Recent extension style preview.',
    thumbnail: '',
    collaborators: [],
    status: 'ACTIVE',
    syncState: 'Extension previewed',
    updatedAt: 'Extension usage',
    owner: 'git-reflow',
    highlights: ['Recently used in extension'],
    sections: [],
  };
}

export function TemplateListPage() {
  const navigate = useNavigate();
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [remoteTemplates, setRemoteTemplates] = useState<TemplateRecord[]>([]);
  const [isLoadingTemplates, setIsLoadingTemplates] = useState(true);
  const [templateError, setTemplateError] = useState('');
  const [templateUsage, setTemplateUsage] = useState<TemplateUsageResponse | null>(null);
  const [newTemplateName, setNewTemplateName] = useState('');
  const [createStatus, setCreateStatus] = useState('');
  const remoteTemplateIds = useMemo(() => new Set(remoteTemplates.map((template) => template.id)), [remoteTemplates]);
  const visibleTemplates = useMemo(() => {
    const userTemplates = remoteTemplates.filter((template) => template.id !== DEFAULT_TEMPLATE_ID);
    const savedTemplateIds = new Set(userTemplates.map((template) => template.id));
    const unsavedStarterTemplates = starterGithubTemplateRecords.filter((template) => !savedTemplateIds.has(template.id));

    return [...unsavedStarterTemplates, ...userTemplates];
  }, [remoteTemplates]);
  const primaryTemplateId = visibleTemplates[0]?.id ?? 'github-dashboard-reference';
  const recentUsage = templateUsage?.recent[0];
  const mostUsedTemplate = templateUsage ? getTopUsageTemplates(templateUsage.templates)[0] : undefined;
  const topUsageTemplates = templateUsage ? getTopUsageTemplates(templateUsage.templates) : [];
  const usageCardTemplateName = formatCompactTemplateName(recentUsage?.name);
  const mostUsedName = formatCompactTemplateName(mostUsedTemplate?.name);
  const recentTemplateRecord =
    visibleTemplates.find((template) => template.id === recentUsage?.id) ?? createUsageTemplateRecord(recentUsage);
  const mostUsedTemplateRecord =
    visibleTemplates.find((template) => template.id === mostUsedTemplate?.id) ?? createUsageTemplateRecord(mostUsedTemplate);
  const recentAccent = getUsageAccent(recentUsage?.id, recentUsage?.name);
  const mostUsedAccent = getUsageAccent(mostUsedTemplate?.id, mostUsedTemplate?.name);

  useEffect(() => {
    let cancelled = false;

    apiGet<TemplateListResponse>('/api/templates')
      .then((result) => {
        if (cancelled) {
          return;
        }

        setRemoteTemplates(result.templates);
        setTemplateError('');
      })
      .catch((error) => {
        if (cancelled) {
          return;
        }

        setTemplateError(error instanceof Error ? error.message : 'Failed to load templates');
      })
      .finally(() => {
        if (!cancelled) {
          setIsLoadingTemplates(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    let cancelled = false;

    const refreshTemplateUsage = () => {
      apiGet<TemplateUsageResponse>('/api/template-usage')
        .then((result) => {
          if (!cancelled) {
            setTemplateUsage(result);
          }
        })
        .catch(() => {
          if (!cancelled) {
            setTemplateUsage(null);
          }
        });
    };

    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        refreshTemplateUsage();
      }
    };

    refreshTemplateUsage();
    const refreshInterval = window.setInterval(refreshTemplateUsage, 10000);
    window.addEventListener('focus', refreshTemplateUsage);
    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      cancelled = true;
      window.clearInterval(refreshInterval);
      window.removeEventListener('focus', refreshTemplateUsage);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, []);

  const handleCreateTemplate = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const name = newTemplateName.trim();

    if (name.length < 2) {
      setCreateStatus('Enter a template name');
      return;
    }

    const nameExists = visibleTemplates.some(
      (template) => template.name.trim().toLowerCase() === name.toLowerCase(),
    );

    if (nameExists) {
      setCreateStatus('Template name already exists');
      return;
    }

    setCreateStatus('Creating...');

    try {
      const result = await apiPost<CreateTemplateResponse>('/api/templates/github-home', createTemplateDraft(name));

      setNewTemplateName('');
      setCreateStatus('Created');
      navigate(`/templates/${result.template.id}`);
    } catch (error) {
      setCreateStatus(error instanceof Error ? error.message : 'Failed to create template');
    }
  };

  const handleOpenTemplate = (template: TemplateRecord) => {
    navigate(`/templates/${template.id}`);
  };

  const handleOpenActivityTemplate = (template?: TemplateRecord | null) => {
    if (template) {
      navigate(`/templates/${template.id}`);
    }
  };

  const handleRenameTemplate = async (template: TemplateRecord, requestedName: string) => {
    const nextName = requestedName.trim();

    if (!nextName || nextName === template.name) {
      return;
    }

    if (nextName.length < 2) {
      setCreateStatus('Template name must be at least 2 characters');
      return;
    }

    const nameExists = visibleTemplates.some(
      (item) => item.id !== template.id && item.name.trim().toLowerCase() === nextName.toLowerCase(),
    );

    if (nameExists) {
      setCreateStatus('Template name already exists');
      return;
    }

    setCreateStatus('Renaming...');

    try {
      const payload = await apiGet<ExtensionTemplatePayload>(`/api/templates/${encodeURIComponent(template.id)}`);
      const now = new Date().toISOString();
      const result = await apiPost<CreateTemplateResponse>('/api/templates/github-home', {
        ...payload,
        name: nextName,
        metadata: {
          ...payload.metadata,
          updatedAt: now,
        },
        updatedAt: now,
      });

      setRemoteTemplates((current) =>
        current.map((item) =>
          item.id === template.id
            ? {
                ...item,
                name: result.template.name,
                description: result.template.description,
                updatedAt: `Updated ${new Date(result.template.updatedAt).toLocaleString()}`,
              }
            : item,
        ),
      );
      setCreateStatus('Renamed');
    } catch (error) {
      setCreateStatus(error instanceof Error ? error.message : 'Failed to rename template');
    }
  };

  const handleDeleteTemplate = async (template: TemplateRecord) => {
    if (!window.confirm(`Delete "${template.name}"?`)) {
      return;
    }

    setCreateStatus('Deleting...');

    try {
      await apiDelete<DeleteTemplateResponse>(`/api/templates/${encodeURIComponent(template.id)}`);
      setRemoteTemplates((current) => current.filter((item) => item.id !== template.id));
      setCreateStatus('Deleted');
    } catch (error) {
      setCreateStatus(error instanceof Error ? error.message : 'Failed to delete template');
    }
  };

  const handleCopyTemplate = async (template: TemplateRecord, requestedName: string) => {
    const generatedName = getCopyTemplateName(template.name, visibleTemplates);
    const nextName = requestedName ? getUniqueTemplateName(requestedName, visibleTemplates) : generatedName;

    if (nextName.length < 2) {
      setCreateStatus('Template name must be at least 2 characters');
      return;
    }

    setCreateStatus('Copying...');

    try {
      const sourcePayload =
        isStarterGithubTemplateId(template.id)
          ? getStarterGithubTemplate(template.id)
          : await apiGet<ExtensionTemplatePayload>(`/api/templates/${encodeURIComponent(template.id)}`);

      if (!sourcePayload) {
        setCreateStatus('Template unavailable');
        return;
      }

      const payload = createCopiedTemplatePayload(sourcePayload, nextName);
      const result = await apiPost<CreateTemplateResponse>('/api/templates/github-home', payload);

      setRemoteTemplates((current) => [
        {
          ...template,
          id: result.template.id,
          name: result.template.name,
          description: result.template.description,
          updatedAt: `Updated ${new Date(result.template.updatedAt).toLocaleString()}`,
          owner: 'Personal Workspace',
        },
        ...current,
      ]);
      setCreateStatus('Copied');
      navigate(`/templates/${result.template.id}`);
    } catch (error) {
      setCreateStatus(error instanceof Error ? error.message : 'Failed to copy template');
    }
  };

  return (
    <div className="dashboard-page">
      <AppTopNav active="templates" searchPlaceholder="Search resources..." />

      <div className="dashboard-shell">
        <aside className="dashboard-sidebar">
          <div className="workspace-card">
            <div className="workspace-card__icon">
              <Icon name="terminal" />
            </div>
            <div>
              <h2>Main Workspace</h2>
              <p>PRODUCTION v1.0.4</p>
            </div>
          </div>

          <Link className="sidebar-create" to={`/templates/${primaryTemplateId}`}>
            <Icon name="add" />
            <span>Create New</span>
          </Link>

          <nav className="sidebar-nav" aria-label="Workspace">
            {sidebarItems.map((item) => (
              <a key={item.label} className={item.active ? 'is-active' : ''} href={`#${item.label}`}>
                <Icon name={item.icon} />
                <span>{item.label}</span>
              </a>
            ))}
          </nav>

          <div className="sidebar-bottom">
            <a href="#support">
              <Icon name="help_outline" />
              <span>Support</span>
            </a>
            <a href="#archive">
              <Icon name="archive" />
              <span>Archive</span>
            </a>
          </div>
        </aside>

        <main className="dashboard-main">
          <header className="dashboard-main__header">
            <div>
              <h1>Repository Templates</h1>
              <p>
                {isLoadingTemplates
                  ? 'Loading saved templates...'
                  : templateError
                    ? `Using local samples: ${templateError}`
                    : 'Manage saved GitHub layout templates.'}
              </p>
            </div>

            <div className="view-toggle">
              <button
                className={viewMode === 'grid' ? 'is-active' : ''}
                type="button"
                onClick={() => setViewMode('grid')}
              >
                <Icon name="grid_view" />
                <span>Grid</span>
              </button>
              <button
                className={viewMode === 'list' ? 'is-active' : ''}
                type="button"
                onClick={() => setViewMode('list')}
              >
                <Icon name="list" />
                <span>List</span>
              </button>
            </div>
          </header>

          <section className={viewMode === 'grid' ? 'template-grid' : 'template-list'}>
            {visibleTemplates.map((template) => (
              <TemplateCard
                key={template.id}
                canManage={
                  template.id !== DEFAULT_TEMPLATE_ID &&
                  !isStarterGithubTemplateId(template.id) &&
                  remoteTemplateIds.has(template.id)
                }
                canCopy={isStarterGithubTemplateId(template.id) || remoteTemplateIds.has(template.id)}
                template={template}
                variant={viewMode}
                onCopy={handleCopyTemplate}
                onDelete={handleDeleteTemplate}
                onOpen={handleOpenTemplate}
                onRename={handleRenameTemplate}
              />
            ))}

            <form className="template-add-card template-create-card" onSubmit={handleCreateTemplate}>
              <div className="template-add-card__icon">
                <Icon name="add_circle" />
              </div>
              <strong>New Template</strong>
              <label>
                <span>Template title</span>
                <input
                  placeholder="GitHub focus layout"
                  type="text"
                  value={newTemplateName}
                  onChange={(event) => setNewTemplateName(event.target.value)}
                />
              </label>
              <button type="submit">Create</button>
              {createStatus ? <em>{createStatus}</em> : null}
            </form>
          </section>

          <section className="activity-section">
            <h2>Recent Activity</h2>

            <div className="activity-grid">
              <article className="activity-card activity-card--large activity-card--style">
                <p>Recent Style</p>
                <strong>{usageCardTemplateName}</strong>
                <span>
                  <Icon name="history" />
                  <em>{formatRelativeUsageTime(recentUsage?.usedAt)}</em>
                </span>

                <div className="activity-style-preview" style={{ background: recentAccent.background }}>
                  <div style={{ background: recentAccent.panel }} />
                  <div>
                    <span style={{ background: recentAccent.soft }} />
                    <span style={{ background: recentAccent.main }} />
                    <span style={{ background: recentAccent.soft }} />
                  </div>
                </div>

                <div className="activity-card__actions">
                  <button
                    type="button"
                    onClick={() => handleOpenActivityTemplate(recentTemplateRecord)}
                    disabled={!recentTemplateRecord}
                  >
                    <Icon name="visibility" />
                    <span>Preview</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => recentTemplateRecord && handleCopyTemplate(recentTemplateRecord, '')}
                    disabled={!recentTemplateRecord}
                  >
                    <Icon name="content_copy" />
                    <span>Copy</span>
                  </button>
                </div>
              </article>

              <article className="activity-card activity-card--usage">
                <p>Most Used</p>
                <strong>{mostUsedTemplate?.useCount ?? 0}</strong>
                <button
                  className="activity-card__style-link"
                  type="button"
                  onClick={() => handleOpenActivityTemplate(mostUsedTemplateRecord)}
                  disabled={!mostUsedTemplateRecord}
                >
                  {mostUsedName}
                </button>
                <div className="activity-ranked-list">
                  {(topUsageTemplates.length ? topUsageTemplates.slice(0, 3) : []).map((template, index) => {
                    const maxUseCount = Math.max(...topUsageTemplates.map((item) => item.useCount), 1);
                    const width = Math.max(12, Math.round((template.useCount / maxUseCount) * 100));
                    const accent = getUsageAccent(template.id, template.name);

                    return (
                      <button key={template.id} type="button" onClick={() => navigate(`/templates/${template.id}`)}>
                        <span>{index + 1}</span>
                        <strong>{formatCompactTemplateName(template.name)}</strong>
                        <em>{template.useCount}</em>
                        <i style={{ width: `${width}%`, background: accent.panel }} />
                      </button>
                    );
                  })}
                  {!topUsageTemplates.length ? <small>No extension usage yet</small> : null}
                </div>
              </article>

              <article className="activity-card activity-card--usage">
                <p>Usage This Week</p>
                <strong>{templateUsage?.weeklyUses ?? 0}</strong>
                <span>{templateUsage?.totalUses ?? 0} total previews</span>
                <div className="activity-style-preview activity-style-preview--small" style={{ background: mostUsedAccent.background }}>
                  <div style={{ background: mostUsedAccent.panel }} />
                  <div>
                    <span style={{ background: mostUsedAccent.soft }} />
                    <span style={{ background: mostUsedAccent.main }} />
                  </div>
                </div>
                <div className="tag-row">
                  {(topUsageTemplates.length ? topUsageTemplates.slice(0, 3) : visibleTemplates.slice(0, 3)).map((template) => (
                    <button key={template.id} type="button" onClick={() => navigate(`/templates/${template.id}`)}>
                      {formatCompactTemplateName(template.name)}
                    </button>
                  ))}
                </div>
              </article>
            </div>
          </section>
        </main>
      </div>

      <footer className="dashboard-footer">
        <div>
          <span>REFLOW PLATFORM</span>
          <p>© 2024 Precision Git Reflow Platform. All rights reserved.</p>
        </div>
        <nav aria-label="Footer">
          <a href="#privacy">Privacy</a>
          <a href="#terms">Terms</a>
          <a href="#security">Security</a>
          <a href="#status">Status</a>
        </nav>
      </footer>
    </div>
  );
}
