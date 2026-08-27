import type { NormalizeStep } from '../types';
import { DEFAULT_NORMALIZE_STEPS } from './steps';

export const normalizeHeader = (
  header: string,
  steps: readonly NormalizeStep[] = DEFAULT_NORMALIZE_STEPS,
): string =>
  steps.reduce((result, step) => step(result), header);
