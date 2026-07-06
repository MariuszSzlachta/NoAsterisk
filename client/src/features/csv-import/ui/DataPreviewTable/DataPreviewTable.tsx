import type { CsvRow } from '#features/csv-import/model/types';

interface DataPreviewTableProps {
  readonly headers: readonly string[];
  readonly rows: readonly CsvRow[];
  readonly selectedRowIndex?: number;
  readonly onRowSelect?: (index: number) => void;
}

export const DataPreviewTable = ({
  headers,
  rows,
  selectedRowIndex = 0,
  onRowSelect,
}: DataPreviewTableProps): React.JSX.Element => (
  <div className="overflow-x-auto rounded-lg border border-border">
    <table className="w-full min-w-[640px] border-collapse font-mono text-xs leading-normal">
      <thead>
        <tr className="border-b border-border bg-surface-2">
          {headers.map((header, idx) => (
            <th
              key={`${header}-${idx}`}
              className="whitespace-nowrap px-4 py-2 text-left font-medium text-subtle"
            >
              {header}
            </th>
          ))}
        </tr>
      </thead>
      <tbody>
        {rows.map((row, rowIdx) => (
          <tr
            key={rowIdx}
            onClick={onRowSelect ? () => onRowSelect(rowIdx) : undefined}
            className={`border-b border-border last:border-b-0 transition-colors duration-150 ${
              onRowSelect ? 'cursor-pointer hover:bg-surface-3' : ''
            } ${rowIdx === selectedRowIndex ? 'bg-primary-soft' : ''}`}
          >
            {headers.map((header, colIdx) => (
              <td
                key={`${header}-${colIdx}`}
                className={`whitespace-nowrap px-4 py-1.5 ${
                  rowIdx === selectedRowIndex ? 'text-foreground' : 'text-muted-foreground'
                }`}
              >
                {row[header] ?? ''}
              </td>
            ))}
          </tr>
        ))}
      </tbody>
    </table>
  </div>
);
