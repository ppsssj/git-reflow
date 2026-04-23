import { Icon } from '../../components/ui/Icon';
import type { TemplateBlock, TemplateLayout, TemplateRegion } from '../../types/template';

interface TemplateEditPanelProps {
  layout: TemplateLayout;
  selectedBlockId: string;
  serializedLayout: string;
  onSelectBlock: (blockId: string) => void;
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
  selectedBlockId,
  serializedLayout,
  onSelectBlock,
  onToggleBlock,
  onMoveBlock,
  onReset,
}: TemplateEditPanelProps) {
  const selectedBlock = layout.blocks.find((block) => block.id === selectedBlockId) ?? layout.blocks[0];

  if (!selectedBlock) {
    return null;
  }

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
