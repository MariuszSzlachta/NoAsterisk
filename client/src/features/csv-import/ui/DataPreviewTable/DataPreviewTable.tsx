import type { CsvRow } from '#features/csv-import/model/types';

interface DataPreviewTableProps {
  readonly headers: readonly string[];
  readonly rows: readonly CsvRow[];
}

export const DataPreviewTable = ({
  headers,
  rows,
}: DataPreviewTableProps): React.JSX.Element => (
  <div className="overflow-x-auto rounded-lg border border-border">
    <table className="w-full text-left font-mono text-[12.5px]">
      <thead>
        <tr className="border-b border-border bg-surface-2">
          {headers.map((header, idx) => (
            <th
              key={`${header}-${idx}`}
              className="whitespace-nowrap px-4 py-2.5 font-medium text-muted-foreground"
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
            className="border-b border-border last:border-b-0"
          >
            {headers.map((header, colIdx) => (
              <td
                key={`${header}-${colIdx}`}
                className="whitespace-nowrap px-4 py-2 text-foreground"
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
