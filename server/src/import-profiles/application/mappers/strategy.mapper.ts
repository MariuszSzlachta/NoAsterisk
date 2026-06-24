import { AnonymizationStrategy } from '@import-profiles/domain/anonymization-strategy.enum';

export type AnonymizationStrategyDto = 'Hash' | 'Mask' | 'Remove';

export const STRATEGY_FROM_DTO: Record<
  AnonymizationStrategyDto,
  AnonymizationStrategy
> = {
  Hash: AnonymizationStrategy.Hash,
  Mask: AnonymizationStrategy.Mask,
  Remove: AnonymizationStrategy.Remove,
};
