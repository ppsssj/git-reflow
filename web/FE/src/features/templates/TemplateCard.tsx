import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { Icon } from '../../components/ui/Icon';
import type { TemplateRecord } from '../../types/template';

interface TemplateCardProps {
  template: TemplateRecord;
  variant?: 'grid' | 'list';
  canManage?: boolean;
  canCopy?: boolean;
  onCopy?: (template: TemplateRecord, name: string) => void;
  onDelete?: (template: TemplateRecord) => void;
  onOpen?: (template: TemplateRecord) => void;
  onRename?: (template: TemplateRecord) => void;
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

export function TemplateCard({
  template,
  variant = 'grid',
  canManage = true,
  canCopy = true,
  onCopy,
  onDelete,
  onOpen,
  onRename,
}: TemplateCardProps) {
  const [menuOpen, setMenuOpen] = useState(false);
  const [copyOpen, setCopyOpen] = useState(false);
  const [copyName, setCopyName] = useState('');
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!menuOpen) {
      return undefined;
    }

    const handlePointerDown = (event: PointerEvent) => {
      if (menuRef.current?.contains(event.target as Node)) {
        return;
      }

      setMenuOpen(false);
      setCopyOpen(false);
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
      setMenuOpen(false);
      setCopyOpen(false);
      }
    };

    document.addEventListener('pointerdown', handlePointerDown);
    document.addEventListener('keydown', handleKeyDown);

    return () => {
      document.removeEventListener('pointerdown', handlePointerDown);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [menuOpen]);

  const handleMenuAction = (action?: (template: TemplateRecord) => void) => {
    setMenuOpen(false);
    setCopyOpen(false);
    action?.(template);
  };

  const handleCopySubmit = () => {
    setMenuOpen(false);
    setCopyOpen(false);
    onCopy?.(template, copyName.trim());
    setCopyName('');
  };

  return (
    <article
      className={[
        'template-tile',
        `template-tile--${variant}`,
        menuOpen || copyOpen ? 'is-menu-open' : '',
      ].join(' ').trim()}
    >
      <Link className="template-tile__link" to={`/templates/${template.id}`}>
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
      </Link>

      <div className="template-tile__body">
        <div className="template-tile__title">
          <Link to={`/templates/${template.id}`}>
            <h3>{template.name}</h3>
          </Link>
          <div className="template-tile__menu" ref={menuRef}>
            <button
              aria-expanded={menuOpen}
              aria-haspopup="menu"
              aria-label={`${template.name} actions`}
              className="template-tile__menu-trigger"
              type="button"
              onClick={() => setMenuOpen((isOpen) => !isOpen)}
            >
              <Icon name="more_vert" />
            </button>
            {menuOpen ? (
              <div className="template-tile__menu-popover" role="menu">
                <button type="button" role="menuitem" onClick={() => handleMenuAction(onOpen)}>
                  <Icon name="open_in_new" />
                  <span>Open</span>
                </button>
                <button
                  disabled={!canManage}
                  type="button"
                  role="menuitem"
                  onClick={() => handleMenuAction(onRename)}
                >
                  <Icon name="edit" />
                  <span>Rename</span>
                </button>
                <button
                  disabled={!canCopy}
                  type="button"
                  role="menuitem"
                  onClick={() => {
                    setCopyOpen(true);
                    setCopyName('');
                  }}
                >
                  <Icon name="content_copy" />
                  <span>Copy</span>
                </button>
                <button
                  className="is-danger"
                  disabled={!canManage}
                  type="button"
                  role="menuitem"
                  onClick={() => handleMenuAction(onDelete)}
                >
                  <Icon name="delete" />
                  <span>Delete</span>
                </button>
              </div>
            ) : null}
            {copyOpen ? (
              <div className="template-tile__copy-popover">
                <label>
                  <span>Copy as</span>
                  <input
                    autoFocus
                    placeholder={`${template.name} (1)`}
                    type="text"
                    value={copyName}
                    onChange={(event) => setCopyName(event.target.value)}
                    onKeyDown={(event) => {
                      if (event.key === 'Enter') {
                        event.preventDefault();
                        handleCopySubmit();
                      }

                      if (event.key === 'Escape') {
                        setCopyOpen(false);
                      }
                    }}
                  />
                </label>
                <div>
                  <button type="button" onClick={() => setCopyOpen(false)}>
                    Cancel
                  </button>
                  <button type="button" onClick={handleCopySubmit}>
                    Copy
                  </button>
                </div>
              </div>
            ) : null}
          </div>
        </div>
        <Link className="template-tile__content-link" to={`/templates/${template.id}`}>
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
        </Link>
      </div>
    </article>
  );
}
