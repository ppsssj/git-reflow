const API_BASE_URL = 'http://localhost:8787';
const LATEST_TEMPLATE_URL = `${API_BASE_URL}/api/templates/github-home/latest`;
const CONTROLLER_ID = 'git-reflow-controller';
const LOGO_URL = chrome.runtime.getURL('assets/git-reflow-cat-logo-small-icon.svg');
const RESIZER_CLASS = 'git-reflow-left-resizer';
const BLOCK_CLASS = 'git-reflow-template-block';
const GENERATED_BLOCK_CLASS = 'git-reflow-generated-block';
const APPEARANCE_CLASS = 'git-reflow-appearance-target';
const LAYOUT_CLASS = 'git-reflow-template-active';
const HIDDEN_CLASS = 'git-reflow-template-hidden';
const ORIGINAL_TEXT_ATTR = 'data-git-reflow-original-text';
const ORIGINAL_PLACEHOLDER_ATTR = 'data-git-reflow-original-placeholder';
const BACKGROUND_IMAGE_LAYER_ID = 'git-reflow-background-image-layer';
const REPOSITORY_PAGE_HOST_ID = 'git-reflow-repository-page-host';
const REPOSITORY_THEME_STYLE_ID = 'git-reflow-repository-theme-style';
const PROFILE_THEME_STYLE_ID = 'git-reflow-profile-theme-style';
const BACKGROUND_IMAGE_FRAME_WIDTH = 1120;
const BACKGROUND_IMAGE_FRAME_HEIGHT = 760;
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
const STARTER_REPOSITORY_README_SCREEN = {
  id: 'github-repository-readme',
  name: 'Repository README',
  providerRoute: 'github.com/:owner/:repo',
  description: 'Repository landing page with file list, README, and metadata sidebar.',
};
const STARTER_REPOSITORY_README_BLOCKS = [
  {
    id: 'repo-header',
    type: 'repository-header',
    title: 'Repository Header',
    region: 'topbar',
    screenId: STARTER_REPOSITORY_README_SCREEN.id,
    visible: true,
    extensionSlot: 'github.repository.header',
    props: {
      owner: 'template-owner',
      repository: 'sample-readme-project',
      visibility: 'Public',
      tabs: [
        { label: 'Code', active: true },
        { label: 'Issues' },
        { label: 'Pull requests' },
        { label: 'Actions' },
        { label: 'Projects' },
        { label: 'Security' },
        { label: 'Insights' },
      ],
      actions: [
        { label: 'Notifications' },
        { label: 'Fork', count: '0' },
        { label: 'Star', count: '0' },
      ],
    },
  },
  {
    id: 'repo-files',
    type: 'repository-file-list',
    title: 'Files',
    region: 'main-feed',
    screenId: STARTER_REPOSITORY_README_SCREEN.id,
    visible: true,
    extensionSlot: 'github.repository.files',
    props: {
      branch: 'main',
      commitAuthor: 'sample-user',
      commitMessage: 'Update README and project description',
      commitTime: 'now',
      files: [
        { name: 'docs', type: 'directory', message: 'Add project documentation examples' },
        { name: 'src', type: 'directory', message: 'Organize application source files' },
        { name: 'tests', type: 'directory', message: 'Add sample coverage for core flows' },
        { name: 'package.json', type: 'file', message: 'Define project scripts and dependencies' },
        { name: 'README.md', type: 'file', message: 'Update README and usage notes' },
      ],
    },
  },
  {
    id: 'repo-readme',
    type: 'repository-readme',
    title: 'README',
    region: 'main-feed',
    screenId: STARTER_REPOSITORY_README_SCREEN.id,
    visible: true,
    extensionSlot: 'github.repository.readme',
    props: {
      title: 'sample-readme-project',
      badges: ['Example', 'README', 'Documentation'],
      sections: [
        {
          heading: 'Overview',
          body: 'Use this area as the main project description. Explain what the repository does, who it is for, and the problem it solves.',
        },
        {
          heading: 'Getting started',
          body: 'Add setup steps, required tools, environment variables, and the first command someone should run after cloning the repository.',
        },
        {
          heading: 'Usage',
          body: 'Show the most common workflow with concise examples. This section can become installation notes, screenshots, or API examples.',
        },
      ],
    },
  },
  {
    id: 'repo-about',
    type: 'repository-about-sidebar',
    title: 'About',
    region: 'right-sidebar',
    screenId: STARTER_REPOSITORY_README_SCREEN.id,
    visible: true,
    extensionSlot: 'github.repository.sidebar.about',
    props: {
      description: 'Short repository description goes here. Keep it clear enough to explain the project from the sidebar.',
      links: ['Readme', 'Activity', 'Custom properties'],
      releases: 'No releases published',
      packages: 'No packages published',
      contributors: [
        { name: 'sample-user', initial: 's' },
      ],
      languages: [
        { name: 'TypeScript', percent: 46, color: '#3178c6' },
        { name: 'CSS', percent: 32, color: '#663399' },
        { name: 'JavaScript', percent: 22, color: '#f1e05a' },
      ],
    },
  },
];
const STARTER_PROFILE_OVERVIEW_SCREEN = {
  id: 'github-profile-overview',
  name: 'Profile Overview',
  providerRoute: 'github.com/:user',
  description: 'GitHub user profile page with profile card, README, pinned repositories, and contribution activity.',
};
const STARTER_PROFILE_OVERVIEW_BLOCKS = [
  {
    id: 'profile-global-nav',
    type: 'top-nav',
    title: 'GitHub Header',
    region: 'topbar',
    screenId: STARTER_PROFILE_OVERVIEW_SCREEN.id,
    visible: true,
    extensionSlot: 'github.profile.globalNav',
    props: {
      context: 'ppsssj',
      searchPlaceholder: 'Type / to search',
      links: ['Overview', 'Repositories', 'Projects', 'Packages', 'Stars'],
      actions: ['Copilot', 'Create', 'Issues', 'Pull requests', 'Repositories'],
    },
  },
  {
    id: 'profile-sidebar',
    type: 'profile-sidebar',
    title: 'Profile Sidebar',
    region: 'left-sidebar',
    screenId: STARTER_PROFILE_OVERVIEW_SCREEN.id,
    visible: true,
    extensionSlot: 'github.profile.sidebar',
    props: {
      name: 'ptjdwls',
      handle: 'ppsssj',
      website: 'https://ppsssj.vercel.app/',
      stats: ['0 followers', '0 following'],
    },
  },
  {
    id: 'profile-readme',
    type: 'profile-readme',
    title: 'Profile README',
    region: 'main-feed',
    screenId: STARTER_PROFILE_OVERVIEW_SCREEN.id,
    visible: true,
    extensionSlot: 'github.profile.readme',
    props: {
      repository: 'ppsssj',
      heading: 'Portfolio',
      links: ['Portfolio', 'Projects'],
      summary: 'Personal overview README rendered on the GitHub profile.',
    },
  },
  {
    id: 'profile-pinned-repos',
    type: 'profile-pinned-repos',
    title: 'Pinned Repositories',
    region: 'main-feed',
    screenId: STARTER_PROFILE_OVERVIEW_SCREEN.id,
    visible: true,
    extensionSlot: 'github.profile.pinned',
    props: {
      repositories: [
        { name: 'Cogic', language: 'TypeScript', stars: '0' },
        { name: 'GraphMind-monorepo', language: 'TypeScript', stars: '0' },
        { name: 'Git-Effects', language: 'JavaScript', stars: '0' },
      ],
    },
  },
  {
    id: 'profile-contributions',
    type: 'profile-contributions',
    title: 'Contributions',
    region: 'main-feed',
    screenId: STARTER_PROFILE_OVERVIEW_SCREEN.id,
    visible: true,
    extensionSlot: 'github.profile.contributions',
    props: {
      summary: 'Contribution calendar and activity timeline',
      years: ['2026', '2025', '2024'],
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

const githubRepositorySelectors = {
  repositoryRoot: [
    '#repo-content-turbo-frame',
    '#repo-content-pjax-container',
    'react-app[app-name="code-view"]',
  ],
  repositoryHeader: ['#repository-container-header', '#repo-title-component'],
  repositoryNav: ['nav[aria-label="Repository"]'],
  repositoryMain: [
    '#repo-content-turbo-frame',
    '#repo-content-pjax-container',
    'react-app[app-name="code-view"]',
  ],
  fileList: [
    'table[aria-labelledby="folders-and-files"]',
    '[aria-labelledby="folders-and-files"]',
    '[data-testid="file-and-directory-list"]',
    '[class*="react-directory"]',
  ],
  readme: [
    'article.markdown-body.entry-content',
    'article.markdown-body',
    '[class*="DirectoryRichtextContent"] article',
  ],
  sidebar: [
    '.BorderGrid',
    '.hide-sm.hide-md .BorderGrid',
    'aside[aria-label*="Repository"]',
    '[data-testid="repository-sidebar"]',
  ],
};

const githubProfileSelectors = {
  profileRoot: [
    'body.page-profile',
    'meta[name="route-controller"][content="profiles"]',
    '#user-profile-frame',
    '.page-profile',
  ],
  profileLayout: [
    'main#js-pjax-container',
    'main#main-content',
    '.application-main',
    '#user-profile-frame',
  ],
  profileSidebar: [
    '.js-profile-editable-area',
    '.js-profile-editable-replace',
    '.vcard-names-container',
    '[data-test-selector="profile-website-url"]',
  ],
  profileNav: [
    '.user-profile-nav',
    '.user-profile-sticky-bar',
    'nav[aria-label="User profile"]',
    'nav[aria-label="Profile"]',
  ],
  profileReadme: [
    '.profile-readme',
    '.profile-readme .markdown-body',
    '#user-profile-frame article.markdown-body',
  ],
  pinnedRepos: [
    '.js-pinned-items-reorder-container',
    '.js-pinned-items-reorder-list',
    '.pinned-item-list-item-content',
  ],
  contributions: [
    '.js-yearly-contributions',
    '.js-calendar-graph',
    '.ContributionCalendar',
    '.contribution-activity',
  ],
};

const regionContainers = {
  topbar: [...githubHomeSelectors.topbar, ...githubRepositorySelectors.repositoryHeader, ...githubProfileSelectors.profileNav],
  'left-sidebar': [...githubHomeSelectors.leftSidebarContent, ...githubProfileSelectors.profileSidebar],
  'main-feed': [...githubHomeSelectors.mainContent, ...githubRepositorySelectors.repositoryMain, ...githubProfileSelectors.profileLayout],
  'right-sidebar': [...githubHomeSelectors.rightSidebar, ...githubHomeSelectors.rightColumn, ...githubRepositorySelectors.sidebar],
};

const blockSelectorRegistry = {
  'top-nav': githubHomeSelectors.topbar,
  'repository-header': [
    ...githubRepositorySelectors.repositoryHeader,
    ...githubRepositorySelectors.repositoryNav,
  ],
  'repository-file-list': githubRepositorySelectors.fileList,
  'repository-readme': githubRepositorySelectors.readme,
  'repository-about-sidebar': githubRepositorySelectors.sidebar,
  'profile-sidebar': githubProfileSelectors.profileSidebar,
  'profile-readme': githubProfileSelectors.profileReadme,
  'profile-pinned-repos': githubProfileSelectors.pinnedRepos,
  'profile-contributions': githubProfileSelectors.contributions,
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
  'repository-header': ['Code', 'Issues', 'Pull requests', 'Actions'],
  'repository-file-list': ['README.md', 'Go to file', 'Code'],
  'repository-readme': ['README', 'README.md'],
  'repository-about-sidebar': ['About', 'Releases', 'Packages', 'Languages'],
  'profile-sidebar': ['followers', 'following', 'Achievements'],
  'profile-readme': ['README', 'Portfolio', 'Projects'],
  'profile-pinned-repos': ['Pinned', 'Popular repositories'],
  'profile-contributions': ['contributions', 'Contribution activity'],
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
let templateApplyRequestId = 0;
let templateRenderGeneration = 0;
let controllerDataLoaded = false;
let templateMutationObserver = null;
let templateMutationReapplyTimer = 0;
let templateMutationReapplying = false;

function isGitHubDashboard() {
  return queryFirst(githubHomeSelectors.dashboardRoot) !== null;
}

function isGitHubRepositoryRoute() {
  const pathParts = window.location.pathname.split('/').filter(Boolean);

  return pathParts.length === 2;
}

function isGitHubProfileRoute() {
  const pathParts = window.location.pathname.split('/').filter(Boolean);

  return pathParts.length === 1 && queryFirst(githubProfileSelectors.profileRoot) !== null;
}

function isGitHubRepositoryReadme() {
  return isGitHubRepositoryRoute() && (
    queryFirst(githubRepositorySelectors.repositoryRoot) !== null ||
    queryFirst(githubRepositorySelectors.repositoryHeader) !== null ||
    queryFirst(githubRepositorySelectors.readme) !== null
  );
}

function isSupportedGitHubPage() {
  return isGitHubDashboard() || isGitHubRepositoryRoute() || isGitHubProfileRoute();
}

function getCurrentGitHubScreenId(template) {
  const screens = Array.isArray(template?.screens) ? template.screens : [];

  if (isGitHubRepositoryRoute()) {
    return screens.find((screen) => screen.id === 'github-repository-readme')?.id ?? 'github-repository-readme';
  }

  if (isGitHubProfileRoute()) {
    return screens.find((screen) => screen.id === 'github-profile-overview')?.id ?? 'github-profile-overview';
  }

  if (isGitHubDashboard()) {
    return screens.find((screen) => screen.id === 'github-home')?.id ?? 'github-home';
  }

  return template?.activeScreenId ?? screens[0]?.id ?? '';
}

function getTemplateObserverRoot() {
  return document.body;
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
    'profile-sidebar': {
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
    'profile-readme': {
      backgroundColor: theme.colors.mainPanel,
      innerBackgroundColor: theme.colors.mainInner,
      borderRadius: 12,
      padding: 0,
      elementGap: 14,
      fontSize: 14,
      textColor: theme.textColor,
      linkColor: theme.linkColor,
      mutedTextColor: theme.mutedTextColor,
    },
    'profile-pinned-repos': {
      backgroundColor: theme.colors.panel,
      innerBackgroundColor: theme.colors.panelSoft,
      borderRadius: 12,
      padding: 14,
      elementGap: 12,
      fontSize: 14,
      textColor: theme.textColor,
      linkColor: theme.linkColor,
      mutedTextColor: theme.mutedTextColor,
    },
    'profile-contributions': {
      backgroundColor: theme.colors.mainPanel,
      innerBackgroundColor: theme.colors.mainInner,
      borderRadius: 12,
      padding: 16,
      elementGap: 12,
      fontSize: 14,
      textColor: theme.textColor,
      linkColor: theme.linkColor,
      mutedTextColor: theme.mutedTextColor,
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
      STARTER_REPOSITORY_README_SCREEN,
      STARTER_PROFILE_OVERVIEW_SCREEN,
    ],
    regions: ['topbar', 'left-sidebar', 'main-feed', 'right-sidebar'],
    metadata: {
      provider: 'github',
      browserMappingKey: 'github.dashboard.reference',
      updatedAt: STARTER_TEMPLATE_UPDATED_AT,
    },
    blocks: [
      ...STARTER_TEMPLATE_BLOCK_DEFINITIONS.map((block) => ({
        ...block,
        screenId: 'github-home',
        visible: STARTER_TEMPLATE_VISIBLE_BLOCKS.has(block.id),
        props: {
          ...block.props,
          ...(blockAppearances[block.type] ? { appearance: blockAppearances[block.type] } : {}),
        },
      })),
      ...STARTER_REPOSITORY_README_BLOCKS.map((block) => ({
        ...block,
        props: {
          ...block.props,
          ...(blockAppearances[block.type] ? { appearance: blockAppearances[block.type] } : {}),
        },
      })),
      ...STARTER_PROFILE_OVERVIEW_BLOCKS.map((block) => ({
        ...block,
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

function getCssBackgroundImage(value) {
  if (typeof value !== 'string' || !value.trim()) {
    return '';
  }

  return `url("${value.trim().replace(/"/g, '\\"')}")`;
}

function getBackgroundImageLayerHost() {
  return (
    queryFirst(githubHomeSelectors.dashboardRoot) ??
    queryFirst(['.application-main', '#js-pjax-container', '[data-turbo-body]']) ??
    document.body
  );
}

function getBackgroundImageLayerStyle(position, size) {
  const widthMatch = typeof size === 'string' ? size.match(/^(\d+)px\s+auto$/) : null;
  const width = widthMatch ? Number(widthMatch[1]) : 420;
  const pixelPositionMatch = typeof position === 'string' ? position.match(/^(-?\d+(?:\.\d+)?)px\s+(-?\d+(?:\.\d+)?)px$/) : null;
  const x = pixelPositionMatch ? Number(pixelPositionMatch[1]) : (BACKGROUND_IMAGE_FRAME_WIDTH - width) / 2;
  const y = pixelPositionMatch ? Number(pixelPositionMatch[2]) : 120;

  return {
    left: `${(x / BACKGROUND_IMAGE_FRAME_WIDTH) * 100}%`,
    top: `${(y / BACKGROUND_IMAGE_FRAME_HEIGHT) * 100}%`,
    width: `${(width / BACKGROUND_IMAGE_FRAME_WIDTH) * 100}%`,
  };
}

function removeBackgroundImageLayer() {
  document.getElementById(BACKGROUND_IMAGE_LAYER_ID)?.remove();
  document.body.classList.remove('git-reflow-has-background-image');
  document
    .querySelectorAll('.git-reflow-background-host')
    .forEach((target) => target.classList.remove('git-reflow-background-host'));
}

function applyBackgroundImageLayer(appearance) {
  const imageUrl = getText(appearance?.backgroundImageUrl, '');

  if (!imageUrl) {
    removeBackgroundImageLayer();
    return;
  }

  const host = getBackgroundImageLayerHost();

  if (!(host instanceof HTMLElement)) {
    return;
  }

  let imageLayer = document.getElementById(BACKGROUND_IMAGE_LAYER_ID);

  if (!(imageLayer instanceof HTMLImageElement)) {
    imageLayer?.remove();
    imageLayer = document.createElement('img');
    imageLayer.id = BACKGROUND_IMAGE_LAYER_ID;
    imageLayer.className = 'git-reflow-background-image-layer';
    imageLayer.alt = '';
    imageLayer.decoding = 'async';
    imageLayer.draggable = false;
    imageLayer.setAttribute('aria-hidden', 'true');
  }

  const layerStyle = getBackgroundImageLayerStyle(
    getText(appearance.backgroundImagePosition, 'right top'),
    getText(appearance.backgroundImageSize, '360px auto'),
  );

  host.classList.add('git-reflow-background-host');
  document.body.classList.add('git-reflow-has-background-image');
  imageLayer.src = imageUrl;
  imageLayer.style.setProperty('left', layerStyle.left, 'important');
  imageLayer.style.setProperty('top', layerStyle.top, 'important');
  imageLayer.style.setProperty('width', layerStyle.width, 'important');

  if (imageLayer.parentElement !== host) {
    host.prepend(imageLayer);
  }
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

  if (typeof appearance.mutedTextColor === 'string') {
    element.style.setProperty('--git-reflow-block-muted-text-color', appearance.mutedTextColor);
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
  element.style.removeProperty('background-image');
  element.style.removeProperty('background-position');
  element.style.removeProperty('background-repeat');
  element.style.removeProperty('background-size');
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
  element.style.removeProperty('--git-reflow-block-muted-text-color');
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

function reapplyActivityFeedAppearance(target, appearance, generation) {
  [150, 500, 1200, 2500].forEach((delay) => {
    window.setTimeout(() => {
      if (generation !== templateRenderGeneration) {
        return;
      }

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

  const pageTargets = [
    document.body,
    document.documentElement,
    queryFirst(githubHomeSelectors.dashboardRoot),
    queryFirst(['.application-main', '#js-pjax-container', '[data-turbo-body]']),
    queryFirst(githubHomeSelectors.feedMain),
    queryFirst(githubHomeSelectors.mainContent),
    queryFirst(githubHomeSelectors.rightSidebar),
    queryFirst(githubHomeSelectors.rightColumn),
  ];
  const pageImageTargets = [
    document.body,
    document.documentElement,
    queryFirst(githubHomeSelectors.dashboardRoot),
    queryFirst(['.application-main', '#js-pjax-container', '[data-turbo-body]']),
  ];
  const backgroundImage = getCssBackgroundImage(appearance.backgroundImageUrl);

  if (typeof appearance.backgroundColor === 'string') {
    document.documentElement.style.setProperty('--git-reflow-page-background', appearance.backgroundColor);

    pageTargets.forEach((target) => {
      if (target instanceof HTMLElement) {
        target.classList.add(APPEARANCE_CLASS);
        target.style.setProperty('background-color', appearance.backgroundColor, 'important');
      }
    });
  }

  if (backgroundImage) {
    document.documentElement.style.setProperty('--git-reflow-page-background-image', backgroundImage);
    document.documentElement.style.setProperty(
      '--git-reflow-page-background-position',
      getText(appearance.backgroundImagePosition, 'right top'),
    );
    document.documentElement.style.setProperty(
      '--git-reflow-page-background-size',
      getText(appearance.backgroundImageSize, '360px auto'),
    );
    document.documentElement.style.setProperty(
      '--git-reflow-page-background-repeat',
      getText(appearance.backgroundImageRepeat, 'no-repeat'),
    );

    pageImageTargets.forEach((target) => {
      if (target instanceof HTMLElement) {
        target.classList.add(APPEARANCE_CLASS);
        target.style.setProperty('background-image', backgroundImage, 'important');
        target.style.setProperty(
          'background-position',
          getText(appearance.backgroundImagePosition, 'right top'),
          'important',
        );
        target.style.setProperty('background-size', getText(appearance.backgroundImageSize, '360px auto'), 'important');
        target.style.setProperty(
          'background-repeat',
          getText(appearance.backgroundImageRepeat, 'no-repeat'),
          'important',
        );
      }
    });
    applyBackgroundImageLayer(appearance);
  } else {
    removeBackgroundImageLayer();
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

function clearPageAppearance() {
  removeBackgroundImageLayer();
  document.documentElement.style.removeProperty('--git-reflow-page-background');
  document.documentElement.style.removeProperty('--git-reflow-page-background-image');
  document.documentElement.style.removeProperty('--git-reflow-page-background-position');
  document.documentElement.style.removeProperty('--git-reflow-page-background-size');
  document.documentElement.style.removeProperty('--git-reflow-page-background-repeat');
  document.documentElement.style.removeProperty('--git-reflow-left-sidebar-background');

  [
    document.body,
    document.documentElement,
    queryFirst(githubHomeSelectors.dashboardRoot),
    queryFirst(['.application-main', '#js-pjax-container', '[data-turbo-body]']),
    queryFirst(githubHomeSelectors.feedMain),
    queryFirst(githubHomeSelectors.mainContent),
    queryFirst(githubHomeSelectors.rightSidebar),
    queryFirst(githubHomeSelectors.rightColumn),
    queryFirst(githubHomeSelectors.leftSidebar),
    queryFirst(githubHomeSelectors.leftSidebarContent),
  ].forEach(clearAppearance);
}

function getAppearanceTargets(block, element) {
  if (!(element instanceof HTMLElement)) {
    return [];
  }

  if (block.type === 'repository-header') {
    return [
      queryFirst(githubRepositorySelectors.repositoryHeader),
      queryFirst(githubRepositorySelectors.repositoryNav),
      element,
    ].filter((target, index, targets) => target instanceof HTMLElement && targets.indexOf(target) === index);
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

function findContainingRegionInfo(element) {
  if (!(element instanceof HTMLElement)) {
    return null;
  }

  for (const [region, selectors] of Object.entries(regionContainers)) {
    const regionRoot = queryFirst(selectors);

    if (regionRoot instanceof HTMLElement && regionRoot.contains(element)) {
      return { region, root: regionRoot };
    }
  }

  return null;
}

function findContainingRegionRoot(element) {
  return findContainingRegionInfo(element)?.root ?? null;
}

function getNativeBlockRegion(block) {
  const registrySelectors = blockSelectorRegistry[block.type] ?? [];

  for (const [region, selectors] of Object.entries(regionContainers)) {
    if (registrySelectors.some((selector) => selectors.includes(selector))) {
      return region;
    }
  }

  const defaultRegions = {
    'top-nav': 'topbar',
    'profile-summary': 'left-sidebar',
    'recent-repos': 'left-sidebar',
    'copilot-prompt': 'main-feed',
    'activity-feed': 'main-feed',
    'repo-updates': 'right-sidebar',
    'pinned-repos': 'right-sidebar',
    'issue-pr-updates': 'right-sidebar',
    'trending-repos': 'right-sidebar',
    'recommended-repos': 'right-sidebar',
    'repository-header': 'topbar',
    'repository-file-list': 'main-feed',
    'repository-readme': 'main-feed',
    'repository-about-sidebar': 'right-sidebar',
  };

  return defaultRegions[block.type] ?? block.region;
}

function getBlockRootFromMatchedElement(block, element, root) {
  const containingRegion = findContainingRegionInfo(element);
  const blockRoot = root instanceof HTMLElement && root !== document.body ? root : containingRegion?.root;
  const currentRegion = containingRegion?.region;

  return currentRegion === 'right-sidebar'
    ? findRightSidebarCardRoot(element, blockRoot)
    : findRegionBlockRoot(element, blockRoot);
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

function findBlockElementInRoot(block, root) {
  const selectors = blockSelectorRegistry[block.type] ?? [];

  for (const selector of selectors) {
    const element = queryFirst([selector], root ?? document);

    if (element instanceof HTMLElement) {
      return getBlockRootFromMatchedElement(block, element, root);
    }
  }

  const textMatched = findElementByText(root ?? document, blockTextMatchers[block.type]);
  if (!(textMatched instanceof HTMLElement)) {
    return null;
  }

  return getBlockRootFromMatchedElement(block, textMatched, root);
}

function findBlockElement(block) {
  const existingGenerated = document.querySelector(
    `.${GENERATED_BLOCK_CLASS}[data-git-reflow-block-id="${CSS.escape(block.id)}"]`,
  );

  if (existingGenerated instanceof HTMLElement) {
    return existingGenerated;
  }

  const existingApplied = document.querySelector(
    `.${BLOCK_CLASS}[data-git-reflow-block-id="${CSS.escape(block.id)}"]`,
  );

  if (existingApplied instanceof HTMLElement) {
    return existingApplied;
  }

  const regionRoot = queryFirst(regionContainers[block.region] ?? []);
  const nativeRegionRoot = queryFirst(regionContainers[getNativeBlockRegion(block)] ?? []);
  const searchRoots = [regionRoot, nativeRegionRoot, document].filter(
    (root, index, roots) => root && roots.indexOf(root) === index,
  );

  for (const root of searchRoots) {
    const match = findBlockElementInRoot(block, root);

    if (match instanceof HTMLElement) {
      return match;
    }
  }

  return null;
}

function getRegionContainer(region) {
  const repositoryRegionContainers = {
    topbar: githubRepositorySelectors.repositoryHeader,
    'left-sidebar': [],
    'main-feed': githubRepositorySelectors.repositoryMain,
    'right-sidebar': githubRepositorySelectors.sidebar,
  };
  const selectors = isGitHubRepositoryRoute()
    ? [...(repositoryRegionContainers[region] ?? []), ...(regionContainers[region] ?? [])]
    : (regionContainers[region] ?? []);
  const container = queryFirst(selectors);
  return container instanceof HTMLElement ? container : null;
}

function moveBlockElementToRegion(element, container, region) {
  if (!(element instanceof HTMLElement) || !(container instanceof HTMLElement) || region === 'topbar') {
    return;
  }

  if (!container.contains(element)) {
    container.append(element);
  }
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
    item.href = getText(repo.href) || `/${encodeURIComponent(getText(repo.name, 'repository')).replace('%2F', '/')}`;
    item.className = 'git-reflow-block-row';
    item.append(createTextElement('strong', getText(repo.name, 'Repository')));

    const meta = getText(repo.visibility || repo.language || repo.reason || repo.stars);
    if (meta) {
      item.append(createTextElement('span', meta));
    }

    list.append(item);
  });

  return list;
}

function createRepositoryFileList(props, itemLimit) {
  const wrapper = document.createElement('div');
  wrapper.className = 'git-reflow-repository-files';

  const toolbar = document.createElement('div');
  toolbar.className = 'git-reflow-repository-files__toolbar';
  toolbar.append(createTextElement('strong', getText(props.branch, 'main')));
  toolbar.append(createTextElement('span', 'Code'));
  wrapper.append(toolbar);

  const commit = document.createElement('div');
  commit.className = 'git-reflow-repository-files__commit';
  commit.append(createTextElement('strong', getText(props.commitAuthor, 'sample-user')));
  commit.append(createTextElement('span', getText(props.commitMessage, 'Update README')));
  commit.append(createTextElement('time', getText(props.commitTime, 'now')));
  wrapper.append(commit);

  const rows = document.createElement('div');
  rows.className = 'git-reflow-repository-file-list';
  getArray(props.files).slice(0, itemLimit).forEach((file) => {
    const row = document.createElement('div');
    row.className = 'git-reflow-repository-file-row';
    row.dataset.fileType = getText(file.type, 'file');
    row.append(createTextElement('strong', getText(file.name, 'README.md')));
    row.append(createTextElement('span', getText(file.message, 'Update file')));
    rows.append(row);
  });
  wrapper.append(rows);

  return wrapper;
}

function createRepositoryHeaderSurface(props) {
  const header = document.createElement('section');
  header.className = 'git-reflow-repository-header-surface';

  const titleRow = document.createElement('div');
  titleRow.className = 'git-reflow-repository-header-surface__title-row';

  const title = document.createElement('div');
  title.className = 'git-reflow-repository-header-surface__title';
  title.append(createTextElement('strong', getText(props.owner, 'template-owner')));
  title.append(createTextElement('span', '/'));
  title.append(createTextElement('strong', getText(props.repository, 'sample-readme-project')));
  title.append(createTextElement('em', getText(props.visibility, 'Public')));
  titleRow.append(title);

  const actions = document.createElement('div');
  actions.className = 'git-reflow-repository-header-surface__actions';
  getArray(props.actions).slice(0, 4).forEach((action) => {
    const button = document.createElement('button');
    button.type = 'button';
    button.textContent = `${getText(action.label, 'Action')}${getText(action.count) ? ` ${getText(action.count)}` : ''}`;
    actions.append(button);
  });
  titleRow.append(actions);
  header.append(titleRow);

  const tabs = document.createElement('nav');
  tabs.className = 'git-reflow-repository-header-surface__tabs';
  tabs.setAttribute('aria-label', 'Repository template navigation');
  getArray(props.tabs).forEach((tab) => {
    const link = document.createElement('a');
    link.href = `#${encodeURIComponent(getText(tab.label, 'tab').toLowerCase().replace(/\s+/g, '-'))}`;
    link.textContent = getText(tab.label, 'Tab');
    link.classList.toggle('is-active', Boolean(tab.active));
    tabs.append(link);
  });
  header.append(tabs);

  return header;
}

function createRepositoryReadme(props) {
  const article = document.createElement('article');
  article.className = 'git-reflow-repository-readme markdown-body';

  const header = document.createElement('div');
  header.className = 'git-reflow-repository-readme__header';
  header.append(createTextElement('strong', 'README.md'));
  article.append(header);

  const body = document.createElement('div');
  body.className = 'git-reflow-repository-readme__body';
  body.append(createTextElement('h1', getText(props.title, 'sample-readme-project')));

  const badges = getArray(props.badges);
  if (badges.length) {
    const badgeList = document.createElement('div');
    badgeList.className = 'git-reflow-chip-list';
    badges.slice(0, 8).forEach((badge) => badgeList.append(createTextElement('span', getText(badge))));
    body.append(badgeList);
  }

  getArray(props.sections).forEach((section) => {
    const sectionElement = document.createElement('section');
    sectionElement.append(createTextElement('h2', getText(section.heading, 'Section')));
    sectionElement.append(createTextElement('p', getText(section.body, 'Add README content here.')));
    body.append(sectionElement);
  });

  article.append(body);
  return article;
}

function createRepositoryAboutSidebar(props) {
  const sidebar = document.createElement('aside');
  sidebar.className = 'git-reflow-repository-about';

  const about = document.createElement('section');
  about.append(createTextElement('h2', 'About'));
  about.append(createTextElement('p', getText(props.description, 'Short repository description goes here.')));

  const links = getArray(props.links);
  if (links.length) {
    const linkList = document.createElement('div');
    linkList.className = 'git-reflow-repository-about__links';
    links.slice(0, 6).forEach((link) => {
      const anchor = document.createElement('a');
      anchor.href = `#${encodeURIComponent(getText(link).toLowerCase().replace(/\s+/g, '-'))}`;
      anchor.textContent = getText(link);
      linkList.append(anchor);
    });
    about.append(linkList);
  }
  sidebar.append(about);

  [
    ['Releases', getText(props.releases, 'No releases published')],
    ['Packages', getText(props.packages, 'No packages published')],
  ].forEach(([heading, body]) => {
    const section = document.createElement('section');
    section.append(createTextElement('h2', heading));
    section.append(createTextElement('p', body));
    sidebar.append(section);
  });

  const contributors = getArray(props.contributors);
  if (contributors.length) {
    const section = document.createElement('section');
    section.append(createTextElement('h2', 'Contributors'));
    const list = document.createElement('div');
    list.className = 'git-reflow-repository-contributors';
    contributors.slice(0, 8).forEach((contributor) => {
      const item = createTextElement('span', getText(contributor.initial, getText(contributor.name, 'u').slice(0, 1)));
      item.title = getText(contributor.name, 'sample-user');
      list.append(item);
    });
    section.append(list);
    sidebar.append(section);
  }

  const languages = getArray(props.languages);
  if (languages.length) {
    const section = document.createElement('section');
    section.append(createTextElement('h2', 'Languages'));
    const bar = document.createElement('div');
    bar.className = 'git-reflow-repository-language-bar';
    languages.forEach((language) => {
      const segment = document.createElement('span');
      segment.style.width = `${Math.max(0, Math.min(100, Number(language.percent) || 0))}%`;
      segment.style.background = getText(language.color, '#0969da');
      bar.append(segment);
    });
    section.append(bar);

    const list = document.createElement('div');
    list.className = 'git-reflow-repository-language-list';
    languages.forEach((language) => {
      const row = createTextElement('span', `${getText(language.name, 'Language')} ${Number(language.percent) || 0}%`);
      list.append(row);
    });
    section.append(list);
    sidebar.append(section);
  }

  return sidebar;
}

function getRepositoryPageHost() {
  const existing = document.getElementById(REPOSITORY_PAGE_HOST_ID);
  if (existing instanceof HTMLElement) {
    return existing;
  }

  const repoRoot = queryFirst(githubRepositorySelectors.repositoryRoot);
  const headerRoot = queryFirst(githubRepositorySelectors.repositoryHeader);
  const anchor = repoRoot ?? headerRoot ?? queryFirst(['main#js-repo-pjax-container', 'main#main-content', '.application-main']);
  const host = document.createElement('div');
  host.id = REPOSITORY_PAGE_HOST_ID;
  host.className = 'git-reflow-repository-page-host';

  if (anchor?.parentElement) {
    anchor.parentElement.insertBefore(host, anchor);
  } else {
    document.body.append(host);
  }

  return host;
}

function hideNativeRepositoryPage() {
  [
    ...githubRepositorySelectors.repositoryRoot,
    ...githubRepositorySelectors.repositoryHeader,
  ].forEach((selector) => {
    document.querySelectorAll(selector).forEach((element) => {
      if (element instanceof HTMLElement && !element.closest(`#${REPOSITORY_PAGE_HOST_ID}`)) {
        element.classList.add(HIDDEN_CLASS);
      }
    });
  });
}

function renderRepositoryPageTemplate(blocks, generation) {
  const host = getRepositoryPageHost();
  const headerBlock = blocks.find((block) => block.type === 'repository-header');
  const fileBlock = blocks.find((block) => block.type === 'repository-file-list');
  const readmeBlock = blocks.find((block) => block.type === 'repository-readme');
  const aboutBlock = blocks.find((block) => block.type === 'repository-about-sidebar');

  if (!(host instanceof HTMLElement) || !headerBlock || (!fileBlock && !readmeBlock && !aboutBlock)) {
    return false;
  }

  hideNativeRepositoryPage();
  host.replaceChildren();

  const headerProps = isObject(headerBlock.props) ? headerBlock.props : {};
  const header = createRepositoryHeaderSurface(headerProps);
  header.dataset.gitReflowBlockId = headerBlock.id;
  header.dataset.gitReflowBlockType = headerBlock.type;
  applyAppearance(header, headerProps.appearance);
  applyInnerAppearance(header, headerProps.appearance);
  applyTypographyAppearance(header, headerProps.appearance);
  host.append(header);

  const body = document.createElement('div');
  body.className = 'git-reflow-repository-page-host__body';
  const main = document.createElement('main');
  const sidebar = document.createElement('aside');

  [fileBlock, readmeBlock].filter(Boolean).forEach((block, index) => {
    const element = createGeneratedBlock(block);
    element.style.order = String(index);
    applyBlockProps(block, element, generation);
    main.append(element);
  });

  if (aboutBlock) {
    const element = createGeneratedBlock(aboutBlock);
    applyBlockProps(aboutBlock, element, generation);
    sidebar.append(element);
  }

  body.append(main, sidebar);
  host.append(body);
  return true;
}

function cleanupRepositoryGeneratedReplacements() {
  document.getElementById(REPOSITORY_PAGE_HOST_ID)?.remove();
  document
    .querySelectorAll(
      [
        `.${GENERATED_BLOCK_CLASS}[data-git-reflow-block-type="repository-file-list"]`,
        `.${GENERATED_BLOCK_CLASS}[data-git-reflow-block-type="repository-readme"]`,
        `.${GENERATED_BLOCK_CLASS}[data-git-reflow-block-type="repository-about-sidebar"]`,
      ].join(', '),
    )
    .forEach((element) => element.remove());
}

function restoreRememberedTextOverrides() {
  document.querySelectorAll(`[${ORIGINAL_TEXT_ATTR}]`).forEach((element) => {
    element.textContent = element.getAttribute(ORIGINAL_TEXT_ATTR) ?? '';
    element.removeAttribute(ORIGINAL_TEXT_ATTR);
  });
}

function removeRepositoryThemeStyle() {
  document.getElementById(REPOSITORY_THEME_STYLE_ID)?.remove();
}

function removeProfileThemeStyle() {
  document.getElementById(PROFILE_THEME_STYLE_ID)?.remove();
}

function getBlockAppearance(blocks, blockType) {
  const appearance = blocks.find((block) => block.type === blockType)?.props?.appearance;

  return isObject(appearance) ? appearance : {};
}

function sanitizeCssToken(value, fallback) {
  const text = getText(value, fallback);

  return /^[#(),.%\w\s-]+$/.test(text) ? text : fallback;
}

function getRepositoryThemeCss(blocks, pageAppearance) {
  const header = getBlockAppearance(blocks, 'repository-header');
  const files = getBlockAppearance(blocks, 'repository-file-list');
  const readme = getBlockAppearance(blocks, 'repository-readme');
  const about = getBlockAppearance(blocks, 'repository-about-sidebar');
  const pageBackground = sanitizeCssToken(pageAppearance?.backgroundColor, '#0b1120');
  const pagePanelBackground = `color-mix(in srgb, ${pageBackground} 82%, #ffffff 7%)`;
  const pagePanelInner = `color-mix(in srgb, ${pageBackground} 72%, #ffffff 12%)`;
  const headerBackground = sanitizeCssToken(header.backgroundColor, pageBackground);
  const headerInner = sanitizeCssToken(header.innerBackgroundColor, pagePanelBackground);
  const headerText = sanitizeCssToken(header.textColor, '#f0f6fc');
  const headerLink = sanitizeCssToken(header.linkColor, '#58a6ff');
  const headerMuted = sanitizeCssToken(header.mutedTextColor, '#8b949e');
  const fileBackground = sanitizeCssToken(files.backgroundColor, pagePanelBackground);
  const fileInner = sanitizeCssToken(files.innerBackgroundColor, pagePanelInner);
  const fileText = sanitizeCssToken(files.textColor, '#f0f6fc');
  const fileLink = sanitizeCssToken(files.linkColor, '#58a6ff');
  const fileMuted = sanitizeCssToken(files.mutedTextColor, '#8b949e');
  const readmeBackground = sanitizeCssToken(readme.backgroundColor, pagePanelBackground);
  const readmeInner = sanitizeCssToken(readme.innerBackgroundColor, pagePanelInner);
  const readmeText = sanitizeCssToken(readme.textColor, '#f0f6fc');
  const readmeLink = sanitizeCssToken(readme.linkColor, '#58a6ff');
  const readmeMuted = sanitizeCssToken(readme.mutedTextColor, '#8b949e');
  const aboutBackground = sanitizeCssToken(about.backgroundColor, pagePanelBackground);
  const aboutInner = sanitizeCssToken(about.innerBackgroundColor, pagePanelInner);
  const aboutText = sanitizeCssToken(about.textColor, '#f0f6fc');
  const aboutLink = sanitizeCssToken(about.linkColor, '#58a6ff');
  const aboutMuted = sanitizeCssToken(about.mutedTextColor, '#8b949e');

  return `
body.git-reflow-template-active {
  background: ${pageBackground} !important;
}
body.git-reflow-template-active :is(.application-main, main#main-content, #js-repo-pjax-container, #repo-content-pjax-container, #repo-content-turbo-frame, react-app[app-name="code-view"], [class*="PageLayout-PageLayoutContent"], [class*="PageLayout-ContentWrapper"], [class*="PageLayout-Content"], [class*="PageLayout-PaneWrapper"]) {
  background: ${pageBackground} !important;
}
body.git-reflow-template-active :is(
  .Layout,
  .Layout-main,
  .Layout-sidebar,
  .repository-content,
  [data-hpc],
  [data-turbo-frame],
  react-app[app-name*="code"],
  [class*="Repository"],
  [class*="Overview"]
) {
  background-color: transparent !important;
}
body.git-reflow-template-active :is(#repo-content-pjax-container, #repo-content-turbo-frame, react-app[app-name="code-view"], [class*="PageLayout-PageLayoutContent"], [class*="PageLayout-ContentWrapper"]) {
  --bgColor-default: ${fileBackground} !important;
  --bgColor-muted: ${fileInner} !important;
  --bgColor-inset: ${pageBackground} !important;
  --bgColor-neutral-muted: color-mix(in srgb, ${fileMuted} 18%, transparent) !important;
  --color-canvas-default: ${fileBackground} !important;
  --color-canvas-subtle: ${fileInner} !important;
  --color-canvas-inset: ${pageBackground} !important;
  --color-fg-default: ${fileText} !important;
  --color-fg-muted: ${fileMuted} !important;
  --color-accent-fg: ${fileLink} !important;
  --color-border-default: color-mix(in srgb, ${fileMuted} 38%, transparent) !important;
  --color-border-muted: color-mix(in srgb, ${fileMuted} 24%, transparent) !important;
  --color-btn-bg: ${fileInner} !important;
  --color-btn-border: color-mix(in srgb, ${fileMuted} 42%, transparent) !important;
  --color-btn-text: ${fileText} !important;
  --fgColor-default: ${fileText} !important;
  --fgColor-muted: ${fileMuted} !important;
  --fgColor-accent: ${fileLink} !important;
  --borderColor-default: color-mix(in srgb, ${fileMuted} 38%, transparent) !important;
  --borderColor-muted: color-mix(in srgb, ${fileMuted} 24%, transparent) !important;
  --control-bgColor-rest: ${fileInner} !important;
  --control-borderColor-rest: color-mix(in srgb, ${fileMuted} 42%, transparent) !important;
  --control-fgColor-rest: ${fileText} !important;
  --button-default-bgColor-rest: ${fileInner} !important;
  --button-default-borderColor-rest: color-mix(in srgb, ${fileMuted} 42%, transparent) !important;
  --button-default-fgColor-rest: ${fileText} !important;
  --button-primary-bgColor-rest: color-mix(in srgb, ${fileLink} 50%, ${fileBackground}) !important;
  --button-primary-fgColor-rest: ${fileText} !important;
}
body.git-reflow-template-active :is(
  main#main-content,
  #repo-content-pjax-container,
  #repo-content-turbo-frame,
  react-app[app-name*="code"],
  [class*="PageLayout"],
  [class*="OverviewContent"],
  [class*="OverviewRepoFiles"],
  [class*="Directory"],
  [class*="CodeView"],
  [class*="Repository"],
  [data-hpc]
) {
  --bgColor-default: ${fileBackground} !important;
  --bgColor-muted: ${fileInner} !important;
  --bgColor-inset: ${pageBackground} !important;
  --color-canvas-default: ${fileBackground} !important;
  --color-canvas-subtle: ${fileInner} !important;
  --color-canvas-inset: ${pageBackground} !important;
  --color-fg-default: ${fileText} !important;
  --color-fg-muted: ${fileMuted} !important;
  --color-accent-fg: ${fileLink} !important;
  --fgColor-default: ${fileText} !important;
  --fgColor-muted: ${fileMuted} !important;
  --fgColor-accent: ${fileLink} !important;
  --borderColor-default: color-mix(in srgb, ${fileMuted} 38%, transparent) !important;
  --borderColor-muted: color-mix(in srgb, ${fileMuted} 24%, transparent) !important;
  --control-bgColor-rest: ${fileInner} !important;
  --control-borderColor-rest: color-mix(in srgb, ${fileMuted} 42%, transparent) !important;
  --control-fgColor-rest: ${fileText} !important;
}
body.git-reflow-template-active :is(.AppHeader, .AppHeader-globalBar, .js-global-bar, [class*="AppHeader"], #repository-container-header, #repo-title-component, nav[aria-label="Repository"], #repository-container-header .UnderlineNav, #repository-container-header [class*="Underline"]) {
  --bgColor-default: ${headerBackground} !important;
  --bgColor-muted: ${headerInner} !important;
  --bgColor-inset: ${headerBackground} !important;
  --color-canvas-default: ${headerBackground} !important;
  --color-canvas-subtle: ${headerInner} !important;
  --color-canvas-inset: ${headerBackground} !important;
  --color-fg-default: ${headerText} !important;
  --color-fg-muted: ${headerMuted} !important;
  --color-accent-fg: ${headerLink} !important;
  --color-border-default: color-mix(in srgb, ${headerMuted} 34%, transparent) !important;
  --color-border-muted: color-mix(in srgb, ${headerMuted} 22%, transparent) !important;
  --color-btn-bg: ${headerInner} !important;
  --color-btn-border: color-mix(in srgb, ${headerMuted} 38%, transparent) !important;
  --color-btn-text: ${headerText} !important;
  --fgColor-default: ${headerText} !important;
  --fgColor-muted: ${headerMuted} !important;
  --fgColor-accent: ${headerLink} !important;
  --borderColor-default: color-mix(in srgb, ${headerMuted} 34%, transparent) !important;
  --borderColor-muted: color-mix(in srgb, ${headerMuted} 22%, transparent) !important;
  background: ${headerBackground} !important;
  color: ${headerText} !important;
  border-color: color-mix(in srgb, ${headerMuted} 34%, transparent) !important;
}
body.git-reflow-template-active :is(.AppHeader, .AppHeader-globalBar, .js-global-bar, [class*="AppHeader"], #repository-container-header, #repo-title-component, nav[aria-label="Repository"], #repository-container-header .UnderlineNav, #repository-container-header [class*="Underline"]) :is(a, span, strong, em, button, svg) {
  color: ${headerText} !important;
  fill: currentColor !important;
}
body.git-reflow-template-active :is(.AppHeader, .AppHeader-globalBar, .js-global-bar, [class*="AppHeader"], #repository-container-header, #repo-title-component, nav[aria-label="Repository"], #repository-container-header .UnderlineNav, #repository-container-header [class*="Underline"]) :is(a, [role="link"], [aria-current="page"]) {
  color: ${headerLink} !important;
}
body.git-reflow-template-active :is(.AppHeader, .AppHeader-globalBar, .js-global-bar, [class*="AppHeader"], #repository-container-header, #repo-title-component, nav[aria-label="Repository"], #repository-container-header .UnderlineNav, #repository-container-header [class*="Underline"]) :is(button, input, textarea, .Label, [class*="Button"], [class*="TextInput"]) {
  background: ${headerInner} !important;
  border-color: color-mix(in srgb, ${headerMuted} 38%, transparent) !important;
  color: ${headerText} !important;
}
body.git-reflow-template-active :is(
  header[role="banner"],
  header[aria-label="Global Navigation Menu"],
  .GlobalNav,
  [class*="GlobalNav"]
) {
  --bgColor-default: ${headerBackground} !important;
  --bgColor-muted: ${headerInner} !important;
  --bgColor-inset: ${headerBackground} !important;
  --color-canvas-default: ${headerBackground} !important;
  --color-canvas-subtle: ${headerInner} !important;
  --color-canvas-inset: ${headerBackground} !important;
  --color-fg-default: ${headerText} !important;
  --color-fg-muted: ${headerMuted} !important;
  --color-accent-fg: ${headerLink} !important;
  --fgColor-default: ${headerText} !important;
  --fgColor-muted: ${headerMuted} !important;
  --fgColor-accent: ${headerLink} !important;
  --borderColor-default: color-mix(in srgb, ${headerMuted} 34%, transparent) !important;
  --borderColor-muted: color-mix(in srgb, ${headerMuted} 22%, transparent) !important;
  --control-bgColor-rest: ${headerInner} !important;
  --control-borderColor-rest: color-mix(in srgb, ${headerMuted} 38%, transparent) !important;
  --control-fgColor-rest: ${headerText} !important;
  background: ${headerBackground} !important;
  background-color: ${headerBackground} !important;
  color: ${headerText} !important;
  border-color: color-mix(in srgb, ${headerMuted} 34%, transparent) !important;
}
body.git-reflow-template-active :is(
  header[role="banner"],
  header[aria-label="Global Navigation Menu"],
  .GlobalNav,
  [class*="GlobalNav"]
) > div,
body.git-reflow-template-active :is(
  header[role="banner"],
  header[aria-label="Global Navigation Menu"],
  .GlobalNav,
  [class*="GlobalNav"]
) :is([class*="prc-Stack-Stack"], [class*="Stack-Stack"]) {
  background: ${headerBackground} !important;
  background-color: ${headerBackground} !important;
  color: ${headerText} !important;
  border-color: color-mix(in srgb, ${headerMuted} 34%, transparent) !important;
}
body.git-reflow-template-active :is(
  header[role="banner"],
  header[aria-label="Global Navigation Menu"],
  .GlobalNav,
  [class*="GlobalNav"]
) :is(a, span, strong, em, button, svg, [role="button"]) {
  color: ${headerText} !important;
  fill: currentColor !important;
}
body.git-reflow-template-active :is(
  header[role="banner"],
  header[aria-label="Global Navigation Menu"],
  .GlobalNav,
  [class*="GlobalNav"]
) :is(a, [role="link"], [aria-current="page"]) {
  color: ${headerLink} !important;
}
body.git-reflow-template-active :is(
  header[role="banner"],
  header[aria-label="Global Navigation Menu"],
  .GlobalNav,
  [class*="GlobalNav"]
) :is(button, input, textarea, .Label, [class*="Button"], [class*="TextInput"], [class*="SearchInput"], [class*="ActionList"], [class*="IconButton"]) {
  background: ${headerInner} !important;
  background-color: ${headerInner} !important;
  border-color: color-mix(in srgb, ${headerMuted} 38%, transparent) !important;
  color: ${headerText} !important;
}
body.git-reflow-template-active :is([class*="OverviewContent-module__Box_1"], [class*="OverviewContent-module__Box_2"], [class*="OverviewContent-module__Box_6"], [class*="OverviewContent-module__Box_7"], [class*="OverviewContent-module__Box_8"], [class*="OverviewContent-module__Box_9"], [class*="OverviewContent-module__Box_10"], [class*="OverviewContent-module__FileResultsList"], [class*="FileResultsList"], .overview-ref-selector, .TextInput-wrapper, [class*="TextInputWrapper"]) {
  background: transparent !important;
  color: ${fileText} !important;
  border-color: color-mix(in srgb, ${fileMuted} 32%, transparent) !important;
}
body.git-reflow-template-active main#main-content :is(
  .Box,
  .Box-header,
  .Box-row,
  [class*="Box"],
  [class*="Header"],
  [class*="FileResultsList"],
  [class*="DirectoryContent"],
  [class*="RepositoryContent"],
  [data-testid*="file"],
  [data-testid*="directory"]
) {
  background-color: ${fileBackground} !important;
  border-color: color-mix(in srgb, ${fileMuted} 30%, transparent) !important;
  color: ${fileText} !important;
}
body.git-reflow-template-active :is([class*="OverviewContent-module__Box_1"], [class*="OverviewContent-module__Box_2"], [class*="OverviewContent-module__Box_6"], [class*="OverviewContent-module__Box_7"], [class*="OverviewContent-module__Box_8"], [class*="OverviewContent-module__Box_9"], [class*="OverviewContent-module__Box_10"], [class*="OverviewContent-module__FileResultsList"], [class*="FileResultsList"]) :is(button, input, textarea, [class*="Button"], [class*="TextInput"]) {
  background: ${fileInner} !important;
  border-color: color-mix(in srgb, ${fileMuted} 40%, transparent) !important;
  color: ${fileText} !important;
}
body.git-reflow-template-active :is([class*="OverviewContent-module__Box_11"], table[aria-labelledby="folders-and-files"], .Table-module__Box__HZKiQ, [data-testid="file-and-directory-list"]) {
  --bgColor-default: ${fileBackground} !important;
  --bgColor-muted: ${fileInner} !important;
  --bgColor-inset: ${fileInner} !important;
  --color-canvas-default: ${fileBackground} !important;
  --color-canvas-subtle: ${fileInner} !important;
  --color-canvas-inset: ${fileInner} !important;
  --color-fg-default: ${fileText} !important;
  --color-fg-muted: ${fileMuted} !important;
  --color-accent-fg: ${fileLink} !important;
  --color-border-default: color-mix(in srgb, ${fileMuted} 38%, transparent) !important;
  --color-border-muted: color-mix(in srgb, ${fileMuted} 24%, transparent) !important;
  --fgColor-default: ${fileText} !important;
  --fgColor-muted: ${fileMuted} !important;
  --fgColor-accent: ${fileLink} !important;
  --borderColor-default: color-mix(in srgb, ${fileMuted} 38%, transparent) !important;
  --borderColor-muted: color-mix(in srgb, ${fileMuted} 24%, transparent) !important;
  background: ${fileBackground} !important;
  border-color: color-mix(in srgb, ${fileMuted} 38%, transparent) !important;
  color: ${fileText} !important;
}
body.git-reflow-template-active :is(table[aria-labelledby="folders-and-files"], .Table-module__Box__HZKiQ, [class*="DirectoryContent"], [class*="LatestCommit"], [class*="CommitAttribution"], .react-directory-row, .react-directory-row td, .react-directory-filename-column, .react-directory-filename-cell, .react-directory-truncate, .react-directory-commit-message, .react-directory-commit-age) {
  background: ${fileBackground} !important;
  border-color: color-mix(in srgb, ${fileMuted} 28%, transparent) !important;
  color: ${fileText} !important;
}
body.git-reflow-template-active :is(table[aria-labelledby="folders-and-files"], .Table-module__Box__HZKiQ, [class*="DirectoryContent"], [class*="LatestCommit"], .react-directory-row) :is(thead, tbody, tr, th, td, [class*="Box"], [class*="Row"]) {
  background: ${fileBackground} !important;
  border-color: color-mix(in srgb, ${fileMuted} 28%, transparent) !important;
  color: ${fileText} !important;
}
body.git-reflow-template-active :is(table[aria-labelledby="folders-and-files"], .Table-module__Box__HZKiQ, [class*="DirectoryContent"], [class*="LatestCommit"], .react-directory-row) :is(.bgColor-muted, [class*="OverviewHeaderRow"], [data-testid="latest-commit"]) {
  background: ${fileInner} !important;
  border-color: color-mix(in srgb, ${fileMuted} 34%, transparent) !important;
}
body.git-reflow-template-active main#main-content :is(
  [data-testid="latest-commit"],
  [class*="LatestCommit"],
  [class*="OverviewHeaderRow"],
  .Box-header,
  .Box-row:first-child
) {
  background-color: ${fileInner} !important;
  border-color: color-mix(in srgb, ${fileMuted} 34%, transparent) !important;
}
body.git-reflow-template-active :is(table[aria-labelledby="folders-and-files"], .Table-module__Box__HZKiQ, [class*="DirectoryContent"], [class*="LatestCommit"], .react-directory-row) :is(a, [role="link"], .Link--primary, .Link--secondary) {
  color: ${fileLink} !important;
}
body.git-reflow-template-active :is(table[aria-labelledby="folders-and-files"], .Table-module__Box__HZKiQ, [class*="DirectoryContent"], [class*="LatestCommit"], .react-directory-row) :is(span, time, relative-time, small, .fgColor-muted, .color-fg-muted) {
  color: ${fileMuted} !important;
}
body.git-reflow-template-active :is([class*="OverviewRepoFiles-module__Box"], [class*="OverviewRepoFiles-module__UnderlineNav"], [class*="DirectoryRichtextContent-module__SharedMarkdownContent"], article.markdown-body, article.markdown-body.entry-content) {
  --bgColor-default: ${readmeBackground} !important;
  --bgColor-muted: ${readmeInner} !important;
  --bgColor-inset: ${readmeInner} !important;
  --color-canvas-default: ${readmeBackground} !important;
  --color-canvas-subtle: ${readmeInner} !important;
  --color-canvas-inset: ${readmeInner} !important;
  --color-fg-default: ${readmeText} !important;
  --color-fg-muted: ${readmeMuted} !important;
  --color-accent-fg: ${readmeLink} !important;
  --color-border-default: color-mix(in srgb, ${readmeMuted} 34%, transparent) !important;
  --color-border-muted: color-mix(in srgb, ${readmeMuted} 22%, transparent) !important;
  --fgColor-default: ${readmeText} !important;
  --fgColor-muted: ${readmeMuted} !important;
  --fgColor-accent: ${readmeLink} !important;
  --borderColor-default: color-mix(in srgb, ${readmeMuted} 34%, transparent) !important;
  --borderColor-muted: color-mix(in srgb, ${readmeMuted} 22%, transparent) !important;
  background: ${readmeBackground} !important;
  border-color: color-mix(in srgb, ${readmeMuted} 34%, transparent) !important;
  color: ${readmeText} !important;
}
body.git-reflow-template-active main#main-content :is(
  .Box:has(article.markdown-body),
  .Box:has(#readme),
  [class*="DirectoryRichtextContent"],
  [class*="SharedMarkdownContent"],
  [data-testid*="readme"]
) {
  background-color: ${readmeBackground} !important;
  border-color: color-mix(in srgb, ${readmeMuted} 34%, transparent) !important;
  color: ${readmeText} !important;
}
body.git-reflow-template-active :is([class*="OverviewRepoFiles-module__UnderlineNav"], [class*="OverviewRepoFiles-module__Box_3"]) {
  background: ${readmeInner} !important;
  border-color: color-mix(in srgb, ${readmeMuted} 30%, transparent) !important;
}
body.git-reflow-template-active :is([class*="DirectoryRichtextContent-module__SharedMarkdownContent"], article.markdown-body, article.markdown-body.entry-content) :is(h1, h2, h3, h4, h5, h6, p, li, span, strong, em, table, td, th) {
  color: ${readmeText} !important;
  border-color: color-mix(in srgb, ${readmeMuted} 28%, transparent) !important;
}
body.git-reflow-template-active :is([class*="DirectoryRichtextContent-module__SharedMarkdownContent"], article.markdown-body, article.markdown-body.entry-content) :is(a, [role="link"]) {
  color: ${readmeLink} !important;
}
body.git-reflow-template-active :is([class*="DirectoryRichtextContent-module__SharedMarkdownContent"], article.markdown-body, article.markdown-body.entry-content) :is(pre, code, blockquote, table, tr, td, th) {
  background: ${readmeInner} !important;
}
body.git-reflow-template-active :is([class*="PageLayout-Pane"], [class*="PageLayout-PaneWrapper"], .Layout-sidebar, .Layout-sidebar .Box, aside[aria-label*="Repository"], [data-testid="repository-sidebar"], .hide-sm.hide-md, .BorderGrid, .BorderGrid-row, .BorderGrid-cell) {
  --bgColor-default: ${aboutBackground} !important;
  --bgColor-muted: ${aboutInner} !important;
  --bgColor-inset: ${aboutInner} !important;
  --color-canvas-default: ${aboutBackground} !important;
  --color-canvas-subtle: ${aboutInner} !important;
  --color-canvas-inset: ${aboutInner} !important;
  --color-fg-default: ${aboutText} !important;
  --color-fg-muted: ${aboutMuted} !important;
  --color-accent-fg: ${aboutLink} !important;
  --color-border-default: color-mix(in srgb, ${aboutMuted} 34%, transparent) !important;
  --color-border-muted: color-mix(in srgb, ${aboutMuted} 22%, transparent) !important;
  --fgColor-default: ${aboutText} !important;
  --fgColor-muted: ${aboutMuted} !important;
  --fgColor-accent: ${aboutLink} !important;
  --borderColor-default: color-mix(in srgb, ${aboutMuted} 34%, transparent) !important;
  --borderColor-muted: color-mix(in srgb, ${aboutMuted} 22%, transparent) !important;
  background: ${aboutBackground} !important;
  border-color: color-mix(in srgb, ${aboutMuted} 30%, transparent) !important;
  color: ${aboutText} !important;
}
body.git-reflow-template-active :is(
  .Layout-sidebar,
  [class*="PageLayout-Pane"],
  aside[aria-label*="Repository"],
  [data-testid="repository-sidebar"]
) :is(
  .Box,
  .BorderGrid,
  .BorderGrid-row,
  .BorderGrid-cell,
  [class*="Sidebar"],
  [class*="About"],
  [class*="Languages"],
  [class*="Deployments"]
) {
  background-color: ${aboutBackground} !important;
  border-color: color-mix(in srgb, ${aboutMuted} 30%, transparent) !important;
  color: ${aboutText} !important;
}
body.git-reflow-template-active :is(.BorderGrid, .BorderGrid-row, .BorderGrid-cell, [class*="SidebarAbout-module"], [class*="SidebarLanguages-module"], [class*="PageLayout-Pane"]) :is(h1, h2, h3, h4, p, span, strong, li, svg) {
  color: ${aboutText} !important;
  fill: currentColor !important;
}
body.git-reflow-template-active :is(.BorderGrid, .BorderGrid-row, .BorderGrid-cell, [class*="SidebarAbout-module"], [class*="SidebarLanguages-module"], [class*="PageLayout-Pane"]) :is(a, [role="link"], .Link--primary, .Link--secondary) {
  color: ${aboutLink} !important;
}
body.git-reflow-template-active :is(.BorderGrid, .BorderGrid-row, .BorderGrid-cell, [class*="SidebarAbout-module"], [class*="SidebarLanguages-module"], [class*="PageLayout-Pane"]) :is(.Label, [class*="Label"], button, [class*="Button"]) {
  background: ${aboutInner} !important;
  border-color: color-mix(in srgb, ${aboutMuted} 34%, transparent) !important;
  color: ${aboutLink} !important;
}
`;
}

function applyRepositoryThemeStyle(blocks, pageAppearance) {
  let style = document.getElementById(REPOSITORY_THEME_STYLE_ID);

  if (!(style instanceof HTMLStyleElement)) {
    style = document.createElement('style');
    style.id = REPOSITORY_THEME_STYLE_ID;
    document.head.append(style);
  }

  style.textContent = getRepositoryThemeCss(blocks, isObject(pageAppearance) ? pageAppearance : {});
}

function getProfileThemeCss(blocks, pageAppearance) {
  const topbar = getBlockAppearance(blocks, 'top-nav');
  const sidebar = getBlockAppearance(blocks, 'profile-sidebar');
  const readme = getBlockAppearance(blocks, 'profile-readme');
  const pinned = getBlockAppearance(blocks, 'profile-pinned-repos');
  const contributions = getBlockAppearance(blocks, 'profile-contributions');
  const pageBackground = sanitizeCssToken(pageAppearance?.backgroundColor, '#0b1120');
  const pagePanelBackground = `color-mix(in srgb, ${pageBackground} 82%, #ffffff 7%)`;
  const pagePanelInner = `color-mix(in srgb, ${pageBackground} 72%, #ffffff 12%)`;
  const headerBackground = sanitizeCssToken(topbar.backgroundColor, pageBackground);
  const headerInner = sanitizeCssToken(topbar.innerBackgroundColor, pagePanelBackground);
  const headerText = sanitizeCssToken(topbar.textColor, '#f0f6fc');
  const headerLink = sanitizeCssToken(topbar.linkColor, '#58a6ff');
  const headerMuted = sanitizeCssToken(topbar.mutedTextColor, '#8b949e');
  const sidebarBackground = sanitizeCssToken(sidebar.backgroundColor, pagePanelBackground);
  const sidebarInner = sanitizeCssToken(sidebar.innerBackgroundColor, pagePanelInner);
  const sidebarText = sanitizeCssToken(sidebar.textColor, '#f0f6fc');
  const sidebarLink = sanitizeCssToken(sidebar.linkColor, '#58a6ff');
  const sidebarMuted = sanitizeCssToken(sidebar.mutedTextColor, '#8b949e');
  const readmeBackground = sanitizeCssToken(readme.backgroundColor, pagePanelBackground);
  const readmeInner = sanitizeCssToken(readme.innerBackgroundColor, pagePanelInner);
  const readmeText = sanitizeCssToken(readme.textColor, '#f0f6fc');
  const readmeLink = sanitizeCssToken(readme.linkColor, '#58a6ff');
  const readmeMuted = sanitizeCssToken(readme.mutedTextColor, '#8b949e');
  const pinnedBackground = sanitizeCssToken(pinned.backgroundColor, pagePanelBackground);
  const pinnedInner = sanitizeCssToken(pinned.innerBackgroundColor, pagePanelInner);
  const pinnedText = sanitizeCssToken(pinned.textColor, '#f0f6fc');
  const pinnedLink = sanitizeCssToken(pinned.linkColor, '#58a6ff');
  const pinnedMuted = sanitizeCssToken(pinned.mutedTextColor, '#8b949e');
  const contributionBackground = sanitizeCssToken(contributions.backgroundColor, pagePanelBackground);
  const contributionInner = sanitizeCssToken(contributions.innerBackgroundColor, pagePanelInner);
  const contributionText = sanitizeCssToken(contributions.textColor, '#f0f6fc');
  const contributionLink = sanitizeCssToken(contributions.linkColor, '#58a6ff');
  const contributionMuted = sanitizeCssToken(contributions.mutedTextColor, '#8b949e');

  return `
body.git-reflow-template-active.page-profile,
body.git-reflow-template-active:has(#user-profile-frame) {
  background: ${pageBackground} !important;
}
body.git-reflow-template-active :is(.application-main, main#js-pjax-container, main#main-content, #user-profile-frame, [data-turbo-frame="user-profile-frame"]) {
  --bgColor-default: ${readmeBackground} !important;
  --bgColor-muted: ${readmeInner} !important;
  --bgColor-inset: ${pageBackground} !important;
  --color-canvas-default: ${readmeBackground} !important;
  --color-canvas-subtle: ${readmeInner} !important;
  --color-canvas-inset: ${pageBackground} !important;
  --color-fg-default: ${readmeText} !important;
  --color-fg-muted: ${readmeMuted} !important;
  --color-accent-fg: ${readmeLink} !important;
  --fgColor-default: ${readmeText} !important;
  --fgColor-muted: ${readmeMuted} !important;
  --fgColor-accent: ${readmeLink} !important;
  --borderColor-default: color-mix(in srgb, ${readmeMuted} 38%, transparent) !important;
  --borderColor-muted: color-mix(in srgb, ${readmeMuted} 24%, transparent) !important;
  background: ${pageBackground} !important;
  color: ${readmeText} !important;
}
body.git-reflow-template-active :is(
  header[role="banner"],
  header[aria-label="Global Navigation Menu"],
  .GlobalNav,
  [class*="GlobalNav"]
) {
  --bgColor-default: ${headerBackground} !important;
  --bgColor-muted: ${headerInner} !important;
  --color-fg-default: ${headerText} !important;
  --color-fg-muted: ${headerMuted} !important;
  --color-accent-fg: ${headerLink} !important;
  --fgColor-default: ${headerText} !important;
  --fgColor-muted: ${headerMuted} !important;
  --fgColor-accent: ${headerLink} !important;
  --control-bgColor-rest: ${headerInner} !important;
  --control-borderColor-rest: color-mix(in srgb, ${headerMuted} 38%, transparent) !important;
  background: ${headerBackground} !important;
  background-color: ${headerBackground} !important;
  color: ${headerText} !important;
  border-color: color-mix(in srgb, ${headerMuted} 34%, transparent) !important;
}
body.git-reflow-template-active :is(
  header[role="banner"],
  header[aria-label="Global Navigation Menu"],
  .GlobalNav,
  [class*="GlobalNav"]
) > div,
body.git-reflow-template-active :is(
  header[role="banner"],
  header[aria-label="Global Navigation Menu"],
  .GlobalNav,
  [class*="GlobalNav"]
) :is([class*="prc-Stack-Stack"], [class*="Stack-Stack"]) {
  background: ${headerBackground} !important;
  background-color: ${headerBackground} !important;
  color: ${headerText} !important;
}
body.git-reflow-template-active :is(
  header[role="banner"],
  header[aria-label="Global Navigation Menu"],
  .GlobalNav,
  [class*="GlobalNav"]
) :is(a, span, strong, em, button, svg, [role="button"]) {
  color: ${headerText} !important;
  fill: currentColor !important;
}
body.git-reflow-template-active :is(
  header[role="banner"],
  header[aria-label="Global Navigation Menu"],
  .GlobalNav,
  [class*="GlobalNav"]
) :is(a, [role="link"], [aria-current="page"]) {
  color: ${headerLink} !important;
}
body.git-reflow-template-active :is(
  header[role="banner"],
  header[aria-label="Global Navigation Menu"],
  .GlobalNav,
  [class*="GlobalNav"]
) :is(button, input, textarea, .Label, [class*="Button"], [class*="TextInput"], [class*="SearchInput"], [class*="IconButton"]) {
  background: ${headerInner} !important;
  background-color: ${headerInner} !important;
  border-color: color-mix(in srgb, ${headerMuted} 38%, transparent) !important;
  color: ${headerText} !important;
}
body.git-reflow-template-active :is(.user-profile-nav, .user-profile-sticky-bar, nav[aria-label="User profile"], nav[aria-label="Profile"]) {
  --bgColor-default: ${headerBackground} !important;
  --bgColor-muted: ${headerInner} !important;
  --fgColor-default: ${headerText} !important;
  --fgColor-muted: ${headerMuted} !important;
  --fgColor-accent: ${headerLink} !important;
  background: ${headerBackground} !important;
  border-color: color-mix(in srgb, ${headerMuted} 30%, transparent) !important;
  color: ${headerText} !important;
}
body.git-reflow-template-active :is(.user-profile-nav, .user-profile-sticky-bar, nav[aria-label="User profile"], nav[aria-label="Profile"]) :is(a, span, svg) {
  color: ${headerText} !important;
  fill: currentColor !important;
}
body.git-reflow-template-active :is(.user-profile-nav, .user-profile-sticky-bar, nav[aria-label="User profile"], nav[aria-label="Profile"]) :is(a[aria-current="page"], .selected) {
  color: ${headerLink} !important;
}
body.git-reflow-template-active :is(.js-profile-editable-area, .js-profile-editable-replace, .vcard-names-container, .user-profile-bio, .user-profile-mini-vcard) {
  --bgColor-default: ${sidebarBackground} !important;
  --bgColor-muted: ${sidebarInner} !important;
  --fgColor-default: ${sidebarText} !important;
  --fgColor-muted: ${sidebarMuted} !important;
  --fgColor-accent: ${sidebarLink} !important;
  color: ${sidebarText} !important;
}
body.git-reflow-template-active :is(.js-profile-editable-area, .js-profile-editable-replace) :is(h1, h2, p, span, strong, li, svg) {
  color: ${sidebarText} !important;
  fill: currentColor !important;
}
body.git-reflow-template-active :is(.js-profile-editable-area, .js-profile-editable-replace) :is(a, [role="link"]) {
  color: ${sidebarLink} !important;
}
body.git-reflow-template-active :is(.js-profile-editable-area, .js-profile-editable-replace) :is(button, .Button, [class*="Button"]) {
  background: ${sidebarInner} !important;
  border-color: color-mix(in srgb, ${sidebarMuted} 36%, transparent) !important;
  color: ${sidebarText} !important;
}
body.git-reflow-template-active :is(.profile-readme, .profile-readme .Box, .profile-readme .markdown-body, #user-profile-frame article.markdown-body) {
  --bgColor-default: ${readmeBackground} !important;
  --bgColor-muted: ${readmeInner} !important;
  --fgColor-default: ${readmeText} !important;
  --fgColor-muted: ${readmeMuted} !important;
  --fgColor-accent: ${readmeLink} !important;
  background: ${readmeBackground} !important;
  border-color: color-mix(in srgb, ${readmeMuted} 34%, transparent) !important;
  color: ${readmeText} !important;
}
body.git-reflow-template-active :is(.profile-readme, #user-profile-frame article.markdown-body) :is(h1, h2, h3, h4, h5, h6, p, li, span, strong, em, table, td, th) {
  color: ${readmeText} !important;
  border-color: color-mix(in srgb, ${readmeMuted} 26%, transparent) !important;
}
body.git-reflow-template-active :is(.profile-readme, #user-profile-frame article.markdown-body) :is(a, [role="link"]) {
  color: ${readmeLink} !important;
}
body.git-reflow-template-active :is(.profile-readme, #user-profile-frame article.markdown-body) :is(pre, code, blockquote, table, tr, td, th) {
  background: ${readmeInner} !important;
}
body.git-reflow-template-active :is(.js-pinned-items-reorder-container, .js-pinned-items-reorder-list) {
  color: ${pinnedText} !important;
}
body.git-reflow-template-active :is(.pinned-item-list-item-content, .pinned-item-list-item .Box) {
  --bgColor-default: ${pinnedBackground} !important;
  --bgColor-muted: ${pinnedInner} !important;
  --fgColor-default: ${pinnedText} !important;
  --fgColor-muted: ${pinnedMuted} !important;
  --fgColor-accent: ${pinnedLink} !important;
  background: ${pinnedBackground} !important;
  border-color: color-mix(in srgb, ${pinnedMuted} 34%, transparent) !important;
  color: ${pinnedText} !important;
}
body.git-reflow-template-active :is(.pinned-item-list-item-content, .pinned-item-list-item .Box) :is(a, [role="link"], .Link--primary) {
  color: ${pinnedLink} !important;
}
body.git-reflow-template-active :is(.pinned-item-list-item-content, .pinned-item-list-item .Box) :is(p, span, small, .color-fg-muted, .pinned-item-meta) {
  color: ${pinnedMuted} !important;
}
body.git-reflow-template-active :is(.js-yearly-contributions, .js-calendar-graph, .ContributionCalendar, .contribution-activity, .js-profile-timeline-year-list) {
  --bgColor-default: ${contributionBackground} !important;
  --bgColor-muted: ${contributionInner} !important;
  --fgColor-default: ${contributionText} !important;
  --fgColor-muted: ${contributionMuted} !important;
  --fgColor-accent: ${contributionLink} !important;
  --contribution-default-bgColor-0: ${contributionInner} !important;
  --contribution-default-bgColor-1: color-mix(in srgb, ${contributionLink} 28%, ${contributionInner}) !important;
  --contribution-default-bgColor-2: color-mix(in srgb, ${contributionLink} 46%, ${contributionInner}) !important;
  --contribution-default-bgColor-3: color-mix(in srgb, ${contributionLink} 68%, ${contributionInner}) !important;
  --contribution-default-bgColor-4: ${contributionLink} !important;
  background: ${contributionBackground} !important;
  border-color: color-mix(in srgb, ${contributionMuted} 34%, transparent) !important;
  color: ${contributionText} !important;
}
body.git-reflow-template-active :is(.js-yearly-contributions, .contribution-activity, .js-profile-timeline-year-list) :is(a, [role="link"]) {
  color: ${contributionLink} !important;
}
body.git-reflow-template-active :is(.js-yearly-contributions, .contribution-activity, .js-profile-timeline-year-list) :is(h2, h3, p, span, strong, li, time, .color-fg-muted) {
  color: ${contributionText} !important;
}
body.git-reflow-template-active :is(.contribution-activity .Box, .contribution-activity-listing, .contribution-activity-show-more, .js-profile-timeline-year-list a) {
  background: ${contributionInner} !important;
  border-color: color-mix(in srgb, ${contributionMuted} 34%, transparent) !important;
  color: ${contributionText} !important;
}
`;
}

function applyProfileThemeStyle(blocks, pageAppearance) {
  let style = document.getElementById(PROFILE_THEME_STYLE_ID);

  if (!(style instanceof HTMLStyleElement)) {
    style = document.createElement('style');
    style.id = PROFILE_THEME_STYLE_ID;
    document.head.append(style);
  }

  style.textContent = getProfileThemeCss(blocks, isObject(pageAppearance) ? pageAppearance : {});
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
  } else if (block.type === 'repository-file-list') {
    wrapper.replaceChildren(createRepositoryFileList(props, itemLimit));
  } else if (block.type === 'repository-readme') {
    wrapper.replaceChildren(createRepositoryReadme(props));
  } else if (block.type === 'repository-about-sidebar') {
    wrapper.replaceChildren(createRepositoryAboutSidebar(props));
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

function shouldRenderGeneratedBlock(block) {
  const props = isObject(block?.props) ? block.props : {};

  return block?.type === 'recent-repos' && getArray(props.repositories).length > 0;
}

function getRepositoryNameFromHref(href) {
  try {
    const url = new URL(href, window.location.origin);
    const parts = url.pathname.split('/').filter(Boolean);

    return parts.length >= 2 ? `${parts[0]}/${parts[1]}` : '';
  } catch {
    return '';
  }
}

function getNativeRecentReposBlock(block, element) {
  if (block?.type !== 'recent-repos' || !(element instanceof HTMLElement)) {
    return block;
  }

  const repositories = [];
  const seen = new Set();

  element.querySelectorAll('a[href]').forEach((link) => {
    if (!(link instanceof HTMLAnchorElement)) {
      return;
    }

    const hrefName = getRepositoryNameFromHref(link.href);
    if (!hrefName || seen.has(hrefName)) {
      return;
    }

    const label = link.textContent?.replace(/\s+/g, ' ').trim();
    const displayName = label && !['New', 'Show more'].includes(label) ? label : hrefName;

    repositories.push({ name: displayName, href: `/${hrefName}` });
    seen.add(hrefName);
  });

  if (repositories.length === 0) {
    return block;
  }

  const props = isObject(block.props) ? block.props : {};
  const input = element.querySelector('input[type="text"], input[type="search"], input');
  const searchPlaceholder =
    input instanceof HTMLInputElement
      ? getText(input.getAttribute('placeholder'), getText(props.searchPlaceholder, 'Find a repository...'))
      : getText(props.searchPlaceholder, 'Find a repository...');

  return {
    ...block,
    props: {
      ...props,
      searchPlaceholder,
      repositories,
    },
  };
}

function hideNativeRecentRepoBlocks(excludedElement) {
  const sidebarRoot = queryFirst(githubHomeSelectors.leftSidebarContent);

  if (!(sidebarRoot instanceof HTMLElement)) {
    return;
  }

  const roots = new Set();
  const addNativeRoot = (candidate) => {
    if (!(candidate instanceof HTMLElement)) {
      return;
    }

    const generatedAncestor = candidate.closest(`.${GENERATED_BLOCK_CLASS}`);
    if (generatedAncestor || candidate === excludedElement || candidate.contains(excludedElement)) {
      return;
    }

    const root = findRegionBlockRoot(candidate, sidebarRoot);
    if (!(root instanceof HTMLElement) || root === sidebarRoot || root.classList.contains(GENERATED_BLOCK_CLASS)) {
      return;
    }

    if (root === excludedElement || root.contains(excludedElement)) {
      return;
    }

    roots.add(root);
  };

  sidebarRoot
    .querySelectorAll('.js-repos-container, [data-filterable-for]')
    .forEach(addNativeRoot);

  sidebarRoot
    .querySelectorAll('h1, h2, h3, h4, strong, span, div')
    .forEach((candidate) => {
      const content = candidate.textContent?.replace(/\s+/g, ' ').trim() ?? '';

      if (content.includes('Top Repositories') || content.includes('Top repositories')) {
        addNativeRoot(candidate);
      }
    });

  Array.from(sidebarRoot.children).forEach((child) => {
    if (!(child instanceof HTMLElement) || child.classList.contains(GENERATED_BLOCK_CLASS)) {
      return;
    }

    const content = child.textContent?.replace(/\s+/g, ' ').trim() ?? '';
    const hasRepoLink = Array.from(child.querySelectorAll('a[href]')).some(
      (link) => link instanceof HTMLAnchorElement && Boolean(getRepositoryNameFromHref(link.href)),
    );

    if (hasRepoLink && content.includes('Top Repositories')) {
      roots.add(child);
    }
  });

  roots.forEach((root) => root.classList.add(HIDDEN_CLASS));
}

function hideNativeGeneratedBlockTarget(block, excludedElement) {
  if (!['repository-file-list', 'repository-readme', 'repository-about-sidebar'].includes(block?.type)) {
    return;
  }

  const selectors = blockSelectorRegistry[block.type] ?? [];

  selectors.forEach((selector) => {
    document.querySelectorAll(selector).forEach((candidate) => {
      if (!(candidate instanceof HTMLElement)) {
        return;
      }

      const generatedAncestor = candidate.closest(`.${GENERATED_BLOCK_CLASS}`);
      if (generatedAncestor || candidate === excludedElement || candidate.contains(excludedElement)) {
        return;
      }

      const root = getBlockRootFromMatchedElement(block, candidate, findContainingRegionRoot(candidate) ?? document);
      if (!(root instanceof HTMLElement) || root.classList.contains(GENERATED_BLOCK_CLASS)) {
        return;
      }

      if (root === excludedElement || root.contains(excludedElement)) {
        return;
      }

      root.classList.add(HIDDEN_CLASS);
    });
  });
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

function applyRepositoryHeaderProps(block, element) {
  const props = isObject(block.props) ? block.props : {};
  const header = element instanceof HTMLElement ? element : queryFirst(githubRepositorySelectors.repositoryHeader);

  if (!(header instanceof HTMLElement)) {
    return;
  }

  const owner = getText(props.owner);
  const repository = getText(props.repository);
  const visibility = getText(props.visibility);
  const links = [...header.querySelectorAll('a[href]')].filter((link) => link instanceof HTMLAnchorElement);
  const repoLinks = links.filter((link) => {
    const parts = new URL(link.href, window.location.origin).pathname.split('/').filter(Boolean);
    return parts.length <= 2;
  });

  if (owner && repoLinks[0] instanceof HTMLElement) {
    setTextIfPossible(repoLinks[0], owner);
  }

  if (repository && repoLinks[1] instanceof HTMLElement) {
    setTextIfPossible(repoLinks[1], repository);
  }

  if (visibility) {
    const visibilityTarget = [...header.querySelectorAll('span, strong, em')].find((target) => {
      const text = target.textContent?.trim();
      return text === 'Public' || text === 'Private' || text === 'Internal';
    });

    if (visibilityTarget instanceof HTMLElement) {
      setTextIfPossible(visibilityTarget, visibility);
    }
  }

  const tabs = getArray(props.tabs).map((tab) => getText(tab.label));
  if (tabs.length) {
    header.querySelectorAll('nav[aria-label="Repository"] a, a.UnderlineNav-item').forEach((tabLink) => {
      if (!(tabLink instanceof HTMLElement)) {
        return;
      }

      const text = tabLink.textContent?.replace(/\d+/g, '').replace(/\s+/g, ' ').trim() ?? '';
      tabLink.classList.toggle(HIDDEN_CLASS, !tabs.some((tab) => text.includes(tab)));
    });
  }
}

function applyBlockProps(block, element, generation) {
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
      reapplyActivityFeedAppearance(target, props.appearance, generation);
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

function applyTemplateBlocks(template, generation) {
  if (
    isGitHubRepositoryRoute() &&
    queryFirst(githubRepositorySelectors.repositoryRoot) === null &&
    queryFirst(githubRepositorySelectors.repositoryHeader) === null
  ) {
    return;
  }

  const currentScreenId = getCurrentGitHubScreenId(template);
  const blocks = Array.isArray(template.blocks)
    ? template.blocks.filter((block) => !block.screenId || block.screenId === currentScreenId)
    : [];

  if (isGitHubRepositoryRoute()) {
    cleanupRepositoryGeneratedReplacements();
    restoreRememberedTextOverrides();
    removeProfileThemeStyle();
    document.querySelectorAll(`.${HIDDEN_CLASS}`).forEach((element) => {
      element.classList.remove(HIDDEN_CLASS);
    });
    document.querySelectorAll(`.${APPEARANCE_CLASS}`).forEach(clearAppearance);
    document.querySelectorAll(`.${BLOCK_CLASS}:not(.${GENERATED_BLOCK_CLASS})`).forEach((element) => {
      element.classList.remove(BLOCK_CLASS, HIDDEN_CLASS);
      element.style.removeProperty('order');
      clearAppearance(element);
      delete element.dataset.gitReflowBlockId;
      delete element.dataset.gitReflowBlockType;
      delete element.dataset.gitReflowRegion;
      delete element.dataset.gitReflowNativeRegion;
    });
    applyRepositoryThemeStyle(blocks, template.pageAppearance);
    return;
  }

  if (isGitHubProfileRoute()) {
    cleanupRepositoryGeneratedReplacements();
    restoreRememberedTextOverrides();
    removeRepositoryThemeStyle();
    document.querySelectorAll(`.${HIDDEN_CLASS}`).forEach((element) => {
      element.classList.remove(HIDDEN_CLASS);
    });
    document.querySelectorAll(`.${APPEARANCE_CLASS}`).forEach(clearAppearance);
    document.querySelectorAll(`.${BLOCK_CLASS}:not(.${GENERATED_BLOCK_CLASS})`).forEach((element) => {
      element.classList.remove(BLOCK_CLASS, HIDDEN_CLASS);
      element.style.removeProperty('order');
      clearAppearance(element);
      delete element.dataset.gitReflowBlockId;
      delete element.dataset.gitReflowBlockType;
      delete element.dataset.gitReflowRegion;
      delete element.dataset.gitReflowNativeRegion;
    });
    applyProfileThemeStyle(blocks, template.pageAppearance);
    return;
  }

  removeRepositoryThemeStyle();
  removeProfileThemeStyle();
  document.querySelectorAll(`.${HIDDEN_CLASS}`).forEach((element) => {
    element.classList.remove(HIDDEN_CLASS);
  });
  document.querySelectorAll(`.${APPEARANCE_CLASS}`).forEach(clearAppearance);
  document.querySelectorAll('.git-reflow-topbar-links').forEach((element) => element.remove());
  document.querySelectorAll(`.${BLOCK_CLASS}:not(.${GENERATED_BLOCK_CLASS})`).forEach((element) => {
    element.classList.remove(BLOCK_CLASS, HIDDEN_CLASS);
    element.style.removeProperty('order');
    clearAppearance(element);
    delete element.dataset.gitReflowBlockId;
    delete element.dataset.gitReflowBlockType;
    delete element.dataset.gitReflowRegion;
    delete element.dataset.gitReflowNativeRegion;
  });
  document.querySelectorAll('.git-reflow-region-container').forEach((element) => {
    element.classList.remove('git-reflow-region-container');
  });
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
      const useGeneratedBlock = shouldRenderGeneratedBlock(block);

      if (useGeneratedBlock) {
        const generatedBlock = getNativeRecentReposBlock(block, element);

        if (element instanceof HTMLElement && !element.classList.contains(GENERATED_BLOCK_CLASS)) {
          element.classList.add(HIDDEN_CLASS);
        }

        if (block.visible !== false && block.type !== 'top-nav' && container) {
          element = getOrCreateGeneratedBlock(generatedBlock);
          container.append(element);
          hideNativeRecentRepoBlocks(element);
          hideNativeGeneratedBlockTarget(block, element);
        }
      }

      if (!(element instanceof HTMLElement) && block.visible !== false && block.type !== 'top-nav' && container) {
        element = getOrCreateGeneratedBlock(block);
        container.append(element);
      }

      if (!(element instanceof HTMLElement)) {
        return;
      }

      if (useGeneratedBlock && element.classList.contains(GENERATED_BLOCK_CLASS)) {
        hideNativeRecentRepoBlocks(element);
        hideNativeGeneratedBlockTarget(block, element);
      }

      if (block.visible !== false) {
        moveBlockElementToRegion(element, container, region);
      }

      element.classList.add(BLOCK_CLASS);
      element.dataset.gitReflowBlockId = block.id;
      element.dataset.gitReflowBlockType = block.type;
      element.dataset.gitReflowRegion = region;
      element.dataset.gitReflowNativeRegion = getNativeBlockRegion(block);
      element.style.order = String(index);
      element.classList.toggle(HIDDEN_CLASS, block.visible === false);

      applyBlockProps(block, element, generation);
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

function reapplyTemplateBlocksAfterGitHubHydration(template, generation) {
  const delays = isGitHubRepositoryRoute() || isGitHubProfileRoute()
    ? [250, 700, 1200, 2200, 3600, 5500, 8000]
    : [350, 900, 1800, 3200];

  delays.forEach((delay) => {
    window.setTimeout(() => {
      if (generation !== templateRenderGeneration) {
        return;
      }

      applyTemplateBlocks(template, generation);
    }, delay);
  });
}

function stopTemplateMutationObserver() {
  if (templateMutationObserver) {
    templateMutationObserver.disconnect();
    templateMutationObserver = null;
  }

  if (templateMutationReapplyTimer) {
    window.clearTimeout(templateMutationReapplyTimer);
    templateMutationReapplyTimer = 0;
  }
}

function startTemplateMutationObserver(template, generation) {
  stopTemplateMutationObserver();

  const root = getTemplateObserverRoot();
  if (!(root instanceof HTMLElement)) {
    return;
  }

  templateMutationObserver = new MutationObserver((mutations) => {
    if (generation !== templateRenderGeneration || templateMutationReapplying) {
      return;
    }

    const shouldReapply = mutations.some((mutation) => {
      const targets = [
        mutation.target,
        ...mutation.addedNodes,
        ...mutation.removedNodes,
      ];

      return targets.some((target) => {
        if (!(target instanceof Element)) {
          return false;
        }

        if (target.closest?.(`#${CONTROLLER_ID}`)) {
          return false;
        }

        return (
          target.matches?.('#repo-content-turbo-frame, #repo-content-pjax-container, #user-profile-frame, article.markdown-body, .profile-readme, .js-pinned-items-reorder-container, .js-yearly-contributions, .contribution-activity, .BorderGrid, [aria-labelledby="folders-and-files"]') ||
          target.querySelector?.('#user-profile-frame, article.markdown-body, .profile-readme, .js-pinned-items-reorder-container, .js-yearly-contributions, .contribution-activity, .BorderGrid, [aria-labelledby="folders-and-files"], .git-reflow-generated-block')
        );
      });
    });

    if (!shouldReapply) {
      return;
    }

    if (templateMutationReapplyTimer) {
      window.clearTimeout(templateMutationReapplyTimer);
    }

    templateMutationReapplyTimer = window.setTimeout(() => {
      if (generation !== templateRenderGeneration) {
        return;
      }

      templateMutationReapplying = true;
      applyTemplateBlocks(template, generation);
      applyPageAppearance(template.pageAppearance);
      window.setTimeout(() => {
        templateMutationReapplying = false;
      }, 80);
    }, 120);
  });

  templateMutationObserver.observe(root, {
    childList: true,
    subtree: true,
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

  if (value.includes('polished') && value.includes('red')) {
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

  if (value.includes('polished') && value.includes('green')) {
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
    background: '#f6f8fa',
    topbar: '#ffffff',
    left: '#ffffff',
    panel: '#ffffff',
    soft: '#f6f8fa',
    main: '#f6f8fa',
    accent: '#0969da',
    right: '#ffffff',
    text: '#1f2328',
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
  const generation = ++templateRenderGeneration;
  latestTemplate = normalizeTemplate(template);

  clearPageAppearance();
  document.querySelectorAll(`.${APPEARANCE_CLASS}`).forEach(clearAppearance);
  document.body.classList.add(LAYOUT_CLASS);
  document.body.classList.toggle('git-reflow-feed-two-column', latestTemplate.selectedVariationId === 'feed-two-column');
  applySidebarWidth(getTemplateSidebarWidth(latestTemplate));
  applyMainColumnWidth(getTemplateMainColumnWidth(latestTemplate));
  applyRightSidebarWidth(getTemplateRightSidebarWidth(latestTemplate));
  applyTemplateBlocks(latestTemplate, generation);
  reapplyTemplateBlocksAfterGitHubHydration(latestTemplate, generation);
  applyPageAppearance(latestTemplate.pageAppearance);
  startTemplateMutationObserver(latestTemplate, generation);
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

  const requestId = ++templateApplyRequestId;
  const selectedTemplateRecord = availableTemplates.find((template) => template.id === templateId);
  const starterTemplate = selectedTemplateRecord?.source === 'starter' ? starterTemplatesById.get(templateId) : null;

  if (starterTemplate) {
    if (requestId !== templateApplyRequestId) {
      return;
    }

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

    if (requestId !== templateApplyRequestId) {
      return;
    }

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
  if (controllerCreated || document.getElementById(CONTROLLER_ID) || !isSupportedGitHubPage()) {
    return;
  }

  const controller = document.createElement('div');
  controller.id = CONTROLLER_ID;
  controller.className = 'git-reflow-controller';
  controller.dataset.gitReflowConnected = 'false';
  controller.dataset.gitReflowView = templateListViewMode;
  controller.innerHTML = `
    <button class="git-reflow-launcher" type="button" data-git-reflow-launcher aria-label="Open git-reflow" aria-expanded="false">
      <span class="git-reflow-brand-logo git-reflow-brand-logo--launcher" aria-hidden="true">
        <img src="${LOGO_URL}" alt="" />
      </span>
    </button>
    <section class="git-reflow-panel" data-git-reflow-panel aria-label="git-reflow templates" hidden>
      <header class="git-reflow-panel__header">
        <div class="git-reflow-panel__brand">
          <span class="git-reflow-brand-logo" aria-hidden="true">
            <img src="${LOGO_URL}" alt="" />
          </span>
          <div>
            <strong>git-reflow</strong>
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
          <div class="git-reflow-view-toggle" aria-label="Template display mode">
            <button class="is-active" type="button" data-git-reflow-view-mode="preview">Preview</button>
            <button type="button" data-git-reflow-view-mode="list">List</button>
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
  templateRenderGeneration += 1;
  stopTemplateMutationObserver();
  removeRepositoryThemeStyle();
  removeProfileThemeStyle();
  cleanupRepositoryGeneratedReplacements();
  customLeftSidebarWidthPx = null;
  clearStoredLeftSidebarWidth();
  removeBackgroundImageLayer();
  document.body.classList.remove(LAYOUT_CLASS);
  document.body.classList.remove('git-reflow-feed-two-column');
  document.documentElement.style.removeProperty('--feed-sidebar');
  document.documentElement.style.removeProperty('--git-reflow-left-sidebar-width');
  document.documentElement.style.removeProperty('--git-reflow-main-column-width');
  document.documentElement.style.removeProperty('--git-reflow-right-sidebar-width');
  document.documentElement.style.removeProperty('--git-reflow-page-background');
  document.documentElement.style.removeProperty('--git-reflow-page-background-image');
  document.documentElement.style.removeProperty('--git-reflow-page-background-position');
  document.documentElement.style.removeProperty('--git-reflow-page-background-size');
  document.documentElement.style.removeProperty('--git-reflow-page-background-repeat');
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
    delete element.dataset.gitReflowRegion;
    delete element.dataset.gitReflowNativeRegion;
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

function loadControllerData() {
  if (controllerDataLoaded || !document.getElementById(CONTROLLER_ID)) {
    return;
  }

  controllerDataLoaded = true;
  getStoredLeftSidebarWidth().then((storedWidth) => {
    customLeftSidebarWidthPx = storedWidth ? clampWidth(storedWidth) : null;
    refreshTemplateList();
  });
}

function boot() {
  createController();
  loadControllerData();

  [500, 1500, 3000].forEach((delay) => {
    window.setTimeout(() => {
      createController();
      loadControllerData();
    }, delay);
  });
}

boot();

document.addEventListener('turbo:load', () => {
  controllerCreated = false;
  controllerDataLoaded = false;
  boot();

  if (latestTemplate) {
    applyTemplate(latestTemplate);
  }
});
