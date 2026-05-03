import type { CSSProperties, WheelEvent } from 'react';
import { useEffect, useMemo, useRef, useState } from 'react';
import { useParams } from 'react-router-dom';
import { AppTopNav } from '../../components/layout/AppTopNav';
import { Icon } from '../../components/ui/Icon';
import { API_BASE_URL, apiGet } from '../../lib/api';
import { templates } from '../../mocks/templates';
import type {
  ExtensionTemplatePayload,
  TemplateColumnLayout,
  TemplateRegion,
  TemplateVariation,
  TemplateVariationId,
} from '../../types/template';
import { TemplateEditPanel } from './TemplateEditPanel';
import { TemplateLayoutCanvas } from './TemplateLayoutCanvas';
import { defaultGithubTemplate } from './templates/defaultGithubTemplate';
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

function clampCanvasZoom(value: number) {
  return Math.min(MAX_CANVAS_ZOOM, Math.max(MIN_CANVAS_ZOOM, value));
}

export function TemplateEditorPage() {
  const { templateId } = useParams();
  const templateRecord = templates.find((item) => item.id === templateId) ?? templates[0];
  const {
    layout,
    activeScreen,
    blocksByRegion,
    setActiveScreen,
    toggleBlockVisibility,
    moveBlock,
    replaceLayout,
    resetLayout,
  } = useTemplateLayout(defaultGithubTemplate);
  const [selectedBlockId, setSelectedBlockId] = useState('');
  const [canvasZoom, setCanvasZoom] = useState(1);
  const [columnLayout, setColumnLayout] = useState<TemplateColumnLayout>(DEFAULT_COLUMN_LAYOUT);
  const [leftSidebarResizeEnabled, setLeftSidebarResizeEnabled] = useState(true);
  const [selectedVariationId, setSelectedVariationId] = useState<TemplateVariationId>('github-default');
  const [syncStatus, setSyncStatus] = useState('Not synced');
  const canvasShellRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    if (selectedBlockId && !layout.blocks.some((block) => block.id === selectedBlockId)) {
      setSelectedBlockId(layout.blocks[0]?.id ?? '');
    }
  }, [layout.blocks, selectedBlockId]);

  useEffect(() => {
    if (!templateId) {
      return;
    }

    if (templateId === defaultGithubTemplate.id) {
      replaceLayout(defaultGithubTemplate);
      setColumnLayout(DEFAULT_COLUMN_LAYOUT);
      setLeftSidebarResizeEnabled(true);
      setSelectedVariationId('github-default');
      setSyncStatus('Loaded default template');
      return;
    }

    let cancelled = false;

    apiGet<ExtensionTemplatePayload>(`/api/templates/${encodeURIComponent(templateId)}`)
      .then((template) => {
        if (cancelled) {
          return;
        }

        replaceLayout(template);
        setColumnLayout(template.columnLayout ?? DEFAULT_COLUMN_LAYOUT);
        setLeftSidebarResizeEnabled(template.leftSidebarResizeEnabled !== false);
        setSelectedVariationId(template.selectedVariationId ?? 'github-default');
        setSyncStatus('Loaded saved template');
      })
      .catch(() => {
        if (!cancelled) {
          setSyncStatus('Using local fallback');
        }
      });

    return () => {
      cancelled = true;
    };
  }, [replaceLayout, templateId]);

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
        },
        null,
        2,
      ),
    [layout, columnLayout, leftSidebarResizeEnabled, selectedVariationId],
  );

  const handleReset = () => {
    resetLayout();
    setSelectedBlockId('');
    setColumnLayout(DEFAULT_COLUMN_LAYOUT);
    setLeftSidebarResizeEnabled(true);
    setSelectedVariationId('github-default');
  };

  const handleSyncTemplate = async () => {
    if (templateId === defaultGithubTemplate.id) {
      setSyncStatus('Create a named template before saving');
      return;
    }

    setSyncStatus('Syncing...');

    try {
      const response = await fetch(`${API_BASE_URL}/api/templates/github-home`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: serializedTemplateState,
      });

      if (!response.ok) {
        const result = await response.json().catch(() => null);
        throw new Error(result?.error ?? `Sync failed with ${response.status}`);
      }

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

  return (
    <div className="editor-page template-builder-page">
      <AppTopNav
        active="templates"
        actionLabel="Save Draft"
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
              <strong>{templateRecord.name}</strong>
              <span>{templateRecord.owner}</span>
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
              <span>{layout.source === 'user' ? 'Draft edited' : 'Default loaded'}</span>
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
              onSelectBlock={setSelectedBlockId}
              screen={activeScreen}
              selectedBlockId={selectedBlockId}
              variationId={selectedVariationId}
            />
          </div>

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

        <TemplateEditPanel
          layout={layout}
          columnLayout={columnLayout}
          leftSidebarResizeEnabled={leftSidebarResizeEnabled}
          onChangeColumnLayout={setColumnLayout}
          onMoveBlock={moveBlock}
          onReset={handleReset}
          onSelectBlock={setSelectedBlockId}
          onSelectVariation={setSelectedVariationId}
          onToggleLeftSidebarResize={() => setLeftSidebarResizeEnabled((enabled) => !enabled)}
          onToggleBlock={toggleBlockVisibility}
          selectedBlockId={selectedBlockId}
          selectedVariationId={selectedVariationId}
          serializedLayout={serializedTemplateState}
          variations={githubSafeVariations}
        />
      </main>
    </div>
  );
}
