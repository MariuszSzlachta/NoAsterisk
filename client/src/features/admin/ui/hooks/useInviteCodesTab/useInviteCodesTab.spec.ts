import { act, renderHook } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import type { UseInviteCodesTabResult } from './useInviteCodesTab';
import { useInviteCodesTab } from './useInviteCodesTab';

// ─── Mocks ───────────────────────────────────────────────────────

const mockGenerate = vi.fn().mockResolvedValue({ code: 'GEN-ABC', id: 'c1', expiresAt: undefined });
const mockDeleteCode = vi.fn().mockResolvedValue({ id: 'c1', deleted: true });

const MOCK_CODES = [
  { id: 'c1', code: 'ABC-123', status: 'Available' as const, createdAt: '2026-08-01', expiresAt: null, usedBy: null, usedAt: null },
  { id: 'c2', code: 'DEF-456', status: 'Used' as const, createdAt: '2026-08-02', expiresAt: '2026-09-01', usedBy: 'user@test.pl', usedAt: '2026-08-05' },
  { id: 'c3', code: 'GHI-789', status: 'Expired' as const, createdAt: '2026-07-01', expiresAt: '2026-07-15', usedBy: null, usedAt: null },
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

describe('useInviteCodesTab', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('maps DTO codes to ViewModels (null → undefined)', () => {
    const { result } = renderHook(() => useInviteCodesTab());
    const data = getLoaded(result.current);

    expect(data.codes).toHaveLength(3);
    expect(data.codes[0].expiresAt).toBeUndefined();
    expect(data.codes[0].usedBy).toBeUndefined();
    expect(data.codes[1].expiresAt).toBe('2026-09-01');
    expect(data.codes[1].usedBy).toBe('user@test.pl');
  });

  it('returns loaded status when data is available', () => {
    const { result } = renderHook(() => useInviteCodesTab());

    expect(result.current.status).toBe('loaded');
  });

  it('starts with no generated code', () => {
    const { result } = renderHook(() => useInviteCodesTab());
    const data = getLoaded(result.current);

    expect(data.generatedCode).toBeUndefined();
  });

  it('starts with empty expiry date', () => {
    const { result } = renderHook(() => useInviteCodesTab());
    const data = getLoaded(result.current);

    expect(data.expiryDate).toBe('');
  });

  it('calls generate with undefined when no expiry date set', () => {
    const { result } = renderHook(() => useInviteCodesTab());

    act(() => {
      getLoaded(result.current).handleGenerate();
    });

    expect(mockGenerate).toHaveBeenCalledWith(undefined);
  });

  it('calls generate with expiry date when set', () => {
    const { result } = renderHook(() => useInviteCodesTab());

    act(() => {
      getLoaded(result.current).handleExpiryChange({ target: { value: '2026-12-31' } } as React.ChangeEvent<HTMLInputElement>);
    });
    act(() => {
      getLoaded(result.current).handleGenerate();
    });

    expect(mockGenerate).toHaveBeenCalledWith('2026-12-31');
  });

  it('updates generatedCode after successful generation', async () => {
    const { result } = renderHook(() => useInviteCodesTab());

    await act(async () => {
      getLoaded(result.current).handleGenerate();
    });

    expect(getLoaded(result.current).generatedCode).toBe('GEN-ABC');
  });

  it('updates expiryDate on change', () => {
    const { result } = renderHook(() => useInviteCodesTab());

    act(() => {
      getLoaded(result.current).handleExpiryChange({ target: { value: '2026-10-15' } } as React.ChangeEvent<HTMLInputElement>);
    });

    expect(getLoaded(result.current).expiryDate).toBe('2026-10-15');
  });

  it('calls deleteCode with correct id', () => {
    const { result } = renderHook(() => useInviteCodesTab());

    act(() => {
      getLoaded(result.current).handleDelete('c2');
    });

    expect(mockDeleteCode).toHaveBeenCalledWith('c2');
  });

  it('copies generatedCode to clipboard', async () => {
    const writeText = vi.fn().mockResolvedValue(undefined);
    Object.assign(navigator, { clipboard: { writeText } });

    const { result } = renderHook(() => useInviteCodesTab());

    await act(async () => {
      getLoaded(result.current).handleGenerate();
    });
    act(() => {
      getLoaded(result.current).handleCopy();
    });

    expect(writeText).toHaveBeenCalledWith('GEN-ABC');
  });
});
