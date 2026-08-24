import { act, renderHook } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { useInviteCodesTab } from './useInviteCodesTab';

// ─── Mocks ───────────────────────────────────────────────────────

const mockGenerate = vi.fn().mockResolvedValue({ code: 'GEN-ABC', id: 'c1', expiresAt: undefined });
const mockDeleteCode = vi.fn().mockResolvedValue({ id: 'c1', deleted: true });

const MOCK_CODES = [
  { id: 'c1', code: 'ABC-123', status: 'Available' as const, createdAt: '2026-08-01', expiresAt: null, usedBy: null, usedAt: null },
  { id: 'c2', code: 'DEF-456', status: 'Used' as const, createdAt: '2026-08-02', expiresAt: '2026-09-01', usedBy: 'user@test.pl', usedAt: '2026-08-05' },
  { id: 'c3', code: 'GHI-789', status: 'Expired' as const, createdAt: '2026-07-01', expiresAt: '2026-07-15', usedBy: null, usedAt: null },
];

vi.mock('#features/admin', () => ({
  useInviteCodesQuery: () => ({ status: 'loaded', data: { codes: MOCK_CODES, total: 3 } }),
  useGenerateCodeMutation: () => ({ generate: mockGenerate, isLoading: false }),
  useDeleteInviteCodeMutation: () => ({ deleteCode: mockDeleteCode, isLoading: false }),
}));

// ─── Tests ───────────────────────────────────────────────────────

describe('useInviteCodesTab', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('maps DTO codes to ViewModels (null → undefined)', () => {
    const { result } = renderHook(() => useInviteCodesTab());

    expect(result.current.codes).toHaveLength(3);
    expect(result.current.codes[0].expiresAt).toBeUndefined();
    expect(result.current.codes[0].usedBy).toBeUndefined();
    expect(result.current.codes[1].expiresAt).toBe('2026-09-01');
    expect(result.current.codes[1].usedBy).toBe('user@test.pl');
  });

  it('returns isLoading false when data is loaded', () => {
    const { result } = renderHook(() => useInviteCodesTab());

    expect(result.current.isLoading).toBe(false);
  });

  it('starts with no generated code', () => {
    const { result } = renderHook(() => useInviteCodesTab());

    expect(result.current.generatedCode).toBeUndefined();
  });

  it('starts with empty expiry date', () => {
    const { result } = renderHook(() => useInviteCodesTab());

    expect(result.current.expiryDate).toBe('');
  });

  it('calls generate with undefined when no expiry date set', () => {
    const { result } = renderHook(() => useInviteCodesTab());

    act(() => {
      result.current.handleGenerate();
    });

    expect(mockGenerate).toHaveBeenCalledWith(undefined);
  });

  it('calls generate with expiry date when set', () => {
    const { result } = renderHook(() => useInviteCodesTab());

    act(() => {
      result.current.handleExpiryChange({ target: { value: '2026-12-31' } } as React.ChangeEvent<HTMLInputElement>);
    });
    act(() => {
      result.current.handleGenerate();
    });

    expect(mockGenerate).toHaveBeenCalledWith('2026-12-31');
  });

  it('updates generatedCode after successful generation', async () => {
    const { result } = renderHook(() => useInviteCodesTab());

    await act(async () => {
      result.current.handleGenerate();
    });

    expect(result.current.generatedCode).toBe('GEN-ABC');
  });

  it('updates expiryDate on change', () => {
    const { result } = renderHook(() => useInviteCodesTab());

    act(() => {
      result.current.handleExpiryChange({ target: { value: '2026-10-15' } } as React.ChangeEvent<HTMLInputElement>);
    });

    expect(result.current.expiryDate).toBe('2026-10-15');
  });

  it('calls deleteCode with correct id', () => {
    const { result } = renderHook(() => useInviteCodesTab());

    act(() => {
      result.current.handleDelete('c2');
    });

    expect(mockDeleteCode).toHaveBeenCalledWith('c2');
  });

  it('copies generatedCode to clipboard', async () => {
    const writeText = vi.fn().mockResolvedValue(undefined);
    Object.assign(navigator, { clipboard: { writeText } });

    const { result } = renderHook(() => useInviteCodesTab());

    await act(async () => {
      result.current.handleGenerate();
    });
    act(() => {
      result.current.handleCopy();
    });

    expect(writeText).toHaveBeenCalledWith('GEN-ABC');
  });
});
