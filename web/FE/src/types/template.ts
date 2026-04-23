export type TemplateStatus = 'ACTIVE' | 'INACTIVE';

export interface TemplateSection {
  id: string;
  label: string;
  kind: 'header' | 'navigation' | 'hero' | 'content' | 'sidebar' | 'activity';
  depth: number;
  description: string;
  visible: boolean;
}

export interface TemplateRecord {
  id: string;
  name: string;
  description: string;
  thumbnail: string;
  collaborators: string[];
  status: TemplateStatus;
  syncState: 'Ready to sync' | 'Needs review' | 'Extension connected';
  updatedAt: string;
  owner: string;
  highlights: string[];
  sections: TemplateSection[];
}

export type TemplateRegion = 'topbar' | 'left-sidebar' | 'main-feed' | 'right-sidebar';

export type TemplateBlockType =
  | 'top-nav'
  | 'profile-summary'
  | 'copilot-prompt'
  | 'pinned-repos'
  | 'recent-repos'
  | 'activity-feed'
  | 'repo-updates'
  | 'issue-pr-updates'
  | 'trending-repos'
  | 'recommended-repos';

export interface TemplateBlock<TProps extends Record<string, unknown> = Record<string, unknown>> {
  id: string;
  type: TemplateBlockType;
  title: string;
  region: TemplateRegion;
  visible: boolean;
  props: TProps;
  screenId?: string;
  extensionSlot?: string;
}

export interface TemplateScreen {
  id: string;
  name: string;
  providerRoute: string;
  description: string;
}

export interface TemplateLayout {
  id: string;
  name: string;
  description: string;
  source: 'default' | 'user';
  version: number;
  activeScreenId: string;
  screens: TemplateScreen[];
  regions: TemplateRegion[];
  blocks: TemplateBlock[];
  metadata: {
    provider: 'github';
    browserMappingKey: string;
    updatedAt: string;
  };
}
