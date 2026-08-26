import { useQuery } from '@tanstack/react-query';

import type { QueryState } from '#shared/api/query-state';

interface UseApiQueryOptions<TResponse> {
  readonly queryKey: readonly unknown[];
  readonly queryFn: () => Promise<TResponse>;
  readonly enabled?: boolean;
}

export const useApiQuery = <TResponse>(
  options: UseApiQueryOptions<TResponse>,
): QueryState<TResponse> => {
  const { data, status, fetchStatus, error } = useQuery({
    queryKey: options.queryKey,
    queryFn: options.queryFn,
    enabled: options.enabled,
  });

  if (status === 'pending' && fetchStatus === 'idle') {
    return { status: 'notLoaded' };
  }
  if (status === 'pending') {
    return { status: 'loading' };
  }
  if (status === 'error') {
    return { status: 'error', error: error.message };
  }

  return { status: 'loaded', data };
};
