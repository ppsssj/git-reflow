import type { FormEvent } from 'react';
import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { AppTopNav } from '../../components/layout/AppTopNav';
import { Icon } from '../../components/ui/Icon';
import { apiGet, apiPost } from '../../lib/api';
import { templates } from '../../mocks/templates';
import type { ExtensionTemplatePayload, TemplateRecord } from '../../types/template';
import { defaultGithubTemplate } from '../editor/templates/defaultGithubTemplate';
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

const DEFAULT_TEMPLATE_ID = defaultGithubTemplate.id;
const defaultTemplateRecord: TemplateRecord = {
  id: defaultGithubTemplate.id,
  name: defaultGithubTemplate.name,
  description: defaultGithubTemplate.description,
  thumbnail: '',
  collaborators: [],
  status: 'ACTIVE',
  syncState: 'Ready to sync',
  updatedAt: 'Default template',
  owner: 'git-reflow',
  highlights: [
    'Base GitHub home layout',
    'Use this as the starting point for saved templates',
    `${defaultGithubTemplate.blocks.filter((block) => block.visible).length} visible blocks`,
  ],
  sections: defaultGithubTemplate.blocks
    .filter((block) => block.visible)
    .slice(0, 6)
    .map((block, index) => ({
      id: block.id,
      label: block.title,
      kind: block.region === 'topbar' ? 'header' : block.region === 'main-feed' ? 'content' : 'sidebar',
      depth: index === 0 ? 0 : 1,
      description: block.extensionSlot ?? block.region,
      visible: block.visible,
    })),
};

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

export function TemplateListPage() {
  const navigate = useNavigate();
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [remoteTemplates, setRemoteTemplates] = useState<TemplateRecord[]>([]);
  const [isLoadingTemplates, setIsLoadingTemplates] = useState(true);
  const [templateError, setTemplateError] = useState('');
  const [newTemplateName, setNewTemplateName] = useState('');
  const [createStatus, setCreateStatus] = useState('');
  const visibleTemplates = useMemo(() => {
    const userTemplates = remoteTemplates.filter((template) => template.id !== DEFAULT_TEMPLATE_ID);

    return userTemplates.length > 0 ? [defaultTemplateRecord, ...userTemplates] : [defaultTemplateRecord, ...templates];
  }, [remoteTemplates]);
  const primaryTemplateId = visibleTemplates[0]?.id ?? 'github-dashboard-reference';

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
              <TemplateCard key={template.id} template={template} variant={viewMode} />
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
              <article className="activity-card activity-card--large">
                <p>Total Deployments</p>
                <strong>1,284</strong>
                <span>
                  <Icon name="trending_up" />
                  <em>+12% from last month</em>
                </span>
                <div className="activity-card__ghost">
                  <Icon name="rocket_launch" />
                </div>
              </article>

              <article className="activity-card">
                <p>Active Assets</p>
                <strong>42</strong>
                <div className="mini-chart">
                  <span />
                  <span />
                  <span />
                  <span />
                  <span />
                </div>
              </article>

              <article className="activity-card">
                <p>Templates Usage</p>
                <strong>89%</strong>
                <div className="tag-row">
                  <span>NEXT.JS</span>
                  <span>ASTRO</span>
                  <span>API</span>
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
