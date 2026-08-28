import type { MonthLocale } from '#features/csv-import/model/parsing/types/month-locale';

import { DE_LOCALE } from '#features/csv-import/model/parsing/date-parser/locales/de-locale';
import { EN_LOCALE } from '#features/csv-import/model/parsing/date-parser/locales/en-locale';
import { PL_LOCALE } from '#features/csv-import/model/parsing/date-parser/locales/pl-locale';

export const ALL_MONTH_LOCALES: readonly MonthLocale[] = [PL_LOCALE, EN_LOCALE, DE_LOCALE];
