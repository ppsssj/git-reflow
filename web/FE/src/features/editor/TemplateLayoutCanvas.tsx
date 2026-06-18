import { useState } from 'react';
import type { CSSProperties, MouseEvent } from 'react';
import { Icon } from '../../components/ui/Icon';
import type { TemplateBlock, TemplateColumnLayout, TemplateRegion } from '../../types/template';
import type { TemplateScreen } from '../../types/template';
import type { TemplateVariationId } from '../../types/template';
import { githubBlockRegistry } from './blocks/GithubTemplateBlocks';

interface TemplateLayoutCanvasProps {
  blocksByRegion: Record<TemplateRegion, TemplateBlock[]>;
  screen?: TemplateScreen;
  selectedBlockId: string;
  columnLayout: TemplateColumnLayout;
  variationId: TemplateVariationId;
  pageAppearance?: Record<string, unknown>;
  onSelectBlock: (blockId: string) => void;
  onOpenBlockMenu: (blockId: string, x: number, y: number) => void;
  onOpenPageMenu: (x: number, y: number) => void;
  onMoveBlock: (blockId: string, direction: 'up' | 'down') => void;
  onMoveBlockToRegion: (blockId: string, region: TemplateRegion) => void;
  onToggleBlock: (blockId: string) => void;
  readOnly?: boolean;
}

const regionLabels: Record<TemplateRegion, string> = {
  topbar: 'Topbar',
  'left-sidebar': 'Left sidebar',
  'main-feed': 'Main feed',
  'right-sidebar': 'Right sidebar',
};

const regionShortLabels: Record<TemplateRegion, string> = {
  topbar: 'Top',
  'left-sidebar': 'Left',
  'main-feed': 'Main',
  'right-sidebar': 'Right',
};

const editorRegions: TemplateRegion[] = ['topbar', 'left-sidebar', 'main-feed', 'right-sidebar'];
const BACKGROUND_IMAGE_FRAME_WIDTH = 1120;
const BACKGROUND_IMAGE_FRAME_HEIGHT = 760;

function getPageAppearanceString(pageAppearance: Record<string, unknown> | undefined, key: string) {
  const value = pageAppearance?.[key];
  return typeof value === 'string' && value.trim() ? value.trim() : undefined;
}

function getCssImageUrl(value: string | undefined) {
  if (!value) {
    return undefined;
  }

  return `url("${value.replace(/"/g, '\\"')}")`;
}

function getBackgroundImageLayerStyle(position: string | undefined, size: string | undefined): CSSProperties {
  const widthMatch = size?.match(/^(\d+)px\s+auto$/);
  const width = widthMatch ? Number(widthMatch[1]) : 420;
  const pixelPositionMatch = position?.match(/^(-?\d+(?:\.\d+)?)px\s+(-?\d+(?:\.\d+)?)px$/);
  const x = pixelPositionMatch ? Number(pixelPositionMatch[1]) : (BACKGROUND_IMAGE_FRAME_WIDTH - width) / 2;
  const y = pixelPositionMatch ? Number(pixelPositionMatch[2]) : 120;

  return {
    left: `${(x / BACKGROUND_IMAGE_FRAME_WIDTH) * 100}%`,
    top: `${(y / BACKGROUND_IMAGE_FRAME_HEIGHT) * 100}%`,
    width: `${(width / BACKGROUND_IMAGE_FRAME_WIDTH) * 100}%`,
  };
}

function RenderBlock({
  block,
  selectedBlockId,
  onSelectBlock,
  onOpenBlockMenu,
  onMoveBlock,
  onMoveBlockToRegion,
  onToggleBlock,
  readOnly = false,
}: {
  block: TemplateBlock;
  selectedBlockId: string;
  onSelectBlock: (blockId: string) => void;
  onOpenBlockMenu: (blockId: string, x: number, y: number) => void;
  onMoveBlock: (blockId: string, direction: 'up' | 'down') => void;
  onMoveBlockToRegion: (blockId: string, region: TemplateRegion) => void;
  onToggleBlock: (blockId: string) => void;
  readOnly?: boolean;
}) {
  const BlockComponent = githubBlockRegistry[block.type];
  const isSelected = block.id === selectedBlockId;

  const openStyleMenu = (event: MouseEvent<HTMLButtonElement>) => {
    event.stopPropagation();
    const rect = event.currentTarget.getBoundingClientRect();
    onOpenBlockMenu(block.id, rect.left, rect.bottom);
  };

  if (!block.visible) {
    return null;
  }

  return (
    <div
      className={['github-block-frame', isSelected ? 'is-selected' : ''].filter(Boolean).join(' ')}
      onClick={(event) => event.stopPropagation()}
    >
      {!readOnly ? (
        <div className="github-block-toolbar" aria-label={`${block.title} quick actions`}>
          <button aria-label="Move block up" type="button" onClick={(event) => {
            event.stopPropagation();
            onMoveBlock(block.id, 'up');
          }}>
            <Icon name="keyboard_arrow_up" />
          </button>
          <button aria-label="Move block down" type="button" onClick={(event) => {
            event.stopPropagation();
            onMoveBlock(block.id, 'down');
          }}>
            <Icon name="keyboard_arrow_down" />
          </button>
          <div className="github-block-toolbar__regions" aria-label="Move block to region">
            {editorRegions.map((region) => (
              <button
                aria-pressed={block.region === region}
                key={region}
                type="button"
                onClick={(event) => {
                  event.stopPropagation();
                  onMoveBlockToRegion(block.id, region);
                }}
              >
                {regionShortLabels[region]}
              </button>
            ))}
          </div>
          <button aria-label="Hide block" type="button" onClick={(event) => {
            event.stopPropagation();
            onToggleBlock(block.id);
          }}>
            <Icon name="visibility_off" />
          </button>
          <button aria-label="Style block" type="button" onClick={openStyleMenu}>
            <Icon name="tune" />
          </button>
        </div>
      ) : null}
      {!readOnly && isSelected ? (
        <div aria-hidden="true" className="github-block-selection-handles">
          <span className="github-block-selection-handle github-block-selection-handle--nw" />
          <span className="github-block-selection-handle github-block-selection-handle--ne" />
          <span className="github-block-selection-handle github-block-selection-handle--sw" />
          <span className="github-block-selection-handle github-block-selection-handle--se" />
        </div>
      ) : null}
      <BlockComponent
        block={block}
        selected={isSelected}
        onOpenContextMenu={onOpenBlockMenu}
        onSelect={onSelectBlock}
      />
    </div>
  );
}

function RegionColumn({
  region,
  blocks,
  selectedBlockId,
  onSelectBlock,
  onOpenBlockMenu,
  onMoveBlock,
  onMoveBlockToRegion,
  onToggleBlock,
  readOnly = false,
}: {
  region: TemplateRegion;
  blocks: TemplateBlock[];
  selectedBlockId: string;
  onSelectBlock: (blockId: string) => void;
  onOpenBlockMenu: (blockId: string, x: number, y: number) => void;
  onMoveBlock: (blockId: string, direction: 'up' | 'down') => void;
  onMoveBlockToRegion: (blockId: string, region: TemplateRegion) => void;
  onToggleBlock: (blockId: string) => void;
  readOnly?: boolean;
}) {
  const visibleBlocks = blocks.filter((block) => block.visible);

  return (
    <section className={`github-home-region github-home-region--${region}`} aria-label={regionLabels[region]}>
      {visibleBlocks.length > 0 ? (
        visibleBlocks.map((block) => (
          <RenderBlock
            block={block}
            key={block.id}
            onMoveBlock={onMoveBlock}
            onMoveBlockToRegion={onMoveBlockToRegion}
            onOpenBlockMenu={onOpenBlockMenu}
            onSelectBlock={onSelectBlock}
            onToggleBlock={onToggleBlock}
            readOnly={readOnly}
            selectedBlockId={selectedBlockId}
          />
        ))
      ) : (
        <div className="github-home-region__empty">Hidden region</div>
      )}
    </section>
  );
}

export function TemplateLayoutCanvas({
  blocksByRegion,
  columnLayout,
  screen,
  selectedBlockId,
  variationId,
  pageAppearance,
  onOpenBlockMenu,
  onOpenPageMenu,
  onSelectBlock,
  onMoveBlock,
  onMoveBlockToRegion,
  onToggleBlock,
  readOnly = false,
}: TemplateLayoutCanvasProps) {
  const pageBackground = getPageAppearanceString(pageAppearance, 'backgroundColor');
  const leftSidebarBackground = getPageAppearanceString(pageAppearance, 'leftSidebarBackgroundColor');
  const pageBackgroundImageUrl = getPageAppearanceString(pageAppearance, 'backgroundImageUrl');
  const pageBackgroundImage = getCssImageUrl(pageBackgroundImageUrl);
  const pageBackgroundPosition = getPageAppearanceString(pageAppearance, 'backgroundImagePosition');
  const pageBackgroundSize = getPageAppearanceString(pageAppearance, 'backgroundImageSize');
  const pageBackgroundRepeat = getPageAppearanceString(pageAppearance, 'backgroundImageRepeat');
  const backgroundImageLayerStyle = getBackgroundImageLayerStyle(pageBackgroundPosition, pageBackgroundSize);
  const isRepositoryReadmeScreen = screen?.id === 'github-repository-readme';
  const isProfileOverviewScreen = screen?.id === 'github-profile-overview';

  const [insertOpen, setInsertOpen] = useState(false);
  const [insertRegion, setInsertRegion] = useState<TemplateRegion>('main-feed');
  const allBlocks = Object.values(blocksByRegion).flat();
  const hiddenBlocks = allBlocks.filter((block) => !block.visible);
  const selectedBlock = allBlocks.find((block) => block.id === selectedBlockId);
  const targetRegion = insertRegion;

  const insertBlock = (blockId: string) => {
    const region = targetRegion;
    onMoveBlockToRegion(blockId, region);
    onSelectBlock(blockId);
    setInsertRegion(region);
    setInsertOpen(false);
  };

  return (
    <div className="template-screen-frame">
      <div className="template-screen-frame__toolbar">
        <div>
          <span>{screen?.providerRoute ?? 'github.com/'}</span>
          <strong>{screen?.name ?? 'GitHub screen'}</strong>
        </div>
        <em>{screen?.description ?? 'Editable provider screen'}</em>
      </div>
      <div
        className={[
          'github-home-preview',
          `github-home-preview--${variationId}`,
          isRepositoryReadmeScreen ? 'github-home-preview--repository-readme' : '',
          isProfileOverviewScreen ? 'github-home-preview--profile-overview' : '',
          pageBackgroundImage ? 'has-background-image' : '',
        ].join(' ')}
        onClick={(event) => {
          if (event.target instanceof Element && event.target.closest('.github-block-frame, .github-insert-panel')) {
            return;
          }

          onSelectBlock('');
          setInsertOpen(false);
        }}
        onContextMenu={(event) => {
          if (event.target instanceof Element && event.target.closest('.github-block')) {
            return;
          }

          event.preventDefault();
          event.stopPropagation();
          onOpenPageMenu(event.clientX, event.clientY);
        }}
        style={
          {
            '--github-preview-left-width': `${columnLayout.left}px`,
            '--github-preview-main-min-width': `${columnLayout.main}px`,
            '--github-preview-right-width': `${columnLayout.right}px`,
            ...(pageBackground ? { '--github-preview-page-background': pageBackground } : {}),
            ...(leftSidebarBackground ? { '--github-preview-left-background': leftSidebarBackground } : {}),
            ...(pageBackgroundImage ? { '--github-preview-page-background-image': pageBackgroundImage } : {}),
            ...(pageBackgroundPosition ? { '--github-preview-page-background-position': pageBackgroundPosition } : {}),
            ...(pageBackgroundSize ? { '--github-preview-page-background-size': pageBackgroundSize } : {}),
            ...(pageBackgroundRepeat ? { '--github-preview-page-background-repeat': pageBackgroundRepeat } : {}),
          } as CSSProperties
        }
      >
        {pageBackgroundImageUrl ? (
          <img
            alt=""
            aria-hidden="true"
            className="github-home-preview__background-image"
            draggable={false}
            src={pageBackgroundImageUrl}
            style={backgroundImageLayerStyle}
          />
        ) : null}
        {!readOnly && hiddenBlocks.length > 0 ? (
          <div className="github-insert-panel">
            <button
              aria-expanded={insertOpen}
              className="github-insert-trigger"
              type="button"
              onClick={(event) => {
                event.stopPropagation();
                if (!insertOpen && selectedBlock?.visible) {
                  setInsertRegion(selectedBlock.region);
                }
                setInsertOpen((open) => !open);
              }}
            >
              <Icon name="add" />
              <span>Insert</span>
            </button>
            {insertOpen ? (
              <div className="github-insert-popover" onClick={(event) => event.stopPropagation()}>
                <div className="github-insert-popover__header">
                  <strong>Hidden blocks</strong>
                  <span>to {regionLabels[targetRegion]}</span>
                </div>
                <div className="github-insert-popover__regions" aria-label="Insert target region">
                  {editorRegions.map((region) => (
                    <button
                      aria-pressed={targetRegion === region}
                      key={region}
                      type="button"
                      onClick={() => setInsertRegion(region)}
                    >
                      {regionShortLabels[region]}
                    </button>
                  ))}
                </div>
                <div className="github-insert-popover__list">
                  {hiddenBlocks.map((block) => (
                    <button key={block.id} type="button" onClick={() => insertBlock(block.id)}>
                      <Icon name="view_agenda" />
                      <span>{block.title}</span>
                    </button>
                  ))}
                </div>
              </div>
            ) : null}
          </div>
        ) : null}
        <RegionColumn
          blocks={blocksByRegion.topbar}
          onMoveBlock={onMoveBlock}
          onMoveBlockToRegion={onMoveBlockToRegion}
          onOpenBlockMenu={onOpenBlockMenu}
          onSelectBlock={onSelectBlock}
          onToggleBlock={onToggleBlock}
          readOnly={readOnly}
          region="topbar"
          selectedBlockId={selectedBlockId}
        />
        <div className="github-home-preview__body">
          <RegionColumn
            blocks={blocksByRegion['left-sidebar']}
            onMoveBlock={onMoveBlock}
            onMoveBlockToRegion={onMoveBlockToRegion}
            onOpenBlockMenu={onOpenBlockMenu}
            onSelectBlock={onSelectBlock}
            onToggleBlock={onToggleBlock}
            readOnly={readOnly}
            region="left-sidebar"
            selectedBlockId={selectedBlockId}
          />
          <RegionColumn
            blocks={blocksByRegion['main-feed']}
            onMoveBlock={onMoveBlock}
            onMoveBlockToRegion={onMoveBlockToRegion}
            onOpenBlockMenu={onOpenBlockMenu}
            onSelectBlock={onSelectBlock}
            onToggleBlock={onToggleBlock}
            readOnly={readOnly}
            region="main-feed"
            selectedBlockId={selectedBlockId}
          />
          <RegionColumn
            blocks={blocksByRegion['right-sidebar']}
            onMoveBlock={onMoveBlock}
            onMoveBlockToRegion={onMoveBlockToRegion}
            onOpenBlockMenu={onOpenBlockMenu}
            onSelectBlock={onSelectBlock}
            onToggleBlock={onToggleBlock}
            readOnly={readOnly}
            region="right-sidebar"
            selectedBlockId={selectedBlockId}
          />
        </div>
      </div>
    </div>
  );
}
