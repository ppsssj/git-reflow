import type { TemplateRecord } from '../types/template';

export const templates: TemplateRecord[] = [
  {
    id: 'repo-focus',
    name: 'nextjs-enterprise-stack',
    description:
      'Production-ready Next.js 14 template with Tailwind, TypeScript, and pre-configured CI/CD pipelines.',
    thumbnail:
      'https://lh3.googleusercontent.com/aida-public/AB6AXuC7DeeAz5qsg5zNEIKn3dItso7jAIODOyATjYdVW-ZzNnURJY3bvSqlvDnt-32OOVOlpc5sCAYnXGAycgJ5OaZcxz438GerLZ4Otgq36KL_fLPqfNJWs-Nrac94hx1pgGdCG45iNYri5BDbo6LanfOT4O7k7Zm3RUTT5Em5NFgmVKXNmDJq4l33IsjEI2aewTwIzdR3lDrtkrkqtCa2LQJz6usA-ppXtbZnL4kLwVGtyu5S1gFyEvToPkZW2YWBOn2_rvZ8QZBKvJw',
    collaborators: [
      'https://lh3.googleusercontent.com/aida-public/AB6AXuDnB981C5geduBUD9Vp3WeW0-InJU1rfn6AVbtUjmonY3mGsn0x433ZlBxaIt0InhfwJ3O1IKbn-8pfZ4lHbjax9_MS9LL4rV_FGEkLDtEzp-viD0Kc4hEyZJxD1Tni1Ms7ytterWz23wiSXdtbJueHQRfgfJWUQZrBwf03znvW93zIp-CF4Cy_IFESDIlOcd08dN-1ij31uApY4w37BcmstSaXJntPO79uh8sMVW0FqVmfUuZ53L8qxSee-koQ6AC7-c_gAO9mMrE',
      'https://lh3.googleusercontent.com/aida-public/AB6AXuDEYUB3NyIlOh1BvNk3OJorWEQkoK9LnDrTHkxDUdiWzjWzbxAqzKOJjUwMMUMLr8GgYb_NuHOSFNX1w2Zj1WlhploZSgckHDNcNFYHy4Xa0TiXORZXpD43lM2PubE9QYuElkNmX_jLt_YK6VG3RnCQLxd3LpiETqNRSMVyyHfMPwPOdE1omUgRs-vLpsZs5zWFjH-cRV1KGFAU0AOC7v-WQD1UEkyoKjdRD-bsR_u9nJbE9Qh7wNiajG9yFX5hfjVeKlsdJ8QmZfI',
    ],
    status: 'ACTIVE',
    syncState: 'Extension connected',
    updatedAt: 'Updated 2h ago',
    owner: 'Design Systems',
    highlights: [
      'Header actions grouped into a tighter command bar.',
      'Readme panel promoted above secondary modules.',
      'Right rail kept visible for contributor and release context.',
    ],
    sections: [
      {
        id: 'header-section',
        label: 'Header_Section',
        kind: 'header',
        depth: 0,
        description: 'Owner, repository name, branch controls, and repo actions.',
        visible: true,
      },
      {
        id: 'main-grid',
        label: 'Main_Grid',
        kind: 'content',
        depth: 0,
        description: 'Primary content frame that holds the hero and supporting modules.',
        visible: true,
      },
      {
        id: 'repo-list',
        label: 'Repo_List',
        kind: 'hero',
        depth: 1,
        description: 'Primary message area for repository summary and onboarding.',
        visible: true,
      },
      {
        id: 'activity-feed',
        label: 'Activity_Feed',
        kind: 'activity',
        depth: 1,
        description: 'Commit cadence, discussions, and release pulse.',
        visible: true,
      },
      {
        id: 'sidebar-context',
        label: 'Sidebar_Context',
        kind: 'sidebar',
        depth: 0,
        description: 'About box, releases, languages, and package links.',
        visible: true,
      },
    ],
  },
  {
    id: 'team-handoff',
    name: 'ui-component-kit-v2',
    description:
      'Rollup based UI library boilerplate with Storybook 7 and automatic versioning logic.',
    thumbnail:
      'https://lh3.googleusercontent.com/aida-public/AB6AXuBU2WPSyYZ9slIyc2SEj8NR6rbSvLv6Snc2w6JdMhUQ2ZdHhsEC8bVxvWJWK06qRVnMlQFvjux-goy1XhbKcNuNSlwbUubdbFVtCu7xtOOeFg4K2xhfYiEAquro7oHD7PTCcnP7JYSQvqGcw6H18fXqfdPAgAHsIYLaifedYkRropVzNwgVNZhAF_ELjeL0glSxuFkzNxZwsW1cxXU-u-wqM4NPU-ou4jzMRomz8oj0zOQj4GtOwkOq-fXdgR3z6kKlgGt6YS_SOgg',
    collaborators: [
      'https://lh3.googleusercontent.com/aida-public/AB6AXuAugy_kTVHVln-0WD9rFC1F3bWV5svedxVOWlg78GhvcQ-npzmjvPwN2ThzruTlYhOx--vqOUxe97mTvnJO93aPj7kfqMW8UWT5t_cwkVOmpuIbdiXxe_y9MA8smwPd449vQLjnmtJnmkc6reJE3QS11kSWTOwxBebAAU4bnQszQ5L2-JgN4SHFriNOw3Zrm1gr2DdzaAszDlO21k0Z69xHbY6biW8IJ2gG1sQNnMnK_louiNF36il9IXT81KkEhNz_zdrRyRfgqk0',
    ],
    status: 'ACTIVE',
    syncState: 'Needs review',
    updatedAt: 'Updated 1d ago',
    owner: 'Growth Team',
    highlights: [
      'Issue and pull request activity surfaces earlier in the page.',
      'Review assignments are exposed in a compact context rail.',
      'Draft mode keeps changes isolated before extension publish.',
    ],
    sections: [
      {
        id: 'repo-header',
        label: 'Repository Header',
        kind: 'header',
        depth: 0,
        description: 'Shared repository identity, branch actions, and CTA group.',
        visible: true,
      },
      {
        id: 'issues-strip',
        label: 'Issue Priority Strip',
        kind: 'hero',
        depth: 1,
        description: 'Short list of urgent issues pinned above file browsing.',
        visible: true,
      },
      {
        id: 'code-overview',
        label: 'Code Overview',
        kind: 'content',
        depth: 0,
        description: 'Repository file list and commit context.',
        visible: true,
      },
      {
        id: 'review-sidebar',
        label: 'Review Sidebar',
        kind: 'sidebar',
        depth: 0,
        description: 'Assignees, labels, milestones, and sync notes.',
        visible: true,
      },
    ],
  },
  {
    id: 'release-radar',
    name: 'fastapi-microservice',
    description:
      'Scalable FastAPI backend with PostgreSQL, Redis, and Docker integration for high-performance apps.',
    thumbnail:
      'https://lh3.googleusercontent.com/aida-public/AB6AXuAHIFBxyiebVZnUFg2D9XUvpWH1Fyqst4tVuD_OuDyi_JggCv_83ZWra-Q6wkTvglKjj-gDyne2wjgtIMgGjNIOFVEB1gJLrIHe_irmkMWa-jQiPiNWWh76eIXlBTMrRcPGrQXPChnbUvftitWcYlZeL9mwpdRJLHIih7ZjhyJ3ofs2r4b4dxUCT8d5P5Xt2otswhxBbMeiNYx3ny9HOkLkT0oipBLXwn0Iz1DgpPkbJ_MuuuByuZW2yPYCL6iENjCCzYn15epUz8c',
    collaborators: [
      'https://lh3.googleusercontent.com/aida-public/AB6AXuB4JyAyHwos4GETA7hMIz_AcnuDX_5IeuSOnHTpw_qNZxjxnPIOFbecT66neaySX4QzRNKqv5eKaP8Ogywa4-Ut6Ujg5uwCcmV75EAMLIf9nrjwIkANZj-zw_TU5nBa8pX1e7aSgaPVac2mwV386Gnl5icDNrgv2f6PTwdnYomqIEqPf1U9QlAZnt5wsokWVAJ_ky3RVvvcfqKVWM53XFtrX4sgtMmI-RrO4MbO5EJeUfFGPNsd16rD2xerl-Gfms-2Jrs1HVHhL4M',
    ],
    status: 'INACTIVE',
    syncState: 'Ready to sync',
    updatedAt: 'Updated 4d ago',
    owner: 'Platform',
    highlights: [
      'Release panel moves into the first viewport.',
      'Package health and deployment notes stay attached to the main content.',
      'Designed for teams that publish often and need operational clarity.',
    ],
    sections: [
      {
        id: 'repo-header',
        label: 'Repository Header',
        kind: 'header',
        depth: 0,
        description: 'Top-level identity and primary repo actions.',
        visible: true,
      },
      {
        id: 'release-overview',
        label: 'Release Overview',
        kind: 'hero',
        depth: 1,
        description: 'Current version, package health, and deployment signal.',
        visible: true,
      },
      {
        id: 'changelog-module',
        label: 'Changelog Module',
        kind: 'content',
        depth: 1,
        description: 'Editorial changelog callout directly below the hero.',
        visible: true,
      },
      {
        id: 'package-sidebar',
        label: 'Package Sidebar',
        kind: 'sidebar',
        depth: 0,
        description: 'Registry, install command, and maintenance ownership.',
        visible: true,
      },
    ],
  },
  {
    id: 'astro-blog-clean',
    name: 'astro-blog-clean',
    description:
      'Lightning fast blog template using Astro 4.0 with markdown support and SEO optimization.',
    thumbnail:
      'https://lh3.googleusercontent.com/aida-public/AB6AXuDqpQIkPIvkghAd6hIn6J8W0tqwRqeOw6lwhpTkGvL2ggKfwHAEuCuRuMcGOoeC5mnW9o5xcQtc3D9zbSVzQxvdE-a5ws4ZKmhGv9P0hKJzR8rMGZkQV0HrMJuZ7CQRzZ86VyfaAjow4APQ2c1n47ZgcQWnuyafniZsF7ufcu46iV1wnkxAfzHsWebBMyLDPt2h8jXuMXF_V6BPeuoEMXaqTXZBR24b80uq_5YwZdig3n80rE_OgC6pf2DSp2YrisreiBrPZ5U-Zp4',
    collaborators: [
      'https://lh3.googleusercontent.com/aida-public/AB6AXuDduXp1m_jpO_FS36qLz6ffhzTdto3uexxF8Xc0FGx54H7o2rZedw8XgU_ZHf_UJ5myZwv635QrxIId0SgN8EYqI7uH-bF4UJjJja-aTuEpz0N2WbUxUCSduC_CZJ5NdVzhBGLI-AQxfOopsvcHiB1WIq_aJD9mXuZz3SrJs1wTYWt1a1GPrwLXUpsETR9d7qXqcAZWQpJuMJI15XmlZXPlNuyDGC2o3eiD45fhVr-gISiloDo2NdpjnaBFS1QAv0m6VaBDzmTr6ho',
    ],
    status: 'ACTIVE',
    syncState: 'Ready to sync',
    updatedAt: 'Updated 1w ago',
    owner: 'Publishing',
    highlights: [
      'Blog-first hero layout with editorial emphasis.',
      'Sidebar modules kept intentionally compact.',
      'Useful for content-heavy repositories and docs portals.',
    ],
    sections: [
      {
        id: 'header-section',
        label: 'Header_Section',
        kind: 'header',
        depth: 0,
        description: 'Repository identity and top-level controls.',
        visible: true,
      },
      {
        id: 'main-grid',
        label: 'Main_Grid',
        kind: 'content',
        depth: 0,
        description: 'Main content grid and supporting modules.',
        visible: true,
      },
      {
        id: 'repo-list',
        label: 'Repo_List',
        kind: 'hero',
        depth: 1,
        description: 'Primary summary module and featured content.',
        visible: true,
      },
      {
        id: 'activity-feed',
        label: 'Activity_Feed',
        kind: 'activity',
        depth: 1,
        description: 'Secondary activity and release stream.',
        visible: true,
      },
    ],
  },
];
