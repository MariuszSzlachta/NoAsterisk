import type { ReactNode } from 'react';

interface CardProps {
  children: ReactNode;
  className?: string;
}

interface CardHeaderProps {
  title: string;
  subtitle?: string;
  action?: ReactNode;
}

export const Card = ({ children, className = '' }: CardProps): React.JSX.Element => {
  return (
    <div className={`rounded-lg border border-border bg-surface p-5 shadow-card ${className}`}>
      {children}
    </div>
  );
};

export const CardHeader = ({ title, subtitle, action }: CardHeaderProps): React.JSX.Element => {
  return (
    <div className="mb-4 flex items-start justify-between">
      <div>
        <h3 className="text-sm font-semibold tracking-tight">{title}</h3>
        {subtitle && <p className="mt-0.5 text-xs text-subtle">{subtitle}</p>}
      </div>
      {action}
    </div>
  );
};
