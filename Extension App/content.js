const API_BASE_URL = 'http://localhost:8787';
const LATEST_TEMPLATE_URL = `${API_BASE_URL}/api/templates/github-home/latest`;
const CONTROLLER_ID = 'git-reflow-controller';
const RESIZER_CLASS = 'git-reflow-left-resizer';
const BLOCK_CLASS = 'git-reflow-template-block';
const GENERATED_BLOCK_CLASS = 'git-reflow-generated-block';
const APPEARANCE_CLASS = 'git-reflow-appearance-target';
const LAYOUT_CLASS = 'git-reflow-template-active';
const HIDDEN_CLASS = 'git-reflow-template-hidden';
const ORIGINAL_TEXT_ATTR = 'data-git-reflow-original-text';
const ORIGINAL_PLACEHOLDER_ATTR = 'data-git-reflow-original-placeholder';
const LEFT_WIDTH_STORAGE_KEY = 'gitReflowLeftSidebarWidthPx';
const AUTH_TOKEN_STORAGE_KEY = 'gitReflowAuthToken';
const SELECTED_TEMPLATE_STORAGE_KEY = 'gitReflowSelectedTemplateId';
const DEFAULT_TEMPLATE_ID = 'github-dashboard-reference';
const MIN_LEFT_SIDEBAR_WIDTH = 220;
const MAX_LEFT_SIDEBAR_WIDTH = 420;
const MIN_MAIN_COLUMN_WIDTH = 640;
const MAX_MAIN_COLUMN_WIDTH = 1120;
const MIN_RIGHT_SIDEBAR_WIDTH = 240;
const MAX_RIGHT_SIDEBAR_WIDTH = 420;
const SUPPORTED_VARIATIONS = new Set(['github-default', 'feed-two-column']);
const DEFAULT_TEMPLATE = {
  columnLayout: {
    left: 320,
    main: 900,
    right: 315,
  },
  leftSidebarResizeEnabled: true,
  selectedVariationId: 'github-default',
};
const STARTER_TEMPLATE_UPDATED_AT = '2026-05-11T00:00:00.000Z';
const STARTER_TEMPLATE_VISIBLE_BLOCKS = new Set([
  'top-nav',
  'profile-summary',
  'recent-repos',
  'copilot-prompt',
  'activity-feed',
  'repo-updates',
  'trending-repos',
]);
const STARTER_TEMPLATE_THEMES = [
  {
    id: 'github-home-polished-starter',
    name: 'GitHub Polished Starter-blue',
    description: 'A soft blue GitHub Home preset with dark panels, compact spacing, and readable content groups.',
    pageBackgroundColor: '#0b1120',
    leftSidebarBackgroundColor: '#0f172a',
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
    colors: {
      topbar: '#10231c',
      panel: '#183329',
      panelSoft: '#25483b',
      mainPanel: '#142820',
      mainInner: '#203c31',
    },
  },
  {
    id: 'github-home-polished-starter-red',
    name: 'GitHub Polished Starter-red',
    description: 'A soft red GitHub Home preset with warm panels, compact spacing, and readable content groups.',
    pageBackgroundColor: '#1f1113',
    leftSidebarBackgroundColor: '#2a171a',
    colors: {
      topbar: '#2a171a',
      panel: '#3a2024',
      panelSoft: '#553239',
      mainPanel: '#2c181c',
      mainInner: '#44272d',
    },
  },
];
const STARTER_TEMPLATE_BLOCK_DEFINITIONS = [
  {
    id: 'top-nav',
    type: 'top-nav',
    title: 'Global Header',
    region: 'topbar',
    extensionSlot: 'github.global.header',
    props: {
      context: 'Dashboard',
      searchPlaceholder: 'Type / to search',
      links: [],
      actions: ['Copilot', 'Create', 'Issues', 'Pull requests', 'Repositories', 'Inbox'],
    },
  },
  {
    id: 'profile-summary',
    type: 'profile-summary',
    title: 'Account Context',
    region: 'left-sidebar',
    extensionSlot: 'github.dashboard.account',
    props: {
      name: 'alex-placeholder',
      handle: 'Personal dashboard',
    },
  },
  {
    id: 'recent-repos',
    type: 'recent-repos',
    title: 'Top Repositories',
    region: 'left-sidebar',
    extensionSlot: 'github.dashboard.repositories',
    props: {
      searchPlaceholder: 'Find a repository...',
      itemLimit: 5,
      repositories: [
        { name: 'git-reflow/web', visibility: 'Private' },
        { name: 'git-reflow/extension', visibility: 'Private' },
        { name: 'git-reflow/templates', visibility: 'Public' },
      ],
    },
  },
  {
    id: 'copilot-prompt',
    type: 'copilot-prompt',
    title: 'Ask Copilot',
    region: 'main-feed',
    extensionSlot: 'github.dashboard.copilot',
    props: {
      placeholder: 'Ask Copilot about your repositories...',
      chips: ['Summarize updates', 'Review pull requests', 'Find issues'],
    },
  },
  {
    id: 'activity-feed',
    type: 'activity-feed',
    title: 'For you',
    region: 'main-feed',
    extensionSlot: 'github.dashboard.feed',
    props: {
      itemLimit: 3,
      events: [
        { actor: 'octocat', action: 'starred', subject: 'git-reflow/templates' },
        { actor: 'github-actions', action: 'updated', subject: 'workflow checks' },
        { actor: 'dependabot', action: 'opened', subject: 'security update' },
      ],
    },
  },
  {
    id: 'repo-updates',
    type: 'repo-updates',
    title: 'Repository updates',
    region: 'right-sidebar',
    extensionSlot: 'github.dashboard.updates',
    props: {
      itemLimit: 4,
      updates: [
        { status: 'Merged', repo: 'git-reflow/web', message: 'template editor polish' },
        { status: 'Opened', repo: 'git-reflow/extension', message: 'preview controls' },
      ],
    },
  },
  {
    id: 'pinned-repos',
    type: 'pinned-repos',
    title: 'Pinned repositories',
    region: 'right-sidebar',
    extensionSlot: 'github.dashboard.pinned',
    props: {
      itemLimit: 4,
      repositories: [],
    },
  },
  {
    id: 'issue-pr-updates',
    type: 'issue-pr-updates',
    title: 'Issues and pull requests',
    region: 'right-sidebar',
    extensionSlot: 'github.dashboard.issues',
    props: {
      itemLimit: 4,
      items: [],
    },
  },
  {
    id: 'trending-repos',
    type: 'trending-repos',
    title: 'Latest changes',
    region: 'right-sidebar',
    extensionSlot: 'github.dashboard.trending',
    props: {
      itemLimit: 4,
      repositories: [
        { name: 'github/cli', language: 'Changelog', stars: '7 hours ago' },
        { name: 'actions/runner', language: 'Changelog', stars: 'Yesterday' },
      ],
    },
  },
  {
    id: 'recommended-repos',
    type: 'recommended-repos',
    title: 'Explore repositories',
    region: 'right-sidebar',
    extensionSlot: 'github.dashboard.recommended',
    props: {
      itemLimit: 4,
      repositories: [],
    },
  },
];

const githubHomeSelectors = {
  dashboardRoot: ['.feed-background', 'feed-container', '#dashboard'],
  leftSidebar: ['.feed-left-sidebar', '[data-target="dashboard.sidebar"]'],
  leftSidebarContent: ['.feed-left-sidebar .dashboard-sidebar', '.dashboard-sidebar'],
  feedMain: ['.feed-main'],
  mainContent: ['.feed-main main', 'main#main-content'],
  rightSidebar: ['.feed-right-sidebar'],
  rightColumn: ['.feed-right-column'],
  topbar: ['react-partial[partial-name="global-nav-bar"]', '.AppHeader', '.GlobalNav', '.js-global-bar'],
  topbarContext: [
    '.AppHeader-context-item-label',
    '.styles-module__contextCrumbLast__tI2e3',
    '[data-testid="context-region"] span',
  ],
  topbarSearch: [
    '.AppHeader-search input',
    '.AppHeader-search textarea',
    'qbsearch-input input',
    'input[aria-label*="Search"]',
    'input[placeholder*="Search"]',
  ],
};

const regionContainers = {
  topbar: githubHomeSelectors.topbar,
  'left-sidebar': githubHomeSelectors.leftSidebarContent,
  'main-feed': githubHomeSelectors.mainContent,
  'right-sidebar': [...githubHomeSelectors.rightSidebar, ...githubHomeSelectors.rightColumn],
};

const blockSelectorRegistry = {
  'top-nav': githubHomeSelectors.topbar,
  'profile-summary': ['.dashboard-sidebar > div:first-child', '.feed-left-sidebar .dashboard-sidebar > *:first-child'],
  'recent-repos': [
    '.dashboard-sidebar .js-repos-container',
    '.dashboard-sidebar [data-filterable-for]',
  ],
  'copilot-prompt': [
    '.CopilotChatInputPartial-module__inputContainer__ULM7D',
    '[class*="CopilotChatInputPartial-module__inputContainer"]',
    '[class*="CopilotImmersiveEmbedded-module__CopilotChatContainer"]',
  ],
  'activity-feed': [
    '#conduit-feed-frame',
    '#dashboard-feed-frame',
    '.js-for-you-feed-items',
    'turbo-frame.js-for-you-feed-items',
    '[id*="feed-frame"]',
  ],
  'repo-updates': [],
  'pinned-repos': [],
  'issue-pr-updates': [],
  'trending-repos': [
    '.feed-right-sidebar a[href*="changelog"]',
    '.feed-right-column a[href*="changelog"]',
  ],
  'recommended-repos': [],
};

const blockTextMatchers = {
  'recent-repos': ['Top Repositories', 'Repositories'],
  'copilot-prompt': ['Copilot'],
  'activity-feed': ['For you', 'Feed'],
  'repo-updates': ['Repository updates', 'Repository Updates'],
  'pinned-repos': ['Pinned'],
  'issue-pr-updates': ['Issues', 'Pull requests'],
  'trending-repos': ['Latest changes', 'Latest from our changelog', 'Changelog'],
  'recommended-repos': ['Explore repositories', 'Recommended'],
};

const topbarActionLabels = ['Copilot', 'Create', 'Issues', 'Pull requests', 'Repositories', 'Inbox'];

const leftSidebarWidths = {
  narrow: '256px',
  default: '320px',
  wide: '336px',
};

const mainColumnWidths = {
  narrow: '760px',
  default: '900px',
  wide: '1040px',
};

const rightSidebarWidths = {
  narrow: '280px',
  default: '315px',
  wide: '356px',
};

let latestTemplate = null;
let availableTemplates = [];
let controllerCreated = false;
let customLeftSidebarWidthPx = null;
let templateListViewMode = 'preview';
let templateFilterOpen = false;
let templateSearchQuery = '';
let templateSortMode = 'updated';

function isGitHubDashboard() {
  return queryFirst(githubHomeSelectors.dashboardRoot) !== null;
}

function queryFirst(selectors, root = document) {
  for (const selector of selectors) {
    const element = root.querySelector(selector);

    if (element) {
      return element;
    }
  }

  return null;
}

function setStatus(text) {
  const status = document.querySelector(`#${CONTROLLER_ID} [data-git-reflow-status]`);

  if (status) {
    status.textContent = text;
  }
}

function setControllerHint(text) {
  const hint = document.querySelector(`#${CONTROLLER_ID} [data-git-reflow-hint]`);

  if (hint) {
    hint.textContent = text;
  }
}

function clampWidth(width) {
  return Math.min(MAX_LEFT_SIDEBAR_WIDTH, Math.max(MIN_LEFT_SIDEBAR_WIDTH, width));
}

function clampMainWidth(width) {
  return Math.min(MAX_MAIN_COLUMN_WIDTH, Math.max(MIN_MAIN_COLUMN_WIDTH, width));
}

function clampRightWidth(width) {
  return Math.min(MAX_RIGHT_SIDEBAR_WIDTH, Math.max(MIN_RIGHT_SIDEBAR_WIDTH, width));
}

function isObject(value) {
  return value !== null && typeof value === 'object' && !Array.isArray(value);
}

function normalizeTemplate(template) {
  if (!isObject(template)) {
    return DEFAULT_TEMPLATE;
  }

  return {
    ...template,
    columnLayout: {
      left: clampWidth(Number(template.columnLayout?.left) || DEFAULT_TEMPLATE.columnLayout.left),
      main: clampMainWidth(Number(template.columnLayout?.main) || DEFAULT_TEMPLATE.columnLayout.main),
      right: clampRightWidth(Number(template.columnLayout?.right) || DEFAULT_TEMPLATE.columnLayout.right),
    },
    leftSidebarResizeEnabled: template.leftSidebarResizeEnabled !== false,
    selectedVariationId: SUPPORTED_VARIATIONS.has(template.selectedVariationId)
      ? template.selectedVariationId
      : DEFAULT_TEMPLATE.selectedVariationId,
    blocks: Array.isArray(template.blocks) ? template.blocks.filter(isObject) : [],
    regions: Array.isArray(template.regions) ? template.regions : [],
  };
}

function createStarterBlockAppearances(theme) {
  return {
    'top-nav': {
      backgroundColor: theme.colors.topbar,
      innerBackgroundColor: theme.colors.panel,
      borderRadius: 0,
      padding: 12,
      elementGap: 10,
      fontSize: 13,
    },
    'profile-summary': {
      backgroundColor: theme.colors.panel,
      innerBackgroundColor: theme.colors.panelSoft,
      borderRadius: 14,
      padding: 14,
      marginY: 8,
      fontSize: 14,
    },
    'recent-repos': {
      backgroundColor: theme.colors.panel,
      innerBackgroundColor: theme.colors.panelSoft,
      borderRadius: 14,
      padding: 16,
      elementGap: 10,
      fontSize: 14,
    },
    'copilot-prompt': {
      backgroundColor: theme.colors.panelSoft,
      innerBackgroundColor: theme.colors.topbar,
      borderRadius: 18,
      padding: 18,
      marginY: 10,
      elementGap: 12,
      fontSize: 15,
    },
    'activity-feed': {
      backgroundColor: theme.colors.mainPanel,
      innerBackgroundColor: theme.colors.mainInner,
      borderRadius: 16,
      padding: 16,
      marginY: 10,
      elementGap: 14,
      fontSize: 14,
    },
    'repo-updates': {
      backgroundColor: theme.colors.panel,
      innerBackgroundColor: theme.colors.panelSoft,
      borderRadius: 16,
      padding: 16,
      marginY: 10,
      elementGap: 12,
    },
    'trending-repos': {
      backgroundColor: theme.colors.panel,
      innerBackgroundColor: theme.colors.panelSoft,
      borderRadius: 16,
      padding: 16,
      marginY: 8,
      elementGap: 12,
      fontSize: 13,
    },
  };
}

function createStarterTemplate(theme) {
  const blockAppearances = createStarterBlockAppearances(theme);

  return {
    id: theme.id,
    name: theme.name,
    description: theme.description,
    source: 'starter',
    version: 1,
    activeScreenId: 'github-home',
    screens: [
      {
        id: 'github-home',
        name: 'GitHub Home',
        providerRoute: 'github.com/',
        description: 'Logged-in GitHub dashboard home screen.',
      },
    ],
    regions: ['topbar', 'left-sidebar', 'main-feed', 'right-sidebar'],
    metadata: {
      provider: 'github',
      browserMappingKey: 'github.dashboard.reference',
      updatedAt: STARTER_TEMPLATE_UPDATED_AT,
    },
    blocks: STARTER_TEMPLATE_BLOCK_DEFINITIONS.map((block) => ({
      ...block,
      screenId: 'github-home',
      visible: STARTER_TEMPLATE_VISIBLE_BLOCKS.has(block.id),
      props: {
        ...block.props,
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
      backgroundColor: theme.pageBackgroundColor,
      leftSidebarBackgroundColor: theme.leftSidebarBackgroundColor,
    },
    updatedAt: STARTER_TEMPLATE_UPDATED_AT,
  };
}

function createStarterTemplateRecord(template) {
  const visibleBlocks = template.blocks.filter((block) => block.visible);

  return {
    id: template.id,
    name: template.name,
    description: template.description,
    thumbnail: '',
    collaborators: [],
    status: 'ACTIVE',
    source: 'starter',
    syncState: 'Ready to preview',
    updatedAt: 'Starter preset',
    owner: 'git-reflow',
    highlights: [
      'Styled GitHub Home preset',
      'github-default variation',
      `Columns ${template.columnLayout.left}/${template.columnLayout.main}/${template.columnLayout.right}`,
    ],
    sections: visibleBlocks.slice(0, 6).map((block, index) => ({
      id: block.id,
      label: block.title,
      kind: block.region === 'topbar' ? 'header' : block.region === 'main-feed' ? 'content' : 'sidebar',
      depth: index === 0 ? 0 : 1,
      description: block.extensionSlot ?? block.region,
      visible: block.visible,
    })),
  };
}

const starterTemplates = STARTER_TEMPLATE_THEMES.map(createStarterTemplate);
const starterTemplateRecords = starterTemplates.map(createStarterTemplateRecord);
const starterTemplatesById = new Map(starterTemplates.map((template) => [template.id, template]));

function mergeStarterTemplateRecords(remoteTemplates) {
  const remoteIds = new Set(remoteTemplates.map((template) => template.id));
  const unsavedStarterTemplates = starterTemplateRecords.filter((template) => !remoteIds.has(template.id));

  return [...unsavedStarterTemplates, ...remoteTemplates];
}

function hasExtensionContext() {
  try {
    return typeof chrome !== 'undefined' && Boolean(chrome.runtime?.id) && Boolean(chrome.storage?.local);
  } catch {
    return false;
  }
}

function hasRuntimeError() {
  try {
    return Boolean(chrome.runtime?.lastError);
  } catch {
    return true;
  }
}

function safeStorageGet(keys) {
  return new Promise((resolve) => {
    if (!hasExtensionContext()) {
      resolve({});
      return;
    }

    try {
      chrome.storage.local.get(keys, (items) => {
        if (hasRuntimeError()) {
          resolve({});
          return;
        }

        resolve(items ?? {});
      });
    } catch {
      resolve({});
    }
  });
}

function safeStorageSet(items) {
  if (!hasExtensionContext()) {
    return;
  }

  try {
    chrome.storage.local.set(items, () => {
      hasRuntimeError();
    });
  } catch {
    // The content script can outlive its extension context after a reload.
  }
}

function safeStorageRemove(keys) {
  if (!hasExtensionContext()) {
    return;
  }

  try {
    chrome.storage.local.remove(keys, () => {
      hasRuntimeError();
    });
  } catch {
    // The content script can outlive its extension context after a reload.
  }
}

function getText(value, fallback = '') {
  return typeof value === 'string' && value.trim() ? value.trim() : fallback;
}

function getArray(value) {
  return Array.isArray(value) ? value : [];
}

function getItemLimit(value, fallback = 8) {
  const parsed = Number(value);

  return Number.isFinite(parsed) ? Math.min(12, Math.max(1, Math.round(parsed))) : fallback;
}

function setImportantStyle(element, property, value) {
  if (element instanceof HTMLElement && typeof value === 'string') {
    element.style.setProperty(property, value, 'important');
  }
}

function removeStyleProperties(element, properties) {
  if (!(element instanceof HTMLElement)) {
    return;
  }

  properties.forEach((property) => element.style.removeProperty(property));
}

function applyWidthContract(element, width, mode = 'fixed') {
  if (!(element instanceof HTMLElement)) {
    return;
  }

  setImportantStyle(element, 'box-sizing', 'border-box');

  if (mode === 'max') {
    setImportantStyle(element, 'width', '100%');
    setImportantStyle(element, 'max-width', width);
    return;
  }

  setImportantStyle(element, 'width', width);
  setImportantStyle(element, 'min-width', width);
  setImportantStyle(element, 'max-width', width);
  setImportantStyle(element, 'flex-basis', width);
}

function applyAppearance(element, appearance) {
  if (!(element instanceof HTMLElement) || !isObject(appearance)) {
    return;
  }

  const marginY = Number(appearance.marginY);
  const padding = Number(appearance.padding);
  const elementGap = Number(appearance.elementGap);
  const fontSize = Number(appearance.fontSize);
  const borderRadius = Number(appearance.borderRadius);

  element.classList.add(APPEARANCE_CLASS);

  if (typeof appearance.backgroundColor === 'string') {
    element.style.setProperty('--git-reflow-block-background', appearance.backgroundColor);
    element.style.setProperty('background', appearance.backgroundColor, 'important');
    element.style.setProperty('background-color', appearance.backgroundColor, 'important');
  }

  if (typeof appearance.innerBackgroundColor === 'string') {
    element.style.setProperty('--git-reflow-block-inner-background', appearance.innerBackgroundColor);
  }

  if (typeof appearance.textColor === 'string') {
    element.style.setProperty('--git-reflow-block-text-color', appearance.textColor);
    element.style.setProperty('color', appearance.textColor, 'important');
  }

  if (typeof appearance.linkColor === 'string') {
    element.style.setProperty('--git-reflow-block-link-color', appearance.linkColor);
  }

  if (Number.isFinite(marginY)) {
    element.style.marginTop = `${Math.max(0, Math.min(48, marginY))}px`;
    element.style.marginBottom = `${Math.max(0, Math.min(48, marginY))}px`;
  }

  if (Number.isFinite(padding)) {
    const paddingValue = `${Math.max(0, Math.min(48, padding))}px`;
    element.style.setProperty('--git-reflow-block-padding', paddingValue);
    element.style.setProperty('padding', paddingValue, 'important');
  }

  if (Number.isFinite(elementGap)) {
    const gapValue = `${Math.max(0, Math.min(32, elementGap))}px`;
    element.style.setProperty('--git-reflow-block-gap', gapValue);
    element.style.setProperty('gap', gapValue, 'important');
  }

  if (typeof appearance.fontFamily === 'string') {
    element.style.setProperty('--git-reflow-block-font-family', appearance.fontFamily);
    element.style.setProperty('font-family', appearance.fontFamily, 'important');
  }

  if (Number.isFinite(fontSize)) {
    const fontSizeValue = `${Math.max(10, Math.min(24, fontSize))}px`;
    element.style.setProperty('--git-reflow-block-font-size', fontSizeValue);
    element.style.setProperty('font-size', fontSizeValue, 'important');
  }

  if (Number.isFinite(borderRadius)) {
    const radiusValue = `${Math.max(0, Math.min(32, borderRadius))}px`;
    element.style.setProperty('--git-reflow-block-radius', radiusValue);
    element.style.setProperty('border-radius', radiusValue, 'important');
  }
}

function clearAppearance(element) {
  if (!(element instanceof HTMLElement)) {
    return;
  }

  element.classList.remove(APPEARANCE_CLASS);
  element.classList.remove('git-reflow-activity-feed-card', 'git-reflow-activity-feed-item');
  element.style.removeProperty('background');
  element.style.removeProperty('background-color');
  element.style.removeProperty('margin-top');
  element.style.removeProperty('margin-bottom');
  element.style.removeProperty('padding');
  element.style.removeProperty('gap');
  element.style.removeProperty('font-family');
  element.style.removeProperty('font-size');
  element.style.removeProperty('border-radius');
  element.style.removeProperty('color');
  element.style.removeProperty('--git-reflow-block-background');
  element.style.removeProperty('--git-reflow-block-inner-background');
  element.style.removeProperty('--git-reflow-block-text-color');
  element.style.removeProperty('--git-reflow-block-link-color');
  element.style.removeProperty('--git-reflow-block-padding');
  element.style.removeProperty('--git-reflow-block-gap');
  element.style.removeProperty('--git-reflow-block-font-family');
  element.style.removeProperty('--git-reflow-block-font-size');
  element.style.removeProperty('--git-reflow-block-radius');
  element.style.removeProperty('--git-reflow-activity-card-background');
}

function applyTopbarAppearance(topbar, appearance) {
  applyAppearance(topbar, appearance);

  if (!(topbar instanceof HTMLElement) || !isObject(appearance)) {
    return;
  }

  const shell = topbar.querySelector('.AppHeader, .GlobalNav, header, [class*="Header"], [class*="GlobalNav"]');

  if (shell instanceof HTMLElement) {
    applyAppearance(shell, appearance);
  }
}

function applyInnerAppearance(element, appearance) {
  if (!(element instanceof HTMLElement) || !isObject(appearance) || typeof appearance.innerBackgroundColor !== 'string') {
    return;
  }

  element.style.setProperty('--git-reflow-block-inner-background', appearance.innerBackgroundColor);

  element
    .querySelectorAll([
      'button:not(.git-reflow-left-resizer)',
      'input',
      'textarea',
      'article',
      '.Box',
      '.Box-row',
      '.js-feed-item-component',
      '[class*="Card"]',
      '[class*="Box"]',
    ].join(', '))
    .forEach((target) => {
      if (target instanceof HTMLElement) {
        target.classList.add(APPEARANCE_CLASS);
        target.style.setProperty('background', appearance.innerBackgroundColor, 'important');
        target.style.setProperty('background-color', appearance.innerBackgroundColor, 'important');
      }
    });
}

function isVisibleCardLikeElement(element) {
  if (!(element instanceof HTMLElement)) {
    return false;
  }

  const rect = element.getBoundingClientRect();

  if (rect.width < 120 || rect.height < 32) {
    return false;
  }

  const style = window.getComputedStyle(element);
  const hasPaint =
    style.backgroundColor !== 'rgba(0, 0, 0, 0)' ||
    style.borderTopStyle !== 'none' ||
    parseFloat(style.borderTopLeftRadius) > 0;

  return hasPaint;
}

function getActivityFeedCardSurface(feedItem) {
  if (!(feedItem instanceof HTMLElement)) {
    return null;
  }

  const feedRect = feedItem.getBoundingClientRect();

  if (feedRect.width < 120 || feedRect.height < 32) {
    return null;
  }

  const shallowChildren = [...feedItem.children].filter((child) => child instanceof HTMLElement);
  const shallowGrandchildren = shallowChildren.flatMap((child) =>
    [...child.children].filter((grandchild) => grandchild instanceof HTMLElement),
  );
  const surfaceCandidates = [...shallowChildren, ...shallowGrandchildren]
    .filter((candidate) => candidate instanceof HTMLElement && isVisibleCardLikeElement(candidate))
    .map((candidate) => {
      const rect = candidate.getBoundingClientRect();
      const widthRatio = rect.width / feedRect.width;
      const heightRatio = rect.height / feedRect.height;
      const depth =
        candidate === feedItem
          ? 0
          : candidate.parentElement === feedItem
            ? 1
            : 2;

      return {
        element: candidate,
        score:
          depth * 1000000 +
          (widthRatio >= 0.68 ? 250000 : 0) +
          (heightRatio >= 0.55 ? 250000 : 0) +
          rect.width * rect.height,
      };
    })
    .filter(({ element }) => {
      const rect = element.getBoundingClientRect();

      return rect.width >= feedRect.width * 0.68 && rect.height >= feedRect.height * 0.55;
    })
    .sort((a, b) => b.score - a.score);

  return surfaceCandidates[0]?.element ?? null;
}

function applyActivityFeedRootBackground(element, appearance) {
  if (!isObject(appearance) || typeof appearance.backgroundColor !== 'string') {
    return [];
  }

  const roots = [
    element,
    ...document.querySelectorAll([
      '#conduit-feed-frame',
      '#dashboard-feed-frame',
      '.js-for-you-feed-items',
      'turbo-frame.js-for-you-feed-items',
      '[id*="feed-frame"]',
    ].join(', ')),
  ].filter((target, index, list) => target instanceof HTMLElement && list.indexOf(target) === index);

  roots.forEach((root) => {
    root.classList.add(APPEARANCE_CLASS);
    root.style.setProperty('--git-reflow-block-background', appearance.backgroundColor);
    root.style.setProperty('background', appearance.backgroundColor, 'important');
    root.style.setProperty('background-color', appearance.backgroundColor, 'important');
  });

  return roots;
}

function applyActivityFeedCardSurface(cardSurface, appearance) {
  if (!(cardSurface instanceof HTMLElement) || !isObject(appearance) || typeof appearance.innerBackgroundColor !== 'string') {
    return;
  }

  cardSurface.classList.add('git-reflow-activity-feed-card');
  cardSurface.classList.add(APPEARANCE_CLASS);
  cardSurface.style.setProperty('background', appearance.innerBackgroundColor, 'important');
  cardSurface.style.setProperty('background-color', appearance.innerBackgroundColor, 'important');

  const borderRadius = Number(appearance.borderRadius);
  if (Number.isFinite(borderRadius)) {
    cardSurface.style.setProperty('border-radius', `${Math.max(0, Math.min(32, borderRadius))}px`, 'important');
  }
}

function applyActivityFeedCardAppearance(element, appearance) {
  if (!(element instanceof HTMLElement) || !isObject(appearance) || typeof appearance.innerBackgroundColor !== 'string') {
    return;
  }

  element.style.setProperty('--git-reflow-activity-card-background', appearance.innerBackgroundColor);
  const roots = applyActivityFeedRootBackground(element, appearance);

  element.querySelectorAll('.git-reflow-activity-feed-card').forEach((target) => {
    if (target instanceof HTMLElement) {
      target.classList.remove('git-reflow-activity-feed-card');
      target.style.removeProperty('background');
      target.style.removeProperty('background-color');
    }
  });

  roots.forEach((root) => {
    root.querySelectorAll('.git-reflow-activity-feed-card').forEach((target) => {
      if (target instanceof HTMLElement) {
        target.classList.remove('git-reflow-activity-feed-card');
        target.style.removeProperty('background');
        target.style.removeProperty('background-color');
      }
    });
    root.querySelectorAll('.git-reflow-activity-feed-item').forEach((target) => {
      if (target instanceof HTMLElement) {
        target.classList.remove('git-reflow-activity-feed-item');
        target.style.removeProperty('background');
        target.style.removeProperty('background-color');
      }
    });
  });

  element.querySelectorAll('.git-reflow-activity-feed-item').forEach((target) => {
    if (target instanceof HTMLElement) {
      target.classList.remove('git-reflow-activity-feed-item');
      target.style.removeProperty('background');
      target.style.removeProperty('background-color');
    }
  });

  roots.forEach((root) => {
    root.querySelectorAll('.feed-item-content').forEach((cardSurface) => {
      applyActivityFeedCardSurface(cardSurface, appearance);
    });
  });

  const feedItemSelector = [
    '.js-feed-item-component',
    'article',
    '[class*="FeedItem"]',
    '[class*="feed-item"]',
    '[class*="TimelineItem"]',
    '[data-testid*="feed-item"]',
  ].join(', ');

  const candidates = [...element.querySelectorAll(feedItemSelector)].filter((target) => {
    if (!(target instanceof HTMLElement)) {
      return false;
    }

    if (target.matches('article') && target.closest('.js-feed-item-component, [class*="FeedItem"], [class*="feed-item"], [class*="TimelineItem"], [data-testid*="feed-item"]') !== target) {
      return false;
    }

    const parentFeedItem = target.parentElement?.closest(feedItemSelector);

    return !parentFeedItem || !element.contains(parentFeedItem);
  });

  candidates.forEach((target) => {
    const cardSurface = getActivityFeedCardSurface(target);

    if (!(cardSurface instanceof HTMLElement)) {
      return;
    }

    if (target !== cardSurface) {
      target.classList.add('git-reflow-activity-feed-item');
      target.style.setProperty('background', 'transparent', 'important');
      target.style.setProperty('background-color', 'transparent', 'important');
    }

    const existingCard = cardSurface.closest('.git-reflow-activity-feed-card');
    if (existingCard !== null && existingCard !== cardSurface) {
      return;
    }

    applyActivityFeedCardSurface(cardSurface, appearance);
  });
}

function reapplyActivityFeedAppearance(target, appearance) {
  [150, 500, 1200, 2500].forEach((delay) => {
    window.setTimeout(() => {
      applyActivityFeedCardAppearance(target, appearance);
      applyTypographyAppearance(target, appearance);
      applyElementSpacing(target, appearance);
    }, delay);
  });
}

function applyTypographyAppearance(element, appearance) {
  if (!(element instanceof HTMLElement) || !isObject(appearance)) {
    return;
  }

  const fontSize = Number(appearance.fontSize);
  const fontFamily = typeof appearance.fontFamily === 'string' ? appearance.fontFamily : '';
  const textColor = typeof appearance.textColor === 'string' ? appearance.textColor : '';
  const linkColor = typeof appearance.linkColor === 'string' ? appearance.linkColor : '';

  if (!Number.isFinite(fontSize) && !fontFamily && !textColor && !linkColor) {
    return;
  }

  element
    .querySelectorAll('h1, h2, h3, h4, p, a, span, strong, em, small, time, label, input, textarea, button')
    .forEach((target) => {
      if (!(target instanceof HTMLElement)) {
        return;
      }

      target.classList.add(APPEARANCE_CLASS);

      if (Number.isFinite(fontSize)) {
        target.style.setProperty('font-size', `${Math.max(10, Math.min(24, fontSize))}px`, 'important');
      }

      if (fontFamily) {
        target.style.setProperty('font-family', fontFamily, 'important');
      }

      if (textColor) {
        target.style.setProperty('color', textColor, 'important');
      }

      if (linkColor && target.matches('a, [role="link"]')) {
        target.style.setProperty('color', linkColor, 'important');
      }
    });
}

function applyElementSpacing(element, appearance) {
  if (!(element instanceof HTMLElement) || !isObject(appearance)) {
    return;
  }

  const elementGap = Number(appearance.elementGap);

  if (!Number.isFinite(elementGap)) {
    return;
  }

  element
    .querySelectorAll('.git-reflow-block-list, ul, ol, [role="list"], [class*="list"], [class*="List"]')
    .forEach((target) => {
      if (target instanceof HTMLElement) {
        target.classList.add(APPEARANCE_CLASS);
        target.style.setProperty('gap', `${Math.max(0, Math.min(32, elementGap))}px`, 'important');
      }
    });
}

function applyPageAppearance(appearance) {
  if (!isObject(appearance)) {
    return;
  }

  if (typeof appearance.backgroundColor === 'string') {
    document.documentElement.style.setProperty('--git-reflow-page-background', appearance.backgroundColor);

    const targets = [
      document.body,
      document.documentElement,
      queryFirst(githubHomeSelectors.dashboardRoot),
      queryFirst(['.application-main', '#js-pjax-container', '[data-turbo-body]']),
      queryFirst(githubHomeSelectors.feedMain),
      queryFirst(githubHomeSelectors.mainContent),
      queryFirst(githubHomeSelectors.rightSidebar),
      queryFirst(githubHomeSelectors.rightColumn),
    ];

    targets.forEach((target) => {
      if (target instanceof HTMLElement) {
        target.classList.add(APPEARANCE_CLASS);
        target.style.setProperty('background', appearance.backgroundColor, 'important');
        target.style.setProperty('background-color', appearance.backgroundColor, 'important');
      }
    });
  }

  if (typeof appearance.leftSidebarBackgroundColor === 'string') {
    document.documentElement.style.setProperty('--git-reflow-left-sidebar-background', appearance.leftSidebarBackgroundColor);

    [
      queryFirst(githubHomeSelectors.leftSidebar),
      queryFirst(githubHomeSelectors.leftSidebarContent),
    ].forEach((target) => {
      if (target instanceof HTMLElement) {
        target.classList.add(APPEARANCE_CLASS);
        target.style.setProperty('background', appearance.leftSidebarBackgroundColor, 'important');
        target.style.setProperty('background-color', appearance.leftSidebarBackgroundColor, 'important');
      }
    });
  }
}

function getAppearanceTargets(block, element) {
  if (!(element instanceof HTMLElement)) {
    return [];
  }

  if (block.type === 'top-nav') {
    const topbar = queryFirst(githubHomeSelectors.topbar);
    return topbar instanceof HTMLElement ? [topbar] : [element];
  }

  if (isRightSidebarBlock(block)) {
    return [element];
  }

  const selectorTarget = queryFirst(blockSelectorRegistry[block.type] ?? [], document);

  if (selectorTarget instanceof HTMLElement) {
    return [selectorTarget];
  }

  return [element];
}

function findClosestSection(element) {
  if (!(element instanceof HTMLElement)) {
    return null;
  }

  return element.closest('section, article, turbo-frame, react-partial, aside, header, div') ?? element;
}

function findRegionBlockRoot(element, regionRoot) {
  if (!(element instanceof HTMLElement)) {
    return null;
  }

  if (!(regionRoot instanceof HTMLElement) || element === regionRoot) {
    return findClosestSection(element);
  }

  let current = element;

  while (current.parentElement && current.parentElement !== regionRoot && current.parentElement !== document.body) {
    current = current.parentElement;
  }

  return current.parentElement === regionRoot ? current : findClosestSection(element);
}

function isRightSidebarBlock(block) {
  return block?.region === 'right-sidebar';
}

function findRightSidebarCardRoot(element, regionRoot) {
  if (!(element instanceof HTMLElement)) {
    return null;
  }

  const rightRoot = regionRoot instanceof HTMLElement
    ? regionRoot
    : queryFirst(regionContainers['right-sidebar']);

  if (!(rightRoot instanceof HTMLElement)) {
    return findClosestSection(element);
  }

  let current = element;

  while (current.parentElement && current.parentElement !== rightRoot && current.parentElement !== document.body) {
    const parent = current.parentElement;
    const style = window.getComputedStyle(current);
    const rect = current.getBoundingClientRect();
    const hasCardShape =
      rect.width >= 180 &&
      rect.height >= 80 &&
      (
        parseFloat(style.borderTopLeftRadius) > 0 ||
        style.borderStyle !== 'none' ||
        style.backgroundColor !== 'rgba(0, 0, 0, 0)'
      );

    if (hasCardShape && parent === rightRoot) {
      return current;
    }

    current = parent;
  }

  if (current.parentElement === rightRoot) {
    return current;
  }

  return findClosestSection(element);
}

function findElementByText(root, texts) {
  if (!(root instanceof Element) || !Array.isArray(texts) || texts.length === 0) {
    return null;
  }

  const candidates = root.querySelectorAll('h1, h2, h3, h4, strong, a, span, div');

  for (const candidate of candidates) {
    const content = candidate.textContent?.replace(/\s+/g, ' ').trim() ?? '';

    if (texts.some((text) => content.includes(text))) {
      return findClosestSection(candidate);
    }
  }

  return null;
}

function findBlockElement(block) {
  const selectors = blockSelectorRegistry[block.type] ?? [];
  const regionRoot = queryFirst(regionContainers[block.region] ?? []);

  for (const selector of selectors) {
    const element = queryFirst([selector], regionRoot ?? document);

    if (element instanceof HTMLElement) {
      return isRightSidebarBlock(block)
        ? findRightSidebarCardRoot(element, regionRoot)
        : findRegionBlockRoot(element, regionRoot);
    }
  }

  const textMatched = findElementByText(regionRoot ?? document, blockTextMatchers[block.type]);
  if (!(textMatched instanceof HTMLElement)) {
    return null;
  }

  return isRightSidebarBlock(block)
    ? findRightSidebarCardRoot(textMatched, regionRoot)
    : findRegionBlockRoot(textMatched, regionRoot);
}

function getRegionContainer(region) {
  const container = queryFirst(regionContainers[region] ?? []);
  return container instanceof HTMLElement ? container : null;
}

function rememberText(element) {
  if (!element.hasAttribute(ORIGINAL_TEXT_ATTR)) {
    element.setAttribute(ORIGINAL_TEXT_ATTR, element.textContent ?? '');
  }
}

function rememberPlaceholder(element) {
  if (!element.hasAttribute(ORIGINAL_PLACEHOLDER_ATTR)) {
    element.setAttribute(ORIGINAL_PLACEHOLDER_ATTR, element.getAttribute('placeholder') ?? '');
  }
}

function setTextIfPossible(element, text) {
  if (!(element instanceof HTMLElement) || !text) {
    return;
  }

  rememberText(element);
  element.textContent = text;
}

function setPlaceholderIfPossible(element, placeholder) {
  if (!(element instanceof HTMLInputElement || element instanceof HTMLTextAreaElement) || !placeholder) {
    return;
  }

  rememberPlaceholder(element);
  element.setAttribute('placeholder', placeholder);
}

function createTextElement(tagName, text, className = '') {
  const element = document.createElement(tagName);
  element.textContent = text;

  if (className) {
    element.className = className;
  }

  return element;
}

function createRepoList(repositories = []) {
  const list = document.createElement('div');
  list.className = 'git-reflow-block-list';

  repositories.forEach((repo) => {
    const item = document.createElement('a');
    item.href = `/${encodeURIComponent(getText(repo.name, 'repository')).replace('%2F', '/')}`;
    item.className = 'git-reflow-block-row';
    item.textContent = getText(repo.name, 'Repository');

    const meta = getText(repo.visibility || repo.language || repo.reason || repo.stars);
    if (meta) {
      item.append(createTextElement('span', meta));
    }

    list.append(item);
  });

  return list;
}

function createGeneratedBlock(block) {
  const props = isObject(block.props) ? block.props : {};
  const itemLimit = getItemLimit(props.itemLimit, 8);
  const wrapper = document.createElement('section');
  wrapper.className = `${BLOCK_CLASS} ${GENERATED_BLOCK_CLASS}`;
  wrapper.dataset.gitReflowBlockId = block.id;
  wrapper.dataset.gitReflowBlockType = block.type;
  applyAppearance(wrapper, props.appearance);

  const title = document.createElement('h2');
  title.textContent = getText(block.title, block.type);
  wrapper.append(title);

  if (block.type === 'recent-repos' || block.type === 'pinned-repos' || block.type === 'recommended-repos') {
    wrapper.append(createRepoList(getArray(props.repositories).slice(0, itemLimit)));
  } else if (block.type === 'activity-feed') {
    const list = document.createElement('div');
    list.className = 'git-reflow-block-list';
    getArray(props.events).slice(0, itemLimit).forEach((event) => {
      const item = document.createElement('article');
      item.className = 'git-reflow-block-row';
      item.textContent = `${getText(event.actor, 'Someone')} ${getText(event.action)} ${getText(event.subject)}`;
      list.append(item);
    });
    wrapper.append(list);
  } else if (block.type === 'repo-updates') {
    const list = document.createElement('div');
    list.className = 'git-reflow-block-list';
    getArray(props.updates).slice(0, itemLimit).forEach((update) => {
      const item = document.createElement('article');
      item.className = 'git-reflow-block-row';
      item.textContent = `${getText(update.status)} ${getText(update.repo)} ${getText(update.message)}`;
      list.append(item);
    });
    wrapper.append(list);
  } else if (block.type === 'issue-pr-updates') {
    const list = document.createElement('div');
    list.className = 'git-reflow-block-list';
    getArray(props.items).slice(0, itemLimit).forEach((item) => {
      const row = document.createElement('button');
      row.type = 'button';
      row.className = 'git-reflow-block-row';
      row.textContent = `${getText(item.label)} ${Number(item.count) || 0}`;
      list.append(row);
    });
    wrapper.append(list);
  } else if (block.type === 'trending-repos') {
    wrapper.append(createRepoList(getArray(props.repositories).slice(0, itemLimit)));
  } else if (block.type === 'copilot-prompt') {
    wrapper.append(createTextElement('p', getText(props.placeholder, 'Ask Copilot from your saved template.')));
    const chips = getArray(props.chips);
    if (chips.length) {
      const chipList = document.createElement('div');
      chipList.className = 'git-reflow-chip-list';
      chips.slice(0, 6).forEach((chip) => chipList.append(createTextElement('span', getText(chip))));
      wrapper.append(chipList);
    }
  } else if (block.type === 'profile-summary') {
    wrapper.append(createTextElement('strong', getText(props.name, 'Profile')));
    wrapper.append(createTextElement('p', getText(props.handle || props.bio, 'GitHub dashboard context')));
  }

  return wrapper;
}

function getOrCreateGeneratedBlock(block) {
  const existing = document.querySelector(`.${GENERATED_BLOCK_CLASS}[data-git-reflow-block-id="${CSS.escape(block.id)}"]`);

  if (existing instanceof HTMLElement) {
    existing.replaceChildren(...createGeneratedBlock(block).childNodes);
    return existing;
  }

  return createGeneratedBlock(block);
}

function applyTopbarProps(block) {
  const props = isObject(block.props) ? block.props : {};
  const contextElement = queryFirst(githubHomeSelectors.topbarContext);
  const searchElement = queryFirst(githubHomeSelectors.topbarSearch);
  const topbar = queryFirst(githubHomeSelectors.topbar);

  setTextIfPossible(contextElement, getText(props.context));
  setPlaceholderIfPossible(searchElement, getText(props.searchPlaceholder));

  if (!(topbar instanceof HTMLElement)) {
    return;
  }

  applyTopbarAppearance(topbar, props.appearance);

  topbar.querySelectorAll('.git-reflow-topbar-links').forEach((element) => element.remove());

  const links = getArray(props.links);
  if (links.length) {
    const nav = document.createElement('nav');
    nav.className = 'git-reflow-topbar-links';
    nav.setAttribute('aria-label', 'git-reflow template links');

    links.slice(0, 6).forEach((link) => {
      const anchor = document.createElement('a');
      anchor.href = `/${encodeURIComponent(getText(link).toLowerCase().replace(/\s+/g, '-'))}`;
      anchor.textContent = getText(link);
      nav.append(anchor);
    });

    topbar.append(nav);
  }

  const actions = getArray(props.actions).map((action) => getText(action));
  if (actions.length) {
    topbarActionLabels.forEach((label) => {
      topbar
        .querySelectorAll(`button[aria-label*="${label}"], a[aria-label*="${label}"], button[title*="${label}"], a[title*="${label}"]`)
        .forEach((element) => {
          if (element instanceof HTMLElement) {
            element.classList.toggle(HIDDEN_CLASS, !actions.includes(label));
          }
        });
    });
  }
}

function applyBlockProps(block, element) {
  const props = isObject(block.props) ? block.props : {};

  if (block.type === 'top-nav') {
    applyTopbarProps(block);
    const topbar = queryFirst(githubHomeSelectors.topbar);
    applyInnerAppearance(topbar, props.appearance);
    applyTypographyAppearance(topbar, props.appearance);
    return;
  }

  getAppearanceTargets(block, element).forEach((target) => {
    applyAppearance(target, props.appearance);
    if (block.type === 'activity-feed') {
      applyActivityFeedCardAppearance(target, props.appearance);
      reapplyActivityFeedAppearance(target, props.appearance);
    } else {
      applyInnerAppearance(target, props.appearance);
    }
    applyTypographyAppearance(target, props.appearance);
    applyElementSpacing(target, props.appearance);
  });

  if (block.type === 'copilot-prompt') {
    const input = element?.querySelector('textarea, input');
    setPlaceholderIfPossible(input, getText(props.placeholder));
  }

  if (block.type === 'recent-repos') {
    const input = element?.querySelector('input[type="text"], input[type="search"], input');
    setPlaceholderIfPossible(input, getText(props.searchPlaceholder));

    const rows = element?.querySelectorAll('li, a, [role="listitem"], .Box-row') ?? [];
    const itemLimit = getItemLimit(props.itemLimit, rows.length || 8);

    rows.forEach((row, index) => {
      if (row instanceof HTMLElement) {
        row.classList.toggle(HIDDEN_CLASS, index >= itemLimit);
      }
    });
  }
}

function applyTemplateBlocks(template) {
  document.querySelectorAll(`.${HIDDEN_CLASS}`).forEach((element) => {
    element.classList.remove(HIDDEN_CLASS);
  });
  document.querySelectorAll(`.${APPEARANCE_CLASS}`).forEach(clearAppearance);
  document.querySelectorAll(`.${GENERATED_BLOCK_CLASS}`).forEach((element) => element.remove());
  document.querySelectorAll('.git-reflow-topbar-links').forEach((element) => element.remove());
  document.querySelectorAll(`.${BLOCK_CLASS}`).forEach((element) => {
    element.classList.remove(BLOCK_CLASS, HIDDEN_CLASS);
    element.style.removeProperty('order');
    clearAppearance(element);
    delete element.dataset.gitReflowBlockId;
    delete element.dataset.gitReflowBlockType;
  });
  document.querySelectorAll('.git-reflow-region-container').forEach((element) => {
    element.classList.remove('git-reflow-region-container');
  });

  const blocks = Array.isArray(template.blocks) ? template.blocks : [];
  const visibleByRegion = new Map();

  blocks.forEach((block) => {
    if (!block.region || !block.type) {
      return;
    }

    const regionBlocks = visibleByRegion.get(block.region) ?? [];
    regionBlocks.push(block);
    visibleByRegion.set(block.region, regionBlocks);
  });

  visibleByRegion.forEach((regionBlocks, region) => {
    const container = getRegionContainer(region);

    if (container && region !== 'topbar') {
      container.classList.add('git-reflow-region-container');
    }

    regionBlocks.forEach((block, index) => {
      let element = findBlockElement(block);

      if (!(element instanceof HTMLElement) && block.visible !== false && block.type !== 'top-nav' && container) {
        element = getOrCreateGeneratedBlock(block);
        container.append(element);
      }

      if (!(element instanceof HTMLElement)) {
        return;
      }

      element.classList.add(BLOCK_CLASS);
      element.dataset.gitReflowBlockId = block.id;
      element.dataset.gitReflowBlockType = block.type;
      element.style.order = String(index);
      element.classList.toggle(HIDDEN_CLASS, block.visible === false);

      applyBlockProps(block, element);
    });
  });
}

function getStoredLeftSidebarWidth() {
  return safeStorageGet([LEFT_WIDTH_STORAGE_KEY]).then((items) => Number(items[LEFT_WIDTH_STORAGE_KEY]) || null);
}

function setStoredLeftSidebarWidth(width) {
  safeStorageSet({ [LEFT_WIDTH_STORAGE_KEY]: width });
}

function clearStoredLeftSidebarWidth() {
  safeStorageRemove([LEFT_WIDTH_STORAGE_KEY]);
}

function getStoredExtensionState() {
  return safeStorageGet([AUTH_TOKEN_STORAGE_KEY, SELECTED_TEMPLATE_STORAGE_KEY]).then((items) => ({
    token: typeof items[AUTH_TOKEN_STORAGE_KEY] === 'string' ? items[AUTH_TOKEN_STORAGE_KEY] : '',
    selectedTemplateId:
      typeof items[SELECTED_TEMPLATE_STORAGE_KEY] === 'string' ? items[SELECTED_TEMPLATE_STORAGE_KEY] : '',
  }));
}

function setStoredAuthToken(token) {
  safeStorageSet({ [AUTH_TOKEN_STORAGE_KEY]: token });
}

function setStoredSelectedTemplateId(templateId) {
  safeStorageSet({ [SELECTED_TEMPLATE_STORAGE_KEY]: templateId });
}

function getAuthHeaders(token) {
  return token
    ? {
        Accept: 'application/json',
        Authorization: `Bearer ${token}`,
      }
    : {
        Accept: 'application/json',
      };
}

async function fetchJson(path, token) {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    cache: 'no-store',
    headers: getAuthHeaders(token),
  });

  if (!response.ok) {
    throw new Error(`HTTP ${response.status}`);
  }

  return response.json();
}

async function postJson(path, body, token) {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    body: JSON.stringify(body),
    cache: 'no-store',
    headers: {
      'Content-Type': 'application/json',
      ...getAuthHeaders(token),
    },
    method: 'POST',
  });

  if (!response.ok) {
    throw new Error(`HTTP ${response.status}`);
  }

  return response.json();
}

function recordTemplateUsage(token, template) {
  if (!token || !isObject(template) || !template.id || !template.name) {
    return;
  }

  postJson('/api/template-usage', {
    templateId: template.id,
    templateName: template.name,
  }, token).catch(() => {
    // Usage stats should never block applying a preview.
  });
}

function getControllerElement(selector) {
  return document.querySelector(`#${CONTROLLER_ID} ${selector}`);
}

function setTokenInputValue(token) {
  const input = getControllerElement('[data-git-reflow-token]');

  if (input instanceof HTMLInputElement && input.value !== token) {
    input.value = token;
  }
}

function setTemplateSelectOptions(selectedTemplateId = '') {
  const list = getControllerElement('[data-git-reflow-template-list]');
  const count = getControllerElement('[data-git-reflow-template-count]');

  if (!(list instanceof HTMLElement)) {
    return;
  }

  list.replaceChildren();

  const templates = getVisibleTemplateRecords();

  if (count instanceof HTMLElement) {
    count.textContent = `${templates.length}/${availableTemplates.length}`;
  }

  if (templates.length === 0) {
    const empty = document.createElement('p');
    empty.className = 'git-reflow-empty-state';
    empty.textContent = availableTemplates.length === 0 ? 'No saved templates yet.' : 'No matching templates.';
    list.append(empty);
    return;
  }

  for (const template of templates) {
    const item = document.createElement('button');
    item.className = ['git-reflow-template-item', template.id === selectedTemplateId ? 'is-active' : '']
      .join(' ')
      .trim();
    item.type = 'button';
    item.dataset.gitReflowTemplateId = template.id;
    item.innerHTML = `
      <span class="git-reflow-template-item__content">
        <strong>${escapeHtml(template.name ?? template.id)}</strong>
        ${getTemplateRecordPreviewHtml(template)}
      </span>
      <small class="git-reflow-template-item__action">${template.id === selectedTemplateId ? 'Previewing' : 'Preview'}</small>
      <em class="git-reflow-template-item__updated">${escapeHtml(template.updatedAt ?? 'Not synced yet')}</em>
    `;
    list.append(item);
  }
}

function getTemplateSearchValue(template) {
  return [
    template.name,
    template.description,
    template.owner,
    template.updatedAt,
    ...(Array.isArray(template.highlights) ? template.highlights : []),
    ...(Array.isArray(template.sections)
      ? template.sections.map((section) => `${section?.label ?? ''} ${section?.description ?? ''}`)
      : []),
  ].join(' ').toLowerCase();
}

function getTemplateUpdatedSortValue(template) {
  if (template?.updatedAt === 'Starter preset') {
    return 1;
  }

  const timestamp = new Date(String(template?.updatedAt ?? '').replace(/^Updated /, '')).getTime();

  return Number.isFinite(timestamp) ? timestamp : 0;
}

function getVisibleTemplateRecords() {
  const query = templateSearchQuery.trim().toLowerCase();
  const filteredTemplates = query
    ? availableTemplates.filter((template) => getTemplateSearchValue(template).includes(query))
    : availableTemplates;

  return [...filteredTemplates].sort((a, b) => {
    if (templateSortMode === 'name') {
      return String(a.name ?? '').localeCompare(String(b.name ?? ''));
    }

    if (templateSortMode === 'starter') {
      return Number(b.source === 'starter') - Number(a.source === 'starter')
        || String(a.name ?? '').localeCompare(String(b.name ?? ''));
    }

    return getTemplateUpdatedSortValue(b) - getTemplateUpdatedSortValue(a)
      || String(a.name ?? '').localeCompare(String(b.name ?? ''));
  });
}

function syncTemplateFilterControls() {
  const controller = document.getElementById(CONTROLLER_ID);
  const searchInput = getControllerElement('[data-git-reflow-template-search]');
  const sortSelect = getControllerElement('[data-git-reflow-template-sort]');
  const filterButton = getControllerElement('[data-git-reflow-filter-toggle]');
  const filterPanel = getControllerElement('[data-git-reflow-filter-panel]');

  if (controller instanceof HTMLElement) {
    controller.dataset.gitReflowFilterOpen = templateFilterOpen ? 'true' : 'false';
  }

  if (filterButton instanceof HTMLButtonElement) {
    filterButton.classList.toggle('is-active', templateFilterOpen);
    filterButton.setAttribute('aria-expanded', String(templateFilterOpen));
  }

  if (filterPanel instanceof HTMLElement) {
    filterPanel.hidden = !templateFilterOpen;
  }

  if (searchInput instanceof HTMLInputElement && searchInput.value !== templateSearchQuery) {
    searchInput.value = templateSearchQuery;
  }

  if (sortSelect instanceof HTMLSelectElement && sortSelect.value !== templateSortMode) {
    sortSelect.value = templateSortMode;
  }
}

function setTemplateFilterOpen(open) {
  templateFilterOpen = open;
  syncTemplateFilterControls();
}

function getPreviewBlock(template, blockType) {
  return Array.isArray(template?.preview?.blocks)
    ? template.preview.blocks.find((block) => block?.type === blockType)
    : undefined;
}

function getPreviewBlockAppearance(template, blockType) {
  const appearance = getPreviewBlock(template, blockType)?.appearance;

  return isObject(appearance) ? appearance : undefined;
}

function getStringValue(value) {
  return typeof value === 'string' && value.trim() ? value : undefined;
}

function getNumberValue(value) {
  const numberValue = Number(value);

  return Number.isFinite(numberValue) ? numberValue : undefined;
}

function getPreviewTheme(template) {
  const value = `${template?.id ?? ''} ${template?.name ?? ''}`.toLowerCase();
  const pageAppearance = isObject(template?.preview?.pageAppearance) ? template.preview.pageAppearance : undefined;
  const topbarAppearance = getPreviewBlockAppearance(template, 'top-nav');
  const leftAppearance =
    getPreviewBlockAppearance(template, 'recent-repos') ?? getPreviewBlockAppearance(template, 'profile-summary');
  const mainAppearance =
    getPreviewBlockAppearance(template, 'activity-feed') ?? getPreviewBlockAppearance(template, 'copilot-prompt');
  const rightAppearance =
    getPreviewBlockAppearance(template, 'trending-repos') ?? getPreviewBlockAppearance(template, 'repo-updates');
  const backgroundColor = getStringValue(pageAppearance?.backgroundColor);
  const leftSidebarBackgroundColor = getStringValue(pageAppearance?.leftSidebarBackgroundColor);
  const topbarColor = getStringValue(topbarAppearance?.backgroundColor);
  const panelColor = getStringValue(leftAppearance?.backgroundColor) ?? leftSidebarBackgroundColor;
  const softColor =
    getStringValue(leftAppearance?.innerBackgroundColor) ??
    getStringValue(rightAppearance?.innerBackgroundColor);
  const mainColor = getStringValue(mainAppearance?.backgroundColor);
  const mainInnerColor = getStringValue(mainAppearance?.innerBackgroundColor);

  if (backgroundColor || topbarColor || panelColor || mainColor) {
    return {
      background: backgroundColor ?? '#dceafe',
      topbar: topbarColor ?? panelColor ?? '#101827',
      left: leftSidebarBackgroundColor ?? panelColor ?? topbarColor ?? '#172033',
      panel: panelColor ?? topbarColor ?? '#172033',
      soft: softColor ?? mainInnerColor ?? '#22304a',
      main: mainColor ?? panelColor ?? '#111827',
      accent: mainInnerColor ?? softColor ?? '#5b8def',
      right: getStringValue(rightAppearance?.backgroundColor) ?? panelColor ?? '#172033',
      text: '#e0f2fe',
    };
  }

  if (value.includes('red')) {
    return {
      background: '#f3d9e0',
      topbar: '#2a171a',
      left: '#3a2024',
      panel: '#3a2024',
      soft: '#553239',
      main: '#2c181c',
      accent: '#c45a6b',
      right: '#3a2024',
      text: '#ffe4ea',
    };
  }

  if (value.includes('green')) {
    return {
      background: '#d8efe4',
      topbar: '#10231c',
      left: '#183329',
      panel: '#183329',
      soft: '#25483b',
      main: '#142820',
      accent: '#3e8b64',
      right: '#183329',
      text: '#def7e9',
    };
  }

  return {
    background: '#dceafe',
    topbar: '#101827',
    left: '#172033',
    panel: '#172033',
    soft: '#22304a',
    main: '#111827',
    accent: '#5b8def',
    right: '#172033',
    text: '#e0f2fe',
  };
}

function getPreviewStyleAttribute(template) {
  const theme = getPreviewTheme(template);

  return [
    ['--preview-background', theme.background],
    ['--preview-topbar', theme.topbar],
    ['--preview-left', theme.left],
    ['--preview-panel', theme.panel],
    ['--preview-soft', theme.soft],
    ['--preview-main', theme.main],
    ['--preview-accent', theme.accent],
    ['--preview-right', theme.right],
    ['--preview-text', theme.text],
  ].map(([name, value]) => `${name}: ${escapeAttribute(value)}`).join('; ');
}

function getBlockMiniStyleAttribute(block) {
  const appearance = isObject(block?.appearance) ? block.appearance : undefined;

  if (!appearance) {
    return '';
  }

  const styles = [];
  const backgroundColor = getStringValue(appearance.backgroundColor);
  const innerBackgroundColor = getStringValue(appearance.innerBackgroundColor);
  const borderRadius = getNumberValue(appearance.borderRadius);
  const elementGap = getNumberValue(appearance.elementGap);

  if (backgroundColor) {
    styles.push(`background: ${escapeAttribute(backgroundColor)}`);
  }

  if (innerBackgroundColor) {
    styles.push(`--preview-card-inner: ${escapeAttribute(innerBackgroundColor)}`);
  }

  if (borderRadius !== undefined) {
    styles.push(`border-radius: ${Math.max(3, Math.min(12, borderRadius * 0.45))}px`);
  }

  if (elementGap !== undefined) {
    styles.push(`gap: ${Math.max(3, Math.min(8, elementGap * 0.45))}px`);
  }

  return styles.length ? ` style="${styles.join('; ')}"` : '';
}

function formatPreviewLabel(value) {
  return String(value ?? '')
    .replace(/[-_]/g, ' ')
    .replace(/\b\w/g, (letter) => letter.toUpperCase())
    .slice(0, 18);
}

function createPreviewSection(id, label, kind = 'content') {
  return {
    id,
    label,
    kind,
    visible: true,
  };
}

function getTemplateRecordPreviewHtml(template) {
  const visibleSections = Array.isArray(template.sections)
    ? template.sections.filter((section) => section?.visible !== false)
    : [];
  const highlights = Array.isArray(template.highlights) ? template.highlights : [];
  const fallbackSections = visibleSections.length
    ? visibleSections
    : highlights.map((highlight, index) => createPreviewSection(`${template.id}-highlight-${index}`, highlight));
  const headerSections = visibleSections.filter((section) => section.kind === 'header');
  const sidebarSections = visibleSections.filter((section) => section.kind === 'sidebar');
  const contentSections = visibleSections.filter((section) => section.kind === 'content');
  const topbarLabel = headerSections[0]?.label ?? 'Dashboard';
  const leftLabels = (sidebarSections.length ? sidebarSections : fallbackSections).slice(0, 4);
  const mainLabels = (contentSections.length ? contentSections : fallbackSections).slice(0, 3);
  const rightLabels = (sidebarSections.length > 2 ? sidebarSections.slice(2) : fallbackSections).slice(0, 3);
  const topbarBlock = getPreviewBlock(template, 'top-nav');
  const leftBlock = getPreviewBlock(template, 'recent-repos') ?? getPreviewBlock(template, 'profile-summary');
  const copilotBlock = getPreviewBlock(template, 'copilot-prompt');
  const feedBlock = getPreviewBlock(template, 'activity-feed');
  const rightBlock = getPreviewBlock(template, 'trending-repos') ?? getPreviewBlock(template, 'repo-updates');
  const updateBlock = getPreviewBlock(template, 'repo-updates');
  const columnLayout = isObject(template.preview?.columnLayout) ? template.preview.columnLayout : undefined;
  const gridTemplateColumns =
    columnLayout?.left && columnLayout?.main && columnLayout?.right
      ? `${Number(columnLayout.left)}fr ${Number(columnLayout.main)}fr ${Number(columnLayout.right)}fr`
      : '';
  const bodyStyle = gridTemplateColumns ? ` style="grid-template-columns: ${escapeAttribute(gridTemplateColumns)}"` : '';
  const leftRows = leftLabels.slice(0, 5).map((section) => `
    <div>
      <span></span>
      <strong>${escapeHtml(formatPreviewLabel(section.label))}</strong>
    </div>
  `).join('');
  const mainRows = mainLabels.slice(0, 3).map((section) => `
    <article>
      <span></span>
      <div>
        <strong>${escapeHtml(formatPreviewLabel(section.label))}</strong>
        <em></em>
        <em></em>
      </div>
    </article>
  `).join('');
  const rightRows = rightLabels.slice(0, 4).map((section) => `
    <div>
      <span></span>
      <p>${escapeHtml(formatPreviewLabel(section.label))}</p>
    </div>
  `).join('');

  return `
    <div class="git-reflow-template-preview" style="${getPreviewStyleAttribute(template)}" aria-hidden="true">
      <div class="git-reflow-template-preview__topbar"${getBlockMiniStyleAttribute(topbarBlock)}>
        <i></i>
        <strong>${escapeHtml(formatPreviewLabel(template.name || topbarLabel))}</strong>
        <span></span>
        <em></em>
        <em></em>
        <em></em>
      </div>
      <div class="git-reflow-template-preview__body"${bodyStyle}>
        <aside class="git-reflow-template-preview__left">
          <div class="git-reflow-template-preview__profile">
            <span></span>
            <strong>${escapeHtml(formatPreviewLabel(template.owner ?? 'git-reflow'))}</strong>
          </div>
          <section class="git-reflow-template-preview__repo-card"${getBlockMiniStyleAttribute(leftBlock)}>
            <header>
              <strong>${escapeHtml(formatPreviewLabel(leftBlock?.title ?? leftLabels[0]?.label ?? 'Top repositories'))}</strong>
              <i></i>
            </header>
            <em></em>
            ${leftRows}
          </section>
        </aside>
        <main class="git-reflow-template-preview__main">
          <section class="git-reflow-template-preview__prompt"${getBlockMiniStyleAttribute(copilotBlock)}>
            <h4>Home</h4>
            <div></div>
            <footer>
              <span></span>
              <i></i>
              <b></b>
            </footer>
          </section>
          <section class="git-reflow-template-preview__feed"${getBlockMiniStyleAttribute(feedBlock)}>
            <header>
              <strong>${escapeHtml(formatPreviewLabel(feedBlock?.title ?? mainLabels[0]?.label ?? 'Feed'))}</strong>
              <i></i>
            </header>
            ${mainRows}
          </section>
          ${updateBlock ? `
            <section class="git-reflow-template-preview__updates"${getBlockMiniStyleAttribute(updateBlock)}>
              <strong>${escapeHtml(formatPreviewLabel(updateBlock.title))}</strong>
              <span></span>
              <span></span>
            </section>
          ` : ''}
        </main>
        <aside class="git-reflow-template-preview__right">
          <section class="git-reflow-template-preview__changelog"${getBlockMiniStyleAttribute(rightBlock)}>
            <strong>${escapeHtml(formatPreviewLabel(rightBlock?.title ?? rightLabels[0]?.label ?? 'Changelog'))}</strong>
            ${rightRows}
          </section>
        </aside>
      </div>
    </div>
  `;
}

function escapeHtml(value) {
  return String(value)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;');
}

function escapeAttribute(value) {
  return escapeHtml(value).replaceAll('`', '&#096;');
}

function setControllerConnected(connected) {
  const controller = document.getElementById(CONTROLLER_ID);

  if (controller instanceof HTMLElement) {
    controller.dataset.gitReflowConnected = connected ? 'true' : 'false';
  }
}

function setTemplateListViewMode(mode) {
  templateListViewMode = mode === 'list' ? 'list' : 'preview';

  const controller = document.getElementById(CONTROLLER_ID);
  if (controller instanceof HTMLElement) {
    controller.dataset.gitReflowView = templateListViewMode;
  }

  document.querySelectorAll(`#${CONTROLLER_ID} [data-git-reflow-view-mode]`).forEach((button) => {
    if (button instanceof HTMLButtonElement) {
      button.classList.toggle('is-active', button.dataset.gitReflowViewMode === templateListViewMode);
    }
  });
}

function setControllerOpen(open) {
  const controller = document.getElementById(CONTROLLER_ID);
  const launcher = getControllerElement('[data-git-reflow-launcher]');
  const panel = getControllerElement('[data-git-reflow-panel]');

  if (controller instanceof HTMLElement) {
    controller.classList.toggle('is-open', open);
  }

  if (launcher instanceof HTMLButtonElement) {
    launcher.setAttribute('aria-expanded', String(open));
  }

  if (panel instanceof HTMLElement) {
    panel.hidden = !open;
  }
}

function clearStoredAuthState() {
  safeStorageRemove([AUTH_TOKEN_STORAGE_KEY, SELECTED_TEMPLATE_STORAGE_KEY]);
}

function applySidebarWidth(width) {
  document.documentElement.style.setProperty('--feed-sidebar', width);
  document.documentElement.style.setProperty('--git-reflow-left-sidebar-width', width);

  [
    queryFirst(githubHomeSelectors.leftSidebar),
    queryFirst(githubHomeSelectors.leftSidebarContent),
  ].forEach((target) => applyWidthContract(target, width));
}

function applyMainColumnWidth(width) {
  document.documentElement.style.setProperty('--git-reflow-main-column-width', width);

  [
    queryFirst(githubHomeSelectors.feedMain),
    queryFirst(githubHomeSelectors.mainContent),
  ].forEach((target) => applyWidthContract(target, width, 'max'));
}

function applyRightSidebarWidth(width) {
  document.documentElement.style.setProperty('--git-reflow-right-sidebar-width', width);

  [
    queryFirst(githubHomeSelectors.rightSidebar),
    queryFirst(githubHomeSelectors.rightColumn),
  ].forEach((target) => applyWidthContract(target, width));
}

function getTemplateSidebarWidth(template) {
  const sidebarWidth = template.columnLayout?.left
    ? `${clampWidth(Number(template.columnLayout.left))}px`
    : (leftSidebarWidths[template.leftSidebarWidth] ?? leftSidebarWidths.default);

  if (template.leftSidebarResizeEnabled !== false && customLeftSidebarWidthPx) {
    return `${customLeftSidebarWidthPx}px`;
  }

  return sidebarWidth;
}

function getTemplateMainColumnWidth(template) {
  if (template.columnLayout?.main) {
    return `${clampMainWidth(Number(template.columnLayout.main))}px`;
  }

  return mainColumnWidths[template.mainColumnWidth] ?? mainColumnWidths.default;
}

function getTemplateRightSidebarWidth(template) {
  if (template.columnLayout?.right) {
    return `${clampRightWidth(Number(template.columnLayout.right))}px`;
  }

  return rightSidebarWidths[template.rightSidebarWidth] ?? rightSidebarWidths.default;
}

function removeLeftSidebarResizer() {
  document.querySelectorAll(`.${RESIZER_CLASS}`).forEach((resizer) => resizer.remove());
  document.querySelectorAll('.git-reflow-resizable-sidebar').forEach((sidebar) => {
    sidebar.classList.remove('git-reflow-resizable-sidebar');
  });
  document.body.classList.remove('git-reflow-resizing-left-sidebar');
}

function ensureLeftSidebarResizer() {
  const leftSidebar = queryFirst(githubHomeSelectors.leftSidebar);
  if (!(leftSidebar instanceof HTMLElement) || leftSidebar.querySelector(`.${RESIZER_CLASS}`)) {
    return;
  }

  leftSidebar.classList.add('git-reflow-resizable-sidebar');

  const resizer = document.createElement('button');
  resizer.className = RESIZER_CLASS;
  resizer.type = 'button';
  resizer.setAttribute('aria-label', 'Resize GitHub left sidebar');
  resizer.title = 'Drag to resize sidebar';

  resizer.addEventListener('pointerdown', (event) => {
    event.preventDefault();

    const startX = event.clientX;
    const startWidth = leftSidebar.getBoundingClientRect().width;

    document.body.classList.add('git-reflow-resizing-left-sidebar');
    resizer.setPointerCapture(event.pointerId);

    const handlePointerMove = (moveEvent) => {
      const nextWidth = clampWidth(startWidth + moveEvent.clientX - startX);
      customLeftSidebarWidthPx = Math.round(nextWidth);
      applySidebarWidth(`${customLeftSidebarWidthPx}px`);
      setStatus(`Left sidebar ${customLeftSidebarWidthPx}px`);
    };

    const handlePointerUp = () => {
      document.body.classList.remove('git-reflow-resizing-left-sidebar');
      setStoredLeftSidebarWidth(customLeftSidebarWidthPx);
      window.removeEventListener('pointermove', handlePointerMove);
      window.removeEventListener('pointerup', handlePointerUp);
      window.removeEventListener('pointercancel', handlePointerUp);
    };

    window.addEventListener('pointermove', handlePointerMove);
    window.addEventListener('pointerup', handlePointerUp);
    window.addEventListener('pointercancel', handlePointerUp);
  });

  leftSidebar.append(resizer);
}

function applyTemplate(template) {
  latestTemplate = normalizeTemplate(template);

  document.querySelectorAll(`.${APPEARANCE_CLASS}`).forEach(clearAppearance);
  document.body.classList.add(LAYOUT_CLASS);
  document.body.classList.toggle('git-reflow-feed-two-column', latestTemplate.selectedVariationId === 'feed-two-column');
  applySidebarWidth(getTemplateSidebarWidth(latestTemplate));
  applyMainColumnWidth(getTemplateMainColumnWidth(latestTemplate));
  applyRightSidebarWidth(getTemplateRightSidebarWidth(latestTemplate));
  applyTemplateBlocks(latestTemplate);
  applyPageAppearance(latestTemplate.pageAppearance);
  if (latestTemplate.leftSidebarResizeEnabled === false) {
    removeLeftSidebarResizer();
    setControllerHint('Preview applied. Left sidebar drag handle is disabled.');
  } else {
    ensureLeftSidebarResizer();
    setControllerHint('Preview applied. Drag the left sidebar edge to resize.');
  }

  setStatus(`Applied ${latestTemplate.name ?? 'template'} / ${latestTemplate.selectedVariationId ?? 'github-default'}`);
}

async function refreshTemplate() {
  try {
    setStatus('Loading latest template...');
    const template = await fetch(LATEST_TEMPLATE_URL, { cache: 'no-store' }).then((response) => {
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }

      return response.json();
    });
    applyTemplate(template);
  } catch {
    setStatus('Backend unavailable');
  }
}

async function loadAndApplySelectedTemplate(token, templateId, options = {}) {
  if (!templateId) {
    setStatus('Choose a template');
    return;
  }

  const selectedTemplateRecord = availableTemplates.find((template) => template.id === templateId);
  const starterTemplate = selectedTemplateRecord?.source === 'starter' ? starterTemplatesById.get(templateId) : null;

  if (starterTemplate) {
    setStoredSelectedTemplateId(templateId);
    applyTemplate(starterTemplate);
    if (options.recordUsage) {
      recordTemplateUsage(token, starterTemplate);
    }
    setTemplateSelectOptions(templateId);
    return;
  }

  if (!token) {
    setStatus('Paste extension token');
    return;
  }

  try {
    setStatus('Applying selected template...');
    const template = await fetchJson(`/api/templates/${encodeURIComponent(templateId)}`, token);
    setStoredSelectedTemplateId(templateId);
    applyTemplate(template);
    if (options.recordUsage) {
      recordTemplateUsage(token, template);
    }
    setTemplateSelectOptions(templateId);
  } catch {
    setStatus('Template unavailable');
  }
}

async function refreshTemplateList() {
  const { token, selectedTemplateId } = await getStoredExtensionState();
  setTokenInputValue(token);
  setControllerConnected(Boolean(token));

  if (!token) {
    availableTemplates = [];
    setTemplateSelectOptions('');
    setStatus('Connect your account');
    setControllerHint('Paste the extension token from git-reflow web.');
    return;
  }

  try {
    setStatus('Loading your templates...');
    const result = await fetchJson('/api/templates', token);
    const remoteTemplates = Array.isArray(result.templates)
      ? result.templates.filter((template) => template?.id !== DEFAULT_TEMPLATE_ID && template?.source !== 'default')
      : [];
    availableTemplates = mergeStarterTemplateRecords(remoteTemplates);
    const nextTemplateId =
      availableTemplates.find((template) => template.id === selectedTemplateId)?.id ?? availableTemplates[0]?.id ?? '';

    setTemplateSelectOptions(nextTemplateId);
    await loadAndApplySelectedTemplate(token, nextTemplateId);
  } catch {
    availableTemplates = [];
    setTemplateSelectOptions('');
    setStatus('Token or backend unavailable');
    setControllerHint('Check localhost:8787 or reconnect with a fresh token.');
  }
}

function createController() {
  if (controllerCreated || document.getElementById(CONTROLLER_ID) || !isGitHubDashboard()) {
    return;
  }

  const controller = document.createElement('div');
  controller.id = CONTROLLER_ID;
  controller.className = 'git-reflow-controller';
  controller.dataset.gitReflowConnected = 'false';
  controller.dataset.gitReflowView = templateListViewMode;
  controller.innerHTML = `
    <button class="git-reflow-launcher" type="button" data-git-reflow-launcher aria-label="Open git-reflow" aria-expanded="false">
      <span aria-hidden="true">gr</span>
    </button>
    <section class="git-reflow-panel" data-git-reflow-panel aria-label="git-reflow templates" hidden>
      <header class="git-reflow-panel__header">
        <div class="git-reflow-panel__brand">
          <span aria-hidden="true">gr</span>
          <div>
            <strong>git-reflow</strong>
            <small>GitHub style preview</small>
          </div>
        </div>
        <div class="git-reflow-panel__status">
          <span data-git-reflow-status>Ready</span>
          <button class="git-reflow-icon-button" type="button" data-git-reflow-close aria-label="Close git-reflow" title="Close">
            <svg aria-hidden="true" focusable="false" viewBox="0 0 16 16">
              <path d="M4.22 4.22a.75.75 0 0 1 1.06 0L8 6.94l2.72-2.72a.75.75 0 1 1 1.06 1.06L9.06 8l2.72 2.72a.75.75 0 1 1-1.06 1.06L8 9.06l-2.72 2.72a.75.75 0 0 1-1.06-1.06L6.94 8 4.22 5.28a.75.75 0 0 1 0-1.06Z" />
            </svg>
          </button>
        </div>
      </header>

      <div class="git-reflow-token-view">
        <div>
          <strong>Connect browser</strong>
          <p>Paste your extension token to preview saved templates on GitHub.</p>
        </div>
        <label>
          <span>Extension token</span>
          <input type="password" data-git-reflow-token placeholder="Paste token" aria-label="Extension token" />
        </label>
        <button type="button" data-git-reflow-save-token>Connect</button>
      </div>

      <div class="git-reflow-template-view">
        <div class="git-reflow-template-view__header">
          <div>
            <strong>Templates</strong>
            <span><small data-git-reflow-template-count>0/0</small> available</span>
          </div>
          <div class="git-reflow-template-actions">
            <button class="git-reflow-icon-button" type="button" data-git-reflow-filter-toggle aria-label="Filter templates" title="Filter" aria-expanded="false">
              <svg aria-hidden="true" focusable="false" viewBox="0 0 16 16">
                <path d="M2.25 3A.75.75 0 0 1 3 2.25h10a.75.75 0 0 1 .58 1.23L9.75 8.08v3.67a.75.75 0 0 1-.36.64l-2 1.2A.75.75 0 0 1 6.25 13V8.08L2.42 3.48A.75.75 0 0 1 2.25 3Zm2.35.75 2.98 3.58c.11.13.17.3.17.48v3.87l.5-.3V7.81c0-.18.06-.35.17-.48l2.98-3.58H4.6Z" />
              </svg>
            </button>
            <button class="git-reflow-icon-button" type="button" data-git-reflow-refresh aria-label="Refresh templates" title="Refresh">
              <svg aria-hidden="true" focusable="false" viewBox="0 0 16 16">
                <path d="M12.78 5.72a.75.75 0 0 1-1.06 0l-.64-.64A4.25 4.25 0 1 0 12.18 9a.75.75 0 0 1 1.47.3 5.75 5.75 0 1 1-1.53-5.28l.66.64a.75.75 0 0 1 0 1.06Z" />
                <path d="M12.25 2.75A.75.75 0 0 1 13 3.5v2.75a.75.75 0 0 1-.75.75H9.5a.75.75 0 0 1 0-1.5h2V3.5a.75.75 0 0 1 .75-.75Z" />
              </svg>
            </button>
          </div>
        </div>
        <div class="git-reflow-template-toolbar">
          <div class="git-reflow-view-toggle" aria-label="Template display mode">
            <button class="is-active" type="button" data-git-reflow-view-mode="preview">Preview</button>
            <button type="button" data-git-reflow-view-mode="list">List</button>
          </div>
        </div>
        <div class="git-reflow-template-filter" data-git-reflow-filter-panel hidden>
          <label>
            <span>Search</span>
            <input type="search" data-git-reflow-template-search placeholder="Starter red" aria-label="Search templates" />
          </label>
          <label>
            <span>Sort</span>
            <select data-git-reflow-template-sort aria-label="Sort templates">
              <option value="updated">Recent</option>
              <option value="name">Name</option>
              <option value="starter">Starter first</option>
            </select>
          </label>
        </div>
        <div class="git-reflow-template-list" data-git-reflow-template-list></div>
        <div class="git-reflow-panel__actions">
          <button class="git-reflow-icon-button" type="button" data-git-reflow-reset aria-label="Reset page" title="Reset page">
            <svg aria-hidden="true" focusable="false" viewBox="0 0 16 16">
              <path d="M6.47 2.22a.75.75 0 0 1 1.06 1.06L6.56 4.25H9.5a4.25 4.25 0 1 1-3.95 5.82.75.75 0 1 1 1.39-.56A2.75 2.75 0 1 0 9.5 5.75H6.56l.97.97a.75.75 0 0 1-1.06 1.06l-2.25-2.25a.75.75 0 0 1 0-1.06l2.25-2.25Z" />
            </svg>
          </button>
          <button class="git-reflow-icon-button" type="button" data-git-reflow-disconnect aria-label="Disconnect" title="Disconnect">
            <svg aria-hidden="true" focusable="false" viewBox="0 0 16 16">
              <path d="M5.25 3.25A2.75 2.75 0 0 1 8 6v1.25h.75A2.75 2.75 0 0 1 11.5 10v.5a2.75 2.75 0 0 1-2.75 2.75h-2A2.75 2.75 0 0 1 4 10.5V10a2.75 2.75 0 0 1 2.5-2.74V6A1.25 1.25 0 0 0 4 6a.75.75 0 0 1-1.5 0 2.75 2.75 0 0 1 2.75-2.75Zm1.5 5.5A1.25 1.25 0 0 0 5.5 10v.5a1.25 1.25 0 0 0 1.25 1.25h2A1.25 1.25 0 0 0 10 10.5V10a1.25 1.25 0 0 0-1.25-1.25h-2Z" />
              <path d="M11.03 2.97a.75.75 0 0 1 1.06 0l.91.91.91-.91a.75.75 0 0 1 1.06 1.06l-.91.91.91.91a.75.75 0 0 1-1.06 1.06L13 6l-.91.91a.75.75 0 0 1-1.06-1.06l.91-.91-.91-.91a.75.75 0 0 1 0-1.06Z" />
            </svg>
          </button>
        </div>
      </div>

      <span class="git-reflow-panel__hint" data-git-reflow-hint>Choose a template to preview it here.</span>
    </section>
  `;

  controller.querySelector('[data-git-reflow-launcher]')?.addEventListener('click', () => {
    const panel = controller.querySelector('[data-git-reflow-panel]');
    setControllerOpen(panel instanceof HTMLElement ? panel.hidden : true);
  });
  controller.querySelector('[data-git-reflow-close]')?.addEventListener('click', () => {
    setControllerOpen(false);
  });
  controller.querySelector('[data-git-reflow-save-token]')?.addEventListener('click', () => {
    const input = controller.querySelector('[data-git-reflow-token]');
    const token = input instanceof HTMLInputElement ? input.value.trim() : '';

    if (!token) {
      setStatus('Paste extension token');
      return;
    }

    setStoredAuthToken(token);
    refreshTemplateList();
  });
  controller.querySelector('[data-git-reflow-token]')?.addEventListener('keydown', (event) => {
    if (event instanceof KeyboardEvent && event.key === 'Enter') {
      event.preventDefault();
      controller.querySelector('[data-git-reflow-save-token]')?.dispatchEvent(new MouseEvent('click'));
    }
  });
  controller.querySelector('[data-git-reflow-template-list]')?.addEventListener('click', (event) => {
    const item = event.target instanceof Element ? event.target.closest('[data-git-reflow-template-id]') : null;

    if (!(item instanceof HTMLElement)) {
      return;
    }

    getStoredExtensionState().then(({ token }) =>
      loadAndApplySelectedTemplate(token, item.dataset.gitReflowTemplateId ?? '', { recordUsage: true }),
    );
  });
  controller.querySelectorAll('[data-git-reflow-view-mode]').forEach((button) => {
    button.addEventListener('click', () => {
      if (button instanceof HTMLButtonElement) {
        setTemplateListViewMode(button.dataset.gitReflowViewMode ?? 'preview');
      }
    });
  });
  controller.querySelector('[data-git-reflow-filter-toggle]')?.addEventListener('click', () => {
    setTemplateFilterOpen(!templateFilterOpen);
  });
  controller.querySelector('[data-git-reflow-template-search]')?.addEventListener('input', (event) => {
    if (event.target instanceof HTMLInputElement) {
      templateSearchQuery = event.target.value;
      setTemplateSelectOptions(latestTemplate?.id ?? '');
    }
  });
  controller.querySelector('[data-git-reflow-template-search]')?.addEventListener('keydown', (event) => {
    if (event instanceof KeyboardEvent && event.key === 'Escape') {
      templateSearchQuery = '';
      syncTemplateFilterControls();
      setTemplateSelectOptions(latestTemplate?.id ?? '');
    }
  });
  controller.querySelector('[data-git-reflow-template-sort]')?.addEventListener('change', (event) => {
    if (event.target instanceof HTMLSelectElement) {
      templateSortMode = event.target.value;
      setTemplateSelectOptions(latestTemplate?.id ?? '');
    }
  });
  controller.querySelector('[data-git-reflow-refresh]')?.addEventListener('click', refreshTemplateList);
  controller.querySelector('[data-git-reflow-reset]')?.addEventListener('click', resetAppliedStyles);
  controller.querySelector('[data-git-reflow-disconnect]')?.addEventListener('click', () => {
    clearStoredAuthState();
    availableTemplates = [];
    setTemplateSelectOptions('');
    setTokenInputValue('');
    setControllerConnected(false);
    setStatus('Disconnected');
    setControllerHint('Paste a token to connect again.');
  });

  document.body.append(controller);
  controllerCreated = true;
  syncTemplateFilterControls();
}

function resetAppliedStyles() {
  customLeftSidebarWidthPx = null;
  clearStoredLeftSidebarWidth();
  document.body.classList.remove(LAYOUT_CLASS);
  document.body.classList.remove('git-reflow-feed-two-column');
  document.documentElement.style.removeProperty('--feed-sidebar');
  document.documentElement.style.removeProperty('--git-reflow-left-sidebar-width');
  document.documentElement.style.removeProperty('--git-reflow-main-column-width');
  document.documentElement.style.removeProperty('--git-reflow-right-sidebar-width');
  document.documentElement.style.removeProperty('--git-reflow-page-background');
  document.documentElement.style.removeProperty('--git-reflow-left-sidebar-background');
  removeLeftSidebarResizer();
  document.querySelectorAll(`.${GENERATED_BLOCK_CLASS}`).forEach((element) => element.remove());
  document.querySelectorAll(`.${HIDDEN_CLASS}`).forEach((element) => {
    element.classList.remove(HIDDEN_CLASS);
  });
  document.querySelectorAll(`.${APPEARANCE_CLASS}`).forEach(clearAppearance);
  document.querySelectorAll(`.${BLOCK_CLASS}`).forEach((element) => {
    element.classList.remove(BLOCK_CLASS, HIDDEN_CLASS);
    element.style.removeProperty('order');
    clearAppearance(element);
    delete element.dataset.gitReflowBlockId;
    delete element.dataset.gitReflowBlockType;
  });
  document.querySelectorAll('.git-reflow-region-container').forEach((element) => {
    element.classList.remove('git-reflow-region-container');
  });
  document.querySelectorAll('.git-reflow-topbar-links').forEach((element) => element.remove());
  document.querySelectorAll(`[${ORIGINAL_TEXT_ATTR}]`).forEach((element) => {
    element.textContent = element.getAttribute(ORIGINAL_TEXT_ATTR) ?? '';
    element.removeAttribute(ORIGINAL_TEXT_ATTR);
  });
  document.querySelectorAll(`[${ORIGINAL_PLACEHOLDER_ATTR}]`).forEach((element) => {
    const placeholder = element.getAttribute(ORIGINAL_PLACEHOLDER_ATTR) ?? '';
    if (placeholder) {
      element.setAttribute('placeholder', placeholder);
    } else {
      element.removeAttribute('placeholder');
    }
    element.removeAttribute(ORIGINAL_PLACEHOLDER_ATTR);
  });

  const styleTargets = [
    githubHomeSelectors.leftSidebar,
    githubHomeSelectors.leftSidebarContent,
    githubHomeSelectors.feedMain,
    githubHomeSelectors.mainContent,
    githubHomeSelectors.rightSidebar,
    githubHomeSelectors.rightColumn,
  ];

  styleTargets.forEach((selectors) => {
    const element = queryFirst(selectors);

    if (element instanceof HTMLElement) {
      removeStyleProperties(element, ['box-sizing', 'width', 'min-width', 'max-width', 'flex-basis']);
    }
  });

  setStatus('Reset locally');
}

function boot() {
  createController();

  if (document.getElementById(CONTROLLER_ID)) {
    getStoredLeftSidebarWidth().then((storedWidth) => {
      customLeftSidebarWidthPx = storedWidth ? clampWidth(storedWidth) : null;
      refreshTemplateList();
    });
  }
}

boot();

document.addEventListener('turbo:load', () => {
  controllerCreated = false;
  boot();

  if (latestTemplate) {
    applyTemplate(latestTemplate);
  }
});
