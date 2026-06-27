import type { ButtonHTMLAttributes, ReactNode } from 'react';

type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'destructive';
type ButtonSize = 'sm' | 'md' | 'lg' | 'icon';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  icon?: ReactNode;
  children?: ReactNode;
}

const VARIANT_CLASSES: Record<ButtonVariant, string> = {
  primary:
    'border-transparent bg-primary text-primary-foreground hover:bg-primary/90',
  secondary:
    'border-border-strong bg-surface text-foreground hover:bg-surface-2',
  ghost:
    'border-transparent bg-transparent text-muted-foreground hover:bg-surface-2',
  destructive:
    'border-transparent bg-expense-soft text-expense hover:bg-expense-soft/80',
};

const SIZE_CLASSES: Record<ButtonSize, string> = {
  sm: 'h-8 px-3 text-xs',
  md: 'h-9 px-4 text-sm',
  lg: 'h-10 px-5 text-sm',
  icon: 'h-9 w-9',
};

export const Button = ({
  variant = 'primary',
  size = 'md',
  icon,
  children,
  className = '',
  ...props
}: ButtonProps): React.JSX.Element => {
  const isIconOnly = size === 'icon' || (!children && icon);
  const sizeClass = isIconOnly ? SIZE_CLASSES.icon : SIZE_CLASSES[size];

  return (
    <button
      className={`inline-flex items-center justify-center gap-2 rounded-md border font-medium transition-colors disabled:pointer-events-none disabled:opacity-50 ${VARIANT_CLASSES[variant]} ${sizeClass} ${className}`}
      {...props}
    >
      {icon}
      {children}
    </button>
  );
};
