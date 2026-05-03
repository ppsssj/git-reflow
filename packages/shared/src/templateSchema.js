export const TEMPLATE_REGIONS = ['topbar', 'left-sidebar', 'main-feed', 'right-sidebar'];
export const TEMPLATE_VARIATIONS = ['github-default', 'feed-two-column'];
export const TEMPLATE_BLOCK_TYPES = [
  'top-nav',
  'profile-summary',
  'copilot-prompt',
  'pinned-repos',
  'recent-repos',
  'activity-feed',
  'repo-updates',
  'issue-pr-updates',
  'trending-repos',
  'recommended-repos',
];

export const DEFAULT_COLUMN_LAYOUT = {
  left: 320,
  main: 900,
  right: 315,
};

export const COLUMN_LIMITS = {
  left: { min: 220, max: 420 },
  main: { min: 640, max: 1120 },
  right: { min: 240, max: 420 },
};

export const DEFAULT_TEMPLATE_PAYLOAD = {
  id: 'github-dashboard-reference',
  name: 'GitHub Home Template',
  description: 'Fallback GitHub home template used before the first sync.',
  source: 'default',
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
  regions: TEMPLATE_REGIONS,
  blocks: [],
  metadata: {
    provider: 'github',
    browserMappingKey: 'github.dashboard.reference',
    updatedAt: new Date(0).toISOString(),
  },
  provider: 'github',
  columnLayout: DEFAULT_COLUMN_LAYOUT,
  leftSidebarResizeEnabled: true,
  selectedVariationId: 'github-default',
  updatedAt: new Date(0).toISOString(),
};

function isObject(value) {
  return value !== null && typeof value === 'object' && !Array.isArray(value);
}

function isString(value) {
  return typeof value === 'string' && value.trim().length > 0;
}

function isBoolean(value) {
  return typeof value === 'boolean';
}

function isNumber(value) {
  return typeof value === 'number' && Number.isFinite(value);
}

function isOneOf(value, allowed) {
  return allowed.includes(value);
}

function validateColumnLayout(value, path, errors) {
  if (!isObject(value)) {
    errors.push(`${path} must be an object`);
    return;
  }

  for (const region of Object.keys(COLUMN_LIMITS)) {
    const width = value[region];
    const { min, max } = COLUMN_LIMITS[region];

    if (!isNumber(width) || width < min || width > max) {
      errors.push(`${path}.${region} must be a number between ${min} and ${max}`);
    }
  }
}

function validateScreens(value, errors) {
  if (!Array.isArray(value) || value.length === 0) {
    errors.push('screens must be a non-empty array');
    return;
  }

  value.forEach((screen, index) => {
    if (!isObject(screen)) {
      errors.push(`screens[${index}] must be an object`);
      return;
    }

    for (const key of ['id', 'name', 'providerRoute', 'description']) {
      if (!isString(screen[key])) {
        errors.push(`screens[${index}].${key} must be a non-empty string`);
      }
    }
  });
}

function validateBlocks(value, errors) {
  if (!Array.isArray(value)) {
    errors.push('blocks must be an array');
    return;
  }

  value.forEach((block, index) => {
    if (!isObject(block)) {
      errors.push(`blocks[${index}] must be an object`);
      return;
    }

    if (!isString(block.id)) errors.push(`blocks[${index}].id must be a non-empty string`);
    if (!isString(block.title)) errors.push(`blocks[${index}].title must be a non-empty string`);
    if (!isOneOf(block.type, TEMPLATE_BLOCK_TYPES)) errors.push(`blocks[${index}].type is unsupported`);
    if (!isOneOf(block.region, TEMPLATE_REGIONS)) errors.push(`blocks[${index}].region is unsupported`);
    if (!isBoolean(block.visible)) errors.push(`blocks[${index}].visible must be a boolean`);
    if (!isObject(block.props)) errors.push(`blocks[${index}].props must be an object`);
    if (block.screenId !== undefined && !isString(block.screenId)) {
      errors.push(`blocks[${index}].screenId must be a non-empty string when provided`);
    }
    if (block.extensionSlot !== undefined && !isString(block.extensionSlot)) {
      errors.push(`blocks[${index}].extensionSlot must be a non-empty string when provided`);
    }
  });
}

export function validateTemplatePayload(value) {
  const errors = [];

  if (!isObject(value)) {
    return { ok: false, errors: ['template payload must be an object'] };
  }

  for (const key of ['id', 'name', 'description', 'activeScreenId']) {
    if (!isString(value[key])) {
      errors.push(`${key} must be a non-empty string`);
    }
  }

  if (!['default', 'user'].includes(value.source)) {
    errors.push('source must be default or user');
  }

  if (!Number.isInteger(value.version) || value.version < 1) {
    errors.push('version must be a positive integer');
  }

  validateScreens(value.screens, errors);
  validateBlocks(value.blocks, errors);

  if (!Array.isArray(value.regions) || value.regions.some((region) => !isOneOf(region, TEMPLATE_REGIONS))) {
    errors.push('regions must contain only supported template regions');
  }

  if (!isObject(value.metadata)) {
    errors.push('metadata must be an object');
  } else {
    if (value.metadata.provider !== 'github') errors.push('metadata.provider must be github');
    if (!isString(value.metadata.browserMappingKey)) {
      errors.push('metadata.browserMappingKey must be a non-empty string');
    }
    if (!isString(value.metadata.updatedAt)) errors.push('metadata.updatedAt must be a non-empty string');
  }

  validateColumnLayout(value.columnLayout, 'columnLayout', errors);

  if (value.provider !== undefined && value.provider !== 'github') {
    errors.push('provider must be github when provided');
  }

  if (!isBoolean(value.leftSidebarResizeEnabled)) {
    errors.push('leftSidebarResizeEnabled must be a boolean');
  }

  if (!isOneOf(value.selectedVariationId, TEMPLATE_VARIATIONS)) {
    errors.push('selectedVariationId is unsupported');
  }

  return errors.length > 0 ? { ok: false, errors } : { ok: true, value };
}

export function normalizeTemplatePayload(value, now = new Date()) {
  const updatedAt = now.toISOString();

  return {
    ...value,
    provider: 'github',
    columnLayout: {
      ...DEFAULT_COLUMN_LAYOUT,
      ...value.columnLayout,
    },
    leftSidebarResizeEnabled: value.leftSidebarResizeEnabled !== false,
    selectedVariationId: isOneOf(value.selectedVariationId, TEMPLATE_VARIATIONS)
      ? value.selectedVariationId
      : 'github-default',
    metadata: {
      ...value.metadata,
      provider: 'github',
      updatedAt,
    },
    updatedAt,
  };
}
