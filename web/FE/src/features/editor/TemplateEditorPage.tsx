import type { CSSProperties, FormEvent, PointerEvent, WheelEvent } from 'react';
import { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { AppTopNav } from '../../components/layout/AppTopNav';
import { Icon } from '../../components/ui/Icon';
import { apiGet, apiPost } from '../../lib/api';
import { templates } from '../../mocks/templates';
import type {
  TemplateBlock,
  ExtensionTemplatePayload,
  TemplateColumnLayout,
  TemplateLayout,
  TemplateRegion,
  TemplateScreen,
  TemplateVariation,
  TemplateVariationId,
  TemplateRecord,
} from '../../types/template';
import { TemplateEditPanel } from './TemplateEditPanel';
import type { QuickThemeId } from './TemplateEditPanel';
import { TemplateLayoutCanvas } from './TemplateLayoutCanvas';
import { defaultGithubTemplate } from './templates/defaultGithubTemplate';
import { profileOverviewBlocks, profileOverviewScreen } from './templates/profileOverviewTemplate';
import { repositoryReadmeBlocks, repositoryReadmeScreen } from './templates/repositoryReadmeTemplate';
import {
  getStarterGithubTemplate,
  getStarterGithubTemplateRecord,
  isStarterGithubTemplateId,
  starterGithubTemplateRecord,
} from './templates/starterGithubTemplate';
import { useTemplateLayout } from './useTemplateLayout';

const regionIcons: Record<TemplateRegion, string> = {
  topbar: 'web_asset',
  'left-sidebar': 'dock_to_left',
  'main-feed': 'view_agenda',
  'right-sidebar': 'dock_to_right',
};

const regionLabels: Record<TemplateRegion, string> = {
  topbar: 'Topbar',
  'left-sidebar': 'Left sidebar',
  'main-feed': 'Main feed',
  'right-sidebar': 'Right sidebar',
};

const MIN_CANVAS_ZOOM = 0.5;
const MAX_CANVAS_ZOOM = 2;
const CANVAS_ZOOM_STEP = 0.1;
const STYLE_MENU_WIDTH = 328;
const STYLE_MENU_VISIBLE_GUTTER = 12;
const BACKGROUND_EDITOR_FRAME_WIDTH = 1120;
const BACKGROUND_EDITOR_FRAME_HEIGHT = 760;
const BACKGROUND_IMAGE_MAX_SOURCE_EDGE = 1800;
const BACKGROUND_IMAGE_MAX_INLINE_LENGTH = 850_000;
const DEFAULT_COLUMN_LAYOUT: TemplateColumnLayout = {
  left: 320,
  main: 900,
  right: 315,
};

const githubSafeVariations: TemplateVariation[] = [
  {
    id: 'github-default',
    title: 'Current GitHub home',
    description: 'Keep the captured dashboard structure as-is.',
    githubConstraint: 'Baseline',
  },
  {
    id: 'feed-two-column',
    title: 'Two-column feed',
    description: 'Split feed cards into two scannable columns.',
    githubConstraint: 'Feed only',
  },
];

const addableScreenPresets: Array<{ screen: TemplateScreen; blocks: TemplateBlock[] }> = [
  {
    screen: repositoryReadmeScreen,
    blocks: repositoryReadmeBlocks,
  },
  {
    screen: profileOverviewScreen,
    blocks: profileOverviewBlocks,
  },
];

interface SaveTemplateResponse {
  ok: true;
  template: ExtensionTemplatePayload;
}

interface NetworkTemplateResponse {
  ok: true;
  template: ExtensionTemplatePayload;
  record: TemplateRecord;
}

interface ImportNetworkTemplateResponse {
  ok: true;
  template: ExtensionTemplatePayload;
  record: TemplateRecord;
}

interface NetworkMetricResponse {
  ok: true;
  template: TemplateRecord;
}

interface TemplateResetSnapshot {
  layout: TemplateLayout;
  columnLayout: TemplateColumnLayout;
  leftSidebarResizeEnabled: boolean;
  selectedVariationId: TemplateVariationId;
  pageAppearance: Record<string, unknown>;
}

function clampCanvasZoom(value: number) {
  return Math.min(MAX_CANVAS_ZOOM, Math.max(MIN_CANVAS_ZOOM, value));
}

function clampMenuCoordinate(value: number, min: number, max: number) {
  return Math.min(Math.max(value, min), Math.max(min, max));
}

function createEditableFallbackTemplate(templateId: string, templateName: string): ExtensionTemplatePayload {
  const now = new Date().toISOString();

  return {
    ...defaultGithubTemplate,
    id: templateId,
    name: templateName,
    description: `Custom GitHub home layout based on ${templateName}.`,
    source: 'user',
    version: defaultGithubTemplate.version,
    metadata: {
      ...defaultGithubTemplate.metadata,
      updatedAt: now,
    },
    provider: 'github',
    columnLayout: DEFAULT_COLUMN_LAYOUT,
    leftSidebarResizeEnabled: true,
    selectedVariationId: 'github-default',
    updatedAt: now,
  };
}

function slugify(value: string) {
  const slug = value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');

  return slug || 'github-template';
}

function createStarterCopyTemplate(template: TemplateLayout & Partial<ExtensionTemplatePayload>): ExtensionTemplatePayload {
  const now = new Date().toISOString();
  const name = `${template.name} Copy`;

  return {
    ...template,
    id: `${slugify(name)}-${Date.now().toString(36)}`,
    name,
    description: template.description || `Custom GitHub home layout based on ${template.name}.`,
    source: 'user',
    version: template.version || 1,
    metadata: {
      ...template.metadata,
      updatedAt: now,
    },
    provider: 'github',
    updatedAt: now,
  } as ExtensionTemplatePayload;
}

function formatPublishedDate(value?: string) {
  if (!value) {
    return 'Recently published';
  }

  return `Published ${new Date(value).toLocaleDateString()}`;
}

function getTemplateResetSnapshot(template: TemplateLayout & Partial<ExtensionTemplatePayload>): TemplateResetSnapshot {
  return {
    layout: template,
    columnLayout: template.columnLayout ?? DEFAULT_COLUMN_LAYOUT,
    leftSidebarResizeEnabled: template.leftSidebarResizeEnabled !== false,
    selectedVariationId: template.selectedVariationId ?? 'github-default',
    pageAppearance:
      typeof template.pageAppearance === 'object' && template.pageAppearance !== null && !Array.isArray(template.pageAppearance)
        ? template.pageAppearance as Record<string, unknown>
        : {},
  };
}

export function TemplateEditorPage() {
  const navigate = useNavigate();
  const { networkTemplateId, templateId } = useParams();
  const isNetworkPreview = Boolean(networkTemplateId);
  const isStarterPresetPreview = Boolean(templateId && isStarterGithubTemplateId(templateId));
  const isReadOnlyPreview = isNetworkPreview || isStarterPresetPreview;
  const templateRecord =
    templateId && isStarterGithubTemplateId(templateId)
      ? getStarterGithubTemplateRecord(templateId) ?? starterGithubTemplateRecord
      : templates.find((item) => item.id === templateId) ?? starterGithubTemplateRecord;
  const {
    layout,
    activeScreen,
    addScreen,
    blocksByRegion,
    setActiveScreen,
    toggleBlockVisibility,
    updateBlock,
    updateBlockProps,
    updateBlockTypeProps,
    moveBlock,
    moveBlockToRegion,
    replaceLayout,
  } = useTemplateLayout(defaultGithubTemplate);
  const [selectedBlockId, setSelectedBlockId] = useState('');
  const [canvasZoom, setCanvasZoom] = useState(1);
  const [columnLayout, setColumnLayout] = useState<TemplateColumnLayout>(DEFAULT_COLUMN_LAYOUT);
  const [leftSidebarResizeEnabled, setLeftSidebarResizeEnabled] = useState(true);
  const [selectedVariationId, setSelectedVariationId] = useState<TemplateVariationId>('github-default');
  const [pageAppearance, setPageAppearance] = useState<Record<string, unknown>>({});
  const [syncStatus, setSyncStatus] = useState('Not synced');
  const [networkRecord, setNetworkRecord] = useState<TemplateRecord | null>(null);
  const [importDialogOpen, setImportDialogOpen] = useState(false);
  const [importTemplateName, setImportTemplateName] = useState('');
  const [resetSnapshot, setResetSnapshot] = useState<TemplateResetSnapshot>(() =>
    getTemplateResetSnapshot(defaultGithubTemplate),
  );
  const [blockStyleMenu, setBlockStyleMenu] = useState<{ blockId: string; x: number; y: number } | null>(null);
  const [pageStyleMenu, setPageStyleMenu] = useState<{ x: number; y: number } | null>(null);
  const canvasShellRef = useRef<HTMLElement | null>(null);
  const styleMenuRef = useRef<HTMLDivElement | null>(null);
  const styleMenuBlock = blockStyleMenu
    ? layout.blocks.find((block) => block.id === blockStyleMenu.blockId)
    : null;

  const applyTemplateState = (template: TemplateLayout & Partial<ExtensionTemplatePayload>) => {
    const snapshot = getTemplateResetSnapshot(template);

    replaceLayout(snapshot.layout);
    setColumnLayout(snapshot.columnLayout);
    setLeftSidebarResizeEnabled(snapshot.leftSidebarResizeEnabled);
    setSelectedVariationId(snapshot.selectedVariationId);
    setPageAppearance(snapshot.pageAppearance);
    setResetSnapshot(snapshot);
  };

  useEffect(() => {
    if (selectedBlockId && !layout.blocks.some((block) => block.id === selectedBlockId)) {
      setSelectedBlockId(layout.blocks[0]?.id ?? '');
    }
  }, [layout.blocks, selectedBlockId]);

  useEffect(() => {
    if (!blockStyleMenu && !pageStyleMenu) {
      return undefined;
    }

    const closeStyleMenus = () => {
      setBlockStyleMenu(null);
      setPageStyleMenu(null);
    };

    const handlePointerDown = (event: PointerEvent) => {
      if (styleMenuRef.current?.contains(event.target as Node)) {
        return;
      }

      closeStyleMenus();
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        closeStyleMenus();
      }
    };

    document.addEventListener('pointerdown', handlePointerDown, true);
    document.addEventListener('keydown', handleKeyDown);

    return () => {
      document.removeEventListener('pointerdown', handlePointerDown, true);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [blockStyleMenu, pageStyleMenu]);

  useEffect(() => {
    if (networkTemplateId) {
      let cancelled = false;

      apiGet<NetworkTemplateResponse>(`/api/templates/network/${encodeURIComponent(networkTemplateId)}`)
        .then((result) => {
          if (cancelled) {
            return;
          }

          setNetworkRecord(result.record);
          applyTemplateState(result.template);
          setSyncStatus('Network preview');

          apiPost<NetworkMetricResponse>(
            `/api/templates/network/${encodeURIComponent(networkTemplateId)}/view`,
            {},
          )
            .then((viewResult) => {
              if (!cancelled) {
                setNetworkRecord(viewResult.template);
              }
            })
            .catch(() => {
              if (!cancelled) {
                setSyncStatus('View count unavailable');
              }
            });
        })
        .catch(() => {
          if (!cancelled) {
            setSyncStatus('Network template unavailable');
          }
        });

      return () => {
        cancelled = true;
      };
    }

    if (!templateId) {
      return;
    }

    if (templateId === defaultGithubTemplate.id) {
      applyTemplateState(defaultGithubTemplate);
      setSyncStatus('Loaded default template');
      return;
    }

    const starterTemplate = getStarterGithubTemplate(templateId);

    if (starterTemplate) {
      applyTemplateState(starterTemplate);
      setSyncStatus('Loaded starter preset');
      return;
    }

    let cancelled = false;

    apiGet<ExtensionTemplatePayload>(`/api/templates/${encodeURIComponent(templateId)}`)
      .then((template) => {
        if (cancelled) {
          return;
        }

        applyTemplateState(template);
        setSyncStatus('Loaded saved template');
      })
      .catch(() => {
        if (!cancelled) {
          const fallbackTemplate = createEditableFallbackTemplate(templateId, templateRecord.name);

          applyTemplateState(fallbackTemplate);
          setSyncStatus('Using editable local fallback');
        }
      });

    return () => {
      cancelled = true;
    };
  }, [networkTemplateId, replaceLayout, templateId, templateRecord.name]);

  const visibleCount = useMemo(
    () =>
      layout.blocks.filter(
        (block) =>
          block.visible && (block.screenId ?? layout.screens[0]?.id ?? layout.activeScreenId) === layout.activeScreenId,
      ).length,
    [layout.activeScreenId, layout.blocks, layout.screens],
  );

  const serializedTemplateState = useMemo(
    () =>
      JSON.stringify(
        {
          ...layout,
          columnLayout,
          leftSidebarResizeEnabled,
          selectedVariationId,
          pageAppearance,
        },
        null,
        2,
      ),
    [layout, columnLayout, leftSidebarResizeEnabled, selectedVariationId, pageAppearance],
  );

  const handleReset = () => {
    replaceLayout(resetSnapshot.layout);
    setSelectedBlockId('');
    setColumnLayout(resetSnapshot.columnLayout);
    setLeftSidebarResizeEnabled(resetSnapshot.leftSidebarResizeEnabled);
    setSelectedVariationId(resetSnapshot.selectedVariationId);
    setPageAppearance(resetSnapshot.pageAppearance);
    setSyncStatus('Reset to loaded draft');
  };

  const openImportDialog = () => {
    setImportTemplateName(`${layout.name} Imported`);
    setImportDialogOpen(true);
  };

  const handleAddScreen = (screen: TemplateScreen, blocks: TemplateBlock[]) => {
    addScreen(screen, blocks);
    setSelectedBlockId('');
    setBlockStyleMenu(null);
    setPageStyleMenu(null);
    setSyncStatus(layout.screens.some((item) => item.id === screen.id) ? 'Opened existing page' : 'Added page');
  };

  const handleImportNetworkTemplate = async (event?: FormEvent<HTMLFormElement>) => {
    event?.preventDefault();

    if (!networkTemplateId) {
      return;
    }

    const nextName = importTemplateName.trim();

    if (nextName.length < 2) {
      setSyncStatus('Template name must be at least 2 characters');
      return;
    }

    setSyncStatus('Importing...');

    try {
      const result = await apiPost<ImportNetworkTemplateResponse>(
        `/api/templates/network/${encodeURIComponent(networkTemplateId)}/import`,
        { name: nextName },
      );

      setImportDialogOpen(false);
      setSyncStatus('Imported');
      navigate(`/templates/${result.template.id}`);
    } catch (error) {
      setSyncStatus(error instanceof Error ? error.message : 'Import failed');
    }
  };

  const handleSyncTemplate = async () => {
    if (isNetworkPreview) {
      openImportDialog();
      return;
    }

    if (isStarterPresetPreview) {
      setSyncStatus('Copying starter template...');

      try {
        const result = await apiPost<SaveTemplateResponse>(
          '/api/templates/github-home',
          createStarterCopyTemplate({
            ...layout,
            columnLayout,
            leftSidebarResizeEnabled,
            selectedVariationId,
            pageAppearance,
          }),
        );

        setSyncStatus('Copied to workspace');
        navigate(`/templates/${result.template.id}`);
      } catch {
        setSyncStatus('Backend unavailable');
      }

      return;
    }

    if (templateId === defaultGithubTemplate.id) {
      setSyncStatus('Create a named template before saving');
      return;
    }

    setSyncStatus('Syncing...');

    try {
      const result = await apiPost<SaveTemplateResponse>(
        '/api/templates/github-home',
        JSON.parse(serializedTemplateState),
      );

      setResetSnapshot(getTemplateResetSnapshot(result.template));
      setSyncStatus('Synced to localhost:8787');
    } catch {
      setSyncStatus('Backend unavailable');
    }
  };

  const updateCanvasZoom = (nextZoom: number) => {
    setCanvasZoom(clampCanvasZoom(nextZoom));
  };

  const handleCanvasWheel = (event: WheelEvent<HTMLElement>) => {
    event.preventDefault();
    event.stopPropagation();

    if (event.ctrlKey || event.metaKey) {
      const shell = event.currentTarget;
      const rect = shell.getBoundingClientRect();
      const pointerX = event.clientX - rect.left + shell.scrollLeft;
      const pointerY = event.clientY - rect.top + shell.scrollTop;
      const direction = event.deltaY > 0 ? -1 : 1;
      const nextZoom = clampCanvasZoom(canvasZoom + direction * CANVAS_ZOOM_STEP);

      if (nextZoom === canvasZoom) {
        return;
      }

      const zoomRatio = nextZoom / canvasZoom;
      setCanvasZoom(nextZoom);

      requestAnimationFrame(() => {
        shell.scrollLeft = pointerX * zoomRatio - (event.clientX - rect.left);
        shell.scrollTop = pointerY * zoomRatio - (event.clientY - rect.top);
      });

      return;
    }

    if (event.shiftKey) {
      const dominantDelta = Math.abs(event.deltaY) >= Math.abs(event.deltaX) ? event.deltaY : event.deltaX;
      event.currentTarget.scrollLeft += dominantDelta;
      return;
    }

    event.currentTarget.scrollLeft += event.deltaX;
    event.currentTarget.scrollTop += event.deltaY;
  };

  const handleToggleNetworkLike = async () => {
    if (!networkTemplateId || !networkRecord) {
      return;
    }

    const nextLiked = !networkRecord.likedByCurrentUser;
    setNetworkRecord({
      ...networkRecord,
      likedByCurrentUser: nextLiked,
      likeCount: Math.max(0, (networkRecord.likeCount ?? 0) + (nextLiked ? 1 : -1)),
    });

    try {
      const result = await apiPost<NetworkMetricResponse>(
        `/api/templates/network/${encodeURIComponent(networkTemplateId)}/like`,
        { liked: nextLiked },
      );

      setNetworkRecord(result.template);
    } catch {
      setNetworkRecord(networkRecord);
      setSyncStatus('Like failed');
    }
  };

  const handleOpenBlockStyleMenu = (blockId: string, x: number, y: number) => {
    if (isReadOnlyPreview) {
      return;
    }

    const menuPosition = getCanvasMenuPosition(x, y);

    setSelectedBlockId(blockId);
    setPageStyleMenu(null);
    setBlockStyleMenu({ blockId, ...menuPosition });
  };

  const handleOpenPageStyleMenu = (x: number, y: number) => {
    if (isReadOnlyPreview) {
      return;
    }

    const menuPosition = getCanvasMenuPosition(x, y);

    setBlockStyleMenu(null);
    setPageStyleMenu(menuPosition);
  };

  const getCanvasMenuPosition = (clientX: number, clientY: number) => {
    const shell = canvasShellRef.current;

    if (!shell) {
      return { x: clientX, y: clientY };
    }

    const rect = shell.getBoundingClientRect();
    const rawX = clientX - rect.left + shell.scrollLeft;
    const rawY = clientY - rect.top + shell.scrollTop;
    const minX = shell.scrollLeft + STYLE_MENU_VISIBLE_GUTTER;
    const maxX = shell.scrollLeft + shell.clientWidth - STYLE_MENU_WIDTH - STYLE_MENU_VISIBLE_GUTTER;
    const minY = shell.scrollTop + STYLE_MENU_VISIBLE_GUTTER;
    const maxY = shell.scrollTop + shell.clientHeight - STYLE_MENU_VISIBLE_GUTTER;

    return {
      x: clampMenuCoordinate(rawX, minX, maxX),
      y: clampMenuCoordinate(rawY, minY, maxY),
    };
  };

  const handleUpdateBlockAppearance = (block: TemplateBlock, appearance: Record<string, unknown>) => {
    if (isReadOnlyPreview) {
      return;
    }

    updateBlockTypeProps(block.type, {
      appearance: {
        ...(typeof block.props.appearance === 'object' && block.props.appearance !== null && !Array.isArray(block.props.appearance)
          ? block.props.appearance
          : {}),
        ...appearance,
      },
    });
  };

  const handleUpdatePageAppearance = (appearance: Record<string, unknown>) => {
    if (isReadOnlyPreview) {
      return;
    }

    setPageAppearance((current) => ({
      ...current,
      ...appearance,
    }));
  };

  const handleApplyQuickTheme = (themeId: QuickThemeId) => {
    if (isReadOnlyPreview) {
      return;
    }

    const themes: Record<QuickThemeId, {
      page: Record<string, unknown>;
      topbar: Record<string, unknown>;
      panel: Record<string, unknown>;
      panelSoft: Record<string, unknown>;
      main: Record<string, unknown>;
    }> = {
      'github-light': {
        page: {
          backgroundColor: '#f6f8fa',
          leftSidebarBackgroundColor: '#ffffff',
          backgroundImageUrl: '',
          backgroundImageName: '',
        },
        topbar: {
          backgroundColor: '#24292f',
          innerBackgroundColor: '#32383f',
          textColor: '#f0f6fc',
          linkColor: '#ffffff',
          borderRadius: 0,
          padding: 12,
          elementGap: 10,
          fontSize: 13,
        },
        panel: {
          backgroundColor: '#ffffff',
          innerBackgroundColor: '#f6f8fa',
          textColor: '#24292f',
          linkColor: '#0969da',
          mutedTextColor: '#57606a',
          borderRadius: 8,
          padding: 12,
          elementGap: 8,
          fontSize: 14,
        },
        panelSoft: {
          backgroundColor: '#ffffff',
          innerBackgroundColor: '#f6f8fa',
          textColor: '#24292f',
          linkColor: '#0969da',
          mutedTextColor: '#57606a',
          borderRadius: 10,
          padding: 14,
          elementGap: 10,
          fontSize: 14,
        },
        main: {
          backgroundColor: '#f6f8fa',
          innerBackgroundColor: '#ffffff',
          textColor: '#24292f',
          linkColor: '#0969da',
          mutedTextColor: '#57606a',
          borderRadius: 10,
          padding: 14,
          elementGap: 12,
          fontSize: 14,
        },
      },
      'polished-blue': {
        page: { backgroundColor: '#0b1120', leftSidebarBackgroundColor: '#0f172a', backgroundImageUrl: '', backgroundImageName: '' },
        topbar: { backgroundColor: '#101827', innerBackgroundColor: '#172033', textColor: '#e5edf7', linkColor: '#f8fbff', borderRadius: 0, padding: 12, elementGap: 10, fontSize: 13 },
        panel: { backgroundColor: '#172033', innerBackgroundColor: '#22304a', textColor: '#e5edf7', linkColor: '#f8fbff', mutedTextColor: '#a9b8cf', borderRadius: 14, padding: 16, elementGap: 10, fontSize: 14 },
        panelSoft: { backgroundColor: '#22304a', innerBackgroundColor: '#101827', textColor: '#e5edf7', linkColor: '#f8fbff', mutedTextColor: '#a9b8cf', borderRadius: 18, padding: 18, elementGap: 12, fontSize: 15 },
        main: { backgroundColor: '#111827', innerBackgroundColor: '#1f2937', textColor: '#e5edf7', linkColor: '#f8fbff', mutedTextColor: '#a9b8cf', borderRadius: 16, padding: 16, elementGap: 14, fontSize: 14 },
      },
      'polished-green': {
        page: { backgroundColor: '#0d1b16', leftSidebarBackgroundColor: '#10261f', backgroundImageUrl: '', backgroundImageName: '' },
        topbar: { backgroundColor: '#10231c', innerBackgroundColor: '#183329', textColor: '#e4f7ec', linkColor: '#f7fffb', borderRadius: 0, padding: 12, elementGap: 10, fontSize: 13 },
        panel: { backgroundColor: '#183329', innerBackgroundColor: '#25483b', textColor: '#e4f7ec', linkColor: '#f7fffb', mutedTextColor: '#a8c8b8', borderRadius: 14, padding: 16, elementGap: 10, fontSize: 14 },
        panelSoft: { backgroundColor: '#25483b', innerBackgroundColor: '#10231c', textColor: '#e4f7ec', linkColor: '#f7fffb', mutedTextColor: '#a8c8b8', borderRadius: 18, padding: 18, elementGap: 12, fontSize: 15 },
        main: { backgroundColor: '#142820', innerBackgroundColor: '#203c31', textColor: '#e4f7ec', linkColor: '#f7fffb', mutedTextColor: '#a8c8b8', borderRadius: 16, padding: 16, elementGap: 14, fontSize: 14 },
      },
      'polished-red': {
        page: { backgroundColor: '#1f1113', leftSidebarBackgroundColor: '#2a171a', backgroundImageUrl: '', backgroundImageName: '' },
        topbar: { backgroundColor: '#2a171a', innerBackgroundColor: '#3a2024', textColor: '#ffe7eb', linkColor: '#fff8f9', borderRadius: 0, padding: 12, elementGap: 10, fontSize: 13 },
        panel: { backgroundColor: '#3a2024', innerBackgroundColor: '#553239', textColor: '#ffe7eb', linkColor: '#fff8f9', mutedTextColor: '#e0aeb8', borderRadius: 14, padding: 16, elementGap: 10, fontSize: 14 },
        panelSoft: { backgroundColor: '#553239', innerBackgroundColor: '#2a171a', textColor: '#ffe7eb', linkColor: '#fff8f9', mutedTextColor: '#e0aeb8', borderRadius: 18, padding: 18, elementGap: 12, fontSize: 15 },
        main: { backgroundColor: '#2c181c', innerBackgroundColor: '#44272d', textColor: '#ffe7eb', linkColor: '#fff8f9', mutedTextColor: '#e0aeb8', borderRadius: 16, padding: 16, elementGap: 14, fontSize: 14 },
      },
    };
    const theme = themes[themeId];

    setPageAppearance((current) => ({ ...current, ...theme.page }));
    updateBlockTypeProps('top-nav', { appearance: theme.topbar });
    updateBlockTypeProps('profile-summary', { appearance: theme.panel });
    updateBlockTypeProps('recent-repos', { appearance: theme.panel });
    updateBlockTypeProps('copilot-prompt', { appearance: theme.panelSoft });
    updateBlockTypeProps('activity-feed', { appearance: theme.main });
    updateBlockTypeProps('repo-updates', { appearance: theme.panel });
    updateBlockTypeProps('pinned-repos', { appearance: theme.panel });
    updateBlockTypeProps('issue-pr-updates', { appearance: theme.panel });
    updateBlockTypeProps('trending-repos', { appearance: theme.panel });
    updateBlockTypeProps('recommended-repos', { appearance: theme.panel });
    updateBlockTypeProps('profile-sidebar', { appearance: theme.panel });
    updateBlockTypeProps('profile-readme', { appearance: theme.main });
    updateBlockTypeProps('profile-pinned-repos', { appearance: theme.panel });
    updateBlockTypeProps('profile-contributions', { appearance: theme.main });
    setSyncStatus('Applied quick theme');
  };

  return (
    <div className="editor-page template-builder-page">
      <AppTopNav
        active={isNetworkPreview ? 'network' : 'templates'}
        actionLabel={isNetworkPreview ? 'Import Template' : isStarterPresetPreview ? 'Copy Template' : 'Save Draft'}
        actionStatus={syncStatus}
        searchPlaceholder="Search blocks..."
        onActionClick={handleSyncTemplate}
      />

      <main
        className={[
          'template-builder-main',
          isStarterPresetPreview ? 'template-builder-main--preview' : '',
        ].join(' ').trim()}
      >
        <aside className="template-builder-rail">
          <div className="template-builder-rail__workspace">
            <div className="template-builder-rail__icon">
              <Icon name="dashboard_customize" />
            </div>
            <div>
              <strong>{layout.name}</strong>
              <span>{layout.metadata.browserMappingKey}</span>
            </div>
          </div>

          <section className="template-builder-rail__section">
            <p>Source Template</p>
            <div className="source-template-card">
              <strong>{isNetworkPreview ? networkRecord?.name ?? templateRecord.name : layout.name}</strong>
              <span>{isNetworkPreview ? networkRecord?.owner ?? templateRecord.owner : 'Personal Workspace'}</span>
            </div>
          </section>

          <section className="template-builder-rail__section">
            <p>Screens</p>
            <div className="screen-list">
              {layout.screens.map((screen) => (
                <button
                  className={screen.id === layout.activeScreenId ? 'is-active' : ''}
                  key={screen.id}
                  type="button"
                  onClick={() => {
                    setActiveScreen(screen.id);
                    setSelectedBlockId('');
                  }}
                >
                  <Icon name="web_asset" />
                  <span>{screen.name}</span>
                  <em>{screen.providerRoute}</em>
                </button>
              ))}
            </div>
            {!isStarterPresetPreview ? (
              <div className="screen-add-list" aria-label="Add template page">
                {addableScreenPresets.map(({ screen, blocks }) => {
                  const exists = layout.screens.some((item) => item.id === screen.id);

                  return (
                    <button
                      className={exists ? 'is-added' : ''}
                      key={screen.id}
                      type="button"
                      onClick={() => handleAddScreen(screen, blocks)}
                    >
                      <Icon name={exists ? 'check_circle' : 'add_circle'} />
                      <span>{exists ? `Open ${screen.name}` : `Add ${screen.name}`}</span>
                    </button>
                  );
                })}
              </div>
            ) : null}
          </section>

          <section className="template-builder-rail__section">
            <p>Regions</p>
            <div className="region-list">
              {layout.regions.map((region) => {
                const blocks = blocksByRegion[region];
                const enabledBlocks = blocks.filter((block) => block.visible).length;

                return (
                  <button key={region} type="button">
                    <Icon name={regionIcons[region]} />
                    <span>{regionLabels[region]}</span>
                    <em>
                      {enabledBlocks}/{blocks.length}
                    </em>
                  </button>
                );
              })}
            </div>
          </section>

          <section className="template-builder-rail__section">
            <p>State</p>
            <div className="layout-state-summary">
              <span>
                {isNetworkPreview
                  ? 'Read-only Network preview'
                  : isStarterPresetPreview
                    ? 'Read-only starter preset'
                    : layout.source === 'user'
                      ? 'Draft edited'
                      : 'Default loaded'}
              </span>
              <strong>{visibleCount} visible blocks</strong>
            </div>
          </section>
        </aside>

        <section
          className="template-builder-canvas-shell"
          onClick={(event) => {
            if (
              event.target instanceof Element &&
              event.target.closest('.template-screen-frame, .block-style-menu, .template-canvas-controls')
            ) {
              return;
            }

            setSelectedBlockId('');
            setBlockStyleMenu(null);
            setPageStyleMenu(null);
          }}
          onWheel={handleCanvasWheel}
          ref={canvasShellRef}
        >
          <div className="template-builder-canvas-header">
            <div>
              <span>{activeScreen?.providerRoute ?? layout.metadata.browserMappingKey}</span>
              <h1>{activeScreen?.description ?? layout.description}</h1>
            </div>
            <div className="template-builder-canvas-header__meta">
              <span>{activeScreen?.name ?? 'Screen'}</span>
              <span>v{layout.version}</span>
            </div>
          </div>

          <div
            className="template-canvas-zoom-layer"
            style={{ '--template-canvas-zoom': canvasZoom } as CSSProperties}
          >
            <TemplateLayoutCanvas
              blocksByRegion={blocksByRegion}
              columnLayout={columnLayout}
              onOpenBlockMenu={handleOpenBlockStyleMenu}
              onOpenPageMenu={handleOpenPageStyleMenu}
              onMoveBlock={moveBlock}
              onMoveBlockToRegion={moveBlockToRegion}
              onSelectBlock={setSelectedBlockId}
              onToggleBlock={toggleBlockVisibility}
              pageAppearance={pageAppearance}
              readOnly={isReadOnlyPreview}
              screen={activeScreen}
              selectedBlockId={selectedBlockId}
              variationId={selectedVariationId}
            />
          </div>

          {blockStyleMenu && styleMenuBlock ? (
            <div
              className="block-style-menu"
              ref={styleMenuRef}
              style={{ left: blockStyleMenu.x, top: blockStyleMenu.y } as CSSProperties}
            >
              <div className="block-style-menu__header">
                <span>Style</span>
                <strong>{styleMenuBlock.title}</strong>
                <button aria-label="Close style menu" type="button" onClick={() => setBlockStyleMenu(null)}>
                  <Icon name="close" />
                </button>
              </div>
              <p>Applied to matching {styleMenuBlock.type} blocks.</p>
              <BlockStyleMenuControls
                block={styleMenuBlock}
                onChange={(appearance) => handleUpdateBlockAppearance(styleMenuBlock, appearance)}
              />
            </div>
          ) : null}

          {pageStyleMenu ? (
            <div
              className="block-style-menu block-style-menu--page"
              ref={styleMenuRef}
              style={{ left: pageStyleMenu.x, top: pageStyleMenu.y } as CSSProperties}
            >
              <div className="block-style-menu__header">
                <span>Page Style</span>
                <strong>GitHub Home background</strong>
                <button aria-label="Close page style menu" type="button" onClick={() => setPageStyleMenu(null)}>
                  <Icon name="close" />
                </button>
              </div>
              <p>Applied to the GitHub Home page background.</p>
              <PageStyleMenuControls pageAppearance={pageAppearance} onChange={handleUpdatePageAppearance} />
            </div>
          ) : null}

          <div className="template-canvas-controls" aria-label="Canvas controls">
            <button
              aria-label="Zoom out"
              type="button"
              onClick={() => updateCanvasZoom(canvasZoom - CANVAS_ZOOM_STEP)}
            >
              <Icon name="zoom_out" />
            </button>
            <strong>{Math.round(canvasZoom * 100)}%</strong>
            <button
              aria-label="Zoom in"
              type="button"
              onClick={() => updateCanvasZoom(canvasZoom + CANVAS_ZOOM_STEP)}
            >
              <Icon name="zoom_in" />
            </button>
            <span aria-hidden="true" />
            <button aria-label="Reset zoom" type="button" onClick={() => updateCanvasZoom(1)}>
              <Icon name="restart_alt" />
            </button>
          </div>
        </section>

        {isNetworkPreview ? (
          <NetworkCommunityPanel
            layout={layout}
            record={networkRecord}
            variationId={selectedVariationId}
            visibleCount={visibleCount}
            onImport={openImportDialog}
            onToggleLike={handleToggleNetworkLike}
          />
        ) : isStarterPresetPreview ? null : (
          <TemplateEditPanel
            layout={layout}
            columnLayout={columnLayout}
            leftSidebarResizeEnabled={leftSidebarResizeEnabled}
            onChangeColumnLayout={setColumnLayout}
            onMoveBlock={moveBlock}
            onReset={handleReset}
            onSelectBlock={setSelectedBlockId}
            onSelectVariation={setSelectedVariationId}
            onUpdateBlock={updateBlock}
            onUpdateBlockProps={updateBlockProps}
            onApplyQuickTheme={handleApplyQuickTheme}
            onToggleLeftSidebarResize={() => setLeftSidebarResizeEnabled((enabled) => !enabled)}
            onToggleBlock={toggleBlockVisibility}
            readOnly={isStarterPresetPreview}
            selectedBlockId={selectedBlockId}
            selectedVariationId={selectedVariationId}
            serializedLayout={serializedTemplateState}
            variations={githubSafeVariations}
          />
        )}
      </main>

      {isNetworkPreview && importDialogOpen ? (
        <div className="create-template-dialog" role="dialog" aria-modal="true" aria-labelledby="import-template-title">
          <form className="create-template-dialog__panel" onSubmit={handleImportNetworkTemplate}>
            <div className="create-template-dialog__header">
              <div className="template-add-card__icon">
                <Icon name="archive" />
              </div>
              <div>
                <strong id="import-template-title">Import Network Template</strong>
                <span>Name the copy that will be saved in your workspace.</span>
              </div>
              <button aria-label="Close import dialog" type="button" onClick={() => setImportDialogOpen(false)}>
                <Icon name="close" />
              </button>
            </div>
            <label>
              <span>Template title</span>
              <input
                autoFocus
                type="text"
                value={importTemplateName}
                onChange={(event) => setImportTemplateName(event.target.value)}
              />
            </label>
            <div className="create-template-dialog__actions">
              <span>{syncStatus}</span>
              <button type="button" onClick={() => setImportDialogOpen(false)}>
                Cancel
              </button>
              <button type="submit">Import</button>
            </div>
          </form>
        </div>
      ) : null}
    </div>
  );
}

function NetworkCommunityPanel({
  layout,
  record,
  variationId,
  visibleCount,
  onImport,
  onToggleLike,
}: {
  layout: TemplateLayout;
  record: TemplateRecord | null;
  variationId: TemplateVariationId;
  visibleCount: number;
  onImport: () => void;
  onToggleLike: () => void;
}) {
  const liked = Boolean(record?.likedByCurrentUser);
  const likeCount = record?.likeCount ?? 0;
  const viewCount = record?.viewCount ?? 0;
  const importCount = record?.importCount ?? 0;

  return (
    <aside className="network-community-panel">
      <div className="network-community-panel__header">
        <span>Network Template</span>
        <strong>{record?.name ?? layout.name}</strong>
        <p>{record?.description ?? layout.description}</p>
      </div>

      <section className="network-community-panel__section">
        <p>Community</p>
        <div className="network-stat-grid">
          <div>
            <Icon name="star" />
            <strong>{likeCount}</strong>
            <span>Likes</span>
          </div>
          <div>
            <Icon name="visibility" />
            <strong>{viewCount}</strong>
            <span>Views</span>
          </div>
          <div>
            <Icon name="content_copy" />
            <strong>{importCount}</strong>
            <span>Imports</span>
          </div>
        </div>
      </section>

      <section className="network-community-panel__section">
        <p>Actions</p>
        <div className="network-action-row">
          <button className={liked ? 'is-active' : ''} type="button" onClick={onToggleLike}>
            <Icon name="star" />
            <span>{liked ? 'Liked' : 'Like'}</span>
          </button>
          <button type="button" onClick={onImport}>
            <Icon name="content_copy" />
            <span>Import</span>
          </button>
        </div>
      </section>

      <section className="network-community-panel__section">
        <p>Publisher</p>
        <div className="network-publisher-card">
          <div>{(record?.publisherName ?? record?.owner ?? 'R').slice(0, 1).toUpperCase()}</div>
          <span>
            <strong>{record?.publisherName ?? record?.owner ?? 'Reflow Network'}</strong>
            <em>{formatPublishedDate(record?.publishedAt)}</em>
          </span>
        </div>
      </section>

      <section className="network-community-panel__section">
        <p>Template Signals</p>
        <div className="network-signal-list">
          <span>
            <strong>{visibleCount}</strong>
            visible blocks
          </span>
          <span>
            <strong>{variationId}</strong>
            variation
          </span>
          <span>
            <strong>{layout.metadata.browserMappingKey}</strong>
            mapping
          </span>
        </div>
      </section>
    </aside>
  );
}

function getAppearanceValue(block: TemplateBlock, key: string, fallback: string | number) {
  const appearance = block.props.appearance;

  if (!appearance || typeof appearance !== 'object' || Array.isArray(appearance)) {
    return fallback;
  }

  const value = (appearance as Record<string, unknown>)[key];

  if (typeof fallback === 'number') {
    const numericValue = Number(value);

    return Number.isFinite(numericValue) ? numericValue : fallback;
  }

  return typeof value === 'string' ? value : fallback;
}

function BlockStyleMenuControls({
  block,
  onChange,
}: {
  block: TemplateBlock;
  onChange: (appearance: Record<string, unknown>) => void;
}) {
  const backgroundColor = getAppearanceValue(block, 'backgroundColor', '#ffffff') as string;
  const innerBackgroundColor = getAppearanceValue(block, 'innerBackgroundColor', '#ffffff') as string;
  const textColor = getAppearanceValue(block, 'textColor', '#1f2328') as string;
  const linkColor = getAppearanceValue(block, 'linkColor', '#0969da') as string;
  const marginY = getAppearanceValue(block, 'marginY', 0) as number;
  const padding = getAppearanceValue(block, 'padding', 0) as number;
  const elementGap = getAppearanceValue(block, 'elementGap', 8) as number;
  const borderRadius = getAppearanceValue(block, 'borderRadius', 6) as number;
  const fontFamily = getAppearanceValue(block, 'fontFamily', '-apple-system, BlinkMacSystemFont, Segoe UI, sans-serif') as string;
  const fontSize = getAppearanceValue(block, 'fontSize', 14) as number;

  return (
    <div className="block-style-menu__controls">
      <label>
        <span>Outer bg</span>
        <input
          type="color"
          value={backgroundColor}
          onChange={(event) => onChange({ backgroundColor: event.target.value })}
        />
      </label>
      <label>
        <span>Inner bg</span>
        <input
          type="color"
          value={innerBackgroundColor}
          onChange={(event) => onChange({ innerBackgroundColor: event.target.value })}
        />
      </label>
      <label>
        <span>Text</span>
        <input
          type="color"
          value={textColor}
          onChange={(event) => onChange({ textColor: event.target.value })}
        />
      </label>
      <label>
        <span>Link</span>
        <input
          type="color"
          value={linkColor}
          onChange={(event) => onChange({ linkColor: event.target.value })}
        />
      </label>
      <label>
        <span>Margin</span>
        <input
          max={48}
          min={0}
          type="number"
          value={marginY}
          onChange={(event) => onChange({ marginY: Math.max(0, Math.min(48, Number(event.target.value) || 0)) })}
        />
      </label>
      <label>
        <span>Padding</span>
        <input
          max={48}
          min={0}
          type="number"
          value={padding}
          onChange={(event) => onChange({ padding: Math.max(0, Math.min(48, Number(event.target.value) || 0)) })}
        />
      </label>
      <label>
        <span>Gap</span>
        <input
          max={32}
          min={0}
          type="number"
          value={elementGap}
          onChange={(event) => onChange({ elementGap: Math.max(0, Math.min(32, Number(event.target.value) || 0)) })}
        />
      </label>
      <label>
        <span>Round</span>
        <input
          max={32}
          min={0}
          type="number"
          value={borderRadius}
          onChange={(event) => onChange({ borderRadius: Math.max(0, Math.min(32, Number(event.target.value) || 0)) })}
        />
      </label>
      <label>
        <span>Font</span>
        <select value={fontFamily} onChange={(event) => onChange({ fontFamily: event.target.value })}>
          <option value="-apple-system, BlinkMacSystemFont, Segoe UI, sans-serif">System</option>
          <option value="Arial, sans-serif">Arial</option>
          <option value="Georgia, serif">Georgia</option>
          <option value="ui-monospace, SFMono-Regular, Menlo, monospace">Mono</option>
        </select>
      </label>
      <label>
        <span>Font size</span>
        <input
          max={24}
          min={10}
          type="number"
          value={fontSize}
          onChange={(event) => onChange({ fontSize: Math.max(10, Math.min(24, Number(event.target.value) || 14)) })}
        />
      </label>
    </div>
  );
}

type BackgroundEditorDragMode = 'move' | 'resize';

interface BackgroundEditorDragState {
  mode: BackgroundEditorDragMode;
  pointerId: number;
  startPoint: { x: number; y: number };
  startOrigin: { x: number; y: number };
  startWidth: number;
}

function clampNumber(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

function getFramePoint(event: PointerEvent<HTMLElement>, stageElement: HTMLDivElement | null) {
  if (!stageElement) {
    return { x: 0, y: 0 };
  }

  const rect = stageElement.getBoundingClientRect();

  return {
    x: ((event.clientX - rect.left) / rect.width) * BACKGROUND_EDITOR_FRAME_WIDTH,
    y: ((event.clientY - rect.top) / rect.height) * BACKGROUND_EDITOR_FRAME_HEIGHT,
  };
}

function getImageSizeWidth(backgroundImageSize: string) {
  const match = backgroundImageSize.match(/^(\d+)px\s+auto$/);

  return match ? Number(match[1]) : 360;
}

function getImageOriginFromPosition(position: string, imageWidth: number, imageHeight: number) {
  const pixelMatch = position.match(/^(-?\d+(?:\.\d+)?)px\s+(-?\d+(?:\.\d+)?)px$/);

  if (pixelMatch) {
    return {
      x: Number(pixelMatch[1]),
      y: Number(pixelMatch[2]),
    };
  }

  const percentMatch = position.match(/^(-?\d+(?:\.\d+)?)%\s+(-?\d+(?:\.\d+)?)%$/);

  if (percentMatch) {
    return {
      x: ((BACKGROUND_EDITOR_FRAME_WIDTH - imageWidth) * Number(percentMatch[1])) / 100,
      y: ((BACKGROUND_EDITOR_FRAME_HEIGHT - imageHeight) * Number(percentMatch[2])) / 100,
    };
  }

  const tokens = position.split(/\s+/);
  const horizontal = tokens.find((token) => ['left', 'center', 'right'].includes(token)) ?? 'right';
  const vertical = tokens.find((token) => ['top', 'center', 'bottom'].includes(token)) ?? 'top';
  const x =
    horizontal === 'left'
      ? 0
      : horizontal === 'center'
        ? (BACKGROUND_EDITOR_FRAME_WIDTH - imageWidth) / 2
        : BACKGROUND_EDITOR_FRAME_WIDTH - imageWidth;
  const y =
    vertical === 'top'
      ? 0
      : vertical === 'center'
        ? (BACKGROUND_EDITOR_FRAME_HEIGHT - imageHeight) / 2
        : BACKGROUND_EDITOR_FRAME_HEIGHT - imageHeight;

  return { x, y };
}

function isSupportedImageFile(file: File) {
  if (file.type.startsWith('image/')) {
    return true;
  }

  return /\.(avif|gif|jpe?g|png|svg|webp)$/i.test(file.name);
}

function readFileAsDataUrl(file: File) {
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = () => {
      if (typeof reader.result === 'string') {
        resolve(reader.result);
        return;
      }

      reject(new Error('Image file could not be read.'));
    };
    reader.onerror = () => reject(new Error('Image file could not be read.'));
    reader.readAsDataURL(file);
  });
}

function readImageMetrics(imageUrl: string) {
  return new Promise<{ naturalWidth: number; naturalHeight: number; image: HTMLImageElement }>((resolve, reject) => {
    const image = new Image();

    image.onload = () => resolve({ naturalWidth: image.naturalWidth, naturalHeight: image.naturalHeight, image });
    image.onerror = () => reject(new Error('Image file could not be loaded.'));
    image.src = imageUrl;
  });
}

async function optimizeBackgroundImageFile(file: File) {
  const originalDataUrl = await readFileAsDataUrl(file);
  const metrics = await readImageMetrics(originalDataUrl).catch(() => null);

  if (!metrics || /\.svg$/i.test(file.name) || file.type === 'image/svg+xml') {
    return {
      dataUrl: originalDataUrl,
      naturalWidth: metrics?.naturalWidth,
      naturalHeight: metrics?.naturalHeight,
    };
  }

  const maxEdge = Math.max(metrics.naturalWidth, metrics.naturalHeight);
  const shouldOptimize = originalDataUrl.length > BACKGROUND_IMAGE_MAX_INLINE_LENGTH || maxEdge > BACKGROUND_IMAGE_MAX_SOURCE_EDGE;

  if (!shouldOptimize) {
    return {
      dataUrl: originalDataUrl,
      naturalWidth: metrics.naturalWidth,
      naturalHeight: metrics.naturalHeight,
    };
  }

  const scale = Math.min(1, BACKGROUND_IMAGE_MAX_SOURCE_EDGE / maxEdge);
  const canvas = document.createElement('canvas');
  canvas.width = Math.max(1, Math.round(metrics.naturalWidth * scale));
  canvas.height = Math.max(1, Math.round(metrics.naturalHeight * scale));
  const context = canvas.getContext('2d');

  if (!context) {
    return {
      dataUrl: originalDataUrl,
      naturalWidth: metrics.naturalWidth,
      naturalHeight: metrics.naturalHeight,
    };
  }

  context.drawImage(metrics.image, 0, 0, canvas.width, canvas.height);
  const optimizedDataUrl = canvas.toDataURL('image/webp', 0.86);

  return {
    dataUrl: optimizedDataUrl.length < originalDataUrl.length ? optimizedDataUrl : originalDataUrl,
    naturalWidth: canvas.width,
    naturalHeight: canvas.height,
  };
}

function PageStyleMenuControls({
  pageAppearance,
  onChange,
}: {
  pageAppearance: Record<string, unknown>;
  onChange: (appearance: Record<string, unknown>) => void;
}) {
  const editorStageRef = useRef<HTMLDivElement | null>(null);
  const editorDragRef = useRef<BackgroundEditorDragState | null>(null);
  const [imageEditorOpen, setImageEditorOpen] = useState(false);
  const [editorImageAspect, setEditorImageAspect] = useState(1.52);
  const pageBackgroundColor =
    typeof pageAppearance.backgroundColor === 'string' ? pageAppearance.backgroundColor : '#f6f8fa';
  const leftSidebarBackgroundColor =
    typeof pageAppearance.leftSidebarBackgroundColor === 'string'
      ? pageAppearance.leftSidebarBackgroundColor
      : '#ffffff';
  const backgroundImageUrl =
    typeof pageAppearance.backgroundImageUrl === 'string' ? pageAppearance.backgroundImageUrl : '';
  const backgroundImagePosition =
    typeof pageAppearance.backgroundImagePosition === 'string'
      ? pageAppearance.backgroundImagePosition
      : 'right top';
  const backgroundImageSize =
    typeof pageAppearance.backgroundImageSize === 'string' ? pageAppearance.backgroundImageSize : '360px auto';
  const backgroundImageName =
    typeof pageAppearance.backgroundImageName === 'string' ? pageAppearance.backgroundImageName : '';
  const customImageWidth = getImageSizeWidth(backgroundImageSize);
  const editorImageWidth = clampNumber(customImageWidth, 80, 1400);
  const editorImageHeight = editorImageAspect > 0 ? editorImageWidth / editorImageAspect : editorImageWidth * 0.66;
  const editorImageOrigin = getImageOriginFromPosition(backgroundImagePosition, editorImageWidth, editorImageHeight);
  const uploadLabel = backgroundImageName || (backgroundImageUrl ? 'Background image loaded' : 'Choose image file');
  const updateImageEditorValues = (origin: { x: number; y: number }, width = editorImageWidth) => {
    onChange({
      backgroundImagePosition: `${Math.round(origin.x)}px ${Math.round(origin.y)}px`,
      backgroundImageSize: `${Math.round(width)}px auto`,
      backgroundImageRepeat: 'no-repeat',
    });
  };
  const beginImageEditDrag = (event: PointerEvent<HTMLElement>, mode: BackgroundEditorDragMode) => {
    if (!backgroundImageUrl) {
      return;
    }

    event.preventDefault();
    event.stopPropagation();
    editorStageRef.current?.setPointerCapture(event.pointerId);
    editorDragRef.current = {
      mode,
      pointerId: event.pointerId,
      startPoint: getFramePoint(event, editorStageRef.current),
      startOrigin: editorImageOrigin,
      startWidth: editorImageWidth,
    };
  };
  const handleImageEditPointerMove = (event: PointerEvent<HTMLDivElement>) => {
    const dragState = editorDragRef.current;

    if (!dragState || dragState.pointerId !== event.pointerId) {
      return;
    }

    event.preventDefault();
    const nextPoint = getFramePoint(event, editorStageRef.current);
    const deltaX = nextPoint.x - dragState.startPoint.x;
    const deltaY = nextPoint.y - dragState.startPoint.y;

    if (dragState.mode === 'resize') {
      updateImageEditorValues(dragState.startOrigin, clampNumber(dragState.startWidth + deltaX, 80, 1400));
      return;
    }

    updateImageEditorValues({
      x: dragState.startOrigin.x + deltaX,
      y: dragState.startOrigin.y + deltaY,
    });
  };
  const endImageEditDrag = (event: PointerEvent<HTMLDivElement>) => {
    if (editorDragRef.current?.pointerId === event.pointerId) {
      editorDragRef.current = null;
    }
  };
  const applyLoadedBackgroundImage = (imageUrl: string, imageName: string, naturalWidth?: number, naturalHeight?: number) => {
    const imageAspect =
      naturalWidth && naturalHeight && naturalWidth > 0 && naturalHeight > 0 ? naturalWidth / naturalHeight : editorImageAspect;
    const initialWidth = clampNumber(
      naturalWidth ? Math.min(naturalWidth, BACKGROUND_EDITOR_FRAME_WIDTH * 0.48) : 420,
      260,
      620,
    );
    const initialHeight = imageAspect > 0 ? initialWidth / imageAspect : initialWidth * 0.66;

    setEditorImageAspect(imageAspect);
    onChange({
      backgroundImageUrl: imageUrl,
      backgroundImageName: imageName,
      backgroundImagePosition: `${Math.round((BACKGROUND_EDITOR_FRAME_WIDTH - initialWidth) / 2)}px ${Math.round((BACKGROUND_EDITOR_FRAME_HEIGHT - initialHeight) / 2)}px`,
      backgroundImageSize: `${Math.round(initialWidth)}px auto`,
      backgroundImageRepeat: 'no-repeat',
    });
    setImageEditorOpen(true);
  };
  const handleImageFileChange = (file?: File) => {
    if (!file || !isSupportedImageFile(file)) {
      return;
    }

    void optimizeBackgroundImageFile(file)
      .then(({ dataUrl, naturalWidth, naturalHeight }) => {
        applyLoadedBackgroundImage(dataUrl, file.name, naturalWidth, naturalHeight);
      })
      .catch(() => {
        setImageEditorOpen(false);
      });
  };

  return (
    <>
    <div className="block-style-menu__controls block-style-menu__controls--page">
      <label>
        <span>Page bg</span>
        <input
          type="color"
          value={pageBackgroundColor}
          onChange={(event) => onChange({ backgroundColor: event.target.value })}
        />
      </label>
      <label>
        <span>Left panel bg</span>
        <input
          type="color"
          value={leftSidebarBackgroundColor}
          onChange={(event) => onChange({ leftSidebarBackgroundColor: event.target.value })}
        />
      </label>

      <div className="background-image-upload">
        <span>Image</span>
        <label>
          <input
            accept="image/*"
            type="file"
            onChange={(event) => {
              handleImageFileChange(event.target.files?.[0]);
              event.currentTarget.value = '';
            }}
          />
          <strong>{uploadLabel}</strong>
          <em>PNG, JPG, GIF, SVG</em>
        </label>
        {backgroundImageUrl ? (
          <div className="background-image-upload__preview">
            <img alt="" src={backgroundImageUrl} />
          </div>
        ) : null}
      </div>

      <button
        className="background-image-upload__edit background-image-upload__edit--primary"
        disabled={!backgroundImageUrl}
        type="button"
        onClick={() => setImageEditorOpen(true)}
      >
        Edit image in frame
      </button>

      <button
        className="block-style-menu__secondary-action"
        type="button"
        onClick={() => {
          setImageEditorOpen(false);
          onChange({
            backgroundImageUrl: '',
            backgroundImageName: '',
            backgroundImagePosition: 'right top',
            backgroundImageSize: '360px auto',
            backgroundImageRepeat: 'no-repeat',
          });
        }}
      >
        Clear image
      </button>
    </div>
    {imageEditorOpen && backgroundImageUrl ? (
      <div
        className="background-image-editor-modal"
        role="dialog"
        aria-modal="true"
        aria-label="Background image editor"
        onClick={() => setImageEditorOpen(false)}
      >
        <div className="background-image-editor-modal__panel" onClick={(event) => event.stopPropagation()}>
          <header className="background-image-editor-modal__header">
            <div>
              <span>Background image</span>
              <strong>{backgroundImageName || 'Image preview'}</strong>
            </div>
            <button type="button" aria-label="Close background image editor" onClick={() => setImageEditorOpen(false)}>
              <Icon name="close" />
            </button>
          </header>
          <div
            className="background-image-editor-stage"
            ref={editorStageRef}
            onPointerMove={handleImageEditPointerMove}
            onPointerUp={endImageEditDrag}
            onPointerCancel={endImageEditDrag}
            style={{ backgroundColor: pageBackgroundColor }}
          >
            <div className="background-image-editor-stage__columns" aria-hidden="true">
              <span />
              <span />
              <span />
            </div>
            <div
              className="background-image-editor-stage__image-frame"
              style={{
                left: `${(editorImageOrigin.x / BACKGROUND_EDITOR_FRAME_WIDTH) * 100}%`,
                top: `${(editorImageOrigin.y / BACKGROUND_EDITOR_FRAME_HEIGHT) * 100}%`,
                width: `${(editorImageWidth / BACKGROUND_EDITOR_FRAME_WIDTH) * 100}%`,
              }}
              onPointerDown={(event) => beginImageEditDrag(event, 'move')}
            >
              <img
                alt=""
                draggable={false}
                src={backgroundImageUrl}
                onLoad={(event) => {
                  const { naturalHeight, naturalWidth } = event.currentTarget;

                  if (naturalWidth > 0 && naturalHeight > 0) {
                    setEditorImageAspect(naturalWidth / naturalHeight);
                  }
                }}
              />
              <button
                aria-label="Resize background image"
                className="background-image-editor-stage__resize"
                type="button"
                onPointerDown={(event) => beginImageEditDrag(event, 'resize')}
              />
            </div>
          </div>
          <div className="background-image-editor-modal__footer">
            <label>
              <span>Size</span>
              <input
                max={1400}
                min={80}
                step={10}
                type="range"
                value={editorImageWidth}
                onChange={(event) => updateImageEditorValues(editorImageOrigin, Number(event.target.value))}
              />
              <em>{Math.round(editorImageWidth)}px</em>
            </label>
            <button type="button" onClick={() => setImageEditorOpen(false)}>
              Done
            </button>
          </div>
        </div>
      </div>
    ) : null}
    </>
  );
}
