import type { InputHTMLAttributes, ReactNode } from 'react';

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  icon?: ReactNode;
}

export const Input = ({
  label,
  error,
  icon,
  className = '',
  id,
  ...props
}: InputProps): React.JSX.Element => {
  const inputId = id ?? label?.toLowerCase().replace(/\s+/g, '-');

  return (
    <div className="flex w-full flex-col gap-1.5">
      {label && (
        <label
          htmlFor={inputId}
          className="text-xs font-medium text-muted-foreground"
        >
          {label}
        </label>
      )}
      <div className="relative">
        {icon && (
          <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-subtle">
            {icon}
          </span>
        )}
        <input
          id={inputId}
          aria-invalid={error ? true : undefined}
          aria-describedby={error ? `${inputId}-error` : undefined}
          className={[
            'flex h-9 w-full rounded-md border bg-surface px-3 text-sm text-foreground',
            'placeholder:text-subtle',
            'outline-none transition-colors',
            'focus:border-ring focus:ring-1 focus:ring-ring',
            'disabled:cursor-not-allowed disabled:opacity-50',
            icon ? 'pl-9' : '',
            error ? 'border-expense' : 'border-border',
            className,
          ].join(' ')}
          {...props}
        />
      </div>
      {error && (
        <p
          id={`${inputId}-error`}
          className="text-xs text-expense"
          role="alert"
        >
          {error}
        </p>
      )}
    </div>
  );
};
