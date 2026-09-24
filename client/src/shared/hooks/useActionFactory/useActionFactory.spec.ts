import { renderHook } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import { useActionFactory } from '#shared/hooks/useActionFactory';

describe('useActionFactory', () => {
  it('should invoke the boundary only when the event is handled', () => {
    const action = vi.fn();
    const { result } = renderHook(() => useActionFactory(action));
    expect(action).not.toHaveBeenCalled();
    result.current.createActionHandler('id')();
    expect(action).toHaveBeenCalledWith('id');
  });
});
