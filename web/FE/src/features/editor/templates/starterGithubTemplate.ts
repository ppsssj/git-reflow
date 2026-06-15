import type { ExtensionTemplatePayload, TemplateBlock, TemplateRecord } from '../../../types/template';
import { defaultGithubTemplate } from './defaultGithubTemplate';
import { repositoryReadmeBlocks, repositoryReadmeScreen } from './repositoryReadmeTemplate';

const now = '2026-05-11T00:00:00.000Z';

interface StarterTheme {
  id: string;
  name: string;
  description: string;
  pageBackgroundColor: string;
  leftSidebarBackgroundColor: string;
  textColor: string;
  linkColor: string;
  mutedTextColor: string;
  colors: {
    topbar: string;
    panel: string;
    panelSoft: string;
    mainPanel: string;
    mainInner: string;
  };
}

const starterThemes: StarterTheme[] = [
  {
    id: 'github-home-polished-starter',
    name: 'GitHub Polished Starter-blue',
    description: 'A soft blue GitHub Home preset with dark panels, compact spacing, and readable content groups.',
    pageBackgroundColor: '#0b1120',
    leftSidebarBackgroundColor: '#0f172a',
    textColor: '#e5edf7',
    linkColor: '#f8fbff',
    mutedTextColor: '#a9b8cf',
    colors: {
      topbar: '#101827',
      panel: '#172033',
      panelSoft: '#22304a',
      mainPanel: '#111827',
      mainInner: '#1f2937',
    },
  },
  {
    id: 'github-home-polished-starter-green',
    name: 'GitHub Polished Starter-green',
    description: 'A soft green GitHub Home preset with calm panels, compact spacing, and readable content groups.',
    pageBackgroundColor: '#0d1b16',
    leftSidebarBackgroundColor: '#10261f',
    textColor: '#e4f7ec',
    linkColor: '#f7fffb',
    mutedTextColor: '#a8c8b8',
    colors: {
      topbar: '#0b1f18',
      panel: '#123326',
      panelSoft: '#1e4a38',
      mainPanel: '#0f2a20',
      mainInner: '#183f30',
    },
  },
  {
    id: 'github-home-polished-starter-red',
    name: 'GitHub Polished Starter-red',
    description: 'A soft red GitHub Home preset with warm panels, compact spacing, and readable content groups.',
    pageBackgroundColor: '#1f1113',
    leftSidebarBackgroundColor: '#2a171a',
    textColor: '#ffe7eb',
    linkColor: '#fff8f9',
    mutedTextColor: '#e0aeb8',
    colors: {
      topbar: '#2a171a',
      panel: '#3a2024',
      panelSoft: '#553239',
      mainPanel: '#2c181c',
      mainInner: '#44272d',
    },
  },
];

function createBlockAppearances(theme: StarterTheme): Partial<Record<TemplateBlock['type'], Record<string, unknown>>> {
  return {
    'top-nav': {
      backgroundColor: theme.colors.topbar,
      innerBackgroundColor: theme.colors.panel,
      borderRadius: 0,
      padding: 12,
      elementGap: 10,
      fontSize: 13,
      textColor: theme.textColor,
      linkColor: theme.linkColor,
    },
    'profile-summary': {
      backgroundColor: theme.colors.panel,
      innerBackgroundColor: theme.colors.panelSoft,
      borderRadius: 14,
      padding: 14,
      marginY: 8,
      fontSize: 14,
      textColor: theme.textColor,
      linkColor: theme.linkColor,
    },
    'recent-repos': {
      backgroundColor: theme.colors.panel,
      innerBackgroundColor: theme.colors.panelSoft,
      borderRadius: 14,
      padding: 16,
      elementGap: 10,
      fontSize: 14,
      textColor: theme.textColor,
      linkColor: theme.linkColor,
      mutedTextColor: theme.mutedTextColor,
    },
    'copilot-prompt': {
      backgroundColor: theme.colors.panelSoft,
      innerBackgroundColor: theme.colors.topbar,
      borderRadius: 18,
      padding: 18,
      marginY: 10,
      elementGap: 12,
      fontSize: 15,
      textColor: theme.textColor,
      linkColor: theme.linkColor,
    },
    'activity-feed': {
      backgroundColor: theme.colors.mainPanel,
      innerBackgroundColor: theme.colors.mainInner,
      borderRadius: 16,
      padding: 16,
      marginY: 10,
      elementGap: 14,
      fontSize: 14,
      textColor: theme.textColor,
      linkColor: theme.linkColor,
    },
    'repo-updates': {
      backgroundColor: theme.colors.panel,
      innerBackgroundColor: theme.colors.panelSoft,
      borderRadius: 16,
      padding: 16,
      marginY: 10,
      elementGap: 12,
      textColor: theme.textColor,
      linkColor: theme.linkColor,
    },
    'trending-repos': {
      backgroundColor: theme.colors.panel,
      innerBackgroundColor: theme.colors.panelSoft,
      borderRadius: 16,
      padding: 16,
      marginY: 8,
      elementGap: 12,
      fontSize: 13,
      textColor: theme.textColor,
      linkColor: theme.linkColor,
      mutedTextColor: theme.mutedTextColor,
    },
    'repository-header': {
      backgroundColor: theme.colors.topbar,
      innerBackgroundColor: theme.colors.panel,
      borderRadius: 0,
      padding: 16,
      textColor: theme.textColor,
      linkColor: theme.linkColor,
      mutedTextColor: theme.mutedTextColor,
    },
    'repository-file-list': {
      backgroundColor: theme.colors.panel,
      innerBackgroundColor: theme.colors.panelSoft,
      borderRadius: 12,
      padding: 14,
      elementGap: 10,
      textColor: theme.textColor,
      linkColor: theme.linkColor,
      mutedTextColor: theme.mutedTextColor,
    },
    'repository-readme': {
      backgroundColor: theme.colors.panel,
      innerBackgroundColor: theme.colors.mainInner,
      borderRadius: 12,
      padding: 0,
      elementGap: 14,
      textColor: theme.textColor,
      linkColor: theme.linkColor,
      mutedTextColor: theme.mutedTextColor,
    },
    'repository-about-sidebar': {
      backgroundColor: theme.colors.panel,
      innerBackgroundColor: theme.colors.panelSoft,
      borderRadius: 12,
      padding: 16,
      elementGap: 10,
      textColor: theme.textColor,
      linkColor: theme.linkColor,
      mutedTextColor: theme.mutedTextColor,
    },
  };
}

const visibleByDefault = new Set([
  'top-nav',
  'profile-summary',
  'recent-repos',
  'copilot-prompt',
  'activity-feed',
  'repo-updates',
  'trending-repos',
]);

function createStarterGithubTemplate(theme: StarterTheme): ExtensionTemplatePayload {
  const blockAppearances = createBlockAppearances(theme);

  return {
    ...defaultGithubTemplate,
    id: theme.id,
    name: theme.name,
    description: theme.description,
    source: 'user',
    version: 1,
    metadata: {
      ...defaultGithubTemplate.metadata,
      updatedAt: now,
    },
    screens: [...defaultGithubTemplate.screens, repositoryReadmeScreen],
    blocks: [
      ...defaultGithubTemplate.blocks.map((block) => ({
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
      ...repositoryReadmeBlocks.map((block) => ({
        ...block,
        visible: true,
        props: {
          ...block.props,
          ...(blockAppearances[block.type] ? { appearance: blockAppearances[block.type] } : {}),
        },
      })),
    ],
    provider: 'github',
    columnLayout: {
      left: 300,
      main: 880,
      right: 330,
    },
    leftSidebarResizeEnabled: true,
    selectedVariationId: 'github-default',
    pageAppearance: {
      backgroundColor: theme.pageBackgroundColor,
      leftSidebarBackgroundColor: theme.leftSidebarBackgroundColor,
    },
    updatedAt: now,
  };
}

function createStarterGithubTemplateRecord(template: ExtensionTemplatePayload): TemplateRecord {
  return {
    id: template.id,
    name: template.name,
    description: template.description,
    thumbnail: '',
    collaborators: [],
    status: 'ACTIVE',
    syncState: 'Ready to sync',
    updatedAt: 'Starter preset',
    owner: 'git-reflow',
    highlights: [
      'Styled GitHub Home preset',
      'Includes Repository README page',
      'Editable colors, spacing, radius, and typography',
    ],
    sections: template.blocks
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
    preview: {
      columnLayout: template.columnLayout,
      pageAppearance: template.pageAppearance,
      blocks: template.blocks
        .filter((block) => block.visible)
        .slice(0, 10)
        .map((block) => ({
          id: block.id,
          type: block.type,
          title: block.title,
          region: block.region,
          appearance:
            typeof block.props.appearance === 'object' && block.props.appearance !== null && !Array.isArray(block.props.appearance)
              ? block.props.appearance as Record<string, unknown>
              : undefined,
        })),
    },
  };
}

export const starterGithubTemplates = starterThemes.map(createStarterGithubTemplate);
export const starterGithubTemplateRecords = starterGithubTemplates.map(createStarterGithubTemplateRecord);
export const starterGithubTemplate = starterGithubTemplates[0];
export const starterGithubTemplateRecord = starterGithubTemplateRecords[0];

export function getStarterGithubTemplate(templateId: string) {
  return starterGithubTemplates.find((template) => template.id === templateId);
}

export function getStarterGithubTemplateRecord(templateId: string) {
  return starterGithubTemplateRecords.find((template) => template.id === templateId);
}

export function isStarterGithubTemplateId(templateId: string) {
  return starterGithubTemplates.some((template) => template.id === templateId);
}
