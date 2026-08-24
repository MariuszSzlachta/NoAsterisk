import { renderHook } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import type { AdminUserViewModel } from '#features/admin';

import { useUserRowActions } from './useUserRowActions';

// ─── Test Builders ───────────────────────────────────────────────

const buildUser = (overrides: Partial<AdminUserViewModel> = {}): AdminUserViewModel => ({
  id: 'user-1',
  email: 'test@budget.pl',
  role: 'Member',
  createdAt: '2026-08-01',
  hasVault: false,
  ...overrides,
});

// ─── Tests ───────────────────────────────────────────────────────

describe('useUserRowActions', () => {
  it('calls onBlock with userId and true when user is not blocked', () => {
    const onBlock = vi.fn();
    const onDelete = vi.fn();
    const user = buildUser({ id: 'u-42', role: 'Member' });

    const { result } = renderHook(() => useUserRowActions(user, onBlock, onDelete));
    result.current.handleBlock();

    expect(onBlock).toHaveBeenCalledWith('u-42', true);
  });

  it('calls onBlock with userId and false when user is already blocked', () => {
    const onBlock = vi.fn();
    const onDelete = vi.fn();
    const user = buildUser({ id: 'u-99', role: 'Blocked' });

    const { result } = renderHook(() => useUserRowActions(user, onBlock, onDelete));
    result.current.handleBlock();

    expect(onBlock).toHaveBeenCalledWith('u-99', false);
  });

  it('calls onDelete with the user object', () => {
    const onBlock = vi.fn();
    const onDelete = vi.fn();
    const user = buildUser({ id: 'u-7', email: 'delete-me@test.pl' });

    const { result } = renderHook(() => useUserRowActions(user, onBlock, onDelete));
    result.current.handleDelete();

    expect(onDelete).toHaveBeenCalledWith(user);
  });
});
