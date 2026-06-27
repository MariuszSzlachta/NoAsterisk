import type { ReactNode } from 'react';
import { Link, useLocation } from 'react-router-dom';
import type { LucideIcon } from 'lucide-react';

interface SidebarNavLinkProps {
  readonly icon: LucideIcon;
  readonly to: string;
  readonly children: ReactNode;
  readonly trailing?: ReactNode;
  readonly onClick?: () => void;
}

const BASE_CLASSES =
  'flex w-full items-center gap-[11px] rounded-lg px-2.5 py-2 text-[13px] font-medium tracking-tight transition-colors';
const ACTIVE_CLASSES = 'bg-primary-soft text-primary';
const INACTIVE_CLASSES = 'text-muted-foreground hover:bg-surface-2';

export const SidebarNavLink = ({
  icon: Icon,
  to,
  children,
  trailing,
  onClick,
}: SidebarNavLinkProps): React.JSX.Element => {
  const { pathname } = useLocation();
  const isActive = pathname === to;

  return (
    <Link
      to={to}
      onClick={onClick}
      aria-current={isActive ? 'page' : undefined}
      className={`${BASE_CLASSES} ${isActive ? ACTIVE_CLASSES : INACTIVE_CLASSES}`}
    >
      <Icon size={18} aria-hidden="true" />
      <span className="flex-1">{children}</span>
      {trailing}
    </Link>
  );
};
