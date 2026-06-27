import type { QueryState } from '#shared/api';
import { Skeleton } from '#shared/ui/Skeleton';

interface QueryRendererProps<TData> {
  readonly state: QueryState<TData>;
  readonly skeleton?: React.JSX.Element;
  readonly children: (data: TData) => React.JSX.Element;
}

export const QueryRenderer = <TData,>({
  state,
  skeleton,
  children,
}: QueryRendererProps<TData>): React.JSX.Element => {
  switch (state.status) {
    case 'loading':
    case 'notLoaded':
      return skeleton ?? <Skeleton className="h-[320px] w-full" />;
    case 'error':
      return <p className="text-sm text-expense">{state.error}</p>;
    case 'loaded':
      return children(state.data);
  }
};
