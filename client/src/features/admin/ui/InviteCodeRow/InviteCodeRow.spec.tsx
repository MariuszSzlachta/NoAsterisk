import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import type { InviteCodeViewModel } from '#features/admin';

import { InviteCodeRow } from './InviteCodeRow';

// ─── Mock i18n ───────────────────────────────────────────────────

vi.mock('react-i18next', () => ({
  useTranslation: () => ({ t: (key: string) => key }),
}));

// ─── Test Builders ───────────────────────────────────────────────

const buildCode = (overrides: Partial<InviteCodeViewModel> = {}): InviteCodeViewModel => ({
  id: 'code-1',
  code: 'ABC-123',
  status: 'Available',
  createdAt: '2026-08-20',
  expiresAt: undefined,
  usedBy: undefined,
  usedAt: undefined,
  ...overrides,
});

// ─── Helper ──────────────────────────────────────────────────────

const renderRow = (code: InviteCodeViewModel, onDelete = vi.fn()): ReturnType<typeof render> =>
  render(
    <table>
      <tbody>
        <InviteCodeRow code={code} onDelete={onDelete} />
      </tbody>
    </table>,
  );

// ─── Tests ───────────────────────────────────────────────────────

describe('InviteCodeRow', () => {
  it('renders code value', () => {
    renderRow(buildCode({ code: 'XYZ-999' }));

    expect(screen.getByText('XYZ-999')).toBeInTheDocument();
  });

  it('renders created date', () => {
    renderRow(buildCode({ createdAt: '2026-08-15' }));

    expect(screen.getByText('2026-08-15')).toBeInTheDocument();
  });

  it('renders dash when usedBy is undefined', () => {
    renderRow(buildCode({ usedBy: undefined }));

    expect(screen.getByText('—')).toBeInTheDocument();
  });

  it('renders usedBy when present', () => {
    renderRow(buildCode({ usedBy: 'user@test.pl' }));

    expect(screen.getByText('user@test.pl')).toBeInTheDocument();
  });

  it('shows delete button for Available status', () => {
    renderRow(buildCode({ status: 'Available' }));

    expect(screen.getByRole('button', { name: 'admin.codes.delete' })).toBeInTheDocument();
  });

  it('hides delete button for Used status', () => {
    renderRow(buildCode({ status: 'Used' }));

    expect(screen.queryByRole('button', { name: 'admin.codes.delete' })).not.toBeInTheDocument();
  });

  it('hides delete button for Expired status', () => {
    renderRow(buildCode({ status: 'Expired' }));

    expect(screen.queryByRole('button', { name: 'admin.codes.delete' })).not.toBeInTheDocument();
  });

  it('calls onDelete with code id when delete button clicked', () => {
    const onDelete = vi.fn();
    renderRow(buildCode({ id: 'code-42', status: 'Available' }), onDelete);

    fireEvent.click(screen.getByRole('button', { name: 'admin.codes.delete' }));

    expect(onDelete).toHaveBeenCalledWith('code-42');
  });
});
