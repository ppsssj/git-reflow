import type { TemplateBlock, TemplateScreen } from '../../../types/template';

export const repositoryReadmeScreen: TemplateScreen = {
  id: 'github-repository-readme',
  name: 'Repository README',
  providerRoute: 'github.com/:owner/:repo',
  description: 'Repository landing page with file list, README, and metadata sidebar.',
};

export const repositoryReadmeBlocks: TemplateBlock[] = [
  {
    id: 'repo-header',
    type: 'repository-header',
    title: 'Repository Header',
    region: 'topbar',
    screenId: repositoryReadmeScreen.id,
    visible: true,
    extensionSlot: 'github.repository.header',
    props: {
      owner: 'template-owner',
      repository: 'sample-readme-project',
      visibility: 'Public',
      tabs: [
        { label: 'Code', active: true },
        { label: 'Issues' },
        { label: 'Pull requests' },
        { label: 'Actions' },
        { label: 'Projects' },
        { label: 'Security' },
        { label: 'Insights' },
      ],
      actions: [
        { label: 'Notifications' },
        { label: 'Fork', count: '0' },
        { label: 'Star', count: '0' },
      ],
    },
  },
  {
    id: 'repo-files',
    type: 'repository-file-list',
    title: 'Files',
    region: 'main-feed',
    screenId: repositoryReadmeScreen.id,
    visible: true,
    extensionSlot: 'github.repository.files',
    props: {
      branch: 'main',
      commitAuthor: 'sample-user',
      commitMessage: 'Update README and project description',
      commitTime: 'now',
      files: [
        { name: 'docs', type: 'directory', message: 'Add project documentation examples' },
        { name: 'src', type: 'directory', message: 'Organize application source files' },
        { name: 'tests', type: 'directory', message: 'Add sample coverage for core flows' },
        { name: 'package.json', type: 'file', message: 'Define project scripts and dependencies' },
        { name: 'README.md', type: 'file', message: 'Update README and usage notes' },
      ],
    },
  },
  {
    id: 'repo-readme',
    type: 'repository-readme',
    title: 'README',
    region: 'main-feed',
    screenId: repositoryReadmeScreen.id,
    visible: true,
    extensionSlot: 'github.repository.readme',
    props: {
      title: 'sample-readme-project',
      badges: ['Example', 'README', 'Documentation'],
      sections: [
        {
          heading: 'Overview',
          body: 'Use this area as the main project description. Explain what the repository does, who it is for, and the problem it solves.',
        },
        {
          heading: 'Getting started',
          body: 'Add setup steps, required tools, environment variables, and the first command someone should run after cloning the repository.',
        },
        {
          heading: 'Usage',
          body: 'Show the most common workflow with concise examples. This section can become installation notes, screenshots, or API examples.',
        },
      ],
    },
  },
  {
    id: 'repo-about',
    type: 'repository-about-sidebar',
    title: 'About',
    region: 'right-sidebar',
    screenId: repositoryReadmeScreen.id,
    visible: true,
    extensionSlot: 'github.repository.sidebar.about',
    props: {
      description: 'Short repository description goes here. Keep it clear enough to explain the project from the sidebar.',
      links: ['Readme', 'Activity', 'Custom properties'],
      releases: 'No releases published',
      packages: 'No packages published',
      contributors: [
        { name: 'sample-user', initial: 's' },
      ],
      languages: [
        { name: 'TypeScript', percent: 46, color: '#3178c6' },
        { name: 'CSS', percent: 32, color: '#663399' },
        { name: 'JavaScript', percent: 22, color: '#f1e05a' },
      ],
    },
  },
];
