import type { PropsWithChildren, ReactNode } from 'react';

interface PanelProps {
  title?: string;
  description?: string;
  actions?: ReactNode;
  className?: string;
}

export function Panel({
  title,
  description,
  actions,
  className = '',
  children,
}: PropsWithChildren<PanelProps>) {
  return (
    <section className={`panel ${className}`.trim()}>
      {(title || description || actions) && (
        <header className="panel__header">
          <div>
            {title ? <h2 className="panel__title">{title}</h2> : null}
            {description ? <p className="panel__description">{description}</p> : null}
          </div>
          {actions ? <div className="panel__actions">{actions}</div> : null}
        </header>
      )}
      {children}
    </section>
  );
}

