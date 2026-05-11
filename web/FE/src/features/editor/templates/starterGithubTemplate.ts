import type { ExtensionTemplatePayload, TemplateBlock, TemplateRecord } from '../../../types/template';
import { defaultGithubTemplate } from './defaultGithubTemplate';

const now = '2026-05-11T00:00:00.000Z';

const blockAppearances: Partial<Record<TemplateBlock['type'], Record<string, unknown>>> = {
  'top-nav': {
    backgroundColor: '#101827',
    innerBackgroundColor: '#172033',
    borderRadius: 0,
    padding: 12,
    elementGap: 10,
    fontSize: 13,
  },
  'profile-summary': {
    backgroundColor: '#172033',
    innerBackgroundColor: '#22304a',
    borderRadius: 14,
    padding: 14,
    marginY: 8,
    fontSize: 14,
  },
  'recent-repos': {
    backgroundColor: '#172033',
    innerBackgroundColor: '#22304a',
    borderRadius: 14,
    padding: 16,
    elementGap: 10,
    fontSize: 14,
  },
  'copilot-prompt': {
    backgroundColor: '#1e293b',
    innerBackgroundColor: '#0f172a',
    borderRadius: 18,
    padding: 18,
    marginY: 10,
    elementGap: 12,
    fontSize: 15,
  },
  'activity-feed': {
    backgroundColor: '#111827',
    innerBackgroundColor: '#1f2937',
    borderRadius: 16,
    padding: 16,
    marginY: 10,
    elementGap: 14,
    fontSize: 14,
  },
  'repo-updates': {
    backgroundColor: '#172033',
    innerBackgroundColor: '#22304a',
    borderRadius: 16,
    padding: 16,
    marginY: 10,
    elementGap: 12,
  },
  'trending-repos': {
    backgroundColor: '#172033',
    innerBackgroundColor: '#22304a',
    borderRadius: 16,
    padding: 16,
    marginY: 8,
    elementGap: 12,
    fontSize: 13,
  },
};

const visibleByDefault = new Set([
  'top-nav',
  'profile-summary',
  'recent-repos',
  'copilot-prompt',
  'activity-feed',
  'repo-updates',
  'trending-repos',
]);

export const starterGithubTemplate: ExtensionTemplatePayload = {
  ...defaultGithubTemplate,
  id: 'github-home-polished-starter',
  name: 'GitHub Polished Starter',
  description: 'A styled GitHub Home preset with dark panels, compact spacing, and readable content groups.',
  source: 'user',
  version: 1,
  metadata: {
    ...defaultGithubTemplate.metadata,
    updatedAt: now,
  },
  blocks: defaultGithubTemplate.blocks.map((block) => ({
    ...block,
    visible: visibleByDefault.has(block.id),
    props: {
      ...block.props,
      ...(block.type === 'recent-repos' ? { itemLimit: 5 } : {}),
      ...(block.type === 'activity-feed' ? { itemLimit: 3 } : {}),
      ...(block.type === 'trending-repos' ? { itemLimit: 4 } : {}),
      ...(blockAppearances[block.type] ? { appearance: blockAppearances[block.type] } : {}),
    },
  })),
  provider: 'github',
  columnLayout: {
    left: 300,
    main: 880,
    right: 330,
  },
  leftSidebarResizeEnabled: true,
  selectedVariationId: 'github-default',
  pageAppearance: {
    backgroundColor: '#0b1120',
  },
  updatedAt: now,
};

export const starterGithubTemplateRecord: TemplateRecord = {
  id: starterGithubTemplate.id,
  name: starterGithubTemplate.name,
  description: starterGithubTemplate.description,
  thumbnail: '',
  collaborators: [],
  status: 'ACTIVE',
  syncState: 'Ready to sync',
  updatedAt: 'Starter preset',
  owner: 'git-reflow',
  highlights: [
    'Styled dark GitHub Home preset',
    'Editable colors, spacing, radius, and typography',
    'Use as a starting point for saved templates',
  ],
  sections: starterGithubTemplate.blocks
    .filter((block) => block.visible)
    .slice(0, 6)
    .map((block, index) => ({
      id: block.id,
      label: block.title,
      kind: block.region === 'topbar' ? 'header' : block.region === 'main-feed' ? 'content' : 'sidebar',
      depth: index === 0 ? 0 : 1,
      description: block.extensionSlot ?? block.region,
      visible: block.visible,
    })),
};
