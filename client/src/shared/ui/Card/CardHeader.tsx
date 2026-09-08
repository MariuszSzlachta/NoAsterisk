import type { ReactNode } from 'react';

interface CardHeaderProps {
  readonly title: string;
  readonly subtitle?: string;
  readonly action?: ReactNode;
}

export const CardHeader = ({
  title,
  subtitle,
  action,
}: CardHeaderProps): React.JSX.Element => (
  <div className="mb-4 flex items-start justify-between">
    <div>
      <h3 className="text-sm font-semibold tracking-tight">{title}</h3>
      {subtitle && <p className="mt-0.5 text-xs text-subtle">{subtitle}</p>}
    </div>
    {action}
  </div>
);
