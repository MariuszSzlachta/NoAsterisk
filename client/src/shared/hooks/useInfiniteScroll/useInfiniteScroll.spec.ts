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
    class MockIntersectionObserver {
      readonly observe = observe;
      readonly disconnect = disconnect;

      constructor(nextCallback: IntersectionObserverCallback) {
        callback = nextCallback;
      }
    }
    vi.stubGlobal('IntersectionObserver', MockIntersectionObserver);
  });

  it('loads more when the sentinel intersects', () => {
    const onLoadMore = vi.fn();
    let rootMargin = '0px 0px 160px';
    const { result, rerender } = renderHook(() =>
      useInfiniteScroll({ hasMore: true, onLoadMore, rootMargin }),
    );
    result.current.current = document.createElement('div');
    rootMargin = '0px 0px 161px';
    rerender();

    callback?.(
      [{ isIntersecting: true } satisfies IntersectionObserverEntry],
      {} satisfies IntersectionObserver,
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
      [{ isIntersecting: true } satisfies IntersectionObserverEntry],
      {} satisfies IntersectionObserver,
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
