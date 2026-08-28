import { TAB_PATTERN } from '#features/csv-import/model/anonymization/pipeline/steps/normalize-whitespace/constants/tab-pattern';
import { MULTI_SPACE_PATTERN } from '#features/csv-import/model/anonymization/pipeline/steps/normalize-whitespace/constants/multi-space-pattern';

export const normalizeWhitespace = (text: string): string =>
  text.replace(TAB_PATTERN, ' ').replace(MULTI_SPACE_PATTERN, ' ').trim();
