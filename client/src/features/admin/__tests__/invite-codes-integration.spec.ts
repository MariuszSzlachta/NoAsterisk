import { act, renderHook } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import type { UseInviteCodesTabResult } from '#features/admin/ui/hooks/useInviteCodesTab/useInviteCodesTab';
import { useInviteCodesTab } from '#features/admin/ui/hooks/useInviteCodesTab/useInviteCodesTab';

// ─── Mock Setup ──────────────────────────────────────────────────

const mockGenerate = vi.fn();
const mockDeleteCode = vi.fn().mockResolvedValue({ id: 'c-1', deleted: true });

const MOCK_CODES = [
  { id: 'c-1', code: 'ABC-111', status: 'Available', createdAt: '2026-08-01', expiresAt: null, usedBy: null, usedAt: null },
  { id: 'c-2', code: 'DEF-222', status: 'Used', createdAt: '2026-08-02', expiresAt: '2026-09-01', usedBy: 'user@x.pl', usedAt: '2026-08-05' },
  { id: 'c-3', code: 'GHI-333', status: 'Expired', createdAt: '2026-07-01', expiresAt: '2026-07-15', usedBy: null, usedAt: null },
];

vi.mock('#features/admin/api/useInviteCodesQuery', () => ({
  useInviteCodesQuery: () => ({ status: 'loaded', data: { codes: MOCK_CODES, total: 3 } }),
}));

vi.mock('#features/admin/api/useGenerateCodeMutation', () => ({
  useGenerateCodeMutation: () => ({ generate: mockGenerate, isLoading: false, error: undefined }),
}));

vi.mock('#features/admin/api/useDeleteInviteCodeMutation', () => ({
  useDeleteInviteCodeMutation: () => ({ deleteCode: mockDeleteCode, isLoading: false, error: undefined }),
}));

// ─── Helpers ─────────────────────────────────────────────────────

const getLoaded = (result: UseInviteCodesTabResult) => {
  if (result.status !== 'loaded') throw new Error(`Expected loaded, got ${result.status}`);
  return result;
};

// ─── Tests ───────────────────────────────────────────────────────

describe('Invite Codes — integration flow', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockGenerate.mockResolvedValue({ id: 'c-new', code: 'NEW-CODE-999', expiresAt: undefined });
  });

  it('flow: set expiry → generate → code appears → copy', async () => {
    const writeText = vi.fn().mockResolvedValue(undefined);
    Object.assign(navigator, { clipboard: { writeText } });

    const { result } = renderHook(() => useInviteCodesTab());

    act(() => {
      getLoaded(result.current).handleExpiryChange({ target: { value: '2026-12-31' } } satisfies React.ChangeEvent<HTMLInputElement>);
    });
    expect(getLoaded(result.current).expiryDate).toBe('2026-12-31');

    await act(async () => {
      getLoaded(result.current).handleGenerate();
    });
    expect(mockGenerate).toHaveBeenCalledWith('2026-12-31');
    expect(getLoaded(result.current).generatedCode).toBe('NEW-CODE-999');

    act(() => {
      getLoaded(result.current).handleCopy();
    });
    expect(writeText).toHaveBeenCalledWith('NEW-CODE-999');
  });

  it('flow: list codes → delete available → mutation called', () => {
    const { result } = renderHook(() => useInviteCodesTab());
    const data = getLoaded(result.current);

    expect(data.codes).toHaveLength(3);
    expect(data.codes[0].code).toBe('ABC-111');

    act(() => {
      getLoaded(result.current).handleDelete('c-1');
    });
    expect(mockDeleteCode).toHaveBeenCalledWith('c-1');
  });

  it('flow: generate without expiry → empty body sent', async () => {
    const { result } = renderHook(() => useInviteCodesTab());

    await act(async () => {
      getLoaded(result.current).handleGenerate();
    });

    expect(mockGenerate).toHaveBeenCalledWith(undefined);
  });

  it('maps null fields from API to undefined in ViewModel', () => {
    const { result } = renderHook(() => useInviteCodesTab());
    const data = getLoaded(result.current);

    const availableCode = data.codes[0];
    expect(availableCode.expiresAt).toBeUndefined();
    expect(availableCode.usedBy).toBeUndefined();

    const usedCode = data.codes[1];
    expect(usedCode.expiresAt).toBe('2026-09-01');
    expect(usedCode.usedBy).toBe('user@x.pl');
  });
});
