import { act, renderHook } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { useInviteCodesTab } from '#features/admin/ui/hooks/useInviteCodesTab/useInviteCodesTab';

// ─── Mock Setup ──────────────────────────────────────────────────

const mockGenerate = vi.fn();
const mockDeleteCode = vi.fn().mockResolvedValue({ id: 'c-1', deleted: true });

const MOCK_CODES = [
  { id: 'c-1', code: 'ABC-111', status: 'Available' as const, createdAt: '2026-08-01', expiresAt: null, usedBy: null, usedAt: null },
  { id: 'c-2', code: 'DEF-222', status: 'Used' as const, createdAt: '2026-08-02', expiresAt: '2026-09-01', usedBy: 'user@x.pl', usedAt: '2026-08-05' },
  { id: 'c-3', code: 'GHI-333', status: 'Expired' as const, createdAt: '2026-07-01', expiresAt: '2026-07-15', usedBy: null, usedAt: null },
];

vi.mock('#features/admin', () => ({
  useInviteCodesQuery: () => ({ status: 'loaded', data: { codes: MOCK_CODES, total: 3 } }),
  useGenerateCodeMutation: () => ({ generate: mockGenerate, isLoading: false }),
  useDeleteInviteCodeMutation: () => ({ deleteCode: mockDeleteCode, isLoading: false }),
}));

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

    // Step 1: Set expiry date
    act(() => {
      result.current.handleExpiryChange({ target: { value: '2026-12-31' } } as React.ChangeEvent<HTMLInputElement>);
    });
    expect(result.current.expiryDate).toBe('2026-12-31');

    // Step 2: Generate
    await act(async () => {
      result.current.handleGenerate();
    });
    expect(mockGenerate).toHaveBeenCalledWith('2026-12-31');
    expect(result.current.generatedCode).toBe('NEW-CODE-999');

    // Step 3: Copy to clipboard
    act(() => {
      result.current.handleCopy();
    });
    expect(writeText).toHaveBeenCalledWith('NEW-CODE-999');
  });

  it('flow: list codes → delete available → mutation called', () => {
    const { result } = renderHook(() => useInviteCodesTab());

    // Verify list
    expect(result.current.codes).toHaveLength(3);
    expect(result.current.codes[0].code).toBe('ABC-111');

    // Delete available code
    act(() => {
      result.current.handleDelete('c-1');
    });
    expect(mockDeleteCode).toHaveBeenCalledWith('c-1');
  });

  it('flow: generate without expiry → empty body sent', async () => {
    const { result } = renderHook(() => useInviteCodesTab());

    await act(async () => {
      result.current.handleGenerate();
    });

    expect(mockGenerate).toHaveBeenCalledWith(undefined);
  });

  it('maps null fields from API to undefined in ViewModel', () => {
    const { result } = renderHook(() => useInviteCodesTab());

    const availableCode = result.current.codes[0];
    expect(availableCode.expiresAt).toBeUndefined();
    expect(availableCode.usedBy).toBeUndefined();

    const usedCode = result.current.codes[1];
    expect(usedCode.expiresAt).toBe('2026-09-01');
    expect(usedCode.usedBy).toBe('user@x.pl');
  });
});
