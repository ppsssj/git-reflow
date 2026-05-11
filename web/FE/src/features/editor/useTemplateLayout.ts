import { useCallback, useMemo, useReducer } from 'react';
import type { TemplateBlock, TemplateLayout, TemplateRegion } from '../../types/template';

type TemplateLayoutAction =
  | { type: 'toggle-block'; blockId: string }
  | { type: 'update-block'; blockId: string; updates: Partial<TemplateBlock> }
  | { type: 'update-block-props'; blockId: string; props: Record<string, unknown> }
  | { type: 'move-block'; blockId: string; direction: 'up' | 'down' }
  | { type: 'set-active-screen'; screenId: string }
  | { type: 'replace'; layout: TemplateLayout }
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
    case 'update-block':
      return {
        ...layout,
        source: 'user',
        blocks: layout.blocks.map((block) =>
          block.id === action.blockId ? { ...block, ...action.updates } : block,
        ),
      };
    case 'update-block-props':
      return {
        ...layout,
        source: 'user',
        blocks: layout.blocks.map((block) =>
          block.id === action.blockId
            ? {
                ...block,
                props: {
                  ...block.props,
                  ...action.props,
                },
              }
            : block,
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
    case 'replace':
      return cloneLayout(action.layout);
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
  const setActiveScreen = useCallback((screenId: string) => dispatch({ type: 'set-active-screen', screenId }), []);
  const replaceLayout = useCallback((nextLayout: TemplateLayout) => dispatch({ type: 'replace', layout: nextLayout }), []);
  const toggleBlockVisibility = useCallback((blockId: string) => dispatch({ type: 'toggle-block', blockId }), []);
  const updateBlock = useCallback(
    (blockId: string, updates: Partial<TemplateBlock>) => dispatch({ type: 'update-block', blockId, updates }),
    [],
  );
  const updateBlockProps = useCallback(
    (blockId: string, props: Record<string, unknown>) => dispatch({ type: 'update-block-props', blockId, props }),
    [],
  );
  const moveBlockByDirection = useCallback(
    (blockId: string, direction: 'up' | 'down') => dispatch({ type: 'move-block', blockId, direction }),
    [],
  );
  const resetLayout = useCallback(() => dispatch({ type: 'reset', layout: defaultLayout }), [defaultLayout]);

  return {
    layout,
    activeScreen,
    blocksByRegion,
    serializedLayout,
    setActiveScreen,
    replaceLayout,
    toggleBlockVisibility,
    updateBlock,
    updateBlockProps,
    moveBlock: moveBlockByDirection,
    resetLayout,
  };
}
