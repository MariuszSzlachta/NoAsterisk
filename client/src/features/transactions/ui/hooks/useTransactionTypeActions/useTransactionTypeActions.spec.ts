import { renderHook } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import { useTransactionTypeActions } from '#features/transactions/ui/hooks/useTransactionTypeActions';

describe('useTransactionTypeActions', () => {
  it('changes only the selected transaction type on activation', () => {
    const change = vi.fn();
    const { result } = renderHook(() => useTransactionTypeActions(change));
    const income = result.current.createTypeChangeHandler('income');
    expect(change).not.toHaveBeenCalled();
    income();
    expect(change).toHaveBeenCalledWith('type', 'income');
    result.current.createTypeChangeHandler('expense')();
    expect(change).toHaveBeenLastCalledWith('type', 'expense');
  });
});
