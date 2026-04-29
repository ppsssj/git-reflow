import type { CSSProperties, PointerEvent } from 'react';
import { Icon } from '../../components/ui/Icon';
import type {
  TemplateBlock,
  TemplateColumnLayout,
  TemplateLayout,
  TemplateRegion,
  TemplateVariation,
  TemplateVariationId,
} from '../../types/template';

interface TemplateEditPanelProps {
  layout: TemplateLayout;
  selectedBlockId: string;
  serializedLayout: string;
  selectedVariationId: TemplateVariationId;
  columnLayout: TemplateColumnLayout;
  leftSidebarResizeEnabled: boolean;
  variations: TemplateVariation[];
  onChangeColumnLayout: (layout: TemplateColumnLayout) => void;
  onToggleLeftSidebarResize: () => void;
  onSelectBlock: (blockId: string) => void;
  onSelectVariation: (variationId: TemplateVariationId) => void;
  onToggleBlock: (blockId: string) => void;
  onMoveBlock: (blockId: string, direction: 'up' | 'down') => void;
  onReset: () => void;
}

const regionLabels: Record<TemplateRegion, string> = {
  topbar: 'Topbar',
  'left-sidebar': 'Left sidebar',
  'main-feed': 'Main feed',
  'right-sidebar': 'Right sidebar',
};

const COLUMN_MIN_WIDTHS: TemplateColumnLayout = {
  left: 220,
  main: 640,
  right: 240,
};

const COLUMN_MAX_WIDTHS: TemplateColumnLayout = {
  left: 420,
  main: 1120,
  right: 420,
};

function clampColumnWidth(region: keyof TemplateColumnLayout, value: number) {
  return Math.min(COLUMN_MAX_WIDTHS[region], Math.max(COLUMN_MIN_WIDTHS[region], value));
}

function getBlockScreenId(layout: TemplateLayout, block: TemplateBlock) {
  return block.screenId ?? layout.screens[0]?.id ?? layout.activeScreenId;
}

function getRegionBlocks(layout: TemplateLayout, region: TemplateRegion) {
  return layout.blocks.filter((block) => block.region === region && getBlockScreenId(layout, block) === layout.activeScreenId);
}

function getMoveState(layout: TemplateLayout, block: TemplateBlock) {
  const regionBlocks = getRegionBlocks(layout, block.region);
  const regionIndex = regionBlocks.findIndex((item) => item.id === block.id);

  return {
    canMoveUp: regionIndex > 0,
    canMoveDown: regionIndex < regionBlocks.length - 1,
  };
}

export function TemplateEditPanel({
  layout,
  columnLayout,
  leftSidebarResizeEnabled,
  selectedBlockId,
  selectedVariationId,
  serializedLayout,
  variations,
  onChangeColumnLayout,
  onToggleLeftSidebarResize,
  onSelectBlock,
  onSelectVariation,
  onToggleBlock,
  onMoveBlock,
  onReset,
}: TemplateEditPanelProps) {
  const selectedBlock = layout.blocks.find((block) => block.id === selectedBlockId) ?? layout.blocks[0];

  if (!selectedBlock) {
    return null;
  }

  const totalColumnWidth = columnLayout.left + columnLayout.main + columnLayout.right;
  const columnTemplate = `${columnLayout.left}fr ${columnLayout.main}fr ${columnLayout.right}fr`;
  const columnMapStyle = {
    '--column-left-ratio': columnLayout.left / totalColumnWidth,
    '--column-main-boundary-ratio': (columnLayout.left + columnLayout.main) / totalColumnWidth,
    gridTemplateColumns: columnTemplate,
  } as CSSProperties;

  const handleColumnInput = (region: keyof TemplateColumnLayout, value: string) => {
    onChangeColumnLayout({
      ...columnLayout,
      [region]: clampColumnWidth(region, Number(value) || COLUMN_MIN_WIDTHS[region]),
    });
  };

  const handleColumnDragStart = (
    boundary: 'left-main' | 'main-right',
    event: PointerEvent<HTMLButtonElement>,
  ) => {
    const map = event.currentTarget.closest('.column-layout-map');

    if (!(map instanceof HTMLElement)) {
      return;
    }

    event.preventDefault();
    event.stopPropagation();

    const pointerId = event.pointerId;
    const startX = event.clientX;
    const startLayout = { ...columnLayout };
    const mapWidth = map.getBoundingClientRect().width;
    const pxPerScreenPixel = totalColumnWidth / mapWidth;

    event.currentTarget.setPointerCapture(pointerId);
    document.body.classList.add('is-dragging-column-layout');

    const handlePointerMove = (moveEvent: globalThis.PointerEvent) => {
      const delta = Math.round((moveEvent.clientX - startX) * pxPerScreenPixel);

      if (boundary === 'left-main') {
        const nextLeft = clampColumnWidth('left', startLayout.left + delta);
        const appliedDelta = nextLeft - startLayout.left;
        const nextMain = clampColumnWidth('main', startLayout.main - appliedDelta);

        onChangeColumnLayout({
          ...startLayout,
          left: nextLeft,
          main: nextMain,
        });
        return;
      }

      const nextMain = clampColumnWidth('main', startLayout.main + delta);
      const appliedDelta = nextMain - startLayout.main;
      const nextRight = clampColumnWidth('right', startLayout.right - appliedDelta);

      onChangeColumnLayout({
        ...startLayout,
        main: nextMain,
        right: nextRight,
      });
    };

    const handlePointerUp = () => {
      document.body.classList.remove('is-dragging-column-layout');
      window.removeEventListener('pointermove', handlePointerMove);
      window.removeEventListener('pointerup', handlePointerUp);
      window.removeEventListener('pointercancel', handlePointerUp);
    };

    window.addEventListener('pointermove', handlePointerMove);
    window.addEventListener('pointerup', handlePointerUp);
    window.addEventListener('pointercancel', handlePointerUp);
  };

  return (
    <aside className="layout-edit-panel">
      <div className="layout-edit-panel__header">
        <div>
          <span>Layout Builder</span>
          <strong>{layout.name}</strong>
        </div>
        <button type="button" onClick={onReset}>
          <Icon name="restart_alt" />
          Reset
        </button>
      </div>

      <section className="layout-edit-panel__section">
        <p>Blocks</p>
        <div className="block-control-groups">
          {layout.regions.map((region) => (
            <div className="block-control-group" key={region}>
              <h2>{regionLabels[region]}</h2>
              {getRegionBlocks(layout, region).map((block) => {
                const { canMoveDown, canMoveUp } = getMoveState(layout, block);

                return (
                  <div
                    className={['block-control-row', block.id === selectedBlockId ? 'is-selected' : '']
                      .join(' ')
                      .trim()}
                    key={block.id}
                  >
                    <button
                      className="block-control-row__select"
                      type="button"
                      onClick={() => onSelectBlock(block.id)}
                    >
                      <Icon name={block.visible ? 'check_box' : 'check_box_outline_blank'} />
                      <span>{block.title}</span>
                    </button>
                    <div className="block-control-row__actions">
                      <button
                        aria-label={`${block.visible ? 'Hide' : 'Show'} ${block.title}`}
                        aria-pressed={block.visible}
                        type="button"
                        onClick={() => onToggleBlock(block.id)}
                      >
                        <Icon name={block.visible ? 'visibility' : 'visibility_off'} />
                      </button>
                      <button
                        aria-label={`Move ${block.title} up`}
                        disabled={!canMoveUp}
                        type="button"
                        onClick={() => onMoveBlock(block.id, 'up')}
                      >
                        <Icon name="keyboard_arrow_up" />
                      </button>
                      <button
                        aria-label={`Move ${block.title} down`}
                        disabled={!canMoveDown}
                        type="button"
                        onClick={() => onMoveBlock(block.id, 'down')}
                      >
                        <Icon name="keyboard_arrow_down" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          ))}
        </div>
      </section>

      <section className="layout-edit-panel__section">
        <p>GitHub-safe Variations</p>
        <div className="variation-list">
          {variations.map((variation) => (
            <button
              className={variation.id === selectedVariationId ? 'is-active' : ''}
              key={variation.id}
              type="button"
              onClick={() => onSelectVariation(variation.id)}
            >
              <span>
                <strong>{variation.title}</strong>
                <em>{variation.description}</em>
              </span>
              <small>{variation.githubConstraint}</small>
            </button>
          ))}
        </div>
      </section>

      <section className="layout-edit-panel__section">
        <p>GitHub-safe Controls</p>
        <div className="column-layout-control">
          <div className="column-layout-map" style={columnMapStyle}>
            <div className="column-layout-map__region is-left">
              <span>Left</span>
            </div>
            <button
              aria-label="Resize left and main columns"
              className="column-layout-map__handle is-left-main"
              type="button"
              onPointerDown={(event) => handleColumnDragStart('left-main', event)}
            />
            <div className="column-layout-map__region is-main">
              <span>Main</span>
            </div>
            <button
              aria-label="Resize main and right columns"
              className="column-layout-map__handle is-main-right"
              type="button"
              onPointerDown={(event) => handleColumnDragStart('main-right', event)}
            />
            <div className="column-layout-map__region is-right">
              <span>Right</span>
            </div>
          </div>
          <div className="column-layout-inputs">
            {(['left', 'main', 'right'] as Array<keyof TemplateColumnLayout>).map((region) => (
              <label key={region}>
                <span>{region}</span>
                <input
                  max={COLUMN_MAX_WIDTHS[region]}
                  min={COLUMN_MIN_WIDTHS[region]}
                  type="number"
                  value={columnLayout[region]}
                  onChange={(event) => handleColumnInput(region, event.target.value)}
                />
              </label>
            ))}
          </div>
        </div>
        <label className="controller-toggle">
          <input
            checked={leftSidebarResizeEnabled}
            type="checkbox"
            onChange={onToggleLeftSidebarResize}
          />
          <span>
            <strong>Left sidebar resize controller</strong>
            <em>Show a drag handle on the live GitHub page.</em>
          </span>
        </label>
      </section>

      <section className="layout-edit-panel__section">
        <p>Selected Block</p>
        <dl className="selected-block-meta">
          <div>
            <dt>Type</dt>
            <dd>{selectedBlock.type}</dd>
          </div>
          <div>
            <dt>Region</dt>
            <dd>{regionLabels[selectedBlock.region]}</dd>
          </div>
          <div>
            <dt>Slot</dt>
            <dd>{selectedBlock.extensionSlot}</dd>
          </div>
          <div>
            <dt>Visible</dt>
            <dd>{selectedBlock.visible ? 'Yes' : 'No'}</dd>
          </div>
        </dl>
      </section>

      <section className="layout-edit-panel__section">
        <p>Persist Later</p>
        <textarea aria-label="Serialized template layout" readOnly value={serializedLayout} />
      </section>
    </aside>
  );
}
