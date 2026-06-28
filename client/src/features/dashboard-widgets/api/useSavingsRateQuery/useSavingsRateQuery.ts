import type { QueryState } from '#shared/api';

export interface SavingsRateDto {
  readonly rate: number;
  readonly savedAmount: string;
  readonly income: string;
}

export const useSavingsRateQuery = (): QueryState<SavingsRateDto> => ({
  status: 'loaded',
  data: {
    rate: 29,
    savedAmount: '2 450 zł',
    income: '8 500 zł',
  },
});
