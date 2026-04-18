import type { PropsWithChildren, ReactNode } from 'react';
import { SiteHeader } from './SiteHeader';

interface WorkspaceShellProps {
  title: string;
  description: string;
  sidebar?: ReactNode;
}

export function WorkspaceShell({
  title,
  description,
  sidebar,
  children,
}: PropsWithChildren<WorkspaceShellProps>) {
  return (
    <div className="workspace-shell">
      <SiteHeader context="workspace" subtitle={description} />
      <main className="workspace-shell__body">
        {sidebar ? <aside className="workspace-shell__sidebar">{sidebar}</aside> : null}
        <section className="workspace-shell__content">
          <div className="page-heading">
            <p className="page-heading__eyebrow">Web Dashboard</p>
            <h1>{title}</h1>
            <p>{description}</p>
          </div>
          {children}
        </section>
      </main>
    </div>
  );
}

