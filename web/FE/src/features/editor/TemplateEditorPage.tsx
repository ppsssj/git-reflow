import type { CSSProperties, WheelEvent } from 'react';
import { useEffect, useMemo, useRef, useState } from 'react';
import { useParams } from 'react-router-dom';
import { AppTopNav } from '../../components/layout/AppTopNav';
import { Icon } from '../../components/ui/Icon';
import { templates } from '../../mocks/templates';
import type { TemplateRegion } from '../../types/template';
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
    serializedLayout,
    setActiveScreen,
    toggleBlockVisibility,
    moveBlock,
    resetLayout,
  } = useTemplateLayout(defaultGithubTemplate);
  const [selectedBlockId, setSelectedBlockId] = useState('');
  const [canvasZoom, setCanvasZoom] = useState(1);
  const canvasShellRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    if (selectedBlockId && !layout.blocks.some((block) => block.id === selectedBlockId)) {
      setSelectedBlockId(layout.blocks[0]?.id ?? '');
    }
  }, [layout.blocks, selectedBlockId]);

  const visibleCount = useMemo(
    () =>
      layout.blocks.filter(
        (block) =>
          block.visible && (block.screenId ?? layout.screens[0]?.id ?? layout.activeScreenId) === layout.activeScreenId,
      ).length,
    [layout.activeScreenId, layout.blocks, layout.screens],
  );

  const handleReset = () => {
    resetLayout();
    setSelectedBlockId('');
  };

  const updateCanvasZoom = (nextZoom: number) => {
    setCanvasZoom(clampCanvasZoom(nextZoom));
  };

  const handleCanvasWheel = (event: WheelEvent<HTMLElement>) => {
    if (event.ctrlKey || event.metaKey) {
      event.preventDefault();

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
      event.preventDefault();
      const dominantDelta = Math.abs(event.deltaY) >= Math.abs(event.deltaX) ? event.deltaY : event.deltaX;
      event.currentTarget.scrollLeft += dominantDelta;
    }
  };

  return (
    <div className="editor-page template-builder-page">
      <AppTopNav active="templates" actionLabel="Save Draft" searchPlaceholder="Search blocks..." />

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
              onSelectBlock={setSelectedBlockId}
              screen={activeScreen}
              selectedBlockId={selectedBlockId}
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
          onMoveBlock={moveBlock}
          onReset={handleReset}
          onSelectBlock={setSelectedBlockId}
          onToggleBlock={toggleBlockVisibility}
          selectedBlockId={selectedBlockId}
          serializedLayout={serializedLayout}
        />
      </main>
    </div>
  );
}
