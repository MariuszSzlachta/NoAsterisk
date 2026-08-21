// ═══════════════════════════════════════════════════════════════════
// VaultSection — StatCard Sub-component
// ═══════════════════════════════════════════════════════════════════

interface StatCardProps {
  readonly label: string;
  readonly value: number | string;
}

export const StatCard = ({ label, value }: StatCardProps): React.JSX.Element => (
  <div className="flex flex-col items-center rounded-md border border-border bg-surface-2 px-3 py-2">
    <span className="text-sm font-semibold tabular-nums text-foreground">{value}</span>
    <span className="text-[10px] text-muted-foreground">{label}</span>
  </div>
);
