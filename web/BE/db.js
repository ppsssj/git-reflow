import Database from 'better-sqlite3';
import { createHash } from 'node:crypto';
import { existsSync, mkdirSync, readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { DEFAULT_TEMPLATE_PAYLOAD } from '../../packages/shared/src/templateSchema.js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const DATA_DIR = join(__dirname, 'data');
const DB_PATH = process.env.SQLITE_DB_PATH ?? join(DATA_DIR, 'git-reflow.sqlite');
const LEGACY_TEMPLATE_STORE_PATH = join(DATA_DIR, 'templates.json');
const LEGACY_SESSION_STORE_PATH = join(DATA_DIR, 'sessions.json');
const LEGACY_TEMPLATE_USAGE_STORE_PATH = join(DATA_DIR, 'template-usage.json');
const SESSION_TOKEN_HASH_PREFIX = 'sha256:';

mkdirSync(DATA_DIR, { recursive: true });

const db = new Database(DB_PATH);
db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id TEXT PRIMARY KEY,
    email TEXT NOT NULL,
    name TEXT NOT NULL,
    avatar_url TEXT NOT NULL DEFAULT '',
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS sessions (
    token TEXT PRIMARY KEY,
    user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    created_at TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS templates (
    id TEXT PRIMARY KEY,
    owner_user_id TEXT NOT NULL,
    name TEXT NOT NULL,
    source TEXT NOT NULL,
    updated_at TEXT NOT NULL,
    sort_index INTEGER NOT NULL DEFAULT 0,
    payload_json TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS template_versions (
    version_key TEXT PRIMARY KEY,
    template_id TEXT NOT NULL,
    owner_user_id TEXT NOT NULL,
    updated_at TEXT NOT NULL,
    sort_index INTEGER NOT NULL DEFAULT 0,
    payload_json TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS network_templates (
    id TEXT PRIMARY KEY,
    source_template_id TEXT NOT NULL,
    publisher_user_id TEXT NOT NULL,
    publisher_name TEXT NOT NULL,
    publisher_avatar_url TEXT NOT NULL DEFAULT '',
    published_at TEXT NOT NULL,
    updated_at TEXT NOT NULL,
    import_count INTEGER NOT NULL DEFAULT 0,
    view_count INTEGER NOT NULL DEFAULT 0,
    sort_index INTEGER NOT NULL DEFAULT 0,
    template_json TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS network_template_likes (
    network_template_id TEXT NOT NULL REFERENCES network_templates(id) ON DELETE CASCADE,
    user_id TEXT NOT NULL,
    created_at TEXT NOT NULL,
    PRIMARY KEY (network_template_id, user_id)
  );

  CREATE TABLE IF NOT EXISTS template_usage_events (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id TEXT NOT NULL,
    template_id TEXT NOT NULL,
    template_name TEXT NOT NULL,
    used_at TEXT NOT NULL
  );
`);

function parseJson(value, fallback) {
  try {
    return JSON.parse(value);
  } catch {
    return fallback;
  }
}

function getTemplateOwnerId(template) {
  return template.ownerUserId ?? template.metadata?.ownerUserId ?? '';
}

function hashSessionToken(token) {
  if (typeof token !== 'string' || token.startsWith(SESSION_TOKEN_HASH_PREFIX)) {
    return token;
  }

  return `${SESSION_TOKEN_HASH_PREFIX}${createHash('sha256').update(token).digest('hex')}`;
}

function readLegacyJson(path) {
  if (!existsSync(path)) {
    return null;
  }

  try {
    return JSON.parse(readFileSync(path, 'utf8'));
  } catch (error) {
    console.warn(`Failed to read legacy JSON store at ${path}.`, error);
    return null;
  }
}

const upsertUserStatement = db.prepare(`
  INSERT INTO users (id, email, name, avatar_url, created_at, updated_at)
  VALUES (@id, @email, @name, @avatarUrl, @now, @now)
  ON CONFLICT(id) DO UPDATE SET
    email = excluded.email,
    name = excluded.name,
    avatar_url = excluded.avatar_url,
    updated_at = excluded.updated_at
`);

const upsertSessionStatement = db.prepare(`
  INSERT INTO sessions (token, user_id, created_at)
  VALUES (@token, @userId, @createdAt)
  ON CONFLICT(token) DO UPDATE SET
    user_id = excluded.user_id,
    created_at = excluded.created_at
`);

const upsertTemplateStatement = db.prepare(`
  INSERT INTO templates (id, owner_user_id, name, source, updated_at, sort_index, payload_json)
  VALUES (@id, @ownerUserId, @name, @source, @updatedAt, @sortIndex, @payloadJson)
  ON CONFLICT(id) DO UPDATE SET
    owner_user_id = excluded.owner_user_id,
    name = excluded.name,
    source = excluded.source,
    updated_at = excluded.updated_at,
    sort_index = excluded.sort_index,
    payload_json = excluded.payload_json
`);

const upsertTemplateVersionStatement = db.prepare(`
  INSERT INTO template_versions (version_key, template_id, owner_user_id, updated_at, sort_index, payload_json)
  VALUES (@versionKey, @templateId, @ownerUserId, @updatedAt, @sortIndex, @payloadJson)
  ON CONFLICT(version_key) DO UPDATE SET
    template_id = excluded.template_id,
    owner_user_id = excluded.owner_user_id,
    updated_at = excluded.updated_at,
    sort_index = excluded.sort_index,
    payload_json = excluded.payload_json
`);

const upsertNetworkTemplateStatement = db.prepare(`
  INSERT INTO network_templates (
    id,
    source_template_id,
    publisher_user_id,
    publisher_name,
    publisher_avatar_url,
    published_at,
    updated_at,
    import_count,
    view_count,
    sort_index,
    template_json
  )
  VALUES (
    @id,
    @sourceTemplateId,
    @publisherUserId,
    @publisherName,
    @publisherAvatarUrl,
    @publishedAt,
    @updatedAt,
    @importCount,
    @viewCount,
    @sortIndex,
    @templateJson
  )
  ON CONFLICT(id) DO UPDATE SET
    source_template_id = excluded.source_template_id,
    publisher_user_id = excluded.publisher_user_id,
    publisher_name = excluded.publisher_name,
    publisher_avatar_url = excluded.publisher_avatar_url,
    published_at = excluded.published_at,
    updated_at = excluded.updated_at,
    import_count = excluded.import_count,
    view_count = excluded.view_count,
    sort_index = excluded.sort_index,
    template_json = excluded.template_json
`);

export function readTemplateStore() {
  const templates = db
    .prepare('SELECT payload_json FROM templates ORDER BY sort_index ASC, updated_at DESC')
    .all()
    .map((row) => parseJson(row.payload_json, null))
    .filter(Boolean);
  const versions = db
    .prepare('SELECT payload_json FROM template_versions ORDER BY sort_index ASC, updated_at DESC LIMIT 25')
    .all()
    .map((row) => parseJson(row.payload_json, null))
    .filter(Boolean);
  const likeRows = db.prepare('SELECT network_template_id, user_id FROM network_template_likes').all();
  const likesByTemplateId = new Map();

  for (const row of likeRows) {
    const likes = likesByTemplateId.get(row.network_template_id) ?? [];
    likes.push(row.user_id);
    likesByTemplateId.set(row.network_template_id, likes);
  }

  const publishedTemplates = db
    .prepare('SELECT * FROM network_templates ORDER BY sort_index ASC, published_at DESC')
    .all()
    .map((row) => ({
      id: row.id,
      sourceTemplateId: row.source_template_id,
      publisherUserId: row.publisher_user_id,
      publisherName: row.publisher_name,
      publisherAvatarUrl: row.publisher_avatar_url,
      publishedAt: row.published_at,
      updatedAt: row.updated_at,
      importCount: row.import_count,
      likeUserIds: likesByTemplateId.get(row.id) ?? [],
      viewCount: row.view_count,
      template: parseJson(row.template_json, DEFAULT_TEMPLATE_PAYLOAD),
    }));

  return {
    templates: [DEFAULT_TEMPLATE_PAYLOAD, ...templates],
    latest: templates[0] ?? DEFAULT_TEMPLATE_PAYLOAD,
    versions,
    publishedTemplates,
  };
}

export const writeTemplateStore = db.transaction((store) => {
  const templates = Array.isArray(store.templates) ? store.templates : [];
  const versions = Array.isArray(store.versions) ? store.versions : [];
  const publishedTemplates = Array.isArray(store.publishedTemplates) ? store.publishedTemplates : [];
  const templateIds = templates.filter((template) => template?.source !== 'default').map((template) => template.id);
  const versionKeys = versions
    .filter((template) => template?.source !== 'default')
    .map((template) => `${template.id}:${template.updatedAt ?? ''}`);
  const networkTemplateIds = publishedTemplates.map((entry) => entry.id);

  if (templateIds.length > 0) {
    const placeholders = templateIds.map(() => '?').join(', ');
    db.prepare(`DELETE FROM templates WHERE id NOT IN (${placeholders})`).run(...templateIds);
  } else {
    db.prepare('DELETE FROM templates').run();
  }

  if (versionKeys.length > 0) {
    const placeholders = versionKeys.map(() => '?').join(', ');
    db.prepare(`DELETE FROM template_versions WHERE version_key NOT IN (${placeholders})`).run(...versionKeys);
  } else {
    db.prepare('DELETE FROM template_versions').run();
  }

  if (networkTemplateIds.length > 0) {
    const placeholders = networkTemplateIds.map(() => '?').join(', ');
    db.prepare(`DELETE FROM network_templates WHERE id NOT IN (${placeholders})`).run(...networkTemplateIds);
  } else {
    db.prepare('DELETE FROM network_templates').run();
  }

  templates.forEach((template, sortIndex) => {
    if (!template?.id || template.source === 'default') {
      return;
    }

    upsertTemplateStatement.run({
      id: template.id,
      ownerUserId: getTemplateOwnerId(template),
      name: template.name,
      source: template.source,
      updatedAt: template.updatedAt ?? template.metadata?.updatedAt ?? new Date().toISOString(),
      sortIndex,
      payloadJson: JSON.stringify(template),
    });
  });

  versions.forEach((template, sortIndex) => {
    if (!template?.id || template.source === 'default') {
      return;
    }

    upsertTemplateVersionStatement.run({
      versionKey: `${template.id}:${template.updatedAt ?? ''}`,
      templateId: template.id,
      ownerUserId: getTemplateOwnerId(template),
      updatedAt: template.updatedAt ?? template.metadata?.updatedAt ?? new Date().toISOString(),
      sortIndex,
      payloadJson: JSON.stringify(template),
    });
  });

  for (const [sortIndex, entry] of publishedTemplates.entries()) {
    upsertNetworkTemplateStatement.run({
      id: entry.id,
      sourceTemplateId: entry.sourceTemplateId,
      publisherUserId: entry.publisherUserId,
      publisherName: entry.publisherName ?? '',
      publisherAvatarUrl: entry.publisherAvatarUrl ?? '',
      publishedAt: entry.publishedAt ?? new Date().toISOString(),
      updatedAt: entry.updatedAt ?? entry.publishedAt ?? new Date().toISOString(),
      importCount: Number(entry.importCount) || 0,
      viewCount: Number(entry.viewCount) || 0,
      sortIndex,
      templateJson: JSON.stringify(entry.template),
    });

    db.prepare('DELETE FROM network_template_likes WHERE network_template_id = ?').run(entry.id);

    for (const userId of Array.isArray(entry.likeUserIds) ? entry.likeUserIds : []) {
      db.prepare(`
        INSERT OR IGNORE INTO network_template_likes (network_template_id, user_id, created_at)
        VALUES (?, ?, ?)
      `).run(entry.id, userId, new Date().toISOString());
    }
  }
});

export function readSessionStore() {
  const sessions = db
    .prepare(`
      SELECT
        sessions.token,
        sessions.created_at,
        users.id,
        users.email,
        users.name,
        users.avatar_url
      FROM sessions
      INNER JOIN users ON users.id = sessions.user_id
      ORDER BY sessions.created_at DESC
      LIMIT 100
    `)
    .all()
    .map((row) => ({
      token: row.token,
      createdAt: row.created_at,
      user: {
        id: row.id,
        email: row.email,
        name: row.name,
        avatarUrl: row.avatar_url,
      },
    }));

  return { sessions };
}

export const writeSessionStore = db.transaction((store) => {
  const sessions = Array.isArray(store.sessions) ? store.sessions : [];
  const tokens = sessions.map((session) => session.token);

  if (tokens.length > 0) {
    const placeholders = tokens.map(() => '?').join(', ');
    db.prepare(`DELETE FROM sessions WHERE token NOT IN (${placeholders})`).run(...tokens);
  } else {
    db.prepare('DELETE FROM sessions').run();
  }

  for (const session of sessions.slice(0, 100)) {
    const now = new Date().toISOString();

    upsertUserStatement.run({
      ...session.user,
      now,
    });
    upsertSessionStatement.run({
      token: hashSessionToken(session.token),
      userId: session.user.id,
      createdAt: session.createdAt,
    });
  }
});

export function readTemplateUsageStore() {
  const events = db
    .prepare(`
      SELECT user_id, template_id, template_name, used_at
      FROM template_usage_events
      ORDER BY used_at DESC, id DESC
      LIMIT 2000
    `)
    .all()
    .map((row) => ({
      userId: row.user_id,
      templateId: row.template_id,
      templateName: row.template_name,
      usedAt: row.used_at,
    }));

  return { events };
}

export const writeTemplateUsageStore = db.transaction((store) => {
  const events = Array.isArray(store.events) ? store.events : [];

  db.prepare('DELETE FROM template_usage_events').run();

  for (const event of events.slice(0, 2000)) {
    db.prepare(`
      INSERT INTO template_usage_events (user_id, template_id, template_name, used_at)
      VALUES (?, ?, ?, ?)
    `).run(event.userId, event.templateId, event.templateName, event.usedAt);
  }
});

function migrateLegacyJsonStores() {
  const templateCount = db.prepare('SELECT COUNT(*) AS count FROM templates').get().count;
  const networkTemplateCount = db.prepare('SELECT COUNT(*) AS count FROM network_templates').get().count;
  const sessionCount = db.prepare('SELECT COUNT(*) AS count FROM sessions').get().count;
  const usageCount = db.prepare('SELECT COUNT(*) AS count FROM template_usage_events').get().count;
  const legacyTemplateStore = readLegacyJson(LEGACY_TEMPLATE_STORE_PATH);
  const legacySessionStore = readLegacyJson(LEGACY_SESSION_STORE_PATH);
  const legacyTemplateUsageStore = readLegacyJson(LEGACY_TEMPLATE_USAGE_STORE_PATH);

  if (templateCount === 0 && networkTemplateCount === 0 && legacyTemplateStore) {
    const rawTemplates = Array.isArray(legacyTemplateStore.templates)
      ? legacyTemplateStore.templates
      : [
          legacyTemplateStore.latest ?? DEFAULT_TEMPLATE_PAYLOAD,
          ...(Array.isArray(legacyTemplateStore.versions) ? legacyTemplateStore.versions : []),
        ];
    const templates = [];
    const seenIds = new Set();

    for (const template of rawTemplates) {
      if (template?.id && !seenIds.has(template.id)) {
        seenIds.add(template.id);
        templates.push(template);
      }
    }

    writeTemplateStore({
      templates,
      latest: legacyTemplateStore.latest ?? templates[0] ?? DEFAULT_TEMPLATE_PAYLOAD,
      versions: Array.isArray(legacyTemplateStore.versions) ? legacyTemplateStore.versions : [],
      publishedTemplates: Array.isArray(legacyTemplateStore.publishedTemplates)
        ? legacyTemplateStore.publishedTemplates
        : [],
    });
  }

  if (sessionCount === 0 && legacySessionStore) {
    writeSessionStore({
      sessions: Array.isArray(legacySessionStore.sessions) ? legacySessionStore.sessions : [],
    });
  }

  if (usageCount === 0 && legacyTemplateUsageStore) {
    writeTemplateUsageStore({
      events: Array.isArray(legacyTemplateUsageStore.events) ? legacyTemplateUsageStore.events : [],
    });
  }
}

migrateLegacyJsonStores();
