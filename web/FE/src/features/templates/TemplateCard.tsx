import { Link } from 'react-router-dom';
import { Icon } from '../../components/ui/Icon';
import type { TemplateRecord } from '../../types/template';

interface TemplateCardProps {
  template: TemplateRecord;
  variant?: 'grid' | 'list';
}

function TemplatePreview({ template }: { template: TemplateRecord }) {
  const visibleSections = template.sections.filter((section) => section.visible).slice(0, 5);

  return (
    <div className="template-preview" aria-hidden="true">
      <div className="template-preview__topbar">
        <span />
        <span />
        <span />
      </div>
      <div className="template-preview__body">
        <aside className="template-preview__left">
          {visibleSections.slice(0, 3).map((section) => (
            <span key={section.id} />
          ))}
        </aside>
        <main className="template-preview__main">
          <strong>{template.name.slice(0, 1).toUpperCase()}</strong>
          <span />
          <span />
          <div>
            <i />
            <i />
          </div>
        </main>
        <aside className="template-preview__right">
          {template.highlights.slice(0, 3).map((highlight) => (
            <span key={highlight} />
          ))}
        </aside>
      </div>
    </div>
  );
}

export function TemplateCard({ template, variant = 'grid' }: TemplateCardProps) {
  return (
    <Link className={`template-tile template-tile--${variant}`} to={`/templates/${template.id}`}>
      <div className="template-tile__thumb">
        {template.thumbnail ? (
          <img alt={template.name} src={template.thumbnail} />
        ) : (
          <TemplatePreview template={template} />
        )}
        <span className={`template-tile__status ${template.status === 'ACTIVE' ? 'is-active' : 'is-inactive'}`}>
          {template.status}
        </span>
      </div>
      <div className="template-tile__body">
        <div className="template-tile__title">
          <h3>{template.name}</h3>
          <Icon name="more_vert" />
        </div>
        <p className="template-tile__description">{template.description}</p>
        <div className="template-tile__meta">
          <div className="template-tile__avatars">
            {template.collaborators.slice(0, 2).map((collaborator, index) => (
              <img
                key={`${template.id}-${index}`}
                alt=""
                aria-hidden="true"
                src={collaborator}
              />
            ))}
          </div>
          <span>{template.updatedAt}</span>
        </div>
        {variant === 'list' ? (
          <div className="template-tile__highlights">
            {template.highlights.slice(0, 3).map((highlight) => (
              <span key={highlight}>{highlight}</span>
            ))}
          </div>
        ) : null}
      </div>
    </Link>
  );
}
