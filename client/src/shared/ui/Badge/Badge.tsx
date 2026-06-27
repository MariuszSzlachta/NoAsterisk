import type { ReactNode } from 'react';

type BadgeVariant = 'soft' | 'solid' | 'outline';
type BadgeColor =
  | 'primary'
  | 'income'
  | 'expense'
  | 'warning'
  | 'neutral'
  | 'purple'
  | 'blue'
  | 'amber';

interface BadgeProps {
  variant?: BadgeVariant;
  color?: BadgeColor;
  dot?: boolean;
  children: ReactNode;
  className?: string;
}

const COLOR_CLASSES: Record<BadgeColor, Record<BadgeVariant, string>> = {
  primary: {
    soft: 'bg-primary-soft text-primary',
    solid: 'bg-primary text-primary-foreground',
    outline: 'border-primary text-primary',
  },
  income: {
    soft: 'bg-income-soft text-income',
    solid: 'bg-income text-primary-foreground',
    outline: 'border-income text-income',
  },
  expense: {
    soft: 'bg-expense-soft text-expense',
    solid: 'bg-expense text-primary-foreground',
    outline: 'border-expense text-expense',
  },
  warning: {
    soft: 'bg-warning-soft text-warning',
    solid: 'bg-warning text-primary-foreground',
    outline: 'border-warning text-warning',
  },
  neutral: {
    soft: 'bg-surface-3 text-muted-foreground',
    solid: 'bg-muted-foreground text-primary-foreground',
    outline: 'border-border-strong text-muted-foreground',
  },
  purple: {
    soft: 'bg-[rgba(167,139,250,0.14)] text-cat-subscriptions',
    solid: 'bg-cat-subscriptions text-primary-foreground',
    outline: 'border-cat-subscriptions text-cat-subscriptions',
  },
  blue: {
    soft: 'bg-primary-soft text-cat-transport',
    solid: 'bg-cat-transport text-primary-foreground',
    outline: 'border-cat-transport text-cat-transport',
  },
  amber: {
    soft: 'bg-warning-soft text-cat-dining',
    solid: 'bg-cat-dining text-primary-foreground',
    outline: 'border-cat-dining text-cat-dining',
  },
};

export const Badge = ({
  variant = 'soft',
  color = 'neutral',
  dot = true,
  children,
  className = '',
}: BadgeProps): React.JSX.Element => {
  const colorClasses = COLOR_CLASSES[color][variant];
  const borderBase =
    variant === 'outline' ? 'border' : 'border border-transparent';

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-md py-[3px] pl-2 pr-[9px] text-xs font-medium ${borderBase} ${colorClasses} ${className}`}
    >
      {dot && <span className="h-1.5 w-1.5 rounded-sm bg-current" />}
      {children}
    </span>
  );
};
