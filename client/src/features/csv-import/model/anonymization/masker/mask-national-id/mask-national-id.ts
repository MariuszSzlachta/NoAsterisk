import type { MaskFn } from '#features/csv-import/model/anonymization/masker/mask-fn';
import { NATIONAL_ID_PREFIX_LENGTH } from '#features/csv-import/model/anonymization/masker/constants/national-id-prefix-length';

export const maskNationalId: MaskFn = (s) => `${s.slice(0, NATIONAL_ID_PREFIX_LENGTH)} ••••••`;
