const API_BASE_URL = 'http://localhost:8787';
const LATEST_TEMPLATE_URL = `${API_BASE_URL}/api/templates/github-home/latest`;
const CONTROLLER_ID = 'git-reflow-controller';
const RESIZER_CLASS = 'git-reflow-left-resizer';
const BLOCK_CLASS = 'git-reflow-template-block';
const GENERATED_BLOCK_CLASS = 'git-reflow-generated-block';
const HIDDEN_CLASS = 'git-reflow-template-hidden';
const ORIGINAL_TEXT_ATTR = 'data-git-reflow-original-text';
const ORIGINAL_PLACEHOLDER_ATTR = 'data-git-reflow-original-placeholder';
const LEFT_WIDTH_STORAGE_KEY = 'gitReflowLeftSidebarWidthPx';
const AUTH_TOKEN_STORAGE_KEY = 'gitReflowAuthToken';
const SELECTED_TEMPLATE_STORAGE_KEY = 'gitReflowSelectedTemplateId';
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
  'right-sidebar': githubHomeSelectors.rightColumn,
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
  'activity-feed': ['#conduit-feed-frame', '.js-for-you-feed-items', 'turbo-frame.js-for-you-feed-items'],
  'repo-updates': [],
  'pinned-repos': [],
  'issue-pr-updates': [],
  'trending-repos': [],
  'recommended-repos': [],
};

const blockTextMatchers = {
  'recent-repos': ['Top Repositories', 'Repositories'],
  'copilot-prompt': ['Copilot'],
  'activity-feed': ['For you', 'Feed'],
  'repo-updates': ['Repository updates'],
  'pinned-repos': ['Pinned'],
  'issue-pr-updates': ['Issues', 'Pull requests'],
  'trending-repos': ['Latest changes', 'Changelog'],
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
      return findRegionBlockRoot(element, regionRoot);
    }
  }

  const textMatched = findElementByText(regionRoot ?? document, blockTextMatchers[block.type]);
  return textMatched instanceof HTMLElement ? findRegionBlockRoot(textMatched, regionRoot) : null;
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

  repositories.slice(0, 8).forEach((repo) => {
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
  const wrapper = document.createElement('section');
  wrapper.className = `${BLOCK_CLASS} ${GENERATED_BLOCK_CLASS}`;
  wrapper.dataset.gitReflowBlockId = block.id;
  wrapper.dataset.gitReflowBlockType = block.type;

  const title = document.createElement('h2');
  title.textContent = getText(block.title, block.type);
  wrapper.append(title);

  if (block.type === 'recent-repos' || block.type === 'pinned-repos' || block.type === 'recommended-repos') {
    wrapper.append(createRepoList(getArray(props.repositories)));
  } else if (block.type === 'activity-feed') {
    const list = document.createElement('div');
    list.className = 'git-reflow-block-list';
    getArray(props.events).slice(0, 5).forEach((event) => {
      const item = document.createElement('article');
      item.className = 'git-reflow-block-row';
      item.textContent = `${getText(event.actor, 'Someone')} ${getText(event.action)} ${getText(event.subject)}`;
      list.append(item);
    });
    wrapper.append(list);
  } else if (block.type === 'repo-updates') {
    const list = document.createElement('div');
    list.className = 'git-reflow-block-list';
    getArray(props.updates).slice(0, 5).forEach((update) => {
      const item = document.createElement('article');
      item.className = 'git-reflow-block-row';
      item.textContent = `${getText(update.status)} ${getText(update.repo)} ${getText(update.message)}`;
      list.append(item);
    });
    wrapper.append(list);
  } else if (block.type === 'issue-pr-updates') {
    const list = document.createElement('div');
    list.className = 'git-reflow-block-list';
    getArray(props.items).slice(0, 5).forEach((item) => {
      const row = document.createElement('button');
      row.type = 'button';
      row.className = 'git-reflow-block-row';
      row.textContent = `${getText(item.label)} ${Number(item.count) || 0}`;
      list.append(row);
    });
    wrapper.append(list);
  } else if (block.type === 'trending-repos') {
    wrapper.append(createRepoList(getArray(props.repositories)));
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
    return;
  }

  if (block.type === 'copilot-prompt') {
    const input = element?.querySelector('textarea, input');
    setPlaceholderIfPossible(input, getText(props.placeholder));
  }

  if (block.type === 'recent-repos') {
    const input = element?.querySelector('input[type="text"], input[type="search"], input');
    setPlaceholderIfPossible(input, getText(props.searchPlaceholder));
  }
}

function applyTemplateBlocks(template) {
  document.querySelectorAll(`.${GENERATED_BLOCK_CLASS}`).forEach((element) => element.remove());
  document.querySelectorAll('.git-reflow-topbar-links').forEach((element) => element.remove());
  document.querySelectorAll(`.${BLOCK_CLASS}`).forEach((element) => {
    element.classList.remove(BLOCK_CLASS, HIDDEN_CLASS);
    element.style.removeProperty('order');
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
  const select = getControllerElement('[data-git-reflow-template-select]');

  if (!(select instanceof HTMLSelectElement)) {
    return;
  }

  select.replaceChildren();

  if (availableTemplates.length === 0) {
    const option = document.createElement('option');
    option.value = '';
    option.textContent = 'No templates';
    select.append(option);
    select.disabled = true;
    return;
  }

  select.disabled = false;

  for (const template of availableTemplates) {
    const option = document.createElement('option');
    option.value = template.id;
    option.textContent = template.name ?? template.id;
    option.selected = template.id === selectedTemplateId;
    select.append(option);
  }
}

function applySidebarWidth(width) {
  document.documentElement.style.setProperty('--feed-sidebar', width);

  const leftSidebar = queryFirst(githubHomeSelectors.leftSidebar);
  if (leftSidebar instanceof HTMLElement) {
    leftSidebar.style.width = width;
  }
}

function applyMainColumnWidth(width) {
  const feedMain = queryFirst(githubHomeSelectors.feedMain);
  if (feedMain instanceof HTMLElement) {
    feedMain.style.maxWidth = width;
  }

  const mainContent = queryFirst(githubHomeSelectors.mainContent);
  if (mainContent instanceof HTMLElement) {
    mainContent.style.maxWidth = width;
  }
}

function applyRightSidebarWidth(width) {
  const rightSidebar = queryFirst(githubHomeSelectors.rightSidebar);
  if (rightSidebar instanceof HTMLElement) {
    rightSidebar.style.width = width;
  }

  const rightColumn = queryFirst(githubHomeSelectors.rightColumn);
  if (rightColumn instanceof HTMLElement) {
    rightColumn.style.maxWidth = width;
  }
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

  document.body.classList.toggle('git-reflow-feed-two-column', latestTemplate.selectedVariationId === 'feed-two-column');
  applySidebarWidth(getTemplateSidebarWidth(latestTemplate));
  applyMainColumnWidth(getTemplateMainColumnWidth(latestTemplate));
  applyRightSidebarWidth(getTemplateRightSidebarWidth(latestTemplate));
  applyTemplateBlocks(latestTemplate);
  if (latestTemplate.leftSidebarResizeEnabled === false) {
    removeLeftSidebarResizer();
    setControllerHint('Left sidebar drag handle is disabled by the saved draft.');
  } else {
    ensureLeftSidebarResizer();
    setControllerHint('Drag the left sidebar edge to resize.');
  }

  const sidebarLabel =
    latestTemplate.leftSidebarResizeEnabled !== false && customLeftSidebarWidthPx
      ? `${customLeftSidebarWidthPx}px`
      : (latestTemplate.columnLayout?.left ? `${latestTemplate.columnLayout.left}px` : (latestTemplate.leftSidebarWidth ?? 'default'));
  const mainLabel = latestTemplate.columnLayout?.main ? `${latestTemplate.columnLayout.main}px` : (latestTemplate.mainColumnWidth ?? 'default');
  const rightLabel = latestTemplate.columnLayout?.right ? `${latestTemplate.columnLayout.right}px` : (latestTemplate.rightSidebarWidth ?? 'default');
  setStatus(
    `Applied ${latestTemplate.selectedVariationId ?? 'github-default'} / L:${sidebarLabel} M:${mainLabel} R:${rightLabel}`,
  );
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

async function loadAndApplySelectedTemplate(token, templateId) {
  if (!token) {
    setStatus('Paste extension token');
    return;
  }

  if (!templateId) {
    setStatus('Choose a template');
    return;
  }

  try {
    setStatus('Applying selected template...');
    const template = await fetchJson(`/api/templates/${encodeURIComponent(templateId)}`, token);
    setStoredSelectedTemplateId(templateId);
    applyTemplate(template);
  } catch {
    setStatus('Template unavailable');
  }
}

async function refreshTemplateList() {
  const { token, selectedTemplateId } = await getStoredExtensionState();
  setTokenInputValue(token);

  if (!token) {
    availableTemplates = [];
    setTemplateSelectOptions('');
    setStatus('Paste extension token');
    setControllerHint('Copy the token from the web app settings menu.');
    return;
  }

  try {
    setStatus('Loading your templates...');
    const result = await fetchJson('/api/templates', token);
    availableTemplates = Array.isArray(result.templates) ? result.templates : [];
    const nextTemplateId =
      availableTemplates.find((template) => template.id === selectedTemplateId)?.id ?? availableTemplates[0]?.id ?? '';

    setTemplateSelectOptions(nextTemplateId);
    await loadAndApplySelectedTemplate(token, nextTemplateId);
  } catch {
    availableTemplates = [];
    setTemplateSelectOptions('');
    setStatus('Token or backend unavailable');
    setControllerHint('Check localhost:8787 and paste a fresh extension token.');
  }
}

function createController() {
  if (controllerCreated || document.getElementById(CONTROLLER_ID) || !isGitHubDashboard()) {
    return;
  }

  const controller = document.createElement('div');
  controller.id = CONTROLLER_ID;
  controller.className = 'git-reflow-controller';
  controller.innerHTML = `
    <strong>Git Reflow Preview</strong>
    <span data-git-reflow-status>Ready</span>
    <span data-git-reflow-hint>Drag the left sidebar edge to resize.</span>
    <input type="password" data-git-reflow-token placeholder="Extension token" aria-label="Extension token" />
    <button type="button" data-git-reflow-save-token>Connect account</button>
    <select data-git-reflow-template-select aria-label="Template"></select>
    <button type="button" data-git-reflow-apply>Apply selected</button>
    <button type="button" data-git-reflow-refresh>Refresh templates</button>
    <button type="button" data-git-reflow-reset>Reset page styles</button>
  `;

  controller.querySelector('[data-git-reflow-save-token]')?.addEventListener('click', () => {
    const input = controller.querySelector('[data-git-reflow-token]');
    const token = input instanceof HTMLInputElement ? input.value.trim() : '';

    setStoredAuthToken(token);
    refreshTemplateList();
  });
  controller.querySelector('[data-git-reflow-template-select]')?.addEventListener('change', (event) => {
    const select = event.currentTarget;

    if (!(select instanceof HTMLSelectElement)) {
      return;
    }

    getStoredExtensionState().then(({ token }) => loadAndApplySelectedTemplate(token, select.value));
  });
  controller.querySelector('[data-git-reflow-apply]')?.addEventListener('click', () => {
    const select = controller.querySelector('[data-git-reflow-template-select]');
    const templateId = select instanceof HTMLSelectElement ? select.value : '';

    getStoredExtensionState().then(({ token }) => loadAndApplySelectedTemplate(token, templateId));
  });
  controller.querySelector('[data-git-reflow-refresh]')?.addEventListener('click', refreshTemplateList);
  controller.querySelector('[data-git-reflow-reset]')?.addEventListener('click', resetAppliedStyles);

  document.body.append(controller);
  controllerCreated = true;
}

function resetAppliedStyles() {
  customLeftSidebarWidthPx = null;
  clearStoredLeftSidebarWidth();
  document.body.classList.remove('git-reflow-feed-two-column');
  document.documentElement.style.removeProperty('--feed-sidebar');
  removeLeftSidebarResizer();
  document.querySelectorAll(`.${GENERATED_BLOCK_CLASS}`).forEach((element) => element.remove());
  document.querySelectorAll(`.${BLOCK_CLASS}`).forEach((element) => {
    element.classList.remove(BLOCK_CLASS, HIDDEN_CLASS);
    element.style.removeProperty('order');
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
    [githubHomeSelectors.leftSidebar, 'width'],
    [githubHomeSelectors.feedMain, 'max-width'],
    [githubHomeSelectors.mainContent, 'max-width'],
    [githubHomeSelectors.rightSidebar, 'width'],
    [githubHomeSelectors.rightColumn, 'max-width'],
  ];

  styleTargets.forEach(([selectors, property]) => {
    const element = queryFirst(selectors);

    if (element instanceof HTMLElement) {
      element.style.removeProperty(property);
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
