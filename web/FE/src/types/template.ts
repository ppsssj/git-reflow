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
