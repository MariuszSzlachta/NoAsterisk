import { useEffect, useRef, type InputHTMLAttributes } from 'react';

interface CheckboxProps extends Omit<
  InputHTMLAttributes<HTMLInputElement>,
  'type'
> {
  readonly indeterminate?: boolean;
  readonly label?: string;
}

export const Checkbox = ({
  indeterminate = false,
  label,
  className = '',
  id,
  ...props
}: CheckboxProps): React.JSX.Element => {
  const ref = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (ref.current) {
      ref.current.indeterminate = indeterminate;
    }
  }, [indeterminate]);

  const inputId = id ?? label?.toLowerCase().replace(/\s+/g, '-');

  return (
    <label
      className={`inline-flex items-center gap-2 text-sm text-foreground ${className}`}
    >
      <input
        ref={ref}
        type="checkbox"
        id={inputId}
        className="h-4 w-4 cursor-pointer rounded-sm border border-border-strong bg-surface accent-primary focus:outline-none focus:ring-2 focus:ring-primary/40 disabled:cursor-not-allowed disabled:opacity-50"
        {...props}
      />
      {label && <span>{label}</span>}
    </label>
  );
};
