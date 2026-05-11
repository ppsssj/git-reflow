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
  onRename?: (template: TemplateRecord, name: string) => void;
}

type TemplateActionPanel = 'copy' | 'rename' | 'delete';

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
  const [actionPanel, setActionPanel] = useState<TemplateActionPanel | null>(null);
  const [copyName, setCopyName] = useState('');
  const [renameName, setRenameName] = useState(template.name);
  const menuRef = useRef<HTMLDivElement>(null);

  const closeActionPanel = () => {
    setActionPanel(null);
    setCopyName('');
    setRenameName(template.name);
  };

  useEffect(() => {
    if (!menuOpen) {
      return undefined;
    }

    const handlePointerDown = (event: PointerEvent) => {
      if (menuRef.current?.contains(event.target as Node)) {
        return;
      }

      setMenuOpen(false);
      closeActionPanel();
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setMenuOpen(false);
        closeActionPanel();
      }
    };

    document.addEventListener('pointerdown', handlePointerDown);
    document.addEventListener('keydown', handleKeyDown);

    return () => {
      document.removeEventListener('pointerdown', handlePointerDown);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [menuOpen, template.name]);

  const handleMenuAction = (action?: (template: TemplateRecord) => void) => {
    setMenuOpen(false);
    closeActionPanel();
    action?.(template);
  };

  const handleToggleMenu = () => {
    setMenuOpen((isOpen) => {
      if (isOpen) {
        closeActionPanel();
      }

      return !isOpen;
    });
  };

  const handleCopySubmit = () => {
    setMenuOpen(false);
    onCopy?.(template, copyName.trim());
    closeActionPanel();
  };

  const handleRenameSubmit = () => {
    const nextName = renameName.trim();

    setMenuOpen(false);
    closeActionPanel();
    onRename?.(template, nextName);
  };

  const handleDeleteSubmit = () => {
    setMenuOpen(false);
    closeActionPanel();
    onDelete?.(template);
  };

  return (
    <article
      className={[
        'template-tile',
        `template-tile--${variant}`,
        menuOpen || actionPanel ? 'is-menu-open' : '',
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
              onClick={handleToggleMenu}
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
                  onClick={() => {
                    setActionPanel('rename');
                    setRenameName(template.name);
                  }}
                >
                  <Icon name="edit" />
                  <span>Rename</span>
                </button>
                <button
                  disabled={!canCopy}
                  type="button"
                  role="menuitem"
                  onClick={() => {
                    setActionPanel('copy');
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
                  onClick={() => setActionPanel('delete')}
                >
                  <Icon name="delete" />
                  <span>Delete</span>
                </button>
              </div>
            ) : null}
            {actionPanel === 'copy' ? (
              <div className="template-tile__action-popover template-tile__copy-popover">
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
                        closeActionPanel();
                      }
                    }}
                  />
                </label>
                <div>
                  <button type="button" onClick={closeActionPanel}>
                    Cancel
                  </button>
                  <button type="button" onClick={handleCopySubmit}>
                    Copy
                  </button>
                </div>
              </div>
            ) : null}
            {actionPanel === 'rename' ? (
              <div className="template-tile__action-popover">
                <label>
                  <span>Rename to</span>
                  <input
                    autoFocus
                    type="text"
                    value={renameName}
                    onChange={(event) => setRenameName(event.target.value)}
                    onKeyDown={(event) => {
                      if (event.key === 'Enter') {
                        event.preventDefault();
                        handleRenameSubmit();
                      }

                      if (event.key === 'Escape') {
                        closeActionPanel();
                      }
                    }}
                  />
                </label>
                <div>
                  <button type="button" onClick={closeActionPanel}>
                    Cancel
                  </button>
                  <button type="button" onClick={handleRenameSubmit}>
                    Rename
                  </button>
                </div>
              </div>
            ) : null}
            {actionPanel === 'delete' ? (
              <div className="template-tile__action-popover template-tile__action-popover--danger">
                <strong>Delete template?</strong>
                <p>{template.name}</p>
                <div>
                  <button type="button" onClick={closeActionPanel}>
                    Cancel
                  </button>
                  <button type="button" onClick={handleDeleteSubmit}>
                    Delete
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
