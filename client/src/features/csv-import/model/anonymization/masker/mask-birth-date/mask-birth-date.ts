import type { MaskFn } from '#features/csv-import/model/anonymization/masker/mask-fn';

export const maskBirthDate: MaskFn = () => 'ur. ••.••.••••';
