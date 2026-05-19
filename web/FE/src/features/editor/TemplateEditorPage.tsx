import type { CSSProperties, WheelEvent } from 'react';
import { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { AppTopNav } from '../../components/layout/AppTopNav';
import { Icon } from '../../components/ui/Icon';
import { apiGet, apiPost } from '../../lib/api';
import { templates } from '../../mocks/templates';
import type {
  TemplateBlock,
  ExtensionTemplatePayload,
  TemplateColumnLayout,
  TemplateLayout,
  TemplateRegion,
  TemplateVariation,
  TemplateVariationId,
  TemplateRecord,
} from '../../types/template';
import { TemplateEditPanel } from './TemplateEditPanel';
import { TemplateLayoutCanvas } from './TemplateLayoutCanvas';
import { defaultGithubTemplate } from './templates/defaultGithubTemplate';
import {
  getStarterGithubTemplate,
  getStarterGithubTemplateRecord,
  isStarterGithubTemplateId,
  starterGithubTemplateRecord,
} from './templates/starterGithubTemplate';
import { useTemplateLayout } from './useTemplateLayout';

const regionIcons: Record<TemplateRegion, string> = {
  topbar: 'web_asset',
  'left-sidebar': 'dock_to_left',
  'main-feed': 'view_agenda',
  'right-sidebar': 'dock_to_right',
};

const regionLabels: Record<TemplateRegion, string> = {
  topbar: 'Topbar',
  'left-sidebar': 'Left sidebar',
  'main-feed': 'Main feed',
  'right-sidebar': 'Right sidebar',
};

const MIN_CANVAS_ZOOM = 0.5;
const MAX_CANVAS_ZOOM = 2;
const CANVAS_ZOOM_STEP = 0.1;
const STYLE_MENU_WIDTH = 260;
const STYLE_MENU_VISIBLE_GUTTER = 12;
const VIEWED_NETWORK_TEMPLATE_STORAGE_KEY = 'git-reflow.viewed-network-templates';
const DEFAULT_COLUMN_LAYOUT: TemplateColumnLayout = {
  left: 320,
  main: 900,
  right: 315,
};

const githubSafeVariations: TemplateVariation[] = [
  {
    id: 'github-default',
    title: 'Current GitHub home',
    description: 'Keep the captured dashboard structure as-is.',
    githubConstraint: 'Baseline',
  },
  {
    id: 'feed-two-column',
    title: 'Two-column feed',
    description: 'Split feed cards into two scannable columns.',
    githubConstraint: 'Feed only',
  },
];

interface SaveTemplateResponse {
  ok: true;
  template: ExtensionTemplatePayload;
}

interface NetworkTemplateResponse {
  ok: true;
  template: ExtensionTemplatePayload;
  record: TemplateRecord;
}

interface ImportNetworkTemplateResponse {
  ok: true;
  template: ExtensionTemplatePayload;
  record: TemplateRecord;
}

interface NetworkMetricResponse {
  ok: true;
  template: TemplateRecord;
}

interface TemplateResetSnapshot {
  layout: TemplateLayout;
  columnLayout: TemplateColumnLayout;
  leftSidebarResizeEnabled: boolean;
  selectedVariationId: TemplateVariationId;
  pageAppearance: Record<string, unknown>;
}

function clampCanvasZoom(value: number) {
  return Math.min(MAX_CANVAS_ZOOM, Math.max(MIN_CANVAS_ZOOM, value));
}

function clampMenuCoordinate(value: number, min: number, max: number) {
  return Math.min(Math.max(value, min), Math.max(min, max));
}

function createEditableFallbackTemplate(templateId: string, templateName: string): ExtensionTemplatePayload {
  const now = new Date().toISOString();

  return {
    ...defaultGithubTemplate,
    id: templateId,
    name: templateName,
    description: `Custom GitHub home layout based on ${templateName}.`,
    source: 'user',
    version: defaultGithubTemplate.version,
    metadata: {
      ...defaultGithubTemplate.metadata,
      updatedAt: now,
    },
    provider: 'github',
    columnLayout: DEFAULT_COLUMN_LAYOUT,
    leftSidebarResizeEnabled: true,
    selectedVariationId: 'github-default',
    updatedAt: now,
  };
}

function formatPublishedDate(value?: string) {
  if (!value) {
    return 'Recently published';
  }

  return `Published ${new Date(value).toLocaleDateString()}`;
}

function readViewedNetworkTemplateIds() {
  try {
    const parsed = JSON.parse(window.sessionStorage.getItem(VIEWED_NETWORK_TEMPLATE_STORAGE_KEY) ?? '[]');

    return Array.isArray(parsed) ? parsed.filter((item): item is string => typeof item === 'string') : [];
  } catch {
    return [];
  }
}

function rememberViewedNetworkTemplate(templateId: string) {
  const ids = readViewedNetworkTemplateIds();

  if (ids.includes(templateId)) {
    return false;
  }

  window.sessionStorage.setItem(VIEWED_NETWORK_TEMPLATE_STORAGE_KEY, JSON.stringify([templateId, ...ids].slice(0, 200)));
  return true;
}

function getTemplateResetSnapshot(template: TemplateLayout & Partial<ExtensionTemplatePayload>): TemplateResetSnapshot {
  return {
    layout: template,
    columnLayout: template.columnLayout ?? DEFAULT_COLUMN_LAYOUT,
    leftSidebarResizeEnabled: template.leftSidebarResizeEnabled !== false,
    selectedVariationId: template.selectedVariationId ?? 'github-default',
    pageAppearance:
      typeof template.pageAppearance === 'object' && template.pageAppearance !== null && !Array.isArray(template.pageAppearance)
        ? template.pageAppearance as Record<string, unknown>
        : {},
  };
}

export function TemplateEditorPage() {
  const navigate = useNavigate();
  const { networkTemplateId, templateId } = useParams();
  const isNetworkPreview = Boolean(networkTemplateId);
  const templateRecord =
    templateId && isStarterGithubTemplateId(templateId)
      ? getStarterGithubTemplateRecord(templateId) ?? starterGithubTemplateRecord
      : templates.find((item) => item.id === templateId) ?? starterGithubTemplateRecord;
  const {
    layout,
    activeScreen,
    blocksByRegion,
    setActiveScreen,
    toggleBlockVisibility,
    updateBlock,
    updateBlockProps,
    updateBlockTypeProps,
    moveBlock,
    replaceLayout,
  } = useTemplateLayout(defaultGithubTemplate);
  const [selectedBlockId, setSelectedBlockId] = useState('');
  const [canvasZoom, setCanvasZoom] = useState(1);
  const [columnLayout, setColumnLayout] = useState<TemplateColumnLayout>(DEFAULT_COLUMN_LAYOUT);
  const [leftSidebarResizeEnabled, setLeftSidebarResizeEnabled] = useState(true);
  const [selectedVariationId, setSelectedVariationId] = useState<TemplateVariationId>('github-default');
  const [pageAppearance, setPageAppearance] = useState<Record<string, unknown>>({});
  const [syncStatus, setSyncStatus] = useState('Not synced');
  const [networkRecord, setNetworkRecord] = useState<TemplateRecord | null>(null);
  const [resetSnapshot, setResetSnapshot] = useState<TemplateResetSnapshot>(() =>
    getTemplateResetSnapshot(defaultGithubTemplate),
  );
  const [blockStyleMenu, setBlockStyleMenu] = useState<{ blockId: string; x: number; y: number } | null>(null);
  const [pageStyleMenu, setPageStyleMenu] = useState<{ x: number; y: number } | null>(null);
  const canvasShellRef = useRef<HTMLElement | null>(null);
  const styleMenuRef = useRef<HTMLDivElement | null>(null);
  const styleMenuBlock = blockStyleMenu
    ? layout.blocks.find((block) => block.id === blockStyleMenu.blockId)
    : null;

  const applyTemplateState = (template: TemplateLayout & Partial<ExtensionTemplatePayload>) => {
    const snapshot = getTemplateResetSnapshot(template);

    replaceLayout(snapshot.layout);
    setColumnLayout(snapshot.columnLayout);
    setLeftSidebarResizeEnabled(snapshot.leftSidebarResizeEnabled);
    setSelectedVariationId(snapshot.selectedVariationId);
    setPageAppearance(snapshot.pageAppearance);
    setResetSnapshot(snapshot);
  };

  useEffect(() => {
    if (selectedBlockId && !layout.blocks.some((block) => block.id === selectedBlockId)) {
      setSelectedBlockId(layout.blocks[0]?.id ?? '');
    }
  }, [layout.blocks, selectedBlockId]);

  useEffect(() => {
    if (!blockStyleMenu && !pageStyleMenu) {
      return undefined;
    }

    const closeStyleMenus = () => {
      setBlockStyleMenu(null);
      setPageStyleMenu(null);
    };

    const handlePointerDown = (event: PointerEvent) => {
      if (styleMenuRef.current?.contains(event.target as Node)) {
        return;
      }

      closeStyleMenus();
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        closeStyleMenus();
      }
    };

    document.addEventListener('pointerdown', handlePointerDown, true);
    document.addEventListener('keydown', handleKeyDown);

    return () => {
      document.removeEventListener('pointerdown', handlePointerDown, true);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [blockStyleMenu, pageStyleMenu]);

  useEffect(() => {
    if (networkTemplateId) {
      let cancelled = false;
      const shouldCountView = rememberViewedNetworkTemplate(networkTemplateId);

      apiGet<NetworkTemplateResponse>(`/api/templates/network/${encodeURIComponent(networkTemplateId)}`)
        .then((result) => {
          if (cancelled) {
            return;
          }

          setNetworkRecord(result.record);
          applyTemplateState(result.template);
          setSyncStatus('Network preview');

          if (shouldCountView) {
            apiPost<NetworkMetricResponse>(
              `/api/templates/network/${encodeURIComponent(networkTemplateId)}/view`,
              {},
            )
              .then((viewResult) => {
                if (!cancelled) {
                  setNetworkRecord(viewResult.template);
                }
              })
              .catch(() => {
                if (!cancelled) {
                  setSyncStatus('View count unavailable');
                }
              });
          }
        })
        .catch(() => {
          if (!cancelled) {
            setSyncStatus('Network template unavailable');
          }
        });

      return () => {
        cancelled = true;
      };
    }

    if (!templateId) {
      return;
    }

    if (templateId === defaultGithubTemplate.id) {
      applyTemplateState(defaultGithubTemplate);
      setSyncStatus('Loaded default template');
      return;
    }

    const starterTemplate = getStarterGithubTemplate(templateId);

    if (starterTemplate) {
      applyTemplateState(starterTemplate);
      setSyncStatus('Loaded starter preset');
      return;
    }

    let cancelled = false;

    apiGet<ExtensionTemplatePayload>(`/api/templates/${encodeURIComponent(templateId)}`)
      .then((template) => {
        if (cancelled) {
          return;
        }

        applyTemplateState(template);
        setSyncStatus('Loaded saved template');
      })
      .catch(() => {
        if (!cancelled) {
          const fallbackTemplate = createEditableFallbackTemplate(templateId, templateRecord.name);

          applyTemplateState(fallbackTemplate);
          setSyncStatus('Using editable local fallback');
        }
      });

    return () => {
      cancelled = true;
    };
  }, [networkTemplateId, replaceLayout, templateId, templateRecord.name]);

  const visibleCount = useMemo(
    () =>
      layout.blocks.filter(
        (block) =>
          block.visible && (block.screenId ?? layout.screens[0]?.id ?? layout.activeScreenId) === layout.activeScreenId,
      ).length,
    [layout.activeScreenId, layout.blocks, layout.screens],
  );

  const serializedTemplateState = useMemo(
    () =>
      JSON.stringify(
        {
          ...layout,
          columnLayout,
          leftSidebarResizeEnabled,
          selectedVariationId,
          pageAppearance,
        },
        null,
        2,
      ),
    [layout, columnLayout, leftSidebarResizeEnabled, selectedVariationId, pageAppearance],
  );

  const handleReset = () => {
    replaceLayout(resetSnapshot.layout);
    setSelectedBlockId('');
    setColumnLayout(resetSnapshot.columnLayout);
    setLeftSidebarResizeEnabled(resetSnapshot.leftSidebarResizeEnabled);
    setSelectedVariationId(resetSnapshot.selectedVariationId);
    setPageAppearance(resetSnapshot.pageAppearance);
    setSyncStatus('Reset to loaded draft');
  };

  const handleImportNetworkTemplate = async () => {
    if (!networkTemplateId) {
      return;
    }

    setSyncStatus('Importing...');

    try {
      const result = await apiPost<ImportNetworkTemplateResponse>(
        `/api/templates/network/${encodeURIComponent(networkTemplateId)}/import`,
        { name: `${layout.name} Imported` },
      );

      setSyncStatus('Imported');
      navigate(`/templates/${result.template.id}`);
    } catch {
      setSyncStatus('Import failed');
    }
  };

  const handleSyncTemplate = async () => {
    if (isNetworkPreview) {
      await handleImportNetworkTemplate();
      return;
    }

    if (templateId === defaultGithubTemplate.id) {
      setSyncStatus('Create a named template before saving');
      return;
    }

    setSyncStatus('Syncing...');

    try {
      const result = await apiPost<SaveTemplateResponse>(
        '/api/templates/github-home',
        JSON.parse(serializedTemplateState),
      );

      setResetSnapshot(getTemplateResetSnapshot(result.template));
      setSyncStatus('Synced to localhost:8787');
    } catch {
      setSyncStatus('Backend unavailable');
    }
  };

  const updateCanvasZoom = (nextZoom: number) => {
    setCanvasZoom(clampCanvasZoom(nextZoom));
  };

  const handleCanvasWheel = (event: WheelEvent<HTMLElement>) => {
    event.preventDefault();
    event.stopPropagation();

    if (event.ctrlKey || event.metaKey) {
      const shell = event.currentTarget;
      const rect = shell.getBoundingClientRect();
      const pointerX = event.clientX - rect.left + shell.scrollLeft;
      const pointerY = event.clientY - rect.top + shell.scrollTop;
      const direction = event.deltaY > 0 ? -1 : 1;
      const nextZoom = clampCanvasZoom(canvasZoom + direction * CANVAS_ZOOM_STEP);

      if (nextZoom === canvasZoom) {
        return;
      }

      const zoomRatio = nextZoom / canvasZoom;
      setCanvasZoom(nextZoom);

      requestAnimationFrame(() => {
        shell.scrollLeft = pointerX * zoomRatio - (event.clientX - rect.left);
        shell.scrollTop = pointerY * zoomRatio - (event.clientY - rect.top);
      });

      return;
    }

    if (event.shiftKey) {
      const dominantDelta = Math.abs(event.deltaY) >= Math.abs(event.deltaX) ? event.deltaY : event.deltaX;
      event.currentTarget.scrollLeft += dominantDelta;
      return;
    }

    event.currentTarget.scrollLeft += event.deltaX;
    event.currentTarget.scrollTop += event.deltaY;
  };

  const handleToggleNetworkLike = async () => {
    if (!networkTemplateId || !networkRecord) {
      return;
    }

    const nextLiked = !networkRecord.likedByCurrentUser;
    setNetworkRecord({
      ...networkRecord,
      likedByCurrentUser: nextLiked,
      likeCount: Math.max(0, (networkRecord.likeCount ?? 0) + (nextLiked ? 1 : -1)),
    });

    try {
      const result = await apiPost<NetworkMetricResponse>(
        `/api/templates/network/${encodeURIComponent(networkTemplateId)}/like`,
        { liked: nextLiked },
      );

      setNetworkRecord(result.template);
    } catch {
      setNetworkRecord(networkRecord);
      setSyncStatus('Like failed');
    }
  };

  const handleOpenBlockStyleMenu = (blockId: string, x: number, y: number) => {
    if (isNetworkPreview) {
      return;
    }

    const menuPosition = getCanvasMenuPosition(x, y);

    setSelectedBlockId(blockId);
    setPageStyleMenu(null);
    setBlockStyleMenu({ blockId, ...menuPosition });
  };

  const handleOpenPageStyleMenu = (x: number, y: number) => {
    if (isNetworkPreview) {
      return;
    }

    const menuPosition = getCanvasMenuPosition(x, y);

    setBlockStyleMenu(null);
    setPageStyleMenu(menuPosition);
  };

  const getCanvasMenuPosition = (clientX: number, clientY: number) => {
    const shell = canvasShellRef.current;

    if (!shell) {
      return { x: clientX, y: clientY };
    }

    const rect = shell.getBoundingClientRect();
    const rawX = clientX - rect.left + shell.scrollLeft;
    const rawY = clientY - rect.top + shell.scrollTop;
    const minX = shell.scrollLeft + STYLE_MENU_VISIBLE_GUTTER;
    const maxX = shell.scrollLeft + shell.clientWidth - STYLE_MENU_WIDTH - STYLE_MENU_VISIBLE_GUTTER;
    const minY = shell.scrollTop + STYLE_MENU_VISIBLE_GUTTER;
    const maxY = shell.scrollTop + shell.clientHeight - STYLE_MENU_VISIBLE_GUTTER;

    return {
      x: clampMenuCoordinate(rawX, minX, maxX),
      y: clampMenuCoordinate(rawY, minY, maxY),
    };
  };

  const handleUpdateBlockAppearance = (block: TemplateBlock, appearance: Record<string, unknown>) => {
    if (isNetworkPreview) {
      return;
    }

    updateBlockTypeProps(block.type, {
      appearance: {
        ...(typeof block.props.appearance === 'object' && block.props.appearance !== null && !Array.isArray(block.props.appearance)
          ? block.props.appearance
          : {}),
        ...appearance,
      },
    });
  };

  const handleUpdatePageAppearance = (appearance: Record<string, unknown>) => {
    if (isNetworkPreview) {
      return;
    }

    setPageAppearance((current) => ({
      ...current,
      ...appearance,
    }));
  };

  return (
    <div className="editor-page template-builder-page">
      <AppTopNav
        active={isNetworkPreview ? 'network' : 'templates'}
        actionLabel={isNetworkPreview ? 'Import Template' : 'Save Draft'}
        actionStatus={syncStatus}
        searchPlaceholder="Search blocks..."
        onActionClick={handleSyncTemplate}
      />

      <main className="template-builder-main">
        <aside className="template-builder-rail">
          <div className="template-builder-rail__workspace">
            <div className="template-builder-rail__icon">
              <Icon name="dashboard_customize" />
            </div>
            <div>
              <strong>{layout.name}</strong>
              <span>{layout.metadata.browserMappingKey}</span>
            </div>
          </div>

          <section className="template-builder-rail__section">
            <p>Source Template</p>
            <div className="source-template-card">
              <strong>{networkRecord?.name ?? templateRecord.name}</strong>
              <span>{networkRecord?.owner ?? templateRecord.owner}</span>
            </div>
          </section>

          <section className="template-builder-rail__section">
            <p>Screens</p>
            <div className="screen-list">
              {layout.screens.map((screen) => (
                <button
                  className={screen.id === layout.activeScreenId ? 'is-active' : ''}
                  key={screen.id}
                  type="button"
                  onClick={() => {
                    setActiveScreen(screen.id);
                    setSelectedBlockId('');
                  }}
                >
                  <Icon name="web_asset" />
                  <span>{screen.name}</span>
                  <em>{screen.providerRoute}</em>
                </button>
              ))}
            </div>
          </section>

          <section className="template-builder-rail__section">
            <p>Regions</p>
            <div className="region-list">
              {layout.regions.map((region) => {
                const blocks = blocksByRegion[region];
                const enabledBlocks = blocks.filter((block) => block.visible).length;

                return (
                  <button key={region} type="button">
                    <Icon name={regionIcons[region]} />
                    <span>{regionLabels[region]}</span>
                    <em>
                      {enabledBlocks}/{blocks.length}
                    </em>
                  </button>
                );
              })}
            </div>
          </section>

          <section className="template-builder-rail__section">
            <p>State</p>
            <div className="layout-state-summary">
              <span>{isNetworkPreview ? 'Read-only Network preview' : layout.source === 'user' ? 'Draft edited' : 'Default loaded'}</span>
              <strong>{visibleCount} visible blocks</strong>
            </div>
          </section>
        </aside>

        <section
          className="template-builder-canvas-shell"
          onWheel={handleCanvasWheel}
          ref={canvasShellRef}
        >
          <div className="template-builder-canvas-header">
            <div>
              <span>{activeScreen?.providerRoute ?? layout.metadata.browserMappingKey}</span>
              <h1>{activeScreen?.description ?? layout.description}</h1>
            </div>
            <div className="template-builder-canvas-header__meta">
              <span>{activeScreen?.name ?? 'Screen'}</span>
              <span>v{layout.version}</span>
            </div>
          </div>

          <div
            className="template-canvas-zoom-layer"
            style={{ '--template-canvas-zoom': canvasZoom } as CSSProperties}
          >
            <TemplateLayoutCanvas
              blocksByRegion={blocksByRegion}
              columnLayout={columnLayout}
              onOpenBlockMenu={handleOpenBlockStyleMenu}
              onOpenPageMenu={handleOpenPageStyleMenu}
              onSelectBlock={setSelectedBlockId}
              pageAppearance={pageAppearance}
              screen={activeScreen}
              selectedBlockId={selectedBlockId}
              variationId={selectedVariationId}
            />
          </div>

          {blockStyleMenu && styleMenuBlock ? (
            <div
              className="block-style-menu"
              ref={styleMenuRef}
              style={{ left: blockStyleMenu.x, top: blockStyleMenu.y } as CSSProperties}
            >
              <div className="block-style-menu__header">
                <span>Style</span>
                <strong>{styleMenuBlock.title}</strong>
                <button aria-label="Close style menu" type="button" onClick={() => setBlockStyleMenu(null)}>
                  <Icon name="close" />
                </button>
              </div>
              <p>Applied to matching {styleMenuBlock.type} blocks.</p>
              <BlockStyleMenuControls
                block={styleMenuBlock}
                onChange={(appearance) => handleUpdateBlockAppearance(styleMenuBlock, appearance)}
              />
            </div>
          ) : null}

          {pageStyleMenu ? (
            <div
              className="block-style-menu block-style-menu--page"
              ref={styleMenuRef}
              style={{ left: pageStyleMenu.x, top: pageStyleMenu.y } as CSSProperties}
            >
              <div className="block-style-menu__header">
                <span>Page Style</span>
                <strong>GitHub Home background</strong>
                <button aria-label="Close page style menu" type="button" onClick={() => setPageStyleMenu(null)}>
                  <Icon name="close" />
                </button>
              </div>
              <p>Applied to the GitHub Home page background.</p>
              <PageStyleMenuControls pageAppearance={pageAppearance} onChange={handleUpdatePageAppearance} />
            </div>
          ) : null}

          <div className="template-canvas-controls" aria-label="Canvas controls">
            <button
              aria-label="Zoom out"
              type="button"
              onClick={() => updateCanvasZoom(canvasZoom - CANVAS_ZOOM_STEP)}
            >
              <Icon name="zoom_out" />
            </button>
            <strong>{Math.round(canvasZoom * 100)}%</strong>
            <button
              aria-label="Zoom in"
              type="button"
              onClick={() => updateCanvasZoom(canvasZoom + CANVAS_ZOOM_STEP)}
            >
              <Icon name="zoom_in" />
            </button>
            <span aria-hidden="true" />
            <button aria-label="Reset zoom" type="button" onClick={() => updateCanvasZoom(1)}>
              <Icon name="restart_alt" />
            </button>
          </div>
        </section>

        {isNetworkPreview ? (
          <NetworkCommunityPanel
            layout={layout}
            record={networkRecord}
            variationId={selectedVariationId}
            visibleCount={visibleCount}
            onImport={handleImportNetworkTemplate}
            onToggleLike={handleToggleNetworkLike}
          />
        ) : (
          <TemplateEditPanel
            layout={layout}
            columnLayout={columnLayout}
            leftSidebarResizeEnabled={leftSidebarResizeEnabled}
            onChangeColumnLayout={setColumnLayout}
            onMoveBlock={moveBlock}
            onReset={handleReset}
            onSelectBlock={setSelectedBlockId}
            onSelectVariation={setSelectedVariationId}
            onUpdateBlock={updateBlock}
            onUpdateBlockProps={updateBlockProps}
            onToggleLeftSidebarResize={() => setLeftSidebarResizeEnabled((enabled) => !enabled)}
            onToggleBlock={toggleBlockVisibility}
            selectedBlockId={selectedBlockId}
            selectedVariationId={selectedVariationId}
            serializedLayout={serializedTemplateState}
            variations={githubSafeVariations}
          />
        )}
      </main>
    </div>
  );
}

function NetworkCommunityPanel({
  layout,
  record,
  variationId,
  visibleCount,
  onImport,
  onToggleLike,
}: {
  layout: TemplateLayout;
  record: TemplateRecord | null;
  variationId: TemplateVariationId;
  visibleCount: number;
  onImport: () => void;
  onToggleLike: () => void;
}) {
  const liked = Boolean(record?.likedByCurrentUser);
  const likeCount = record?.likeCount ?? 0;
  const viewCount = record?.viewCount ?? 0;
  const importCount = record?.importCount ?? 0;

  return (
    <aside className="network-community-panel">
      <div className="network-community-panel__header">
        <span>Network Template</span>
        <strong>{record?.name ?? layout.name}</strong>
        <p>{record?.description ?? layout.description}</p>
      </div>

      <section className="network-community-panel__section">
        <p>Community</p>
        <div className="network-stat-grid">
          <div>
            <Icon name="star" />
            <strong>{likeCount}</strong>
            <span>Likes</span>
          </div>
          <div>
            <Icon name="visibility" />
            <strong>{viewCount}</strong>
            <span>Views</span>
          </div>
          <div>
            <Icon name="content_copy" />
            <strong>{importCount}</strong>
            <span>Imports</span>
          </div>
        </div>
      </section>

      <section className="network-community-panel__section">
        <p>Actions</p>
        <div className="network-action-row">
          <button className={liked ? 'is-active' : ''} type="button" onClick={onToggleLike}>
            <Icon name="star" />
            <span>{liked ? 'Liked' : 'Like'}</span>
          </button>
          <button type="button" onClick={onImport}>
            <Icon name="content_copy" />
            <span>Import</span>
          </button>
        </div>
      </section>

      <section className="network-community-panel__section">
        <p>Publisher</p>
        <div className="network-publisher-card">
          <div>{(record?.publisherName ?? record?.owner ?? 'R').slice(0, 1).toUpperCase()}</div>
          <span>
            <strong>{record?.publisherName ?? record?.owner ?? 'Reflow Network'}</strong>
            <em>{formatPublishedDate(record?.publishedAt)}</em>
          </span>
        </div>
      </section>

      <section className="network-community-panel__section">
        <p>Template Signals</p>
        <div className="network-signal-list">
          <span>
            <strong>{visibleCount}</strong>
            visible blocks
          </span>
          <span>
            <strong>{variationId}</strong>
            variation
          </span>
          <span>
            <strong>{layout.metadata.browserMappingKey}</strong>
            mapping
          </span>
        </div>
      </section>
    </aside>
  );
}

function getAppearanceValue(block: TemplateBlock, key: string, fallback: string | number) {
  const appearance = block.props.appearance;

  if (!appearance || typeof appearance !== 'object' || Array.isArray(appearance)) {
    return fallback;
  }

  const value = (appearance as Record<string, unknown>)[key];

  if (typeof fallback === 'number') {
    const numericValue = Number(value);

    return Number.isFinite(numericValue) ? numericValue : fallback;
  }

  return typeof value === 'string' ? value : fallback;
}

function BlockStyleMenuControls({
  block,
  onChange,
}: {
  block: TemplateBlock;
  onChange: (appearance: Record<string, unknown>) => void;
}) {
  const backgroundColor = getAppearanceValue(block, 'backgroundColor', '#ffffff') as string;
  const innerBackgroundColor = getAppearanceValue(block, 'innerBackgroundColor', '#ffffff') as string;
  const textColor = getAppearanceValue(block, 'textColor', '#1f2328') as string;
  const linkColor = getAppearanceValue(block, 'linkColor', '#0969da') as string;
  const marginY = getAppearanceValue(block, 'marginY', 0) as number;
  const padding = getAppearanceValue(block, 'padding', 0) as number;
  const elementGap = getAppearanceValue(block, 'elementGap', 8) as number;
  const borderRadius = getAppearanceValue(block, 'borderRadius', 6) as number;
  const fontFamily = getAppearanceValue(block, 'fontFamily', '-apple-system, BlinkMacSystemFont, Segoe UI, sans-serif') as string;
  const fontSize = getAppearanceValue(block, 'fontSize', 14) as number;

  return (
    <div className="block-style-menu__controls">
      <label>
        <span>Outer bg</span>
        <input
          type="color"
          value={backgroundColor}
          onChange={(event) => onChange({ backgroundColor: event.target.value })}
        />
      </label>
      <label>
        <span>Inner bg</span>
        <input
          type="color"
          value={innerBackgroundColor}
          onChange={(event) => onChange({ innerBackgroundColor: event.target.value })}
        />
      </label>
      <label>
        <span>Text</span>
        <input
          type="color"
          value={textColor}
          onChange={(event) => onChange({ textColor: event.target.value })}
        />
      </label>
      <label>
        <span>Link</span>
        <input
          type="color"
          value={linkColor}
          onChange={(event) => onChange({ linkColor: event.target.value })}
        />
      </label>
      <label>
        <span>Margin</span>
        <input
          max={48}
          min={0}
          type="number"
          value={marginY}
          onChange={(event) => onChange({ marginY: Math.max(0, Math.min(48, Number(event.target.value) || 0)) })}
        />
      </label>
      <label>
        <span>Padding</span>
        <input
          max={48}
          min={0}
          type="number"
          value={padding}
          onChange={(event) => onChange({ padding: Math.max(0, Math.min(48, Number(event.target.value) || 0)) })}
        />
      </label>
      <label>
        <span>Gap</span>
        <input
          max={32}
          min={0}
          type="number"
          value={elementGap}
          onChange={(event) => onChange({ elementGap: Math.max(0, Math.min(32, Number(event.target.value) || 0)) })}
        />
      </label>
      <label>
        <span>Round</span>
        <input
          max={32}
          min={0}
          type="number"
          value={borderRadius}
          onChange={(event) => onChange({ borderRadius: Math.max(0, Math.min(32, Number(event.target.value) || 0)) })}
        />
      </label>
      <label>
        <span>Font</span>
        <select value={fontFamily} onChange={(event) => onChange({ fontFamily: event.target.value })}>
          <option value="-apple-system, BlinkMacSystemFont, Segoe UI, sans-serif">System</option>
          <option value="Arial, sans-serif">Arial</option>
          <option value="Georgia, serif">Georgia</option>
          <option value="ui-monospace, SFMono-Regular, Menlo, monospace">Mono</option>
        </select>
      </label>
      <label>
        <span>Font size</span>
        <input
          max={24}
          min={10}
          type="number"
          value={fontSize}
          onChange={(event) => onChange({ fontSize: Math.max(10, Math.min(24, Number(event.target.value) || 14)) })}
        />
      </label>
    </div>
  );
}

function PageStyleMenuControls({
  pageAppearance,
  onChange,
}: {
  pageAppearance: Record<string, unknown>;
  onChange: (appearance: Record<string, unknown>) => void;
}) {
  const pageBackgroundColor =
    typeof pageAppearance.backgroundColor === 'string' ? pageAppearance.backgroundColor : '#f6f8fa';
  const leftSidebarBackgroundColor =
    typeof pageAppearance.leftSidebarBackgroundColor === 'string'
      ? pageAppearance.leftSidebarBackgroundColor
      : '#ffffff';

  return (
    <div className="block-style-menu__controls block-style-menu__controls--page">
      <label>
        <span>Page bg</span>
        <input
          type="color"
          value={pageBackgroundColor}
          onChange={(event) => onChange({ backgroundColor: event.target.value })}
        />
      </label>
      <label>
        <span>Left panel bg</span>
        <input
          type="color"
          value={leftSidebarBackgroundColor}
          onChange={(event) => onChange({ leftSidebarBackgroundColor: event.target.value })}
        />
      </label>
    </div>
  );
}
