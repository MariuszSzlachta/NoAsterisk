import { Check } from 'lucide-react';

interface DetectionChipProps {
  readonly icon: React.ReactNode;
  readonly label: string;
  readonly value: string;
  readonly verified?: boolean;
}

export const DetectionChip = ({
  icon,
  label,
  value,
  verified = false,
}: DetectionChipProps): React.JSX.Element => (
  <div className="flex items-center gap-2 rounded-[9px] border border-border bg-surface-2 px-3 py-2">
    <span className="text-subtle">{icon}</span>
    <div className="flex flex-col">
      <span className="text-[10.5px] font-medium leading-tight text-subtle">
        {label}
      </span>
      <span className="font-mono text-[12.5px] font-medium leading-tight text-foreground">
        {value}
      </span>
    </div>
    {verified && <Check size={14} className="ml-1 text-income" />}
  </div>
);
