import { act, renderHook } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import { useLayeredOverlayDismiss } from '#shared/hooks/useLayeredOverlayDismiss';

describe('useLayeredOverlayDismiss', () => {
  it('closes the child overlay before the parent modal', () => {
    const onClose = vi.fn();
    const { result } = renderHook(() => useLayeredOverlayDismiss(onClose));

    act(() => result.current.setChildOpen(true));
    expect(result.current.isChildOpen).toBe(true);

    act(() => result.current.handleBackdropClick());

    expect(result.current.isChildOpen).toBe(false);
    expect(onClose).not.toHaveBeenCalled();

    act(() => result.current.handleBackdropClick());

    expect(onClose).toHaveBeenCalledOnce();
  });

  it('closes the parent modal immediately when no child overlay is open', () => {
    const onClose = vi.fn();
    const { result } = renderHook(() => useLayeredOverlayDismiss(onClose));

    act(() => result.current.handleBackdropClick());

    expect(onClose).toHaveBeenCalledOnce();
  });

  it('resets the child overlay when the parent closes', () => {
    const onClose = vi.fn();
    const { result } = renderHook(() => useLayeredOverlayDismiss(onClose));

    act(() => result.current.setChildOpen(true));
    act(() => result.current.handleClose());

    expect(result.current.isChildOpen).toBe(false);
    expect(onClose).toHaveBeenCalledOnce();
  });
});
