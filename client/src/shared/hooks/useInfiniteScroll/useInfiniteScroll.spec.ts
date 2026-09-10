import { renderHook } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { useInfiniteScroll } from '#shared/hooks/useInfiniteScroll';

describe('useInfiniteScroll', () => {
  const observe = vi.fn();
  const disconnect = vi.fn();
  let callback: IntersectionObserverCallback | undefined;

  beforeEach(() => {
    observe.mockReset();
    disconnect.mockReset();
    callback = undefined;
    vi.stubGlobal(
      'IntersectionObserver',
      vi.fn((nextCallback: IntersectionObserverCallback) => {
        callback = nextCallback;
        return { observe, disconnect };
      }),
    );
  });

  it('loads more when the sentinel intersects', () => {
    const onLoadMore = vi.fn();
    const { result, rerender } = renderHook(() =>
      useInfiniteScroll({ hasMore: true, onLoadMore }),
    );
    result.current.current = document.createElement('div');
    rerender();

    callback?.(
      [{ isIntersecting: true } as IntersectionObserverEntry],
      {} as IntersectionObserver,
    );

    expect(observe).toHaveBeenCalled();
    expect(onLoadMore).toHaveBeenCalledOnce();
  });

  it('does not observe or load when there are no more items', () => {
    const onLoadMore = vi.fn();
    const { result, rerender } = renderHook(() =>
      useInfiniteScroll({ hasMore: false, onLoadMore }),
    );
    result.current.current = document.createElement('div');
    rerender();

    callback?.(
      [{ isIntersecting: true } as IntersectionObserverEntry],
      {} as IntersectionObserver,
    );

    expect(observe).not.toHaveBeenCalled();
    expect(onLoadMore).not.toHaveBeenCalled();
  });

  it('disconnects the observer on unmount', () => {
    const { result, rerender, unmount } = renderHook(() =>
      useInfiniteScroll({ hasMore: true, onLoadMore: vi.fn() }),
    );
    result.current.current = document.createElement('div');
    rerender();
    unmount();

    expect(disconnect).toHaveBeenCalled();
  });
});
