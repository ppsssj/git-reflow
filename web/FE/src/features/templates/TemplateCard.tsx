import { Link } from 'react-router-dom';
import { Icon } from '../../components/ui/Icon';
import type { TemplateRecord } from '../../types/template';

interface TemplateCardProps {
  template: TemplateRecord;
}

export function TemplateCard({ template }: TemplateCardProps) {
  return (
    <Link className="template-tile" to={`/templates/${template.id}`}>
      <div className="template-tile__thumb">
        <img alt={template.name} src={template.thumbnail} />
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
      </div>
    </Link>
  );
}
