import { renderHook } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import { useBoundAction } from '#shared/hooks/useBoundAction';

describe('useBoundAction', () => {
  it('should invoke the boundary only when the event is handled', () => {
    const action = vi.fn();
    const { result } = renderHook(() => useBoundAction('id', action));
    expect(action).not.toHaveBeenCalled();
    result.current.handleAction();
    expect(action).toHaveBeenCalledWith('id');
  });
  it('should safely handle an absent optional action', () => {
    const { result } = renderHook(() => useBoundAction('id', undefined));
    expect(() => result.current.handleAction()).not.toThrow();
  });
});
