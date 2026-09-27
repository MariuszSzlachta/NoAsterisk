import type { CategoryInfo } from '#model/category/types';
import { isRecord } from '#shared/lib/is-record';
import { recordGuards } from '#shared/lib/record-guards';

export const isCategoryInfo = (value: unknown): value is CategoryInfo =>
  isRecord(value) &&
  recordGuards.hasString(value, 'id') &&
  recordGuards.hasString(value, 'label') &&
  recordGuards.hasString(value, 'color');
