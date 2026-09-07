import type { ReactNode } from 'react';

import { Checkbox } from '#shared/ui/Checkbox';

export interface DataTableColumn<TRow> {
  readonly key: string;
  readonly header: string;
  readonly render?: (row: TRow, index: number) => ReactNode;
  readonly className?: string;
}

interface DataTableProps<TRow> {
  readonly columns: readonly DataTableColumn<TRow>[];
  readonly data: readonly TRow[];
  readonly rowKey: (row: TRow, index: number) => string;
  readonly selectable?: boolean;
  readonly selectedKeys?: ReadonlySet<string>;
  readonly onSelectionChange?: (keys: Set<string>) => void;
  readonly className?: string;
}

export const DataTable = <TRow extends object>({
  columns,
  data,
  rowKey,
  selectable = false,
  selectedKeys = new Set(),
  onSelectionChange,
  className = '',
}: DataTableProps<TRow>): React.JSX.Element => {
  const allSelected =
    data.length > 0 && data.every((row, i) => selectedKeys.has(rowKey(row, i)));
  const someSelected = data.some((row, i) => selectedKeys.has(rowKey(row, i)));

  const handleSelectAll = (): void => {
    if (!onSelectionChange) {
      return;
    }
    if (allSelected) {
      onSelectionChange(new Set());
    } else {
      onSelectionChange(new Set(data.map((row, i) => rowKey(row, i))));
    }
  };

  const handleSelectRow = (key: string): void => {
    if (!onSelectionChange) {
      return;
    }
    const next = new Set(selectedKeys);
    if (next.has(key)) {
      next.delete(key);
    } else {
      next.add(key);
    }
    onSelectionChange(next);
  };

  return (
    <div className={`overflow-x-auto ${className}`}>
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-border text-left text-xs font-medium uppercase text-muted-foreground">
            {selectable && (
              <th className="w-10 px-3 py-2">
                <Checkbox
                  checked={allSelected}
                  indeterminate={someSelected && !allSelected}
                  onChange={handleSelectAll}
                  aria-label="Zaznacz wszystkie"
                />
              </th>
            )}
            {columns.map((col) => (
              <th key={col.key} className={`px-3 py-2 ${col.className ?? ''}`}>
                {col.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {data.map((row, i) => {
            const key = rowKey(row, i);
            const isSelected = selectedKeys.has(key);
            return (
              <tr
                key={key}
                className={`border-b border-border/50 transition-colors ${
                  isSelected ? 'bg-primary/5' : 'hover:bg-surface-2'
                }`}
              >
                {selectable && (
                  <td className="w-10 px-3 py-2">
                    <Checkbox
                      checked={isSelected}
                      onChange={() => handleSelectRow(key)}
                      aria-label={`Zaznacz wiersz ${i + 1}`}
                    />
                  </td>
                )}
                {columns.map((col) => (
                  <td
                    key={col.key}
                    className={`px-3 py-2 ${col.className ?? ''}`}
                  >
                    {col.render
                      ? col.render(row, i)
                      : String((row as Record<string, unknown>)[col.key] ?? '')}
                  </td>
                ))}
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
};
