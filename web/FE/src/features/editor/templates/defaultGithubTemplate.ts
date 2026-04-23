import type { TemplateLayout } from '../../../types/template';

export const defaultGithubTemplate: TemplateLayout = {
  id: 'github-dashboard-reference',
  name: 'GitHub Dashboard Template',
  description: 'GitHub-like dashboard structure rebuilt with local placeholder blocks.',
  source: 'default',
  version: 2,
  regions: ['topbar', 'left-sidebar', 'main-feed', 'right-sidebar'],
  metadata: {
    provider: 'github',
    browserMappingKey: 'github.dashboard.reference',
    updatedAt: '2026-04-23',
  },
  blocks: [
    {
      id: 'top-nav',
      type: 'top-nav',
      title: 'Global Header',
      region: 'topbar',
      visible: true,
      extensionSlot: 'github.global.header',
      props: {
        context: 'Dashboard',
        searchPlaceholder: 'Search or jump to...',
        links: ['Pull requests', 'Issues', 'Codespaces', 'Marketplace', 'Explore'],
        actions: ['Copilot', 'Create', 'Issues', 'Pull requests', 'Inbox'],
      },
    },
    {
      id: 'profile-summary',
      type: 'profile-summary',
      title: 'Account Context',
      region: 'left-sidebar',
      visible: true,
      extensionSlot: 'github.dashboard.account',
      props: {
        name: 'Alex Morgan',
        handle: '@alex-placeholder',
        bio: 'Personal dashboard',
        stats: [
          { label: 'Teams', value: '3' },
          { label: 'Projects', value: '12' },
        ],
      },
    },
    {
      id: 'recent-repos',
      type: 'recent-repos',
      title: 'Top Repositories',
      region: 'left-sidebar',
      visible: true,
      extensionSlot: 'github.dashboard.repositories.top',
      props: {
        searchPlaceholder: 'Find a repository...',
        repositories: [
          { name: 'alex-placeholder/ui-workbench', language: 'TypeScript', visibility: 'Public' },
          { name: 'alex-placeholder/git-notes', language: 'Markdown', visibility: 'Private' },
          { name: 'reflow-labs/layout-capture', language: 'React', visibility: 'Public' },
          { name: 'demo-space/issue-board', language: 'JavaScript', visibility: 'Public' },
          { name: 'alex-placeholder/browser-mapper', language: 'CSS', visibility: 'Private' },
          { name: 'design-systems/token-playground', language: 'TypeScript', visibility: 'Public' },
        ],
      },
    },
    {
      id: 'copilot-prompt',
      type: 'copilot-prompt',
      title: 'Assistant Prompt',
      region: 'main-feed',
      visible: true,
      extensionSlot: 'github.dashboard.copilot.prompt',
      props: {
        placeholder: 'Ask anything or type @ to add context',
        model: 'Placeholder Model',
        chips: ['Agent', 'Create issue', 'Write code', 'Git', 'Pull requests'],
      },
    },
    {
      id: 'activity-feed',
      type: 'activity-feed',
      title: 'Home Feed',
      region: 'main-feed',
      visible: true,
      extensionSlot: 'github.dashboard.feed',
      props: {
        filters: ['For you', 'Following'],
        events: [
          {
            actor: 'orbit-ui',
            action: 'released',
            subject: 'Dashboard cards v2.4',
            time: '20m',
            summary: 'A compact card system for repository activity and extension previews.',
          },
          {
            actor: 'maple-dev',
            action: 'opened pull request',
            subject: 'Add selector scoring fallback',
            time: '1h',
            summary: 'Improves matching when a source page changes class names.',
          },
          {
            actor: 'northstar-labs',
            action: 'starred',
            subject: 'browser-layout-capture',
            time: '3h',
            summary: 'A utility package for turning page regions into editable schema.',
          },
        ],
      },
    },
    {
      id: 'repo-updates',
      type: 'repo-updates',
      title: 'Repository Updates',
      region: 'main-feed',
      visible: true,
      extensionSlot: 'github.dashboard.repository.updates',
      props: {
        updates: [
          { repo: 'reflow-labs/layout-capture', message: 'Published a preview build with better sidebar detection.', status: 'Release' },
          { repo: 'alex-placeholder/ui-workbench', message: 'Merged new empty-state components for dashboards.', status: 'Merged' },
        ],
      },
    },
    {
      id: 'pinned-repos',
      type: 'pinned-repos',
      title: 'Pinned Repositories',
      region: 'main-feed',
      visible: false,
      extensionSlot: 'github.dashboard.repositories.pinned',
      props: {
        repositories: [
          {
            name: 'layout-capture',
            description: 'Placeholder repository card for future block mapping.',
            language: 'TypeScript',
            stars: '1.2k',
          },
          {
            name: 'template-runtime',
            description: 'Composable React renderer for saved page layouts.',
            language: 'React',
            stars: '842',
          },
        ],
      },
    },
    {
      id: 'issue-pr-updates',
      type: 'issue-pr-updates',
      title: 'Issues and Pull Requests',
      region: 'right-sidebar',
      visible: true,
      extensionSlot: 'github.dashboard.work.queue',
      props: {
        items: [
          { label: 'Assigned issues', count: 6 },
          { label: 'Review requests', count: 3 },
          { label: 'Mentioned threads', count: 9 },
        ],
      },
    },
    {
      id: 'trending-repos',
      type: 'trending-repos',
      title: 'Latest Changelog',
      region: 'right-sidebar',
      visible: true,
      extensionSlot: 'github.dashboard.changelog',
      props: {
        repositories: [
          { name: 'Dashboard feed placeholders now support compact previews', language: 'Changelog', stars: '7 hours ago' },
          { name: 'Code review summary metrics added to template examples', language: 'Changelog', stars: '8 hours ago' },
          { name: 'CLI telemetry controls available in sample settings', language: 'Changelog', stars: '9 hours ago' },
          { name: 'Bring your own model key added to local prototype', language: 'Changelog', stars: '15 hours ago' },
        ],
      },
    },
    {
      id: 'recommended-repos',
      type: 'recommended-repos',
      title: 'Explore Repositories',
      region: 'right-sidebar',
      visible: true,
      extensionSlot: 'github.dashboard.explore.repositories',
      props: {
        repositories: [
          { name: 'placeholder/feed-patterns', reason: 'Because you work with dashboard layouts.' },
          { name: 'example/repo-discovery', reason: 'Popular with frontend extension teams.' },
        ],
      },
    },
  ],
};
