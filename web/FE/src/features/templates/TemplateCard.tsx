import type { CSSProperties } from 'react';
import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { Icon } from '../../components/ui/Icon';
import type { TemplateRecord } from '../../types/template';

interface TemplateCardProps {
  template: TemplateRecord;
  variant?: 'grid' | 'list';
  canManage?: boolean;
  canCopy?: boolean;
  copyLabel?: string;
  canPublish?: boolean;
  openPath?: string;
  isFavorite?: boolean;
  isPublished?: boolean;
  onCopy?: (template: TemplateRecord, name: string) => void;
  onDelete?: (template: TemplateRecord) => void;
  onToggleFavorite?: (template: TemplateRecord) => void;
  onTogglePublish?: (template: TemplateRecord) => void;
  onOpen?: (template: TemplateRecord) => void;
  onRename?: (template: TemplateRecord, name: string) => void;
}

type TemplateActionPanel = 'copy' | 'rename' | 'publish' | 'delete';

function getPreviewTheme(template: TemplateRecord) {
  const value = `${template.id} ${template.name}`.toLowerCase();
  const pageAppearance = template.preview?.pageAppearance;
  const topbarAppearance = getPreviewBlockAppearance(template, 'top-nav');
  const leftAppearance =
    getPreviewBlockAppearance(template, 'recent-repos') ?? getPreviewBlockAppearance(template, 'profile-summary');
  const mainAppearance =
    getPreviewBlockAppearance(template, 'activity-feed') ?? getPreviewBlockAppearance(template, 'copilot-prompt');
  const rightAppearance =
    getPreviewBlockAppearance(template, 'trending-repos') ?? getPreviewBlockAppearance(template, 'repo-updates');
  const backgroundColor = getStringValue(pageAppearance?.backgroundColor);
  const leftSidebarBackgroundColor = getStringValue(pageAppearance?.leftSidebarBackgroundColor);
  const topbarColor = getStringValue(topbarAppearance?.backgroundColor);
  const panelColor = getStringValue(leftAppearance?.backgroundColor) ?? leftSidebarBackgroundColor;
  const softColor =
    getStringValue(leftAppearance?.innerBackgroundColor) ??
    getStringValue(rightAppearance?.innerBackgroundColor);
  const mainColor = getStringValue(mainAppearance?.backgroundColor);
  const mainInnerColor = getStringValue(mainAppearance?.innerBackgroundColor);

  if (backgroundColor || topbarColor || panelColor || mainColor) {
    return {
      background: backgroundColor ?? '#dceafe',
      topbar: topbarColor ?? panelColor ?? '#101827',
      left: leftSidebarBackgroundColor ?? panelColor ?? topbarColor ?? '#172033',
      panel: panelColor ?? topbarColor ?? '#172033',
      soft: softColor ?? mainInnerColor ?? '#22304a',
      main: mainColor ?? panelColor ?? '#111827',
      accent: mainInnerColor ?? softColor ?? '#5b8def',
      right: getStringValue(rightAppearance?.backgroundColor) ?? panelColor ?? '#172033',
      text: '#e0f2fe',
    };
  }

  if (value.includes('red')) {
    return {
      background: '#f3d9e0',
      topbar: '#2a171a',
      left: '#3a2024',
      panel: '#3a2024',
      soft: '#553239',
      main: '#2c181c',
      accent: '#c45a6b',
      right: '#3a2024',
      text: '#ffe4ea',
    };
  }

  if (value.includes('green')) {
    return {
      background: '#d8efe4',
      topbar: '#10231c',
      left: '#183329',
      panel: '#183329',
      soft: '#25483b',
      main: '#142820',
      accent: '#3e8b64',
      right: '#183329',
      text: '#def7e9',
    };
  }

  return {
    background: '#dceafe',
    topbar: '#101827',
    left: '#172033',
    panel: '#172033',
    soft: '#22304a',
    main: '#111827',
    accent: '#5b8def',
    right: '#172033',
    text: '#e0f2fe',
  };
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function getStringValue(value: unknown) {
  return typeof value === 'string' && value.trim() ? value : undefined;
}

function getNumberValue(value: unknown) {
  const numberValue = Number(value);

  return Number.isFinite(numberValue) ? numberValue : undefined;
}

function getPreviewBlock(template: TemplateRecord, blockType: string) {
  return template.preview?.blocks?.find((block) => block.type === blockType);
}

function getPreviewBlockAppearance(template: TemplateRecord, blockType: string) {
  const appearance = getPreviewBlock(template, blockType)?.appearance;

  return isRecord(appearance) ? appearance : undefined;
}

function getBlockMiniStyle(appearance?: Record<string, unknown>): CSSProperties | undefined {
  if (!appearance) {
    return undefined;
  }

  const style: CSSProperties = {};
  const backgroundColor = getStringValue(appearance.backgroundColor);
  const innerBackgroundColor = getStringValue(appearance.innerBackgroundColor);
  const borderRadius = getNumberValue(appearance.borderRadius);
  const elementGap = getNumberValue(appearance.elementGap);

  if (backgroundColor) {
    style.background = backgroundColor;
  }

  if (innerBackgroundColor) {
    (style as Record<string, string>)['--preview-card-inner'] = innerBackgroundColor;
  }

  if (borderRadius !== undefined) {
    style.borderRadius = `${Math.max(3, Math.min(12, borderRadius * 0.45))}px`;
  }

  if (elementGap !== undefined) {
    style.gap = `${Math.max(3, Math.min(8, elementGap * 0.45))}px`;
  }

  return style;
}

function getPreviewStyle(template: TemplateRecord): CSSProperties {
  const theme = getPreviewTheme(template);

  return {
    '--preview-background': theme.background,
    '--preview-topbar': theme.topbar,
    '--preview-left': theme.left,
    '--preview-panel': theme.panel,
    '--preview-soft': theme.soft,
    '--preview-main': theme.main,
    '--preview-accent': theme.accent,
    '--preview-right': theme.right,
    '--preview-text': theme.text,
  } as CSSProperties;
}

function formatPreviewLabel(value: string) {
  return value
    .replace(/[-_]/g, ' ')
    .replace(/\b\w/g, (letter) => letter.toUpperCase())
    .slice(0, 18);
}

function TemplatePreview({ template }: { template: TemplateRecord }) {
  const visibleSections = template.sections.filter((section) => section.visible);
  const headerSections = visibleSections.filter((section) => section.kind === 'header');
  const sidebarSections = visibleSections.filter((section) => section.kind === 'sidebar');
  const contentSections = visibleSections.filter((section) => section.kind === 'content');
  const fallbackSections = visibleSections.length ? visibleSections : template.highlights.map((highlight, index) => ({
    id: `${template.id}-highlight-${index}`,
    label: highlight,
    kind: 'content',
    depth: 0,
    description: highlight,
    visible: true,
  }));
  const topbarLabel = headerSections[0]?.label ?? 'Dashboard';
  const leftLabels = (sidebarSections.length ? sidebarSections : fallbackSections).slice(0, 4);
  const mainLabels = (contentSections.length ? contentSections : fallbackSections).slice(0, 3);
  const rightLabels = (sidebarSections.length > 2 ? sidebarSections.slice(2) : fallbackSections).slice(0, 3);
  const topbarBlock = getPreviewBlock(template, 'top-nav');
  const leftBlock =
    getPreviewBlock(template, 'recent-repos') ?? getPreviewBlock(template, 'profile-summary');
  const copilotBlock = getPreviewBlock(template, 'copilot-prompt');
  const feedBlock = getPreviewBlock(template, 'activity-feed');
  const rightBlock =
    getPreviewBlock(template, 'trending-repos') ?? getPreviewBlock(template, 'repo-updates');
  const updateBlock = getPreviewBlock(template, 'repo-updates');
  const columnLayout = template.preview?.columnLayout;
  const gridTemplateColumns =
    columnLayout?.left && columnLayout?.main && columnLayout?.right
      ? `${columnLayout.left}fr ${columnLayout.main}fr ${columnLayout.right}fr`
      : undefined;

  return (
    <div className="template-preview" style={getPreviewStyle(template)} aria-hidden="true">
      <div className="template-preview__topbar" style={getBlockMiniStyle(topbarBlock?.appearance)}>
        <i />
        <strong>{formatPreviewLabel(template.name || topbarLabel)}</strong>
        <span />
        <em />
        <em />
        <em />
      </div>
      <div className="template-preview__body" style={{ gridTemplateColumns }}>
        <aside className="template-preview__left">
          <div className="template-preview__profile">
            <span />
            <strong>{formatPreviewLabel(template.owner)}</strong>
          </div>
          <section className="template-preview__repo-card" style={getBlockMiniStyle(leftBlock?.appearance)}>
            <header>
              <strong>{formatPreviewLabel(leftBlock?.title ?? leftLabels[0]?.label ?? 'Top repositories')}</strong>
              <i />
            </header>
            <em />
            {leftLabels.slice(0, 5).map((section) => (
              <div key={section.id}>
                <span />
                <strong>{formatPreviewLabel(section.label)}</strong>
              </div>
            ))}
          </section>
        </aside>
        <main className="template-preview__main">
          <section className="template-preview__prompt" style={getBlockMiniStyle(copilotBlock?.appearance)}>
            <h4>Home</h4>
            <div />
            <footer>
              <span />
              <i />
              <b />
            </footer>
          </section>
          <section className="template-preview__feed" style={getBlockMiniStyle(feedBlock?.appearance)}>
            <header>
              <strong>{formatPreviewLabel(feedBlock?.title ?? mainLabels[0]?.label ?? 'Feed')}</strong>
              <i />
            </header>
            {mainLabels.slice(0, 3).map((section) => (
              <article key={section.id}>
                <span />
                <div>
                  <strong>{formatPreviewLabel(section.label)}</strong>
                  <em />
                  <em />
                </div>
              </article>
            ))}
          </section>
          {updateBlock ? (
            <section className="template-preview__updates" style={getBlockMiniStyle(updateBlock.appearance)}>
              <strong>{formatPreviewLabel(updateBlock.title)}</strong>
              <span />
              <span />
            </section>
          ) : null}
        </main>
        <aside className="template-preview__right">
          <section className="template-preview__changelog" style={getBlockMiniStyle(rightBlock?.appearance)}>
            <strong>{formatPreviewLabel(rightBlock?.title ?? rightLabels[0]?.label ?? 'Changelog')}</strong>
            {rightLabels.slice(0, 4).map((section) => (
              <div key={section.id}>
                <span />
                <p>{formatPreviewLabel(section.label)}</p>
              </div>
            ))}
          </section>
        </aside>
      </div>
    </div>
  );
}

export function TemplateCard({
  template,
  variant = 'grid',
  canManage = true,
  canCopy = true,
  copyLabel = 'Copy',
  canPublish = false,
  openPath,
  isFavorite = false,
  isPublished = false,
  onCopy,
  onDelete,
  onToggleFavorite,
  onTogglePublish,
  onOpen,
  onRename,
}: TemplateCardProps) {
  const [menuOpen, setMenuOpen] = useState(false);
  const [actionPanel, setActionPanel] = useState<TemplateActionPanel | null>(null);
  const [copyName, setCopyName] = useState('');
  const [renameName, setRenameName] = useState(template.name);
  const menuRef = useRef<HTMLDivElement>(null);

  const closeActionPanel = () => {
    setActionPanel(null);
    setCopyName('');
    setRenameName(template.name);
  };

  useEffect(() => {
    if (!menuOpen) {
      return undefined;
    }

    const handlePointerDown = (event: PointerEvent) => {
      if (menuRef.current?.contains(event.target as Node)) {
        return;
      }

      setMenuOpen(false);
      closeActionPanel();
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setMenuOpen(false);
        closeActionPanel();
      }
    };

    document.addEventListener('pointerdown', handlePointerDown);
    document.addEventListener('keydown', handleKeyDown);

    return () => {
      document.removeEventListener('pointerdown', handlePointerDown);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [menuOpen, template.name]);

  const handleMenuAction = (action?: (template: TemplateRecord) => void) => {
    setMenuOpen(false);
    closeActionPanel();
    action?.(template);
  };

  const handleToggleMenu = () => {
    setMenuOpen((isOpen) => {
      if (isOpen) {
        closeActionPanel();
      }

      return !isOpen;
    });
  };

  const handleCopySubmit = () => {
    setMenuOpen(false);
    onCopy?.(template, copyName.trim());
    closeActionPanel();
  };

  const handleRenameSubmit = () => {
    const nextName = renameName.trim();

    setMenuOpen(false);
    closeActionPanel();
    onRename?.(template, nextName);
  };

  const handleDeleteSubmit = () => {
    setMenuOpen(false);
    closeActionPanel();
    onDelete?.(template);
  };

  const handlePublishSubmit = () => {
    setMenuOpen(false);
    closeActionPanel();
    onTogglePublish?.(template);
  };

  const templatePath = openPath ?? `/templates/${template.id}`;
  const canOpenTemplate = Boolean(onOpen);
  const thumbnailContent = (
    <>
      {template.thumbnail ? (
        <img alt={template.name} src={template.thumbnail} />
      ) : (
        <TemplatePreview template={template} />
      )}
      <span className={`template-tile__status ${template.status === 'ACTIVE' ? 'is-active' : 'is-inactive'}`}>
        {template.status}
      </span>
    </>
  );
  const detailContent = (
    <>
      <p className="template-tile__description">{template.description}</p>
      <div className="template-tile__meta">
        <div className="template-tile__avatars">
          {template.collaborators.slice(0, 2).map((collaborator, index) => (
            <img
              key={`${template.id}-${index}`}
              alt=""
              aria-hidden="true"
              src={collaborator}
            />
          ))}
        </div>
        <span>{template.updatedAt}</span>
      </div>
      {variant === 'list' ? (
        <div className="template-tile__highlights">
          {template.highlights.slice(0, 3).map((highlight) => (
            <span key={highlight}>{highlight}</span>
          ))}
        </div>
      ) : null}
    </>
  );

  return (
    <article
      className={[
        'template-tile',
        `template-tile--${variant}`,
        menuOpen || actionPanel ? 'is-menu-open' : '',
      ].join(' ').trim()}
    >
      <div className="template-tile__thumb">
        {canOpenTemplate ? (
          <Link className="template-tile__link" to={templatePath}>
            {thumbnailContent}
          </Link>
        ) : (
          <div className="template-tile__link">
            {thumbnailContent}
          </div>
        )}
        <button
          aria-pressed={isFavorite}
          aria-label={isFavorite ? `Remove ${template.name} from favorites` : `Add ${template.name} to favorites`}
          className={['template-tile__favorite', isFavorite ? 'is-favorite' : ''].join(' ').trim()}
          type="button"
          onClick={() => onToggleFavorite?.(template)}
        >
          <Icon name="star" />
        </button>
      </div>

      <div className="template-tile__body">
        <div className="template-tile__title">
          {canOpenTemplate ? (
            <Link to={templatePath}>
              <h3>{template.name}</h3>
            </Link>
          ) : (
            <span className="template-tile__title-link">
              <h3>{template.name}</h3>
            </span>
          )}
          <div className="template-tile__menu" ref={menuRef}>
            <button
              aria-expanded={menuOpen}
              aria-haspopup="menu"
              aria-label={`${template.name} actions`}
              className="template-tile__menu-trigger"
              type="button"
              onClick={handleToggleMenu}
            >
              <Icon name="more_vert" />
            </button>
            {menuOpen ? (
              <div className="template-tile__menu-popover" role="menu">
                <button disabled={!onOpen} type="button" role="menuitem" onClick={() => handleMenuAction(onOpen)}>
                  <Icon name="open_in_new" />
                  <span>Open</span>
                </button>
                <button
                  disabled={!canManage}
                  type="button"
                  role="menuitem"
                  onClick={() => {
                    setActionPanel('rename');
                    setRenameName(template.name);
                  }}
                >
                  <Icon name="edit" />
                  <span>Rename</span>
                </button>
                <button
                  disabled={!canCopy}
                  type="button"
                  role="menuitem"
                  onClick={() => {
                    setActionPanel('copy');
                    setCopyName('');
                  }}
                >
                  <Icon name="content_copy" />
                  <span>{copyLabel}</span>
                </button>
                <button
                  disabled={!canPublish && !isPublished}
                  type="button"
                  role="menuitem"
                  onClick={() => setActionPanel('publish')}
                >
                  <Icon name={isPublished ? 'visibility_off' : 'send'} />
                  <span>{isPublished ? 'Unpublish' : 'Publish to Network'}</span>
                </button>
                <button
                  className="is-danger"
                  disabled={!canManage}
                  type="button"
                  role="menuitem"
                  onClick={() => setActionPanel('delete')}
                >
                  <Icon name="delete" />
                  <span>Delete</span>
                </button>
              </div>
            ) : null}
            {actionPanel === 'copy' ? (
              <div className="template-tile__action-popover template-tile__copy-popover">
                <label>
                  <span>{copyLabel} as</span>
                  <input
                    autoFocus
                    placeholder={`${template.name} (1)`}
                    type="text"
                    value={copyName}
                    onChange={(event) => setCopyName(event.target.value)}
                    onKeyDown={(event) => {
                      if (event.key === 'Enter') {
                        event.preventDefault();
                        handleCopySubmit();
                      }

                      if (event.key === 'Escape') {
                        closeActionPanel();
                      }
                    }}
                  />
                </label>
                <div>
                  <button type="button" onClick={closeActionPanel}>
                    Cancel
                  </button>
                  <button type="button" onClick={handleCopySubmit}>
                    {copyLabel}
                  </button>
                </div>
              </div>
            ) : null}
            {actionPanel === 'rename' ? (
              <div className="template-tile__action-popover">
                <label>
                  <span>Rename to</span>
                  <input
                    autoFocus
                    type="text"
                    value={renameName}
                    onChange={(event) => setRenameName(event.target.value)}
                    onKeyDown={(event) => {
                      if (event.key === 'Enter') {
                        event.preventDefault();
                        handleRenameSubmit();
                      }

                      if (event.key === 'Escape') {
                        closeActionPanel();
                      }
                    }}
                  />
                </label>
                <div>
                  <button type="button" onClick={closeActionPanel}>
                    Cancel
                  </button>
                  <button type="button" onClick={handleRenameSubmit}>
                    Rename
                  </button>
                </div>
              </div>
            ) : null}
            {actionPanel === 'delete' ? (
              <div className="template-tile__action-popover template-tile__action-popover--danger">
                <strong>Delete template?</strong>
                <p>{template.name}</p>
                <div>
                  <button type="button" onClick={closeActionPanel}>
                    Cancel
                  </button>
                  <button type="button" onClick={handleDeleteSubmit}>
                    Delete
                  </button>
                </div>
              </div>
            ) : null}
            {actionPanel === 'publish' ? (
              <div className="template-tile__action-popover">
                <strong>{isPublished ? 'Unpublish template?' : 'Publish to Network?'}</strong>
                <p>
                  {isPublished
                    ? 'This removes the template from the public Network view.'
                    : 'Public templates can be discovered and imported by other users.'}
                </p>
                <div>
                  <button type="button" onClick={closeActionPanel}>
                    Cancel
                  </button>
                  <button type="button" onClick={handlePublishSubmit}>
                    {isPublished ? 'Unpublish' : 'Publish'}
                  </button>
                </div>
              </div>
            ) : null}
          </div>
        </div>
        {canOpenTemplate ? (
          <Link className="template-tile__content-link" to={templatePath}>
            {detailContent}
          </Link>
        ) : (
          <div className="template-tile__content-link">
            {detailContent}
          </div>
        )}
      </div>
    </article>
  );
}
