import { Link } from 'react-router-dom';
import { AppTopNav } from '../../components/layout/AppTopNav';
import { Icon } from '../../components/ui/Icon';
import { templates } from '../../mocks/templates';
import { TemplateCard } from './TemplateCard';

const sidebarItems = [
  { icon: 'folder', label: 'Projects', active: true },
  { icon: 'alt_route', label: 'Branches' },
  { icon: 'history', label: 'Commits' },
  { icon: 'merge_type', label: 'Pull Requests' },
  { icon: 'inventory_2', label: 'Assets' },
  { icon: 'analytics', label: 'Analytics' },
];

export function TemplateListPage() {
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

          <Link className="sidebar-create" to={`/templates/${templates[0].id}`}>
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
              <p>Manage and deploy pre-configured development environments.</p>
            </div>

            <div className="view-toggle">
              <button className="is-active" type="button">
                <Icon name="grid_view" />
                <span>Grid</span>
              </button>
              <button type="button">
                <Icon name="list" />
                <span>List</span>
              </button>
            </div>
          </header>

          <section className="template-grid">
            {templates.map((template) => (
              <TemplateCard key={template.id} template={template} />
            ))}

            <Link className="template-add-card" to={`/templates/${templates[0].id}`}>
              <div className="template-add-card__icon">
                <Icon name="add_circle" />
              </div>
              <strong>New Template</strong>
              <span>Initialize from repository</span>
            </Link>
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
