import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import type { AdminUserViewModel } from '#features/admin';

import { UserRow } from './UserRow';

// ─── Mocks ───────────────────────────────────────────────────────

vi.mock('react-i18next', () => ({
  useTranslation: () => ({ t: (key: string) => key }),
}));

const mockHandleBlock = vi.fn();
const mockHandleDelete = vi.fn();

vi.mock('#features/admin/ui/hooks/useUserRowActions', () => ({
  useUserRowActions: () => ({
    handleBlock: mockHandleBlock,
    handleDelete: mockHandleDelete,
  }),
}));

// ─── Test Builder ────────────────────────────────────────────────

const buildUser = (overrides: Partial<AdminUserViewModel> = {}): AdminUserViewModel => ({
  id: 'u-1',
  email: 'test@budget.pl',
  role: 'Member',
  createdAt: '2026-08-01',
  hasVault: false,
  ...overrides,
});

const renderRow = (user: AdminUserViewModel): ReturnType<typeof render> =>
  render(
    <table>
      <tbody>
        <UserRow user={user} onBlock={vi.fn()} onDelete={vi.fn()} />
      </tbody>
    </table>,
  );

// ─── Tests ───────────────────────────────────────────────────────

describe('UserRow', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders user email', () => {
    renderRow(buildUser({ email: 'admin@x.pl' }));

    expect(screen.getByText('admin@x.pl')).toBeInTheDocument();
  });

  it('renders createdAt date', () => {
    renderRow(buildUser({ createdAt: '2026-08-15' }));

    expect(screen.getByText('2026-08-15')).toBeInTheDocument();
  });

  it('shows check icon when user has vault', () => {
    renderRow(buildUser({ hasVault: true }));

    const checkIcon = document.querySelector('.text-income');
    expect(checkIcon).toBeInTheDocument();
  });

  it('shows X icon when user has no vault', () => {
    renderRow(buildUser({ hasVault: false }));

    const xIcon = document.querySelector('.text-muted-foreground');
    expect(xIcon).toBeInTheDocument();
  });

  it('renders block button with correct aria-label for member', () => {
    renderRow(buildUser({ role: 'Member' }));

    expect(screen.getByRole('button', { name: 'admin.users.block' })).toBeInTheDocument();
  });

  it('renders unblock button for blocked user', () => {
    renderRow(buildUser({ role: 'Blocked' }));

    expect(screen.getByRole('button', { name: 'admin.users.unblock' })).toBeInTheDocument();
  });

  it('renders delete button', () => {
    renderRow(buildUser());

    expect(screen.getByRole('button', { name: 'admin.users.delete' })).toBeInTheDocument();
  });

  it('calls handleBlock when block button clicked', () => {
    renderRow(buildUser());

    fireEvent.click(screen.getByRole('button', { name: 'admin.users.block' }));

    expect(mockHandleBlock).toHaveBeenCalledTimes(1);
  });

  it('calls handleDelete when delete button clicked', () => {
    renderRow(buildUser());

    fireEvent.click(screen.getByRole('button', { name: 'admin.users.delete' }));

    expect(mockHandleDelete).toHaveBeenCalledTimes(1);
  });

  it('displays role badge text for blocked user', () => {
    renderRow(buildUser({ role: 'Blocked' }));

    expect(screen.getByText('admin.roles.blocked')).toBeInTheDocument();
  });
});
