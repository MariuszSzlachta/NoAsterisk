import type { ReactNode } from 'react';

import type { DomainField } from '#features/csv-import/model/types';
import type { CellRendererParams } from '#shared/adapters/grid';
import type { AnonymizationGridRow } from '#features/csv-import/ui/hooks/useAnonymizationGrid/types';

export type CellRendererMap = Partial<
  Record<
    DomainField,
    (params: CellRendererParams<AnonymizationGridRow>) => ReactNode
  >
>;
