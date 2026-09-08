import type { ReactNode } from 'react';

interface CardProps {
  children: ReactNode;
  className?: string;
}

export const Card = ({
  children,
  className = '',
}: CardProps): React.JSX.Element => {
  return (
    <div
      className={`flex h-full flex-col rounded-lg border border-border bg-surface p-5 shadow-card ${className}`}
    >
      {children}
    </div>
  );
};
