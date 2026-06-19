export enum SortDirection {
  Asc = 'asc',
  Desc = 'desc',
}

export interface SortOption<T extends string = string> {
  field: T;
  direction: SortDirection;
}

export interface PageOptions {
  page: number;
  limit: number;
}

export interface PagedQuery<
  TFilter = Record<string, unknown>,
  TSortField extends string = string,
> {
  page: PageOptions;
  sort?: SortOption<TSortField>;
  filter?: TFilter;
}

export interface PagedResult<T> {
  data: T[];
  meta: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}
