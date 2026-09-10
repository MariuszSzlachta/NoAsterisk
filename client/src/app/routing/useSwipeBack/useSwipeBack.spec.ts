import { renderHook, act } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { useSwipeBack } from '#app/routing/useSwipeBack';

const mockNavigate = vi.fn();

vi.mock('react-router-dom', () => ({
  useNavigate: () => mockNavigate,
}));

const setTouchDevice = (matches: boolean): void => {
  Object.defineProperty(window, 'matchMedia', {
    configurable: true,
    value: vi.fn(() => ({
      matches,
      media: '(pointer: coarse)',
      onchange: null,
      addListener: vi.fn(),
      removeListener: vi.fn(),
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      dispatchEvent: vi.fn(),
    })),
  });
};

const touch = (clientX: number, clientY: number) => ({
  clientX,
  clientY,
});

describe('useSwipeBack', () => {
  beforeEach(() => {
    mockNavigate.mockReset();
    vi.restoreAllMocks();
  });

  it('navigates back after a horizontal swipe from the left edge', () => {
    setTouchDevice(true);
    renderHook(() => useSwipeBack());

    act(() => {
      window.dispatchEvent(
        new TouchEvent('touchstart', { touches: [touch(20, 200)] as any }),
      );
      window.dispatchEvent(
        new TouchEvent('touchend', {
          changedTouches: [touch(120, 205)] as any,
        }),
      );
    });

    expect(mockNavigate).toHaveBeenCalledWith(-1);
  });

  it('ignores swipes that do not start near the left edge', () => {
    setTouchDevice(true);
    renderHook(() => useSwipeBack());

    act(() => {
      window.dispatchEvent(
        new TouchEvent('touchstart', { touches: [touch(80, 200)] as any }),
      );
      window.dispatchEvent(
        new TouchEvent('touchend', {
          changedTouches: [touch(180, 200)] as any,
        }),
      );
    });

    expect(mockNavigate).not.toHaveBeenCalled();
  });

  it('ignores short and mostly vertical swipes', () => {
    setTouchDevice(true);
    renderHook(() => useSwipeBack());

    act(() => {
      window.dispatchEvent(
        new TouchEvent('touchstart', { touches: [touch(20, 200)] as any }),
      );
      window.dispatchEvent(
        new TouchEvent('touchend', {
          changedTouches: [touch(70, 280)] as any,
        }),
      );
    });

    expect(mockNavigate).not.toHaveBeenCalled();
  });

  it('does nothing on a non-touch device', () => {
    setTouchDevice(false);
    renderHook(() => useSwipeBack());

    act(() => {
      window.dispatchEvent(
        new TouchEvent('touchstart', { touches: [touch(20, 200)] as any }),
      );
      window.dispatchEvent(
        new TouchEvent('touchend', {
          changedTouches: [touch(120, 200)] as any,
        }),
      );
    });

    expect(mockNavigate).not.toHaveBeenCalled();
  });
});
