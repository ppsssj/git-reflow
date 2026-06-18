import type { TemplateBlock, TemplateScreen } from '../../../types/template';

export const profileOverviewScreen: TemplateScreen = {
  id: 'github-profile-overview',
  name: 'Profile Overview',
  providerRoute: 'github.com/:user',
  description: 'GitHub user profile page with profile card, README, pinned repositories, and contribution activity.',
};

export const profileOverviewBlocks: TemplateBlock[] = [
  {
    id: 'profile-global-nav',
    type: 'top-nav',
    title: 'GitHub Header',
    region: 'topbar',
    screenId: profileOverviewScreen.id,
    visible: true,
    extensionSlot: 'github.profile.globalNav',
    props: {
      context: 'ppsssj',
      searchPlaceholder: 'Type / to search',
      links: ['Overview', 'Repositories', 'Projects', 'Packages', 'Stars'],
      actions: ['Copilot', 'Create', 'Issues', 'Pull requests', 'Repositories'],
    },
  },
  {
    id: 'profile-sidebar',
    type: 'profile-sidebar',
    title: 'Profile Sidebar',
    region: 'left-sidebar',
    screenId: profileOverviewScreen.id,
    visible: true,
    extensionSlot: 'github.profile.sidebar',
    props: {
      name: 'ptjdwls',
      handle: 'ppsssj',
      website: 'https://ppsssj.vercel.app/',
      stats: ['0 followers', '0 following'],
    },
  },
  {
    id: 'profile-readme',
    type: 'profile-readme',
    title: 'Profile README',
    region: 'main-feed',
    screenId: profileOverviewScreen.id,
    visible: true,
    extensionSlot: 'github.profile.readme',
    props: {
      repository: 'ppsssj',
      heading: 'Portfolio',
      links: ['Portfolio', 'Projects'],
      summary: 'Personal overview README rendered on the GitHub profile.',
    },
  },
  {
    id: 'profile-pinned-repos',
    type: 'profile-pinned-repos',
    title: 'Pinned Repositories',
    region: 'main-feed',
    screenId: profileOverviewScreen.id,
    visible: true,
    extensionSlot: 'github.profile.pinned',
    props: {
      repositories: [
        { name: 'Cogic', language: 'TypeScript', stars: '0' },
        { name: 'GraphMind-monorepo', language: 'TypeScript', stars: '0' },
        { name: 'Git-Effects', language: 'JavaScript', stars: '0' },
      ],
    },
  },
  {
    id: 'profile-contributions',
    type: 'profile-contributions',
    title: 'Contributions',
    region: 'main-feed',
    screenId: profileOverviewScreen.id,
    visible: true,
    extensionSlot: 'github.profile.contributions',
    props: {
      summary: 'Contribution calendar and activity timeline',
      years: ['2026', '2025', '2024'],
    },
  },
];
