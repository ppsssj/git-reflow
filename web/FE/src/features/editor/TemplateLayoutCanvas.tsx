import type { TemplateBlock, TemplateRegion } from '../../types/template';
import { githubBlockRegistry } from './blocks/GithubTemplateBlocks';

interface TemplateLayoutCanvasProps {
  blocksByRegion: Record<TemplateRegion, TemplateBlock[]>;
  selectedBlockId: string;
  onSelectBlock: (blockId: string) => void;
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
}: {
  block: TemplateBlock;
  selectedBlockId: string;
  onSelectBlock: (blockId: string) => void;
}) {
  const BlockComponent = githubBlockRegistry[block.type];

  if (!block.visible) {
    return null;
  }

  return <BlockComponent block={block} selected={block.id === selectedBlockId} onSelect={onSelectBlock} />;
}

function RegionColumn({
  region,
  blocks,
  selectedBlockId,
  onSelectBlock,
}: {
  region: TemplateRegion;
  blocks: TemplateBlock[];
  selectedBlockId: string;
  onSelectBlock: (blockId: string) => void;
}) {
  const visibleBlocks = blocks.filter((block) => block.visible);

  return (
    <section className={`github-home-region github-home-region--${region}`} aria-label={regionLabels[region]}>
      {visibleBlocks.length > 0 ? (
        visibleBlocks.map((block) => (
          <RenderBlock
            block={block}
            key={block.id}
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
  selectedBlockId,
  onSelectBlock,
}: TemplateLayoutCanvasProps) {
  return (
    <div className="github-home-preview">
      <RegionColumn
        blocks={blocksByRegion.topbar}
        onSelectBlock={onSelectBlock}
        region="topbar"
        selectedBlockId={selectedBlockId}
      />
      <div className="github-home-preview__body">
        <RegionColumn
          blocks={blocksByRegion['left-sidebar']}
          onSelectBlock={onSelectBlock}
          region="left-sidebar"
          selectedBlockId={selectedBlockId}
        />
        <RegionColumn
          blocks={blocksByRegion['main-feed']}
          onSelectBlock={onSelectBlock}
          region="main-feed"
          selectedBlockId={selectedBlockId}
        />
        <RegionColumn
          blocks={blocksByRegion['right-sidebar']}
          onSelectBlock={onSelectBlock}
          region="right-sidebar"
          selectedBlockId={selectedBlockId}
        />
      </div>
    </div>
  );
}
