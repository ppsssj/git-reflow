import { useEffect, useMemo, useState } from 'react';
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

        <section className="template-builder-canvas-shell">
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

          <TemplateLayoutCanvas
            blocksByRegion={blocksByRegion}
            onSelectBlock={setSelectedBlockId}
            screen={activeScreen}
            selectedBlockId={selectedBlockId}
          />
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
