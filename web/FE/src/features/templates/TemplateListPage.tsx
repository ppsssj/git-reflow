import type { FormEvent } from 'react';
import { useEffect, useMemo, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { AppTopNav } from '../../components/layout/AppTopNav';
import { Icon } from '../../components/ui/Icon';
import { apiDelete, apiGet, apiPost } from '../../lib/api';
import { getAuthSession } from '../../lib/auth';
import type { ExtensionTemplatePayload, TemplateRecord } from '../../types/template';
import { defaultGithubTemplate } from '../editor/templates/defaultGithubTemplate';
import {
  getStarterGithubTemplate,
  isStarterGithubTemplateId,
  starterGithubTemplateRecords,
} from '../editor/templates/starterGithubTemplate';
import { TemplateCard } from './TemplateCard';

const sidebarItems = [
  { icon: 'folder', label: 'My Templates', path: '/templates' },
  { icon: 'explore', label: 'Discover', path: '/templates/discover' },
  { icon: 'star', label: 'Favorites', path: '/templates/favorites' },
  { icon: 'archive', label: 'Imported', path: '/templates/imported' },
  { icon: 'send', label: 'Published', path: '/templates/published' },
  { icon: 'analytics', label: 'Usage', path: '/templates/usage' },
] as const;

interface TemplateListResponse {
  ok: true;
  templates: TemplateRecord[];
}

interface CreateTemplateResponse {
  ok: true;
  template: ExtensionTemplatePayload;
}

interface DeleteTemplateResponse {
  ok: true;
}

interface NetworkTemplateListResponse {
  ok: true;
  templates: TemplateRecord[];
}

interface NetworkTemplateResponse {
  ok: true;
  template: TemplateRecord;
}

interface ImportNetworkTemplateResponse {
  ok: true;
  template: ExtensionTemplatePayload;
  record: TemplateRecord;
}

interface TemplateUsageSummary {
  id: string;
  name: string;
  useCount: number;
  weeklyUseCount: number;
  lastUsedAt: string;
}

interface TemplateUsageEvent {
  id: string;
  name: string;
  usedAt: string;
}

interface TemplateUsageResponse {
  ok: true;
  totalUses: number;
  weeklyUses: number;
  templates: TemplateUsageSummary[];
  recent: TemplateUsageEvent[];
}

type TemplateSortMode = 'updated' | 'name' | 'most-used' | 'recently-used';
type TemplateLibrarySection = 'my' | 'discover' | 'favorites' | 'imported' | 'published' | 'usage';

const DEFAULT_TEMPLATE_ID = defaultGithubTemplate.id;
const FAVORITE_TEMPLATE_STORAGE_KEY = 'git-reflow.favoriteTemplateIds';

function slugify(value: string) {
  const slug = value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');

  return slug || 'github-template';
}

function createTemplateDraft(name: string): ExtensionTemplatePayload {
  const now = new Date().toISOString();

  return {
    ...defaultGithubTemplate,
    id: `${slugify(name)}-${Date.now().toString(36)}`,
    name,
    description: `Custom GitHub home layout based on the default template.`,
    source: 'user',
    version: 1,
    metadata: {
      ...defaultGithubTemplate.metadata,
      updatedAt: now,
    },
    provider: 'github',
    columnLayout: {
      left: 320,
      main: 900,
      right: 315,
    },
    leftSidebarResizeEnabled: true,
    selectedVariationId: 'github-default',
    updatedAt: now,
  };
}

function getUniqueTemplateName(baseName: string, templates: TemplateRecord[]) {
  const existingNames = new Set(templates.map((template) => template.name.trim().toLowerCase()));

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

function getCopyTemplateName(templateName: string, templates: TemplateRecord[]) {
  const existingNames = new Set(templates.map((template) => template.name.trim().toLowerCase()));
  let index = 1;
  let nextName = `${templateName} (${index})`;

  while (existingNames.has(nextName.trim().toLowerCase())) {
    index += 1;
    nextName = `${templateName} (${index})`;
  }

  return nextName;
}

function createCopiedTemplatePayload(source: ExtensionTemplatePayload, name: string): ExtensionTemplatePayload {
  const now = new Date().toISOString();

  return {
    ...source,
    id: `${slugify(name)}-${Date.now().toString(36)}`,
    name,
    description: source.description || `Copied GitHub home layout based on ${source.name}.`,
    source: 'user',
    version: source.version || 1,
    metadata: {
      ...source.metadata,
      updatedAt: now,
    },
    provider: 'github',
    updatedAt: now,
  };
}

function formatRelativeUsageTime(value?: string) {
  if (!value) {
    return 'No extension previews yet';
  }

  const usedAt = new Date(value).getTime();

  if (!Number.isFinite(usedAt)) {
    return 'Recently previewed';
  }

  const diffMinutes = Math.max(0, Math.round((Date.now() - usedAt) / 60000));

  if (diffMinutes < 1) {
    return 'Just now';
  }

  if (diffMinutes < 60) {
    return `${diffMinutes} min ago`;
  }

  const diffHours = Math.round(diffMinutes / 60);

  if (diffHours < 24) {
    return `${diffHours} hr ago`;
  }

  const diffDays = Math.round(diffHours / 24);

  return `${diffDays} day${diffDays === 1 ? '' : 's'} ago`;
}

function formatCompactTemplateName(name?: string) {
  return name?.replace(/^GitHub Polished /, '').replace(/^GitHub /, '') ?? 'No style yet';
}

function getTopUsageTemplates(templates: TemplateUsageSummary[]) {
  return [...templates].sort((a, b) => b.useCount - a.useCount || a.name.localeCompare(b.name)).slice(0, 5);
}

function getUsageAccent(templateId?: string, templateName?: string) {
  const value = `${templateId ?? ''} ${templateName ?? ''}`.toLowerCase();

  if (value.includes('red')) {
    return {
      background: '#f3d9e0',
      panel: '#7f1d1d',
      soft: '#c45a6b',
      main: '#3a2024',
    };
  }

  if (value.includes('green')) {
    return {
      background: '#d8efe4',
      panel: '#14532d',
      soft: '#3e8b64',
      main: '#183329',
    };
  }

  return {
    background: '#dceafe',
    panel: '#1d4ed8',
    soft: '#5b8def',
    main: '#172033',
  };
}

function createUsageTemplateRecord(usage?: TemplateUsageSummary | TemplateUsageEvent): TemplateRecord | null {
  if (!usage) {
    return null;
  }

  return {
    id: usage.id,
    name: usage.name,
    description: 'Recent extension style preview.',
    thumbnail: '',
    collaborators: [],
    status: 'ACTIVE',
    syncState: 'Extension connected',
    updatedAt: 'Extension usage',
    owner: 'git-reflow',
    highlights: ['Recently used in extension'],
    sections: [],
  };
}

function getTemplateSearchText(template: TemplateRecord) {
  return [
    template.name,
    template.description,
    template.owner,
    template.updatedAt,
    ...template.highlights,
    ...template.sections.map((section) => `${section.label} ${section.description}`),
  ].join(' ').toLowerCase();
}

function getUpdatedSortValue(template: TemplateRecord) {
  if (template.updatedAt === 'Starter preset') {
    return 1;
  }

  const timestamp = new Date(template.updatedAt.replace(/^Updated /, '')).getTime();

  return Number.isFinite(timestamp) ? timestamp : 0;
}

function readFavoriteTemplateIds() {
  try {
    const rawValue = window.localStorage.getItem(FAVORITE_TEMPLATE_STORAGE_KEY);
    const parsedValue = rawValue ? JSON.parse(rawValue) : [];

    return Array.isArray(parsedValue)
      ? parsedValue.filter((templateId): templateId is string => typeof templateId === 'string')
      : [];
  } catch {
    return [];
  }
}

function getTemplateLibrarySection(pathname: string): TemplateLibrarySection {
  if (pathname.endsWith('/discover')) return 'discover';
  if (pathname.endsWith('/favorites')) return 'favorites';
  if (pathname.endsWith('/imported')) return 'imported';
  if (pathname.endsWith('/published')) return 'published';
  if (pathname.endsWith('/usage')) return 'usage';

  return 'my';
}

function getSectionCopy(section: TemplateLibrarySection) {
  if (section === 'discover') {
    return {
      title: 'Template Network',
      description: 'Explore public GitHub layouts and import them into your workspace.',
      search: 'Search public templates, styles, or sections...',
      empty: 'No public templates found',
      emptyHint: 'Try another name, color, or section.',
    };
  }

  if (section === 'favorites') {
    return {
      title: 'Favorite Templates',
      description: 'Your saved shortcuts for frequently used layouts.',
      search: 'Search favorite templates...',
      empty: 'No favorite templates yet',
      emptyHint: 'Star templates from My Templates or Discover to collect them here.',
    };
  }

  if (section === 'imported') {
    return {
      title: 'Imported Templates',
      description: 'Templates copied from the public network into your workspace.',
      search: 'Search imported templates...',
      empty: 'No imported templates yet',
      emptyHint: 'Open Discover and import a public template to get started.',
    };
  }

  if (section === 'published') {
    return {
      title: 'Published Templates',
      description: 'Layouts you have shared with the template network.',
      search: 'Search published templates...',
      empty: 'No published templates yet',
      emptyHint: 'Publishing controls can be added to template actions next.',
    };
  }

  if (section === 'usage') {
    return {
      title: 'Template Usage',
      description: 'See which layouts are being previewed through the extension.',
      search: 'Search templates by usage...',
      empty: 'No usage templates found',
      emptyHint: 'Preview templates in the extension to generate activity.',
    };
  }

  return {
    title: 'Repository Templates',
    description: 'Manage saved GitHub layout templates.',
    search: 'Search templates, sections, or colors...',
    empty: 'No templates found',
    emptyHint: 'Try another name, color, section, or usage sort.',
  };
}

function isImportedTemplate(template: TemplateRecord) {
  const value = `${template.name} ${template.description} ${template.updatedAt}`.toLowerCase();

  return Boolean(template.importedFromNetworkTemplateId || template.importedFromTemplateId)
    || value.includes('copied')
    || value.includes('imported');
}

function getSourceTemplateId(template: TemplateRecord) {
  return template.sourceTemplateId ?? template.id;
}

function getTemplateOpenPath(template: TemplateRecord) {
  return template.networkTemplateId
    ? `/templates/network/${encodeURIComponent(template.networkTemplateId)}`
    : `/templates/${template.id}`;
}

export function TemplateListPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const librarySection = getTemplateLibrarySection(location.pathname);
  const sectionCopy = getSectionCopy(librarySection);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [templateSearchQuery, setTemplateSearchQuery] = useState(
    () => new URLSearchParams(location.search).get('search') ?? '',
  );
  const [templateSortMode, setTemplateSortMode] = useState<TemplateSortMode>('updated');
  const [remoteTemplates, setRemoteTemplates] = useState<TemplateRecord[]>([]);
  const [isLoadingTemplates, setIsLoadingTemplates] = useState(true);
  const [templateError, setTemplateError] = useState('');
  const [templateUsage, setTemplateUsage] = useState<TemplateUsageResponse | null>(null);
  const [publicTemplates, setPublicTemplates] = useState<TemplateRecord[]>([]);
  const [newTemplateName, setNewTemplateName] = useState('');
  const [createStatus, setCreateStatus] = useState('');
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [favoriteTemplateIds, setFavoriteTemplateIds] = useState<string[]>(readFavoriteTemplateIds);
  const [showFavoritesOnly, setShowFavoritesOnly] = useState(false);
  const currentUserId = getAuthSession()?.user.id ?? '';
  const remoteTemplateIds = useMemo(() => new Set(remoteTemplates.map((template) => template.id)), [remoteTemplates]);
  const visibleTemplates = useMemo<TemplateRecord[]>(() => {
    const userTemplates = remoteTemplates.filter((template) => template.id !== DEFAULT_TEMPLATE_ID);
    const savedTemplateIds = new Set(userTemplates.map((template) => template.id));
    const unsavedStarterTemplates = starterGithubTemplateRecords.filter((template) => !savedTemplateIds.has(template.id));
    const activeTemplateId = templateUsage?.recent[0]?.id ?? '';

    return [...unsavedStarterTemplates, ...userTemplates].map((template) => ({
      ...template,
      status: template.id === activeTemplateId ? 'ACTIVE' : 'INACTIVE',
      syncState: template.id === activeTemplateId ? 'Extension connected' : template.syncState,
    }));
  }, [remoteTemplates, templateUsage]);
  const favoriteTemplateIdSet = useMemo(() => new Set(favoriteTemplateIds), [favoriteTemplateIds]);
  const publishedTemplateIdSet = useMemo(
    () =>
      new Set(
        publicTemplates
          .filter((template) => template.publisherUserId === currentUserId)
          .map((template) => template.sourceTemplateId ?? template.id),
      ),
    [currentUserId, publicTemplates],
  );
  const publishedTemplates = useMemo<TemplateRecord[]>(
    () =>
      publicTemplates.filter((template) => template.publisherUserId === currentUserId),
    [currentUserId, publicTemplates],
  );
  const templateUsageById = useMemo(
    () => new Map((templateUsage?.templates ?? []).map((template) => [template.id, template])),
    [templateUsage],
  );
  const sectionTemplates = useMemo(() => {
    if (librarySection === 'discover') {
      return publicTemplates;
    }

    if (librarySection === 'favorites') {
      return visibleTemplates.filter((template) => favoriteTemplateIdSet.has(template.id));
    }

    if (librarySection === 'imported') {
      return visibleTemplates.filter(isImportedTemplate);
    }

    if (librarySection === 'published') {
      return publishedTemplates;
    }

    if (librarySection === 'usage') {
      return visibleTemplates.filter((template) => templateUsageById.has(template.id));
    }

    return visibleTemplates;
  }, [
    favoriteTemplateIdSet,
    librarySection,
    publicTemplates,
    publishedTemplates,
    templateUsageById,
    visibleTemplates,
  ]);
  const filteredTemplates = useMemo(() => {
    const query = templateSearchQuery.trim().toLowerCase();
    const searchedTemplates = query
      ? sectionTemplates.filter((template) => getTemplateSearchText(template).includes(query))
      : sectionTemplates;
    const favoriteFilteredTemplates = showFavoritesOnly && librarySection === 'my'
      ? searchedTemplates.filter((template) => favoriteTemplateIdSet.has(template.id))
      : searchedTemplates;

    return [...favoriteFilteredTemplates].sort((a, b) => {
      const favoriteDelta = Number(favoriteTemplateIdSet.has(b.id)) - Number(favoriteTemplateIdSet.has(a.id));

      if (favoriteDelta !== 0) {
        return favoriteDelta;
      }

      if (templateSortMode === 'name') {
        return a.name.localeCompare(b.name);
      }

      if (templateSortMode === 'most-used') {
        return (templateUsageById.get(b.id)?.useCount ?? 0) - (templateUsageById.get(a.id)?.useCount ?? 0)
          || a.name.localeCompare(b.name);
      }

      if (templateSortMode === 'recently-used') {
        return new Date(templateUsageById.get(b.id)?.lastUsedAt ?? 0).getTime()
          - new Date(templateUsageById.get(a.id)?.lastUsedAt ?? 0).getTime()
          || a.name.localeCompare(b.name);
      }

      return getUpdatedSortValue(b) - getUpdatedSortValue(a) || a.name.localeCompare(b.name);
    });
  }, [
    favoriteTemplateIdSet,
    showFavoritesOnly,
    librarySection,
    templateSearchQuery,
    templateSortMode,
    templateUsageById,
    sectionTemplates,
  ]);
  const recentUsage = templateUsage?.recent[0];
  const mostUsedTemplate = templateUsage ? getTopUsageTemplates(templateUsage.templates)[0] : undefined;
  const topUsageTemplates = templateUsage ? getTopUsageTemplates(templateUsage.templates) : [];
  const usageCardTemplateName = formatCompactTemplateName(recentUsage?.name);
  const mostUsedName = formatCompactTemplateName(mostUsedTemplate?.name);
  const recentTemplateRecord =
    visibleTemplates.find((template) => template.id === recentUsage?.id) ?? createUsageTemplateRecord(recentUsage);
  const mostUsedTemplateRecord =
    visibleTemplates.find((template) => template.id === mostUsedTemplate?.id) ?? createUsageTemplateRecord(mostUsedTemplate);
  const recentAccent = getUsageAccent(recentUsage?.id, recentUsage?.name);
  const mostUsedAccent = getUsageAccent(mostUsedTemplate?.id, mostUsedTemplate?.name);

  useEffect(() => {
    setTemplateSearchQuery(new URLSearchParams(location.search).get('search') ?? '');
  }, [location.search]);

  useEffect(() => {
    let cancelled = false;

    apiGet<TemplateListResponse>('/api/templates')
      .then((result) => {
        if (cancelled) {
          return;
        }

        setRemoteTemplates(result.templates);
        setTemplateError('');
      })
      .catch((error) => {
        if (cancelled) {
          return;
        }

        setTemplateError(error instanceof Error ? error.message : 'Failed to load templates');
      })
      .finally(() => {
        if (!cancelled) {
          setIsLoadingTemplates(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    window.localStorage.setItem(FAVORITE_TEMPLATE_STORAGE_KEY, JSON.stringify(favoriteTemplateIds));
  }, [favoriteTemplateIds]);

  useEffect(() => {
    let cancelled = false;

    const refreshNetworkTemplates = () => {
      apiGet<NetworkTemplateListResponse>('/api/templates/network')
        .then((result) => {
          if (!cancelled) {
            setPublicTemplates(result.templates);
          }
        })
        .catch(() => {
          if (!cancelled) {
            setPublicTemplates([]);
          }
        });
    };

    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        refreshNetworkTemplates();
      }
    };

    refreshNetworkTemplates();
    const refreshInterval = window.setInterval(refreshNetworkTemplates, 15000);
    window.addEventListener('focus', refreshNetworkTemplates);
    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      cancelled = true;
      window.clearInterval(refreshInterval);
      window.removeEventListener('focus', refreshNetworkTemplates);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, []);

  useEffect(() => {
    let cancelled = false;

    const refreshTemplateUsage = () => {
      apiGet<TemplateUsageResponse>('/api/template-usage')
        .then((result) => {
          if (!cancelled) {
            setTemplateUsage(result);
          }
        })
        .catch(() => {
          if (!cancelled) {
            setTemplateUsage(null);
          }
        });
    };

    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        refreshTemplateUsage();
      }
    };

    refreshTemplateUsage();
    const refreshInterval = window.setInterval(refreshTemplateUsage, 10000);
    window.addEventListener('focus', refreshTemplateUsage);
    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      cancelled = true;
      window.clearInterval(refreshInterval);
      window.removeEventListener('focus', refreshTemplateUsage);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, []);

  const handleCreateTemplate = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const name = newTemplateName.trim();

    if (name.length < 2) {
      setCreateStatus('Enter a template name');
      return;
    }

    const nameExists = visibleTemplates.some(
      (template) => template.name.trim().toLowerCase() === name.toLowerCase(),
    );

    if (nameExists) {
      setCreateStatus('Template name already exists');
      return;
    }

    setCreateStatus('Creating...');

    try {
      const result = await apiPost<CreateTemplateResponse>('/api/templates/github-home', createTemplateDraft(name));

      setNewTemplateName('');
      setCreateDialogOpen(false);
      setCreateStatus('Created');
      navigate(`/templates/${result.template.id}`);
    } catch (error) {
      setCreateStatus(error instanceof Error ? error.message : 'Failed to create template');
    }
  };

  const handleOpenTemplate = (template: TemplateRecord) => {
    navigate(getTemplateOpenPath(template));
  };

  const handleOpenActivityTemplate = (template?: TemplateRecord | null) => {
    if (template) {
      navigate(`/templates/${template.id}`);
    }
  };

  const handleToggleFavoriteTemplate = (template: TemplateRecord) => {
    setFavoriteTemplateIds((current) =>
      current.includes(template.id)
        ? current.filter((templateId) => templateId !== template.id)
        : [template.id, ...current],
    );
  };

  const handleTogglePublishedTemplate = async (template: TemplateRecord) => {
    const sourceTemplateId = getSourceTemplateId(template);
    const isPublished = publishedTemplateIdSet.has(sourceTemplateId);

    setCreateStatus(isPublished ? 'Unpublishing...' : 'Publishing...');

    try {
      if (isPublished) {
        await apiDelete<{ ok: true }>(`/api/templates/${encodeURIComponent(sourceTemplateId)}/publish`);
        setPublicTemplates((current) =>
          current.filter((item) => item.sourceTemplateId !== sourceTemplateId || item.publisherUserId !== currentUserId),
        );
        setCreateStatus('Unpublished from Network');
        return;
      }

      const result = await apiPost<NetworkTemplateResponse>(
        `/api/templates/${encodeURIComponent(sourceTemplateId)}/publish`,
        {},
      );

      setPublicTemplates((current) => [
        result.template,
        ...current.filter(
          (item) => item.sourceTemplateId !== sourceTemplateId || item.publisherUserId !== currentUserId,
        ),
      ]);
      setCreateStatus('Published to Network');
    } catch (error) {
      setCreateStatus(error instanceof Error ? error.message : 'Failed to update Network publishing');
    }
  };

  const handleRenameTemplate = async (template: TemplateRecord, requestedName: string) => {
    const nextName = requestedName.trim();

    if (!nextName || nextName === template.name) {
      return;
    }

    if (nextName.length < 2) {
      setCreateStatus('Template name must be at least 2 characters');
      return;
    }

    const nameExists = visibleTemplates.some(
      (item) => item.id !== template.id && item.name.trim().toLowerCase() === nextName.toLowerCase(),
    );

    if (nameExists) {
      setCreateStatus('Template name already exists');
      return;
    }

    setCreateStatus('Renaming...');

    try {
      const payload = await apiGet<ExtensionTemplatePayload>(`/api/templates/${encodeURIComponent(template.id)}`);
      const now = new Date().toISOString();
      const result = await apiPost<CreateTemplateResponse>('/api/templates/github-home', {
        ...payload,
        name: nextName,
        metadata: {
          ...payload.metadata,
          updatedAt: now,
        },
        updatedAt: now,
      });

      setRemoteTemplates((current) =>
        current.map((item) =>
          item.id === template.id
            ? {
                ...item,
                name: result.template.name,
                description: result.template.description,
                updatedAt: `Updated ${new Date(result.template.updatedAt).toLocaleString()}`,
              }
            : item,
        ),
      );
      setCreateStatus('Renamed');
    } catch (error) {
      setCreateStatus(error instanceof Error ? error.message : 'Failed to rename template');
    }
  };

  const handleDeleteTemplate = async (template: TemplateRecord) => {
    if (!window.confirm(`Delete "${template.name}"?`)) {
      return;
    }

    setCreateStatus('Deleting...');

    try {
      await apiDelete<DeleteTemplateResponse>(`/api/templates/${encodeURIComponent(template.id)}`);
      setRemoteTemplates((current) => current.filter((item) => item.id !== template.id));
      setCreateStatus('Deleted');
    } catch (error) {
      setCreateStatus(error instanceof Error ? error.message : 'Failed to delete template');
    }
  };

  const handleCopyTemplate = async (
    template: TemplateRecord,
    requestedName: string,
    action = { progress: 'Copying...', success: 'Copied', failure: 'copy' },
  ) => {
    const generatedName = getCopyTemplateName(template.name, visibleTemplates);
    const nextName = requestedName ? getUniqueTemplateName(requestedName, visibleTemplates) : generatedName;

    if (nextName.length < 2) {
      setCreateStatus('Template name must be at least 2 characters');
      return;
    }

    setCreateStatus(action.progress);

    try {
      const sourcePayload =
        isStarterGithubTemplateId(template.id)
          ? getStarterGithubTemplate(template.id)
          : await apiGet<ExtensionTemplatePayload>(`/api/templates/${encodeURIComponent(template.id)}`);

      if (!sourcePayload) {
        setCreateStatus('Template unavailable');
        return;
      }

      const payload = createCopiedTemplatePayload(sourcePayload, nextName);
      const result = await apiPost<CreateTemplateResponse>('/api/templates/github-home', payload);

      setRemoteTemplates((current) => [
        {
          ...template,
          id: result.template.id,
          name: result.template.name,
          description: result.template.description,
          updatedAt: `Updated ${new Date(result.template.updatedAt).toLocaleString()}`,
          owner: 'Personal Workspace',
        },
        ...current,
      ]);
      setCreateStatus(action.success);
      navigate(`/templates/${result.template.id}`);
    } catch (error) {
      setCreateStatus(error instanceof Error ? error.message : `Failed to ${action.failure} template`);
    }
  };

  const handleImportTemplate = async (template: TemplateRecord, requestedName: string) => {
    if (template.networkTemplateId) {
      const generatedName = getCopyTemplateName(template.name, visibleTemplates);
      const nextName = requestedName ? getUniqueTemplateName(requestedName, visibleTemplates) : generatedName;

      setCreateStatus('Importing...');

      try {
        const result = await apiPost<ImportNetworkTemplateResponse>(
          `/api/templates/network/${encodeURIComponent(template.networkTemplateId)}/import`,
          { name: nextName },
        );

        setRemoteTemplates((current) => [result.record, ...current]);
        setPublicTemplates((current) =>
          current.map((item) =>
            item.networkTemplateId === template.networkTemplateId
              ? { ...item, importCount: (item.importCount ?? 0) + 1 }
              : item,
          ),
        );
        setCreateStatus('Imported');
        navigate(`/templates/${result.template.id}`);
      } catch (error) {
        setCreateStatus(error instanceof Error ? error.message : 'Failed to import template');
      }

      return;
    }

    await handleCopyTemplate(template, requestedName, {
      progress: 'Importing...',
      success: 'Imported',
      failure: 'import',
    });
  };

  return (
    <div className="dashboard-page">
      <AppTopNav
        active={librarySection === 'discover' ? 'network' : 'templates'}
        searchPlaceholder="Search resources..."
      />

      <div className="dashboard-shell">
        <aside className="dashboard-sidebar">
          <div className="workspace-card">
            <div className="workspace-card__icon">
              <Icon name="terminal" />
            </div>
            <div>
              <h2>Main Workspace</h2>
              <p>PRODUCTION v1.0.4</p>
            </div>
          </div>

          <button
            className="sidebar-create"
            type="button"
            onClick={() => {
              setCreateStatus('');
              setNewTemplateName('');
              setCreateDialogOpen(true);
            }}
          >
            <Icon name="add" />
            <span>Create New</span>
          </button>

          <nav className="sidebar-nav" aria-label="Template workspace">
            {sidebarItems.map((item) => (
              <Link
                key={item.label}
                className={location.pathname === item.path ? 'is-active' : ''}
                to={item.path}
              >
                <Icon name={item.icon} />
                <span>{item.label}</span>
              </Link>
            ))}
          </nav>

          <div className="sidebar-bottom">
            <a href="#support">
              <Icon name="help_outline" />
              <span>Support</span>
            </a>
            <a href="#archive">
              <Icon name="archive" />
              <span>Archive</span>
            </a>
          </div>
        </aside>

        <main className="dashboard-main">
          <header className="dashboard-main__header">
            <div>
              <h1>{sectionCopy.title}</h1>
              <p>
                {isLoadingTemplates
                  ? 'Loading saved templates...'
                  : templateError
                    ? `Using local samples: ${templateError}`
                    : sectionCopy.description}
              </p>
            </div>

            <div className="view-toggle">
              <button
                className={viewMode === 'grid' ? 'is-active' : ''}
                type="button"
                onClick={() => setViewMode('grid')}
              >
                <Icon name="grid_view" />
                <span>Grid</span>
              </button>
              <button
                className={viewMode === 'list' ? 'is-active' : ''}
                type="button"
                onClick={() => setViewMode('list')}
              >
                <Icon name="list" />
                <span>List</span>
              </button>
            </div>
          </header>

          <section className="template-toolbar" aria-label="Template filters">
            <label className="template-toolbar__search">
              <Icon name="search" />
              <input
                placeholder={sectionCopy.search}
                type="search"
                value={templateSearchQuery}
                onChange={(event) => setTemplateSearchQuery(event.target.value)}
              />
            </label>
            <label className="template-toolbar__sort">
              <span>Sort</span>
              <select
                value={templateSortMode}
                onChange={(event) => setTemplateSortMode(event.target.value as TemplateSortMode)}
              >
                <option value="updated">Recently updated</option>
                <option value="name">Name</option>
                <option value="most-used">Most used</option>
                <option value="recently-used">Recently used</option>
              </select>
            </label>
            {librarySection === 'my' ? (
              <button
                className={['template-toolbar__favorite', showFavoritesOnly ? 'is-active' : ''].join(' ').trim()}
                type="button"
                aria-pressed={showFavoritesOnly}
                onClick={() => setShowFavoritesOnly((current) => !current)}
              >
                <Icon name="star" />
                <span>Favorites</span>
              </button>
            ) : null}
            <span className="template-toolbar__count">
              {filteredTemplates.length} of {sectionTemplates.length}
            </span>
          </section>

          <section className={viewMode === 'grid' ? 'template-grid' : 'template-list'}>
            {filteredTemplates.map((template) => (
              <TemplateCard
                key={template.id}
                canManage={
                  librarySection !== 'discover' &&
                  template.id !== DEFAULT_TEMPLATE_ID &&
                  !isStarterGithubTemplateId(template.id) &&
                  remoteTemplateIds.has(template.id)
                }
                canCopy={
                  librarySection === 'discover' ||
                  isStarterGithubTemplateId(template.id) ||
                  remoteTemplateIds.has(template.id)
                }
                copyLabel={librarySection === 'discover' ? 'Import' : 'Copy'}
                canPublish={
                  librarySection !== 'discover' &&
                  getSourceTemplateId(template) !== DEFAULT_TEMPLATE_ID &&
                  !isStarterGithubTemplateId(getSourceTemplateId(template)) &&
                  remoteTemplateIds.has(getSourceTemplateId(template))
                }
                isFavorite={favoriteTemplateIdSet.has(template.id)}
                isPublished={publishedTemplateIdSet.has(getSourceTemplateId(template))}
                template={template}
                variant={viewMode}
                onCopy={librarySection === 'discover' ? handleImportTemplate : handleCopyTemplate}
                onDelete={handleDeleteTemplate}
                onToggleFavorite={handleToggleFavoriteTemplate}
                onTogglePublish={handleTogglePublishedTemplate}
                openPath={getTemplateOpenPath(template)}
                onOpen={handleOpenTemplate}
                onRename={handleRenameTemplate}
              />
            ))}

            {filteredTemplates.length === 0 ? (
              <div className="template-empty-results">
                <Icon name="search" />
                <strong>{sectionCopy.empty}</strong>
                <span>{sectionCopy.emptyHint}</span>
              </div>
            ) : null}

            {librarySection === 'my' ? (
              <form className="template-add-card template-create-card" onSubmit={handleCreateTemplate}>
                <div className="template-add-card__icon">
                  <Icon name="add_circle" />
                </div>
                <strong>New Template</strong>
                <label>
                  <span>Template title</span>
                  <input
                    placeholder="GitHub focus layout"
                    type="text"
                    value={newTemplateName}
                    onChange={(event) => setNewTemplateName(event.target.value)}
                  />
                </label>
                <button type="submit">Create</button>
                {createStatus ? <em>{createStatus}</em> : null}
              </form>
            ) : null}
          </section>

          {librarySection === 'my' || librarySection === 'usage' ? (
          <section className="activity-section">
            <h2>Recent Activity</h2>

            <div className="activity-grid">
              <article className="activity-card activity-card--large activity-card--style">
                <p>Recent Style</p>
                <strong>{usageCardTemplateName}</strong>
                <span>
                  <Icon name="history" />
                  <em>{formatRelativeUsageTime(recentUsage?.usedAt)}</em>
                </span>

                <div className="activity-style-preview" style={{ background: recentAccent.background }}>
                  <div style={{ background: recentAccent.panel }} />
                  <div>
                    <span style={{ background: recentAccent.soft }} />
                    <span style={{ background: recentAccent.main }} />
                    <span style={{ background: recentAccent.soft }} />
                  </div>
                </div>

                <div className="activity-card__actions">
                  <button
                    type="button"
                    onClick={() => handleOpenActivityTemplate(recentTemplateRecord)}
                    disabled={!recentTemplateRecord}
                  >
                    <Icon name="visibility" />
                    <span>Preview</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => recentTemplateRecord && handleCopyTemplate(recentTemplateRecord, '')}
                    disabled={!recentTemplateRecord}
                  >
                    <Icon name="content_copy" />
                    <span>Copy</span>
                  </button>
                </div>
              </article>

              <article className="activity-card activity-card--usage">
                <p>Most Used</p>
                <strong>{mostUsedTemplate?.useCount ?? 0}</strong>
                <button
                  className="activity-card__style-link"
                  type="button"
                  onClick={() => handleOpenActivityTemplate(mostUsedTemplateRecord)}
                  disabled={!mostUsedTemplateRecord}
                >
                  {mostUsedName}
                </button>
                <div className="activity-ranked-list">
                  {(topUsageTemplates.length ? topUsageTemplates.slice(0, 3) : []).map((template, index) => {
                    const maxUseCount = Math.max(...topUsageTemplates.map((item) => item.useCount), 1);
                    const width = Math.max(12, Math.round((template.useCount / maxUseCount) * 100));
                    const accent = getUsageAccent(template.id, template.name);

                    return (
                      <button key={template.id} type="button" onClick={() => navigate(`/templates/${template.id}`)}>
                        <span>{index + 1}</span>
                        <strong>{formatCompactTemplateName(template.name)}</strong>
                        <em>{template.useCount}</em>
                        <i style={{ width: `${width}%`, background: accent.panel }} />
                      </button>
                    );
                  })}
                  {!topUsageTemplates.length ? <small>No extension usage yet</small> : null}
                </div>
              </article>

              <article className="activity-card activity-card--usage">
                <p>Usage This Week</p>
                <strong>{templateUsage?.weeklyUses ?? 0}</strong>
                <span>{templateUsage?.totalUses ?? 0} total previews</span>
                <div className="activity-style-preview activity-style-preview--small" style={{ background: mostUsedAccent.background }}>
                  <div style={{ background: mostUsedAccent.panel }} />
                  <div>
                    <span style={{ background: mostUsedAccent.soft }} />
                    <span style={{ background: mostUsedAccent.main }} />
                  </div>
                </div>
                <div className="tag-row">
                  {(topUsageTemplates.length ? topUsageTemplates.slice(0, 3) : visibleTemplates.slice(0, 3)).map((template) => (
                    <button key={template.id} type="button" onClick={() => navigate(`/templates/${template.id}`)}>
                      {formatCompactTemplateName(template.name)}
                    </button>
                  ))}
                </div>
              </article>
            </div>
          </section>
          ) : null}
        </main>
      </div>

      {createDialogOpen ? (
        <div className="create-template-dialog" role="dialog" aria-modal="true" aria-labelledby="create-template-title">
          <form className="create-template-dialog__panel" onSubmit={handleCreateTemplate}>
            <div className="create-template-dialog__header">
              <div className="template-add-card__icon">
                <Icon name="add_circle" />
              </div>
              <div>
                <strong id="create-template-title">New Template</strong>
                <span>Start from the plain GitHub Home draft.</span>
              </div>
              <button aria-label="Close new template dialog" type="button" onClick={() => setCreateDialogOpen(false)}>
                <Icon name="close" />
              </button>
            </div>
            <label>
              <span>Template title</span>
              <input
                autoFocus
                placeholder="GitHub focus layout"
                type="text"
                value={newTemplateName}
                onChange={(event) => setNewTemplateName(event.target.value)}
              />
            </label>
            <div className="create-template-dialog__actions">
              <span>{createStatus}</span>
              <button type="button" onClick={() => setCreateDialogOpen(false)}>
                Cancel
              </button>
              <button type="submit">Create</button>
            </div>
          </form>
        </div>
      ) : null}

      <footer className="dashboard-footer">
        <div>
          <span>REFLOW PLATFORM</span>
          <p>© 2026 Precision Git Reflow Platform. All rights reserved.</p>
        </div>
        <nav aria-label="Footer">
          <a href="#privacy">Privacy</a>
          <a href="#terms">Terms</a>
          <a href="#security">Security</a>
          <a href="#status">Status</a>
        </nav>
      </footer>
    </div>
  );
}
