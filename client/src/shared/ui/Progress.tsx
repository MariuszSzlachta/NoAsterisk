type ProgressColor = 'primary' | 'income' | 'expense' | 'warning';

interface ProgressProps {
  value: number;
  max?: number;
  color?: ProgressColor;
  className?: string;
}

const COLOR_CLASSES: Record<ProgressColor, string> = {
  primary: 'bg-primary',
  income: 'bg-income',
  expense: 'bg-expense',
  warning: 'bg-warning',
};

export const Progress = ({
  value,
  max = 100,
  color = 'primary',
  className = '',
}: ProgressProps): React.JSX.Element => {
  const percentage = Math.min(100, Math.max(0, (value / max) * 100));

  return (
    <div
      className={`h-2 w-full overflow-hidden rounded-full bg-surface-3 ${className}`}
      role="progressbar"
      aria-valuenow={value}
      aria-valuemin={0}
      aria-valuemax={max}
    >
      <div
        className={`h-full rounded-full transition-all duration-300 ${COLOR_CLASSES[color]}`}
        style={{ width: `${percentage}%` }}
      />
    </div>
  );
};
