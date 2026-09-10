import { useEffect, useRef } from 'react';

interface UseInfiniteScrollOptions {
  readonly hasMore: boolean;
  readonly onLoadMore: () => void;
  readonly rootMargin?: string;
}

export const useInfiniteScroll = ({
  hasMore,
  onLoadMore,
  rootMargin = '0px 0px 160px',
}: UseInfiniteScrollOptions): React.RefObject<HTMLDivElement | null> => {
  const sentinelRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const sentinel = sentinelRef.current;
    if (!sentinel || !hasMore) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting) onLoadMore();
      },
      { rootMargin },
    );
    observer.observe(sentinel);

    return () => observer.disconnect();
  }, [hasMore, onLoadMore, rootMargin]);

  return sentinelRef;
};
