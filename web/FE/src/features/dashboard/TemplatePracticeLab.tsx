import type { CSSProperties } from 'react';
import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { Icon } from '../../components/ui/Icon';
import { starterGithubTemplateRecord } from '../editor/templates/starterGithubTemplate';

type PracticeRegion = 'left' | 'main' | 'right';

interface PracticeBlock {
  id: string;
  title: string;
  description: string;
  region: PracticeRegion;
  visible: boolean;
}

const initialPracticeBlocks: PracticeBlock[] = [
  {
    id: 'recent-repos',
    title: 'Recent repositories',
    description: 'Repository shortcuts and ownership context.',
    region: 'left',
    visible: true,
  },
  {
    id: 'copilot-prompt',
    title: 'Copilot prompt',
    description: 'The first action area in the main feed.',
    region: 'main',
    visible: true,
  },
  {
    id: 'activity-feed',
    title: 'Activity feed',
    description: 'Pull requests, stars, and team movement.',
    region: 'main',
    visible: true,
  },
  {
    id: 'release-radar',
    title: 'Release radar',
    description: 'Changelog and package activity.',
    region: 'right',
    visible: true,
  },
];

const practiceRegionLabels: Record<PracticeRegion, string> = {
  left: 'Left rail',
  main: 'Main feed',
  right: 'Right rail',
};

const practiceThemeOptions = [
  { id: 'blue', label: 'Blue', accent: '#00629e', soft: '#dceafe', panel: '#ffffff' },
  { id: 'green', label: 'Green', accent: '#167447', soft: '#d8efe4', panel: '#f8fffb' },
  { id: 'rose', label: 'Rose', accent: '#be3a5b', soft: '#f3d9e0', panel: '#fff8fa' },
] as const;

export function TemplatePracticeLab() {
  const [practiceBlocks, setPracticeBlocks] = useState<PracticeBlock[]>(initialPracticeBlocks);
  const [selectedPracticeBlockId, setSelectedPracticeBlockId] = useState(initialPracticeBlocks[1].id);
  const [practiceThemeId, setPracticeThemeId] = useState<(typeof practiceThemeOptions)[number]['id']>('blue');
  const [practiceDensity, setPracticeDensity] = useState(2);
  const selectedPracticeBlock =
    practiceBlocks.find((block) => block.id === selectedPracticeBlockId) ?? practiceBlocks[0];
  const visiblePracticeBlocks = practiceBlocks.filter((block) => block.visible);
  const practiceTheme =
    practiceThemeOptions.find((theme) => theme.id === practiceThemeId) ?? practiceThemeOptions[0];
  const visiblePracticeBlocksByRegion = useMemo(
    () => ({
      left: visiblePracticeBlocks.filter((block) => block.region === 'left'),
      main: visiblePracticeBlocks.filter((block) => block.region === 'main'),
      right: visiblePracticeBlocks.filter((block) => block.region === 'right'),
    }),
    [visiblePracticeBlocks],
  );

  const updatePracticeBlock = (blockId: string, updater: (block: PracticeBlock) => PracticeBlock) => {
    setPracticeBlocks((current) => current.map((block) => (block.id === blockId ? updater(block) : block)));
  };

  const moveSelectedPracticeBlock = (region: PracticeRegion) => {
    updatePracticeBlock(selectedPracticeBlock.id, (block) => ({ ...block, region, visible: true }));
  };

  return (
    <section className="dashboard-practice-section" aria-label="Template practice lab">
      <div className="dashboard-practice-section__header">
        <div>
          <span>Practice Lab</span>
          <h2>Try template edits here</h2>
          <p>Move blocks, hide modules, and change the preview style without changing saved templates.</p>
        </div>
        <Link to={`/templates/${starterGithubTemplateRecord.id}`}>
          Open full editor
          <Icon name="open_in_new" />
        </Link>
      </div>

      <div className="practice-lab practice-lab--embedded">
        <aside className="practice-lab__controls">
          <section>
            <h2>Select a block</h2>
            <div className="practice-block-list">
              {practiceBlocks.map((block) => (
                <button
                  className={block.id === selectedPracticeBlock.id ? 'is-active' : ''}
                  key={block.id}
                  type="button"
                  onClick={() => setSelectedPracticeBlockId(block.id)}
                >
                  <Icon name={block.visible ? 'check_box' : 'check_box_outline_blank'} />
                  <span>{block.title}</span>
                  <em>{practiceRegionLabels[block.region]}</em>
                </button>
              ))}
            </div>
          </section>

          <section>
            <h2>Move selected block</h2>
            <div className="practice-segmented">
              {(Object.keys(practiceRegionLabels) as PracticeRegion[]).map((region) => (
                <button
                  className={selectedPracticeBlock.region === region ? 'is-active' : ''}
                  key={region}
                  type="button"
                  onClick={() => moveSelectedPracticeBlock(region)}
                >
                  {practiceRegionLabels[region]}
                </button>
              ))}
            </div>
          </section>

          <section>
            <h2>Visibility</h2>
            <button
              className="practice-toggle"
              type="button"
              onClick={() =>
                updatePracticeBlock(selectedPracticeBlock.id, (block) => ({ ...block, visible: !block.visible }))
              }
            >
              <Icon name={selectedPracticeBlock.visible ? 'visibility' : 'visibility_off'} />
              <span>{selectedPracticeBlock.visible ? 'Visible in preview' : 'Hidden from preview'}</span>
            </button>
          </section>

          <section>
            <h2>Style preset</h2>
            <div className="practice-swatches">
              {practiceThemeOptions.map((option) => (
                <button
                  aria-label={option.label}
                  className={practiceThemeId === option.id ? 'is-active' : ''}
                  key={option.id}
                  style={{ background: option.accent }}
                  type="button"
                  onClick={() => setPracticeThemeId(option.id)}
                />
              ))}
            </div>
          </section>

          <section>
            <h2>Density</h2>
            <input
              aria-label="Preview density"
              max="3"
              min="1"
              type="range"
              value={practiceDensity}
              onChange={(event) => setPracticeDensity(Number(event.target.value))}
            />
          </section>
        </aside>

        <section
          className="practice-preview"
          style={
            {
              '--practice-accent': practiceTheme.accent,
              '--practice-soft': practiceTheme.soft,
              '--practice-panel': practiceTheme.panel,
              '--practice-gap': `${18 - practiceDensity * 3}px`,
            } as CSSProperties
          }
        >
          <div className="practice-preview__topbar">
            <Icon name="dashboard_customize" />
            <strong>GitHub Home Template</strong>
            <span>{selectedPracticeBlock.title}</span>
          </div>
          <div className="practice-preview__grid">
            {(Object.keys(practiceRegionLabels) as PracticeRegion[]).map((region) => (
              <div className={`practice-preview__region practice-preview__region--${region}`} key={region}>
                <header>{practiceRegionLabels[region]}</header>
                {visiblePracticeBlocksByRegion[region].map((block) => (
                  <button
                    className={block.id === selectedPracticeBlock.id ? 'is-selected' : ''}
                    key={block.id}
                    type="button"
                    onClick={() => setSelectedPracticeBlockId(block.id)}
                  >
                    <strong>{block.title}</strong>
                    <span>{block.description}</span>
                  </button>
                ))}
                {visiblePracticeBlocksByRegion[region].length === 0 ? <em>Drop blocks here</em> : null}
              </div>
            ))}
          </div>
        </section>
      </div>
    </section>
  );
}
