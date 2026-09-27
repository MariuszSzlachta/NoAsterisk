import type { CategoryInfo } from '#model/category/types';
import { recordGuards } from '#shared/lib/record-guards';
import { isRecord } from '#shared/lib/is-record';

export const isCategoryInfo = (value: unknown): value is CategoryInfo =>
  isRecord(value) &&
  recordGuards.hasString(value, 'id') &&
  recordGuards.hasString(value, 'label') &&
  recordGuards.hasString(value, 'color');
