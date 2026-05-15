import { createServer } from 'node:http';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { randomBytes } from 'node:crypto';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import 'dotenv/config';
import { OAuth2Client } from 'google-auth-library';
import {
  DEFAULT_TEMPLATE_PAYLOAD,
  normalizeTemplatePayload,
  validateTemplatePayload,
} from '../../packages/shared/src/templateSchema.js';

const PORT = Number(process.env.PORT ?? 8787);
const MAX_BODY_BYTES = 1024 * 1024;
const __dirname = dirname(fileURLToPath(import.meta.url));
const DATA_DIR = join(__dirname, 'data');
const TEMPLATE_STORE_PATH = join(DATA_DIR, 'templates.json');
const SESSION_STORE_PATH = join(DATA_DIR, 'sessions.json');
const TEMPLATE_USAGE_STORE_PATH = join(DATA_DIR, 'template-usage.json');
const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID ?? '';
const googleClient = new OAuth2Client(GOOGLE_CLIENT_ID);

async function ensureDataDir() {
  await mkdir(DATA_DIR, { recursive: true });
}

async function readTemplateStore() {
  try {
    const raw = await readFile(TEMPLATE_STORE_PATH, 'utf8');
    const parsed = JSON.parse(raw);
    const rawTemplates = Array.isArray(parsed.templates)
      ? parsed.templates
      : [parsed.latest ?? DEFAULT_TEMPLATE_PAYLOAD, ...(Array.isArray(parsed.versions) ? parsed.versions : [])];
    const templates = [];
    const seenIds = new Set();

    for (const template of rawTemplates) {
      if (template?.id && !seenIds.has(template.id)) {
        seenIds.add(template.id);
        templates.push(template);
      }
    }

    return {
      templates,
      latest: parsed.latest ?? templates[0] ?? DEFAULT_TEMPLATE_PAYLOAD,
      versions: Array.isArray(parsed.versions) ? parsed.versions : [],
    };
  } catch (error) {
    if (error?.code !== 'ENOENT') {
      console.warn('Failed to read template store. Falling back to default template.', error);
    }

    return {
      templates: [DEFAULT_TEMPLATE_PAYLOAD],
      latest: DEFAULT_TEMPLATE_PAYLOAD,
      versions: [],
    };
  }
}

async function writeTemplateStore(store) {
  await ensureDataDir();
  await writeFile(TEMPLATE_STORE_PATH, `${JSON.stringify(store, null, 2)}\n`, 'utf8');
}

async function readSessionStore() {
  try {
    const raw = await readFile(SESSION_STORE_PATH, 'utf8');
    const parsed = JSON.parse(raw);

    return {
      sessions: Array.isArray(parsed.sessions) ? parsed.sessions : [],
    };
  } catch (error) {
    if (error?.code !== 'ENOENT') {
      console.warn('Failed to read session store. Falling back to empty sessions.', error);
    }

    return { sessions: [] };
  }
}

async function writeSessionStore(store) {
  await ensureDataDir();
  await writeFile(SESSION_STORE_PATH, `${JSON.stringify(store, null, 2)}\n`, 'utf8');
}

async function readTemplateUsageStore() {
  try {
    const raw = await readFile(TEMPLATE_USAGE_STORE_PATH, 'utf8');
    const parsed = JSON.parse(raw);

    return {
      events: Array.isArray(parsed.events) ? parsed.events : [],
    };
  } catch (error) {
    if (error?.code !== 'ENOENT') {
      console.warn('Failed to read template usage store. Falling back to empty usage.', error);
    }

    return { events: [] };
  }
}

async function writeTemplateUsageStore(store) {
  await ensureDataDir();
  await writeFile(TEMPLATE_USAGE_STORE_PATH, `${JSON.stringify(store, null, 2)}\n`, 'utf8');
}

function sendJson(response, status, body) {
  response.writeHead(status, {
    'Access-Control-Allow-Headers': 'Authorization, Content-Type',
    'Access-Control-Allow-Methods': 'DELETE,GET,POST,OPTIONS',
    'Access-Control-Allow-Origin': '*',
    'Content-Type': 'application/json; charset=utf-8',
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

function getBearerToken(request) {
  const authorization = request.headers.authorization ?? '';

  if (!authorization.startsWith('Bearer ')) {
    return '';
  }

  return authorization.slice('Bearer '.length).trim();
}

async function getSessionFromRequest(request) {
  const token = getBearerToken(request);

  if (!token) {
    return null;
  }

  const store = await readSessionStore();

  return store.sessions.find((item) => item.token === token) ?? null;
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
  const latest = store.latest?.id === templateId ? templates[0] ?? DEFAULT_TEMPLATE_PAYLOAD : store.latest;

  await writeTemplateStore({
    latest,
    templates,
    versions,
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

  const store = await readTemplateStore();
  const template = withTemplateOwner(createTemplateFromName(name, store.templates), session.user.id);
  const templates = [template, ...store.templates];
  const nextStore = {
    latest: template,
    templates,
    versions: [template, ...store.versions].slice(0, 25),
  };

  await writeTemplateStore(nextStore);
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
  const token = getBearerToken(request);

  if (!token) {
    sendError(response, 401, 'Missing bearer token');
    return;
  }

  const store = await readSessionStore();
  const session = store.sessions.find((item) => item.token === token);

  if (!session) {
    sendError(response, 401, 'Session not found');
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
      sessions: store.sessions.filter((session) => session.token !== token),
    });
  }

  sendJson(response, 200, { ok: true });
}

async function handleRequest(request, response) {
  const url = parseUrl(request);

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

  if (request.method === 'GET' && url.pathname.startsWith('/api/templates/')) {
    const templateId = decodeURIComponent(url.pathname.replace('/api/templates/', ''));
    await handleGetTemplate(request, response, templateId);
    return;
  }

  if (request.method === 'DELETE' && url.pathname.startsWith('/api/templates/')) {
    const templateId = decodeURIComponent(url.pathname.replace('/api/templates/', ''));
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
