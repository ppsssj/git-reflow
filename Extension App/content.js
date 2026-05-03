const API_URL = 'http://localhost:8787/api/templates/github-home/latest';
const CONTROLLER_ID = 'git-reflow-controller';
const RESIZER_CLASS = 'git-reflow-left-resizer';
const LEFT_WIDTH_STORAGE_KEY = 'gitReflowLeftSidebarWidthPx';
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
  feedMain: ['.feed-main'],
  mainContent: ['.feed-main main', 'main#main-content'],
  rightSidebar: ['.feed-right-sidebar'],
  rightColumn: ['.feed-right-column'],
};

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
  };
}

function getStoredLeftSidebarWidth() {
  return new Promise((resolve) => {
    chrome.storage.local.get([LEFT_WIDTH_STORAGE_KEY], (items) => {
      resolve(Number(items[LEFT_WIDTH_STORAGE_KEY]) || null);
    });
  });
}

function setStoredLeftSidebarWidth(width) {
  chrome.storage.local.set({ [LEFT_WIDTH_STORAGE_KEY]: width });
}

function clearStoredLeftSidebarWidth() {
  chrome.storage.local.remove([LEFT_WIDTH_STORAGE_KEY]);
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
    setStatus('Loading localhost:8787...');
    const response = await fetch(API_URL, { cache: 'no-store' });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }

    const template = await response.json();
    applyTemplate(template);
  } catch {
    setStatus('Backend unavailable');
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
    <button type="button" data-git-reflow-refresh>Refresh template</button>
    <button type="button" data-git-reflow-reset>Reset page styles</button>
  `;

  controller.querySelector('[data-git-reflow-refresh]')?.addEventListener('click', refreshTemplate);
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
      refreshTemplate();
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
