import { useMemo, useReducer } from 'react';
import type { TemplateBlock, TemplateLayout, TemplateRegion } from '../../types/template';

type TemplateLayoutAction =
  | { type: 'toggle-block'; blockId: string }
  | { type: 'move-block'; blockId: string; direction: 'up' | 'down' }
  | { type: 'set-active-screen'; screenId: string }
  | { type: 'reset'; layout: TemplateLayout };

function cloneLayout(layout: TemplateLayout): TemplateLayout {
  return {
    ...layout,
    metadata: { ...layout.metadata },
    screens: layout.screens.map((screen) => ({ ...screen })),
    regions: [...layout.regions],
    blocks: layout.blocks.map((block) => ({
      ...block,
      props: { ...block.props },
    })),
  };
}

function getBlockScreenId(layout: TemplateLayout, block: TemplateBlock) {
  return block.screenId ?? layout.screens[0]?.id ?? layout.activeScreenId;
}

function moveBlock(layout: TemplateLayout, blockId: string, direction: 'up' | 'down'): TemplateLayout {
  const block = layout.blocks.find((item) => item.id === blockId);

  if (!block) {
    return layout;
  }

  const blockScreenId = getBlockScreenId(layout, block);
  const regionBlocks = layout.blocks.filter(
    (item) => item.region === block.region && getBlockScreenId(layout, item) === blockScreenId,
  );
  const currentRegionIndex = regionBlocks.findIndex((item) => item.id === blockId);
  const nextRegionIndex = direction === 'up' ? currentRegionIndex - 1 : currentRegionIndex + 1;
  const targetBlock = regionBlocks[nextRegionIndex];

  if (!targetBlock) {
    return layout;
  }

  const nextBlocks = [...layout.blocks];
  const currentIndex = nextBlocks.findIndex((item) => item.id === blockId);
  const targetIndex = nextBlocks.findIndex((item) => item.id === targetBlock.id);

  nextBlocks[currentIndex] = targetBlock;
  nextBlocks[targetIndex] = block;

  return {
    ...layout,
    source: 'user',
    blocks: nextBlocks,
  };
}

function templateLayoutReducer(layout: TemplateLayout, action: TemplateLayoutAction): TemplateLayout {
  switch (action.type) {
    case 'toggle-block':
      return {
        ...layout,
        source: 'user',
        blocks: layout.blocks.map((block) =>
          block.id === action.blockId ? { ...block, visible: !block.visible } : block,
        ),
      };
    case 'move-block':
      return moveBlock(layout, action.blockId, action.direction);
    case 'set-active-screen':
      if (!layout.screens.some((screen) => screen.id === action.screenId)) {
        return layout;
      }

      return {
        ...layout,
        activeScreenId: action.screenId,
      };
    case 'reset':
      return cloneLayout(action.layout);
    default:
      return layout;
  }
}

export function useTemplateLayout(defaultLayout: TemplateLayout) {
  const [layout, dispatch] = useReducer(templateLayoutReducer, defaultLayout, cloneLayout);

  const blocksByRegion = useMemo(() => {
    return layout.regions.reduce(
      (regions, region) => ({
        ...regions,
        [region]: layout.blocks.filter(
          (block) => block.region === region && getBlockScreenId(layout, block) === layout.activeScreenId,
        ),
      }),
      {} as Record<TemplateRegion, TemplateBlock[]>,
    );
  }, [layout]);

  const activeScreen = useMemo(
    () => layout.screens.find((screen) => screen.id === layout.activeScreenId) ?? layout.screens[0],
    [layout.activeScreenId, layout.screens],
  );

  const serializedLayout = useMemo(() => JSON.stringify(layout, null, 2), [layout]);

  return {
    layout,
    activeScreen,
    blocksByRegion,
    serializedLayout,
    setActiveScreen: (screenId: string) => dispatch({ type: 'set-active-screen', screenId }),
    toggleBlockVisibility: (blockId: string) => dispatch({ type: 'toggle-block', blockId }),
    moveBlock: (blockId: string, direction: 'up' | 'down') =>
      dispatch({ type: 'move-block', blockId, direction }),
    resetLayout: () => dispatch({ type: 'reset', layout: defaultLayout }),
  };
}
