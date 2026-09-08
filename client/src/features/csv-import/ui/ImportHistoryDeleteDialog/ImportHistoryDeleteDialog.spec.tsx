import { fireEvent, render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';

import type { ImportHistoryRecord } from '#features/csv-import/model/history/types';
import { ImportHistoryDeleteDialog } from '#features/csv-import/ui/ImportHistoryDeleteDialog/ImportHistoryDeleteDialog';

vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string, params?: Record<string, unknown>) => {
      const map: Record<string, string> = {
        'importHistory.deleteDialog.cancel': 'Anuluj',
        'importHistory.deleteDialog.confirm': 'Usuń import',
        'importHistory.deleteDialog.description': `Usunąć ${params?.fileName ?? ''}?`,
        'importHistory.deleteDialog.title': 'Usuń import',
      };
      return map[key] ?? key;
    },
  }),
}));

const RECORD: ImportHistoryRecord = {
  batchId: 'batch-1',
  fileName: 'statement.csv',
  completedAt: '2026-09-08T10:00:00.000Z',
  acceptedCount: 1,
  duplicateCount: 0,
  rejectedCount: 0,
};

describe('ImportHistoryDeleteDialog', () => {
  it('calls cancel without confirming the deletion', async () => {
    const user = userEvent.setup();
    const onCancel = vi.fn();
    const onConfirm = vi.fn<() => Promise<void>>();

    render(
      <ImportHistoryDeleteDialog
        record={RECORD}
        isDeleting={false}
        onCancel={onCancel}
        onConfirm={onConfirm}
      />,
    );

    await user.click(
      within(screen.getByRole('dialog')).getByRole('button', {
        name: 'Anuluj',
      }),
    );

    expect(onCancel).toHaveBeenCalledTimes(1);
    expect(onConfirm).not.toHaveBeenCalled();
  });

  it('confirms deletion for the selected filename', async () => {
    const user = userEvent.setup();
    const onConfirm = vi.fn<() => Promise<void>>().mockResolvedValue(undefined);

    render(
      <ImportHistoryDeleteDialog
        record={RECORD}
        isDeleting={false}
        onCancel={vi.fn()}
        onConfirm={onConfirm}
      />,
    );

    await user.click(
      within(screen.getByRole('dialog')).getByRole('button', {
        name: 'Usuń import',
      }),
    );

    expect(screen.getByText(/statement\.csv/)).toBeInTheDocument();
    expect(onConfirm).toHaveBeenCalledTimes(1);
  });

  it('supports keyboard dismissal and describes the dialog', () => {
    const onCancel = vi.fn();

    render(
      <ImportHistoryDeleteDialog
        record={RECORD}
        isDeleting={false}
        onCancel={onCancel}
        onConfirm={vi.fn<() => Promise<void>>()}
      />,
    );

    const dialog = screen.getByRole('dialog');
    expect(dialog).toHaveAttribute('aria-describedby');

    fireEvent.keyDown(dialog, { key: 'Escape' });

    expect(onCancel).toHaveBeenCalledTimes(1);
  });
});
