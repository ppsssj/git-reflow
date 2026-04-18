import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { AppTopNav } from '../../components/layout/AppTopNav';
import { Icon } from '../../components/ui/Icon';
import { templates } from '../../mocks/templates';

const layerItems = [
  { icon: 'folder', label: 'Projects', id: 'header-section' },
  { icon: 'alt_route', label: 'Branches', id: 'main-grid' },
  { icon: 'history', label: 'Commits', id: 'repo-list' },
  { icon: 'merge_type', label: 'Pull Requests', id: 'activity-feed' },
];

const inspectorIcons = [
  'align_horizontal_left',
  'align_horizontal_center',
  'align_horizontal_right',
  'align_vertical_top',
  'align_vertical_center',
  'align_vertical_bottom',
];

export function TemplateEditorPage() {
  const { templateId } = useParams();
  const template = templates.find((item) => item.id === templateId) ?? templates[0];
  const [selectedSectionId, setSelectedSectionId] = useState(template.sections[0]?.id ?? 'header-section');

  useEffect(() => {
    setSelectedSectionId(template.sections[0]?.id ?? 'header-section');
  }, [template]);

  const selectedSection =
    template.sections.find((section) => section.id === selectedSectionId) ?? template.sections[0];

  const isSelected = (id: string) => selectedSection.id === id;

  return (
    <div className="editor-page">
      <AppTopNav active="templates" searchPlaceholder="Search templates..." />

      <main className="editor-main">
        <aside className="editor-sidebar">
          <div className="editor-sidebar__workspace">
            <div className="editor-sidebar__icon">
              <Icon name="folder" />
            </div>
            <div>
              <strong>Main Workspace</strong>
              <span>Production v1.0.4</span>
            </div>
          </div>

          <section className="editor-sidebar__section">
            <p>Layers</p>
            {layerItems.map((item) => (
              <button
                key={item.label}
                className={isSelected(item.id) ? 'is-active' : ''}
                type="button"
                onClick={() => setSelectedSectionId(item.id)}
              >
                <Icon name={item.icon} />
                <span>{item.label}</span>
              </button>
            ))}
          </section>

          <section className="editor-sidebar__section">
            <p>Structure</p>
            <div className="editor-tree">
              {template.sections.map((section) => (
                <button
                  key={section.id}
                  className={isSelected(section.id) ? 'is-selected' : ''}
                  style={{ paddingLeft: `${section.depth * 24 + 16}px` }}
                  type="button"
                  onClick={() => setSelectedSectionId(section.id)}
                >
                  <Icon
                    name={
                      section.kind === 'header'
                        ? 'view_quilt'
                        : section.kind === 'content'
                          ? 'view_column'
                          : section.kind === 'hero'
                            ? 'table_rows'
                            : section.kind === 'activity'
                              ? 'widgets'
                              : 'info'
                    }
                  />
                  <span>{section.label}</span>
                </button>
              ))}
            </div>
          </section>

          <div className="editor-sidebar__bottom">
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

        <section className="editor-canvas-shell">
          <div className="editor-canvas-grid">
            <div className="canvas-frame">
              <div className="canvas-frame__bar">
                <div className="window-pips">
                  <span />
                  <span />
                  <span />
                </div>
                <span>MAIN_UI_V1.REFLOW</span>
                <div className="canvas-spacer" />
              </div>

              <div className="canvas-frame__content">
                <div className="canvas-top">
                  <div className={`canvas-icon-block ${isSelected('header-section') ? 'is-highlighted' : ''}`}>
                    <Icon name="image" />
                  </div>
                  <div className="canvas-lines">
                    <span className="is-wide" />
                    <span className="is-medium" />
                  </div>
                  <div className="canvas-top__actions">
                    <span />
                    <span />
                  </div>
                </div>

                <div className="canvas-grid-layout">
                  <div className="canvas-main">
                    <div className={`canvas-module canvas-module--hero ${isSelected('repo-list') ? 'is-highlighted' : ''}`}>
                      <span className="is-medium" />
                      <span className="is-wide" />
                      <span className="is-wide" />
                      <span className="is-short" />
                    </div>

                    <div className="canvas-module-row">
                      <div className={`canvas-module ${isSelected('main-grid') ? 'is-highlighted' : ''}`}>
                        <span className="is-medium" />
                        <span className="is-short" />
                      </div>
                      <div className={`canvas-module ${isSelected('activity-feed') ? 'is-highlighted' : ''}`}>
                        <span className="is-medium" />
                        <span className="is-short" />
                      </div>
                    </div>
                  </div>

                  <aside className={`canvas-side-module ${isSelected('sidebar-context') ? 'is-highlighted' : ''}`}>
                    <div className="canvas-side-module__legend">
                      <span className="violet" />
                      <div>
                        <span className="is-short" />
                        <span className="is-short" />
                      </div>
                    </div>
                    <div className="canvas-side-module__legend">
                      <span className="amber" />
                      <div>
                        <span className="is-short" />
                        <span className="is-short" />
                      </div>
                    </div>
                  </aside>
                </div>
              </div>
            </div>

            <div className="canvas-controls">
              <button type="button">
                <Icon name="zoom_out" />
              </button>
              <span>84%</span>
              <button type="button">
                <Icon name="zoom_in" />
              </button>
              <div className="divider" />
              <button type="button">
                <Icon name="pan_tool" />
              </button>
              <button className="is-primary" type="button">
                <Icon name="near_me" />
              </button>
            </div>
          </div>
        </section>

        <aside className="editor-inspector">
          <div className="editor-inspector__header">
            <strong>INSPECTOR</strong>
            <div>
              <button type="button">
                <Icon name="devices" />
              </button>
              <button type="button">
                <Icon name="code" />
              </button>
            </div>
          </div>

          <section className="editor-inspector__section">
            <p>Alignment &amp; Position</p>
            <div className="icon-grid">
              {inspectorIcons.map((name) => (
                <button key={name} type="button">
                  <Icon name={name} />
                </button>
              ))}
            </div>
          </section>

          <section className="editor-inspector__section">
            <p>Component Style</p>
            <div className="inspector-row">
              <span>Visibility</span>
              <div className="toggle-pill">
                <div />
              </div>
            </div>

            <div className="inspector-slider">
              <div className="inspector-slider__label">
                <span>Density</span>
                <span>75%</span>
              </div>
              <input defaultValue="75" type="range" />
            </div>

            <div className="inspector-slider">
              <div className="inspector-slider__label">
                <span>Spacing</span>
                <span>24px</span>
              </div>
              <input defaultValue="24" max="48" type="range" />
            </div>

            <div className="inspector-pos-grid">
              <label>
                <span>X POS</span>
                <input readOnly type="text" value={selectedSection.id === 'header-section' ? '128' : '256'} />
              </label>
              <label>
                <span>Y POS</span>
                <input readOnly type="text" value={selectedSection.id === 'header-section' ? '512' : '368'} />
              </label>
            </div>
          </section>

          <section className="editor-inspector__section">
            <div className="editor-inspector__title-row">
              <p>Fill</p>
              <button type="button">
                <Icon name="add" />
              </button>
            </div>
            <div className="fill-row">
              <span className="fill-swatch" />
              <strong>#00629E</strong>
              <em>100%</em>
            </div>
          </section>

          <section className="editor-inspector__section">
            <div className="editor-inspector__title-row">
              <p>Effects</p>
              <button type="button">
                <Icon name="add" />
              </button>
            </div>
            <div className="effect-row">
              <Icon name="blur_on" />
              <span>Soft Ambient Glow</span>
              <button type="button">
                <Icon name="settings" />
              </button>
            </div>
          </section>
        </aside>
      </main>

      <footer className="editor-footerbar">
        <span>© 2024 Precision Git Reflow Platform. All rights reserved.</span>
        <nav aria-label="Footer">
          <a href="#privacy">Privacy</a>
          <a href="#terms">Terms</a>
          <a href="#security">Security</a>
          <a className="is-active" href="#status">
            Status
          </a>
        </nav>
        <strong>REF-PLATFORM-V1</strong>
      </footer>
    </div>
  );
}
