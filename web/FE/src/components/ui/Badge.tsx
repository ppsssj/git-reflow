import type { PropsWithChildren } from 'react';

interface BadgeProps {
  tone?: 'primary' | 'secondary' | 'neutral' | 'success';
}

export function Badge({
  children,
  tone = 'neutral',
}: PropsWithChildren<BadgeProps>) {
  return <span className={`badge badge--${tone}`}>{children}</span>;
}

