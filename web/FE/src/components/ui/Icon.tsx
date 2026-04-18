interface IconProps {
  name: string;
  className?: string;
}

export function Icon({ name, className = '' }: IconProps) {
  return (
    <span className={['material-symbols-outlined', className].join(' ').trim()} aria-hidden="true">
      {name}
    </span>
  );
}

