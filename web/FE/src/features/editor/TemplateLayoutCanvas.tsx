import type { CSSProperties } from 'react';
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
}

const regionLabels: Record<TemplateRegion, string> = {
  topbar: 'Topbar',
  'left-sidebar': 'Left sidebar',
  'main-feed': 'Main feed',
  'right-sidebar': 'Right sidebar',
};

function RenderBlock({
  block,
  selectedBlockId,
  onSelectBlock,
  onOpenBlockMenu,
}: {
  block: TemplateBlock;
  selectedBlockId: string;
  onSelectBlock: (blockId: string) => void;
  onOpenBlockMenu: (blockId: string, x: number, y: number) => void;
}) {
  const BlockComponent = githubBlockRegistry[block.type];

  if (!block.visible) {
    return null;
  }

  return (
    <BlockComponent
      block={block}
      selected={block.id === selectedBlockId}
      onOpenContextMenu={onOpenBlockMenu}
      onSelect={onSelectBlock}
    />
  );
}

function RegionColumn({
  region,
  blocks,
  selectedBlockId,
  onSelectBlock,
  onOpenBlockMenu,
}: {
  region: TemplateRegion;
  blocks: TemplateBlock[];
  selectedBlockId: string;
  onSelectBlock: (blockId: string) => void;
  onOpenBlockMenu: (blockId: string, x: number, y: number) => void;
}) {
  const visibleBlocks = blocks.filter((block) => block.visible);

  return (
    <section className={`github-home-region github-home-region--${region}`} aria-label={regionLabels[region]}>
      {visibleBlocks.length > 0 ? (
        visibleBlocks.map((block) => (
          <RenderBlock
            block={block}
            key={block.id}
            onOpenBlockMenu={onOpenBlockMenu}
            onSelectBlock={onSelectBlock}
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
}: TemplateLayoutCanvasProps) {
  const pageBackground =
    typeof pageAppearance?.backgroundColor === 'string' ? pageAppearance.backgroundColor : undefined;
  const leftSidebarBackground =
    typeof pageAppearance?.leftSidebarBackgroundColor === 'string'
      ? pageAppearance.leftSidebarBackgroundColor
      : undefined;

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
        ].join(' ')}
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
          } as CSSProperties
        }
      >
        <RegionColumn
          blocks={blocksByRegion.topbar}
          onOpenBlockMenu={onOpenBlockMenu}
          onSelectBlock={onSelectBlock}
          region="topbar"
          selectedBlockId={selectedBlockId}
        />
        <div className="github-home-preview__body">
          <RegionColumn
            blocks={blocksByRegion['left-sidebar']}
            onOpenBlockMenu={onOpenBlockMenu}
            onSelectBlock={onSelectBlock}
            region="left-sidebar"
            selectedBlockId={selectedBlockId}
          />
          <RegionColumn
            blocks={blocksByRegion['main-feed']}
            onOpenBlockMenu={onOpenBlockMenu}
            onSelectBlock={onSelectBlock}
            region="main-feed"
            selectedBlockId={selectedBlockId}
          />
          <RegionColumn
            blocks={blocksByRegion['right-sidebar']}
            onOpenBlockMenu={onOpenBlockMenu}
            onSelectBlock={onSelectBlock}
            region="right-sidebar"
            selectedBlockId={selectedBlockId}
          />
        </div>
      </div>
    </div>
  );
}
