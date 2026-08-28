import type { CellRendererParams } from '#shared/adapters/grid';
import { Tooltip } from '#shared/ui/Tooltip';

import type { AnonymizationGridRow } from '#features/csv-import/ui/hooks/useAnonymizationGrid/types';
import { STATUS_DOT_COLORS } from '#features/csv-import/ui/TitleCellRenderer/status-dot-colors';
import { STATUS_BG_COLORS } from '#features/csv-import/ui/TitleCellRenderer/status-bg-colors';


export const TitleCellRenderer = ({
  value,
  data,
}: CellRendererParams<AnonymizationGridRow>): React.JSX.Element => {
  const status = data.anonymizationStatus;
  const dotColor = STATUS_DOT_COLORS[status] ?? '';
  const bgColor = STATUS_BG_COLORS[status] ?? '';
  const text = String(value);

  return (
    <div
      className={`flex h-full min-w-0 items-center gap-2 rounded-sm px-2 ${bgColor}`}
    >
      <span
        className={`inline-block h-2 w-2 shrink-0 rounded-full ${dotColor}`}
      />
      <span className="min-w-0 flex-1 overflow-hidden">
        {/* Tooltip text-base (16px) is intentionally larger than cell text-[13px] for readability of long transaction titles */}
        <Tooltip
          content={text}
          placement="bottom"
          maxWidth={600}
          className="font-mono text-base"
        >
          <span className="block truncate font-mono text-[13px]">{text}</span>
        </Tooltip>
      </span>
    </div>
  );
};
