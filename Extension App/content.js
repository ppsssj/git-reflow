const API_URL = 'http://localhost:8787/api/templates/github-home/latest';
const CONTROLLER_ID = 'git-reflow-controller';
const RESIZER_CLASS = 'git-reflow-left-resizer';
const LEFT_WIDTH_STORAGE_KEY = 'gitReflowLeftSidebarWidthPx';
const MIN_LEFT_SIDEBAR_WIDTH = 220;
const MAX_LEFT_SIDEBAR_WIDTH = 420;

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
  return document.querySelector('.feed-background, feed-container, #dashboard') !== null;
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
  return Math.min(1120, Math.max(640, width));
}

function clampRightWidth(width) {
  return Math.min(420, Math.max(240, width));
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

  const leftSidebar = document.querySelector('.feed-left-sidebar');
  if (leftSidebar instanceof HTMLElement) {
    leftSidebar.style.width = width;
  }
}

function applyMainColumnWidth(width) {
  const feedMain = document.querySelector('.feed-main');
  if (feedMain instanceof HTMLElement) {
    feedMain.style.maxWidth = width;
  }

  const mainContent = document.querySelector('.feed-main main, main#main-content');
  if (mainContent instanceof HTMLElement) {
    mainContent.style.maxWidth = width;
  }
}

function applyRightSidebarWidth(width) {
  const rightSidebar = document.querySelector('.feed-right-sidebar');
  if (rightSidebar instanceof HTMLElement) {
    rightSidebar.style.width = width;
  }

  const rightColumn = document.querySelector('.feed-right-column');
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
  const leftSidebar = document.querySelector('.feed-left-sidebar');
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
  latestTemplate = template;

  document.body.classList.toggle('git-reflow-feed-two-column', template.selectedVariationId === 'feed-two-column');
  applySidebarWidth(getTemplateSidebarWidth(template));
  applyMainColumnWidth(getTemplateMainColumnWidth(template));
  applyRightSidebarWidth(getTemplateRightSidebarWidth(template));
  if (template.leftSidebarResizeEnabled === false) {
    removeLeftSidebarResizer();
    setControllerHint('Left sidebar drag handle is disabled by the saved draft.');
  } else {
    ensureLeftSidebarResizer();
    setControllerHint('Drag the left sidebar edge to resize.');
  }

  const sidebarLabel =
    template.leftSidebarResizeEnabled !== false && customLeftSidebarWidthPx
      ? `${customLeftSidebarWidthPx}px`
      : (template.columnLayout?.left ? `${template.columnLayout.left}px` : (template.leftSidebarWidth ?? 'default'));
  const mainLabel = template.columnLayout?.main ? `${template.columnLayout.main}px` : (template.mainColumnWidth ?? 'default');
  const rightLabel = template.columnLayout?.right ? `${template.columnLayout.right}px` : (template.rightSidebarWidth ?? 'default');
  setStatus(
    `Applied ${template.selectedVariationId ?? 'github-default'} / L:${sidebarLabel} M:${mainLabel} R:${rightLabel}`,
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
  controller.querySelector('[data-git-reflow-reset]')?.addEventListener('click', () => {
    customLeftSidebarWidthPx = null;
    clearStoredLeftSidebarWidth();
    document.body.classList.remove('git-reflow-feed-two-column');
    document.documentElement.style.removeProperty('--feed-sidebar');

    const leftSidebar = document.querySelector('.feed-left-sidebar');
    if (leftSidebar instanceof HTMLElement) {
      leftSidebar.style.removeProperty('width');
    }

    const feedMain = document.querySelector('.feed-main');
    if (feedMain instanceof HTMLElement) {
      feedMain.style.removeProperty('max-width');
    }

    const mainContent = document.querySelector('.feed-main main, main#main-content');
    if (mainContent instanceof HTMLElement) {
      mainContent.style.removeProperty('max-width');
    }

    const rightSidebar = document.querySelector('.feed-right-sidebar');
    if (rightSidebar instanceof HTMLElement) {
      rightSidebar.style.removeProperty('width');
    }

    const rightColumn = document.querySelector('.feed-right-column');
    if (rightColumn instanceof HTMLElement) {
      rightColumn.style.removeProperty('max-width');
    }

    setStatus('Reset locally');
  });

  document.body.append(controller);
  controllerCreated = true;
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
