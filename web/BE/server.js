import { createServer } from 'node:http';
import { createHash, randomBytes } from 'node:crypto';
import 'dotenv/config';
import { OAuth2Client } from 'google-auth-library';
import {
  readSessionStore,
  readTemplateStore,
  readTemplateUsageStore,
  writeSessionStore,
  writeTemplateStore,
  writeTemplateUsageStore,
} from './db.js';
import {
  DEFAULT_TEMPLATE_PAYLOAD,
  normalizeTemplatePayload,
  validateTemplatePayload,
} from '../../packages/shared/src/templateSchema.js';

const PORT = Number(process.env.PORT ?? 8787);
const MAX_BODY_BYTES = 1024 * 1024;
const MAX_NAME_LENGTH = 120;
const MAX_USAGE_NAME_LENGTH = 180;
const SESSION_TTL_MS = Number(process.env.SESSION_TTL_MS ?? 7 * 24 * 60 * 60 * 1000);
const SESSION_TOKEN_HASH_PREFIX = 'sha256:';
const RATE_LIMIT_WINDOW_MS = Number(process.env.RATE_LIMIT_WINDOW_MS ?? 60 * 1000);
const RATE_LIMIT_MAX_REQUESTS = Number(process.env.RATE_LIMIT_MAX_REQUESTS ?? 120);
const MUTATION_RATE_LIMIT_MAX_REQUESTS = Number(process.env.MUTATION_RATE_LIMIT_MAX_REQUESTS ?? 60);
const TRUST_PROXY = process.env.TRUST_PROXY === 'true';
const rateLimitBuckets = new Map();
const DEFAULT_ALLOWED_ORIGINS = [
  'http://localhost:5173',
  'http://127.0.0.1:5173',
  'http://localhost:4173',
  'http://127.0.0.1:4173',
  'https://github.com',
  'chrome-extension://*',
];
const ALLOWED_ORIGINS = (process.env.CORS_ALLOWED_ORIGINS ?? DEFAULT_ALLOWED_ORIGINS.join(','))
  .split(',')
  .map((origin) => origin.trim())
  .filter(Boolean);
const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID ?? '';
const googleClient = new OAuth2Client(GOOGLE_CLIENT_ID);

function sendJson(response, status, body) {
  const corsOrigin = response.corsOrigin ?? ALLOWED_ORIGINS[0] ?? 'http://localhost:5173';

  response.writeHead(status, {
    ...securityHeaders(),
    'Access-Control-Allow-Headers': 'Authorization, Content-Type',
    'Access-Control-Allow-Methods': 'DELETE,GET,POST,OPTIONS',
    'Access-Control-Allow-Origin': corsOrigin,
    'Content-Type': 'application/json; charset=utf-8',
    Vary: 'Origin',
  });

  if (status === 204) {
    response.end();
    return;
  }

  response.end(JSON.stringify(body, null, 2));
}

function sendError(response, status, error, details = undefined) {
  sendJson(response, status, {
    ok: false,
    error,
    ...(details ? { details } : {}),
  });
}

function securityHeaders() {
  return {
    'Cross-Origin-Resource-Policy': 'cross-origin',
    'Referrer-Policy': 'no-referrer',
    'X-Content-Type-Options': 'nosniff',
  };
}

function isOriginAllowed(origin) {
  if (!origin) {
    return true;
  }

  return ALLOWED_ORIGINS.some((allowedOrigin) => {
    if (allowedOrigin === origin || allowedOrigin === '*') {
      return true;
    }

    return allowedOrigin === 'chrome-extension://*' && origin.startsWith('chrome-extension://');
  });
}

function applyCors(request, response) {
  const origin = request.headers.origin ?? '';

  response.corsOrigin = isOriginAllowed(origin) ? origin || ALLOWED_ORIGINS[0] : ALLOWED_ORIGINS[0];
}

function getClientKey(request) {
  const remoteAddress = request.socket.remoteAddress ?? 'local';

  if (!TRUST_PROXY) {
    return remoteAddress;
  }

  const forwardedFor = request.headers['x-forwarded-for'];
  const forwardedAddress = Array.isArray(forwardedFor) ? forwardedFor[0] : forwardedFor;

  return (forwardedAddress?.split(',')[0] ?? remoteAddress).trim();
}

function getRateLimitConfig(request, pathname) {
  if (!Number.isFinite(RATE_LIMIT_WINDOW_MS) || RATE_LIMIT_WINDOW_MS <= 0) {
    return null;
  }

  if (request.method === 'OPTIONS' || request.method === 'GET') {
    return {
      scope: 'read',
      maxRequests: RATE_LIMIT_MAX_REQUESTS,
    };
  }

  const isMutation = ['POST', 'DELETE'].includes(request.method ?? '');

  if (!isMutation) {
    return {
      scope: 'other',
      maxRequests: RATE_LIMIT_MAX_REQUESTS,
    };
  }

  const isNetworkMetric = pathname.startsWith('/api/templates/network/') && (
    pathname.endsWith('/view') ||
    pathname.endsWith('/like') ||
    pathname.endsWith('/import')
  );

  return {
    scope: isNetworkMetric ? 'network-metric' : 'mutation',
    maxRequests: MUTATION_RATE_LIMIT_MAX_REQUESTS,
  };
}

function isRateLimited(request, pathname) {
  const config = getRateLimitConfig(request, pathname);

  if (!config || !Number.isFinite(config.maxRequests) || config.maxRequests <= 0) {
    return false;
  }

  const now = Date.now();
  const key = `${getClientKey(request)}:${config.scope}`;
  const bucket = rateLimitBuckets.get(key);

  if (!bucket || now >= bucket.resetAt) {
    rateLimitBuckets.set(key, {
      count: 1,
      resetAt: now + RATE_LIMIT_WINDOW_MS,
    });
    return false;
  }

  bucket.count += 1;

  if (bucket.count > config.maxRequests) {
    return true;
  }

  if (rateLimitBuckets.size > 1000) {
    for (const [bucketKey, value] of rateLimitBuckets.entries()) {
      if (now >= value.resetAt) {
        rateLimitBuckets.delete(bucketKey);
      }
    }
  }

  return false;
}

function readJson(request) {
  return new Promise((resolve, reject) => {
    let body = '';
    let size = 0;

    request.on('data', (chunk) => {
      size += chunk.length;

      if (size > MAX_BODY_BYTES) {
        reject(new Error('Request body too large'));
        request.destroy();
        return;
      }

      body += chunk;
    });

    request.on('end', () => {
      try {
        resolve(body ? JSON.parse(body) : {});
      } catch {
        reject(new Error('Invalid JSON body'));
      }
    });

    request.on('error', reject);
  });
}

function parseUrl(request) {
  return new URL(request.url ?? '/', `http://${request.headers.host ?? 'localhost'}`);
}

function createSessionToken() {
  return randomBytes(32).toString('base64url');
}

function hashSessionToken(token) {
  return `${SESSION_TOKEN_HASH_PREFIX}${createHash('sha256').update(token).digest('hex')}`;
}

function getBearerToken(request) {
  const authorization = request.headers.authorization ?? '';

  if (!authorization.startsWith('Bearer ')) {
    return '';
  }

  return authorization.slice('Bearer '.length).trim();
}

function sessionTokenMatches(session, token) {
  return session.token === token || session.token === hashSessionToken(token);
}

function isSessionExpired(session) {
  if (!Number.isFinite(SESSION_TTL_MS) || SESSION_TTL_MS <= 0) {
    return false;
  }

  const createdAt = new Date(session.createdAt).getTime();

  return !Number.isFinite(createdAt) || Date.now() - createdAt > SESSION_TTL_MS;
}

async function pruneExpiredSessions(store) {
  const sessions = store.sessions.filter((session) => !isSessionExpired(session));

  if (sessions.length !== store.sessions.length) {
    await writeSessionStore({ sessions });
  }

  return { sessions };
}

function decodePathParam(value) {
  try {
    return decodeURIComponent(value);
  } catch {
    return null;
  }
}

function readRouteId(response, value) {
  const decoded = decodePathParam(value);

  if (decoded === null) {
    sendError(response, 400, 'Malformed path parameter');
    return null;
  }

  return decoded;
}

async function getSessionFromRequest(request) {
  const token = getBearerToken(request);

  if (!token) {
    return null;
  }

  const store = await pruneExpiredSessions(await readSessionStore());

  return store.sessions.find((item) => sessionTokenMatches(item, token)) ?? null;
}

async function requireSession(request, response) {
  const session = await getSessionFromRequest(request);

  if (!session) {
    sendError(response, 401, 'Missing or invalid session');
    return null;
  }

  return session;
}

function getTemplateOwnerId(template) {
  return template.ownerUserId ?? template.metadata?.ownerUserId ?? '';
}

function belongsToUser(template, userId) {
  const ownerUserId = getTemplateOwnerId(template);

  return ownerUserId === userId || ownerUserId === '';
}

function isDefaultTemplate(template) {
  return template.id === DEFAULT_TEMPLATE_PAYLOAD.id || template.source === 'default';
}

function withTemplateOwner(template, userId) {
  return {
    ...template,
    ownerUserId: userId,
    metadata: {
      ...template.metadata,
      ownerUserId: userId,
    },
  };
}

function toTemplateRecord(template) {
  const visibleBlocks = Array.isArray(template.blocks) ? template.blocks.filter((block) => block.visible) : [];
  const previewBlocks = visibleBlocks.slice(0, 10).map((block) => ({
    id: block.id,
    type: block.type,
    title: block.title,
    region: block.region,
    ...(block.props?.appearance && typeof block.props.appearance === 'object' && !Array.isArray(block.props.appearance)
      ? { appearance: block.props.appearance }
      : {}),
  }));
  const sections = visibleBlocks.slice(0, 6).map((block, index) => ({
    id: block.id,
    label: block.title,
    kind: block.region === 'main-feed' ? 'content' : block.region === 'topbar' ? 'header' : 'sidebar',
    depth: index === 0 ? 0 : 1,
    description: block.extensionSlot ?? `${block.region} block`,
    visible: block.visible,
  }));

  return {
    id: template.id,
    name: template.name,
    description: template.description,
    thumbnail: '',
    collaborators: [],
    status: 'ACTIVE',
    syncState: 'Extension connected',
    updatedAt: template.updatedAt ? `Updated ${new Date(template.updatedAt).toLocaleString()}` : 'Not synced yet',
    owner: 'Personal Workspace',
    highlights: [
      `${visibleBlocks.length} visible blocks`,
      `${template.selectedVariationId ?? 'github-default'} variation`,
      `Columns ${template.columnLayout?.left ?? 320}/${template.columnLayout?.main ?? 900}/${template.columnLayout?.right ?? 315}`,
    ],
    sections,
    preview: {
      columnLayout: template.columnLayout,
      pageAppearance:
        template.pageAppearance && typeof template.pageAppearance === 'object' && !Array.isArray(template.pageAppearance)
          ? template.pageAppearance
          : {},
      blocks: previewBlocks,
    },
  };
}

function getNetworkLikeUserIds(entry) {
  return Array.isArray(entry.likeUserIds) ? entry.likeUserIds.filter((item) => typeof item === 'string') : [];
}

function toNetworkTemplateRecord(entry, currentUserId = '') {
  const record = toTemplateRecord(entry.template);
  const likeUserIds = getNetworkLikeUserIds(entry);

  return {
    ...record,
    id: entry.id,
    networkTemplateId: entry.id,
    sourceTemplateId: entry.sourceTemplateId,
    publisherUserId: entry.publisherUserId,
    publisherName: entry.publisherName,
    publishedAt: entry.publishedAt,
    importCount: Number(entry.importCount) || 0,
    likeCount: likeUserIds.length,
    viewCount: Number(entry.viewCount) || 0,
    likedByCurrentUser: currentUserId ? likeUserIds.includes(currentUserId) : false,
    status: 'INACTIVE',
    syncState: 'Ready to sync',
    updatedAt: entry.publishedAt ? `Published ${new Date(entry.publishedAt).toLocaleString()}` : 'Published to Network',
    owner: entry.publisherName || 'Reflow Network',
    highlights: [
      'Public template',
      `${Number(entry.importCount) || 0} imports`,
      `${likeUserIds.length} likes`,
      ...record.highlights.slice(0, 2),
    ],
  };
}

function slugify(value) {
  const slug = value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');

  return slug || 'github-template';
}

function createTemplateId(name, existingTemplates) {
  const baseId = slugify(name);
  const existingIds = new Set(existingTemplates.map((template) => template.id));

  if (!existingIds.has(baseId)) {
    return baseId;
  }

  let index = 2;
  while (existingIds.has(`${baseId}-${index}`)) {
    index += 1;
  }

  return `${baseId}-${index}`;
}

function createPublicTemplateId(userId, templateId) {
  return `network-${slugify(userId)}-${slugify(templateId)}`;
}

function createUniqueTemplateName(baseName, existingTemplates, userId) {
  const existingNames = new Set(
    existingTemplates
      .filter((template) => belongsToUser(template, userId))
      .map((template) => template.name.trim().toLowerCase()),
  );

  if (!existingNames.has(baseName.trim().toLowerCase())) {
    return baseName;
  }

  let index = 1;
  let nextName = `${baseName} (${index})`;

  while (existingNames.has(nextName.trim().toLowerCase())) {
    index += 1;
    nextName = `${baseName} (${index})`;
  }

  return nextName;
}

function createTemplateFromName(name, existingTemplates) {
  const now = new Date().toISOString();
  const id = createTemplateId(name, existingTemplates);

  return normalizeTemplatePayload({
    ...DEFAULT_TEMPLATE_PAYLOAD,
    id,
    name,
    description: `Custom GitHub home layout for ${name}.`,
    source: 'user',
    version: 1,
    metadata: {
      ...DEFAULT_TEMPLATE_PAYLOAD.metadata,
      updatedAt: now,
    },
    updatedAt: now,
  }, new Date(now));
}

function summarizeTemplateUsage(events) {
  const now = Date.now();
  const weekStart = now - 7 * 24 * 60 * 60 * 1000;
  const summariesById = new Map();
  const sortedEvents = [...events].sort((a, b) => new Date(b.usedAt).getTime() - new Date(a.usedAt).getTime());

  for (const event of sortedEvents) {
    const usedAt = new Date(event.usedAt).getTime();
    const existing = summariesById.get(event.templateId) ?? {
      id: event.templateId,
      name: event.templateName,
      useCount: 0,
      weeklyUseCount: 0,
      lastUsedAt: event.usedAt,
    };

    existing.useCount += 1;

    if (Number.isFinite(usedAt) && usedAt >= weekStart) {
      existing.weeklyUseCount += 1;
    }

    if (new Date(event.usedAt).getTime() > new Date(existing.lastUsedAt).getTime()) {
      existing.lastUsedAt = event.usedAt;
      existing.name = event.templateName;
    }

    summariesById.set(event.templateId, existing);
  }

  const templates = [...summariesById.values()].sort(
    (a, b) => new Date(b.lastUsedAt).getTime() - new Date(a.lastUsedAt).getTime(),
  );

  return {
    totalUses: events.length,
    weeklyUses: events.filter((event) => new Date(event.usedAt).getTime() >= weekStart).length,
    templates,
    recent: sortedEvents.slice(0, 10).map((event) => ({
      id: event.templateId,
      name: event.templateName,
      usedAt: event.usedAt,
    })),
  };
}

async function handleGetLatest(request, response) {
  const store = await readTemplateStore();
  const session = await getSessionFromRequest(request);

  if (!session) {
    sendJson(response, 200, store.latest);
    return;
  }

  const template = store.templates.find((item) => belongsToUser(item, session.user.id)) ?? store.latest;
  sendJson(response, 200, template);
}

async function handleGetTemplates(request, response) {
  const session = await requireSession(request, response);

  if (!session) {
    return;
  }

  const store = await readTemplateStore();
  const templatesById = new Map();

  for (const template of store.templates.filter((item) => belongsToUser(item, session.user.id) && !isDefaultTemplate(item))) {
    templatesById.set(template.id, toTemplateRecord(template));
  }

  sendJson(response, 200, {
    ok: true,
    templates: [...templatesById.values()],
  });
}

async function handleGetTemplate(request, response, templateId) {
  const session = await requireSession(request, response);

  if (!session) {
    return;
  }

  const store = await readTemplateStore();
  const template = store.templates.find((item) => item.id === templateId && belongsToUser(item, session.user.id));

  if (!template) {
    sendError(response, 404, 'Template not found');
    return;
  }

  sendJson(response, 200, template);
}

async function handleDeleteTemplate(request, response, templateId) {
  const session = await requireSession(request, response);

  if (!session) {
    return;
  }

  const store = await readTemplateStore();
  const template = store.templates.find((item) => item.id === templateId && belongsToUser(item, session.user.id));

  if (!template) {
    sendError(response, 404, 'Template not found');
    return;
  }

  if (template.source === 'default') {
    sendError(response, 400, 'Default template cannot be deleted');
    return;
  }

  const templates = store.templates.filter((item) => item.id !== templateId);
  const versions = store.versions.filter((item) => item.id !== templateId);
  const publishedTemplates = store.publishedTemplates.filter(
    (item) => !(item.sourceTemplateId === templateId && item.publisherUserId === session.user.id),
  );
  const latest = store.latest?.id === templateId ? templates[0] ?? DEFAULT_TEMPLATE_PAYLOAD : store.latest;

  await writeTemplateStore({
    latest,
    templates,
    versions,
    publishedTemplates,
  });

  sendJson(response, 200, { ok: true });
}

async function handlePostTemplate(request, response) {
  const session = await requireSession(request, response);

  if (!session) {
    return;
  }

  let body;

  try {
    body = await readJson(request);
  } catch (error) {
    sendError(response, error.message === 'Request body too large' ? 413 : 400, error.message);
    return;
  }

  const validation = validateTemplatePayload(body);

  if (!validation.ok) {
    sendError(response, 422, 'Template payload failed validation', validation.errors);
    return;
  }

  const store = await readTemplateStore();
  const template = withTemplateOwner(normalizeTemplatePayload(validation.value), session.user.id);

  if (template.name.trim().length > MAX_NAME_LENGTH) {
    sendError(response, 400, `Template name must be ${MAX_NAME_LENGTH} characters or fewer`);
    return;
  }

  const normalizedName = template.name.trim().toLowerCase();
  const nameExists = store.templates.some(
    (item) =>
      item.id !== template.id &&
      belongsToUser(item, session.user.id) &&
      item.name.trim().toLowerCase() === normalizedName,
  );

  if (nameExists) {
    sendError(response, 409, 'Template name already exists');
    return;
  }

  const templates = [template, ...store.templates.filter((item) => item.id !== template.id)];
  const versions = [template, ...store.versions.filter((item) => item.updatedAt !== template.updatedAt)].slice(0, 25);
  const nextStore = {
    latest: template,
    templates,
    versions,
    publishedTemplates: store.publishedTemplates,
  };

  await writeTemplateStore(nextStore);
  sendJson(response, 200, { ok: true, template });
}

async function handleGetTemplateUsage(request, response) {
  const session = await requireSession(request, response);

  if (!session) {
    return;
  }

  const store = await readTemplateUsageStore();
  const events = store.events.filter((event) => event.userId === session.user.id);

  sendJson(response, 200, {
    ok: true,
    ...summarizeTemplateUsage(events),
  });
}

async function handlePostTemplateUsage(request, response) {
  const session = await requireSession(request, response);

  if (!session) {
    return;
  }

  let body;

  try {
    body = await readJson(request);
  } catch (error) {
    sendError(response, error.message === 'Request body too large' ? 413 : 400, error.message);
    return;
  }

  const templateId = typeof body.templateId === 'string' ? body.templateId.trim() : '';
  const templateName = typeof body.templateName === 'string' ? body.templateName.trim() : '';

  if (!templateId || !templateName) {
    sendError(response, 400, 'Template usage requires templateId and templateName');
    return;
  }

  if (templateId.length > MAX_NAME_LENGTH || templateName.length > MAX_USAGE_NAME_LENGTH) {
    sendError(response, 400, 'Template usage identifiers are too long');
    return;
  }

  const store = await readTemplateUsageStore();
  const event = {
    userId: session.user.id,
    templateId,
    templateName,
    usedAt: new Date().toISOString(),
  };
  const events = [event, ...store.events].slice(0, 2000);

  await writeTemplateUsageStore({ events });
  sendJson(response, 201, {
    ok: true,
    event,
  });
}

async function handleCreateTemplate(request, response) {
  const session = await requireSession(request, response);

  if (!session) {
    return;
  }

  let body;

  try {
    body = await readJson(request);
  } catch (error) {
    sendError(response, error.message === 'Request body too large' ? 413 : 400, error.message);
    return;
  }

  const name = typeof body.name === 'string' ? body.name.trim() : '';

  if (name.length < 2) {
    sendError(response, 400, 'Template name must be at least 2 characters');
    return;
  }

  if (name.length > MAX_NAME_LENGTH) {
    sendError(response, 400, `Template name must be ${MAX_NAME_LENGTH} characters or fewer`);
    return;
  }

  const store = await readTemplateStore();
  const template = withTemplateOwner(createTemplateFromName(name, store.templates), session.user.id);
  const templates = [template, ...store.templates];
  const nextStore = {
    latest: template,
    templates,
    versions: [template, ...store.versions].slice(0, 25),
    publishedTemplates: store.publishedTemplates,
  };

  await writeTemplateStore(nextStore);
  sendJson(response, 201, {
    ok: true,
    template,
    record: toTemplateRecord(template),
  });
}

async function handleGetNetworkTemplates(request, response) {
  const store = await readTemplateStore();
  const session = await getSessionFromRequest(request);
  const templates = [...store.publishedTemplates]
    .sort((a, b) => new Date(b.publishedAt ?? 0).getTime() - new Date(a.publishedAt ?? 0).getTime())
    .map((entry) => toNetworkTemplateRecord(entry, session?.user.id ?? ''));

  sendJson(response, 200, {
    ok: true,
    templates,
  });
}

async function handleGetNetworkTemplate(request, response, networkTemplateId) {
  const store = await readTemplateStore();
  const session = await getSessionFromRequest(request);
  const entry = store.publishedTemplates.find((item) => item.id === networkTemplateId);

  if (!entry) {
    sendError(response, 404, 'Network template not found');
    return;
  }

  sendJson(response, 200, {
    ok: true,
    template: entry.template,
    record: toNetworkTemplateRecord(entry, session?.user.id ?? ''),
  });
}

async function handleSetNetworkTemplateLike(request, response, networkTemplateId) {
  const session = await requireSession(request, response);

  if (!session) {
    return;
  }

  let body;

  try {
    body = await readJson(request);
  } catch (error) {
    sendError(response, error.message === 'Request body too large' ? 413 : 400, error.message);
    return;
  }

  const store = await readTemplateStore();
  const entry = store.publishedTemplates.find((item) => item.id === networkTemplateId);

  if (!entry) {
    sendError(response, 404, 'Network template not found');
    return;
  }

  if (typeof body.liked !== 'boolean') {
    sendError(response, 400, 'Network template like requires a boolean liked value');
    return;
  }

  const liked = body.liked;
  const currentLikeUserIds = getNetworkLikeUserIds(entry);
  const likeUserIds = liked
    ? [...new Set([...currentLikeUserIds, session.user.id])]
    : currentLikeUserIds.filter((userId) => userId !== session.user.id);
  const publishedTemplates = store.publishedTemplates.map((item) =>
    item.id === networkTemplateId ? { ...item, likeUserIds } : item,
  );
  const nextEntry = { ...entry, likeUserIds };

  await writeTemplateStore({
    latest: store.latest,
    templates: store.templates,
    versions: store.versions,
    publishedTemplates,
  });

  sendJson(response, 200, {
    ok: true,
    template: toNetworkTemplateRecord(nextEntry, session.user.id),
  });
}

async function handleViewNetworkTemplate(request, response, networkTemplateId) {
  const store = await readTemplateStore();
  const session = await getSessionFromRequest(request);
  const entry = store.publishedTemplates.find((item) => item.id === networkTemplateId);

  if (!entry) {
    sendError(response, 404, 'Network template not found');
    return;
  }

  const viewCount = (Number(entry.viewCount) || 0) + 1;
  const publishedTemplates = store.publishedTemplates.map((item) =>
    item.id === networkTemplateId ? { ...item, viewCount } : item,
  );
  const nextEntry = { ...entry, viewCount };

  await writeTemplateStore({
    latest: store.latest,
    templates: store.templates,
    versions: store.versions,
    publishedTemplates,
  });

  sendJson(response, 200, {
    ok: true,
    template: toNetworkTemplateRecord(nextEntry, session?.user.id ?? ''),
  });
}

async function handlePublishTemplate(request, response, templateId) {
  const session = await requireSession(request, response);

  if (!session) {
    return;
  }

  const store = await readTemplateStore();
  const template = store.templates.find((item) => item.id === templateId && belongsToUser(item, session.user.id));

  if (!template || isDefaultTemplate(template)) {
    sendError(response, 404, 'Template not found');
    return;
  }

  const existing = store.publishedTemplates.find(
    (item) => item.sourceTemplateId === templateId && item.publisherUserId === session.user.id,
  );
  const now = new Date().toISOString();
  const entry = {
    id: existing?.id ?? createPublicTemplateId(session.user.id, template.id),
    sourceTemplateId: template.id,
    publisherUserId: session.user.id,
    publisherName: session.user.name ?? session.user.email,
    publisherAvatarUrl: session.user.avatarUrl ?? '',
    publishedAt: existing?.publishedAt ?? now,
    updatedAt: now,
    importCount: Number(existing?.importCount) || 0,
    likeUserIds: getNetworkLikeUserIds(existing ?? {}),
    viewCount: Number(existing?.viewCount) || 0,
    template,
  };
  const publishedTemplates = [
    entry,
    ...store.publishedTemplates.filter(
      (item) => !(item.sourceTemplateId === templateId && item.publisherUserId === session.user.id),
    ),
  ];

  await writeTemplateStore({
    latest: store.latest,
    templates: store.templates,
    versions: store.versions,
    publishedTemplates,
  });

  sendJson(response, 200, {
    ok: true,
    template: toNetworkTemplateRecord(entry, session.user.id),
  });
}

async function handleUnpublishTemplate(request, response, templateId) {
  const session = await requireSession(request, response);

  if (!session) {
    return;
  }

  const store = await readTemplateStore();
  const publishedTemplates = store.publishedTemplates.filter(
    (item) => !(item.sourceTemplateId === templateId && item.publisherUserId === session.user.id),
  );

  await writeTemplateStore({
    latest: store.latest,
    templates: store.templates,
    versions: store.versions,
    publishedTemplates,
  });

  sendJson(response, 200, { ok: true });
}

async function handleImportNetworkTemplate(request, response, networkTemplateId) {
  const session = await requireSession(request, response);

  if (!session) {
    return;
  }

  let body;

  try {
    body = await readJson(request);
  } catch (error) {
    sendError(response, error.message === 'Request body too large' ? 413 : 400, error.message);
    return;
  }

  const store = await readTemplateStore();
  const entry = store.publishedTemplates.find((item) => item.id === networkTemplateId);

  if (!entry) {
    sendError(response, 404, 'Network template not found');
    return;
  }

  const now = new Date().toISOString();
  const requestedName = typeof body.name === 'string' ? body.name.trim() : '';

  if (requestedName.length > MAX_NAME_LENGTH) {
    sendError(response, 400, `Template name must be ${MAX_NAME_LENGTH} characters or fewer`);
    return;
  }

  const baseName = requestedName || `${entry.template.name} (imported)`;
  const name = createUniqueTemplateName(baseName, store.templates, session.user.id);
  const template = withTemplateOwner(
    normalizeTemplatePayload({
      ...entry.template,
      id: createTemplateId(name, store.templates),
      name,
      description: entry.template.description || `Imported GitHub layout based on ${entry.template.name}.`,
      source: 'user',
      metadata: {
        ...entry.template.metadata,
        updatedAt: now,
      },
      updatedAt: now,
    }, new Date(now)),
    session.user.id,
  );
  const publishedTemplates = store.publishedTemplates.map((item) =>
    item.id === networkTemplateId
      ? {
          ...item,
          importCount: (Number(item.importCount) || 0) + 1,
        }
      : item,
  );
  const templates = [template, ...store.templates.filter((item) => item.id !== template.id)];
  const versions = [template, ...store.versions].slice(0, 25);

  await writeTemplateStore({
    latest: template,
    templates,
    versions,
    publishedTemplates,
  });

  sendJson(response, 201, {
    ok: true,
    template,
    record: toTemplateRecord(template),
  });
}

async function handlePostGoogleAuth(request, response) {
  if (!GOOGLE_CLIENT_ID) {
    sendError(response, 503, 'GOOGLE_CLIENT_ID is not configured');
    return;
  }

  let body;

  try {
    body = await readJson(request);
  } catch (error) {
    sendError(response, error.message === 'Request body too large' ? 413 : 400, error.message);
    return;
  }

  if (typeof body.credential !== 'string' || body.credential.length === 0) {
    sendError(response, 400, 'Google credential is required');
    return;
  }

  try {
    const ticket = await googleClient.verifyIdToken({
      idToken: body.credential,
      audience: GOOGLE_CLIENT_ID,
    });
    const payload = ticket.getPayload();

    if (!payload?.sub || !payload.email) {
      sendError(response, 401, 'Google credential is missing profile information');
      return;
    }

    const now = new Date().toISOString();
    const session = {
      token: createSessionToken(),
      createdAt: now,
      user: {
        id: payload.sub,
        email: payload.email,
        name: payload.name ?? payload.email,
        avatarUrl: payload.picture ?? '',
      },
    };
    const store = await readSessionStore();
    const sessions = [session, ...store.sessions.filter((item) => item.user.id !== session.user.id)].slice(0, 100);

    await writeSessionStore({ sessions });
    sendJson(response, 200, {
      ok: true,
      session,
    });
  } catch {
    sendError(response, 401, 'Google credential verification failed');
  }
}

async function handleGetMe(request, response) {
  const session = await getSessionFromRequest(request);

  if (!session) {
    sendError(response, 401, 'Missing or invalid session');
    return;
  }

  sendJson(response, 200, {
    ok: true,
    user: session.user,
  });
}

async function handlePostLogout(request, response) {
  const token = getBearerToken(request);

  if (token) {
    const store = await readSessionStore();
    await writeSessionStore({
      sessions: store.sessions.filter((session) => !sessionTokenMatches(session, token)),
    });
  }

  sendJson(response, 200, { ok: true });
}

async function handleRequest(request, response) {
  applyCors(request, response);

  if (request.headers.origin && !isOriginAllowed(request.headers.origin)) {
    sendError(response, 403, 'Origin not allowed');
    return;
  }

  const url = parseUrl(request);

  if (isRateLimited(request, url.pathname)) {
    sendError(response, 429, 'Too many requests');
    return;
  }

  if (request.method === 'OPTIONS') {
    sendJson(response, 204, {});
    return;
  }

  if (request.method === 'GET' && url.pathname === '/health') {
    sendJson(response, 200, { ok: true });
    return;
  }

  if (request.method === 'GET' && url.pathname === '/api/templates/github-home/latest') {
    await handleGetLatest(request, response);
    return;
  }

  if (request.method === 'GET' && url.pathname === '/api/templates') {
    await handleGetTemplates(request, response);
    return;
  }

  if (request.method === 'GET' && url.pathname === '/api/templates/network') {
    await handleGetNetworkTemplates(request, response);
    return;
  }

  if (request.method === 'GET' && url.pathname.startsWith('/api/templates/network/')) {
    const networkTemplateId = readRouteId(response, url.pathname.replace('/api/templates/network/', ''));

    if (networkTemplateId === null) {
      return;
    }

    await handleGetNetworkTemplate(request, response, networkTemplateId);
    return;
  }

  if (request.method === 'POST' && url.pathname.startsWith('/api/templates/network/') && url.pathname.endsWith('/like')) {
    const networkTemplateId = readRouteId(response,
      url.pathname.replace('/api/templates/network/', '').replace('/like', ''),
    );

    if (networkTemplateId === null) {
      return;
    }

    await handleSetNetworkTemplateLike(request, response, networkTemplateId);
    return;
  }

  if (request.method === 'POST' && url.pathname.startsWith('/api/templates/network/') && url.pathname.endsWith('/view')) {
    const networkTemplateId = readRouteId(response,
      url.pathname.replace('/api/templates/network/', '').replace('/view', ''),
    );

    if (networkTemplateId === null) {
      return;
    }

    await handleViewNetworkTemplate(request, response, networkTemplateId);
    return;
  }

  if (request.method === 'POST' && url.pathname.startsWith('/api/templates/network/') && url.pathname.endsWith('/import')) {
    const networkTemplateId = readRouteId(response,
      url.pathname.replace('/api/templates/network/', '').replace('/import', ''),
    );

    if (networkTemplateId === null) {
      return;
    }

    await handleImportNetworkTemplate(request, response, networkTemplateId);
    return;
  }

  if (request.method === 'GET' && url.pathname === '/api/template-usage') {
    await handleGetTemplateUsage(request, response);
    return;
  }

  if (request.method === 'POST' && url.pathname === '/api/template-usage') {
    await handlePostTemplateUsage(request, response);
    return;
  }

  if (request.method === 'POST' && url.pathname === '/api/templates') {
    await handleCreateTemplate(request, response);
    return;
  }

  if (request.method === 'POST' && url.pathname.startsWith('/api/templates/') && url.pathname.endsWith('/publish')) {
    const templateId = readRouteId(response, url.pathname.replace('/api/templates/', '').replace('/publish', ''));

    if (templateId === null) {
      return;
    }

    await handlePublishTemplate(request, response, templateId);
    return;
  }

  if (request.method === 'DELETE' && url.pathname.startsWith('/api/templates/') && url.pathname.endsWith('/publish')) {
    const templateId = readRouteId(response, url.pathname.replace('/api/templates/', '').replace('/publish', ''));

    if (templateId === null) {
      return;
    }

    await handleUnpublishTemplate(request, response, templateId);
    return;
  }

  if (request.method === 'GET' && url.pathname.startsWith('/api/templates/')) {
    const templateId = readRouteId(response, url.pathname.replace('/api/templates/', ''));

    if (templateId === null) {
      return;
    }

    await handleGetTemplate(request, response, templateId);
    return;
  }

  if (request.method === 'DELETE' && url.pathname.startsWith('/api/templates/')) {
    const templateId = readRouteId(response, url.pathname.replace('/api/templates/', ''));

    if (templateId === null) {
      return;
    }

    await handleDeleteTemplate(request, response, templateId);
    return;
  }

  if (request.method === 'POST' && url.pathname === '/api/templates/github-home') {
    await handlePostTemplate(request, response);
    return;
  }

  if (request.method === 'POST' && url.pathname === '/api/auth/google') {
    await handlePostGoogleAuth(request, response);
    return;
  }

  if (request.method === 'GET' && url.pathname === '/api/auth/me') {
    await handleGetMe(request, response);
    return;
  }

  if (request.method === 'POST' && url.pathname === '/api/auth/logout') {
    await handlePostLogout(request, response);
    return;
  }

  sendError(response, 404, 'Not found');
}

const server = createServer((request, response) => {
  handleRequest(request, response).catch((error) => {
    console.error(error);
    sendError(response, 500, 'Internal server error');
  });
});

server.listen(PORT, () => {
  console.log(`git-reflow backend listening on http://localhost:${PORT}`);
});
