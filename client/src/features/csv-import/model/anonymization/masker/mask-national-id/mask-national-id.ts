import type { MaskFn } from '#features/csv-import/model/anonymization/masker/mask-fn';

export const maskNationalId: MaskFn = (s) => `${s.slice(0, 3)} ••••••`;
