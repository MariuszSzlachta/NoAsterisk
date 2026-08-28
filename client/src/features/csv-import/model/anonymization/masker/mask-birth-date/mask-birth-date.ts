import type { MaskFn } from '#features/csv-import/model/anonymization/masker/mask-fn';
import { BIRTH_DATE_MASK } from '#features/csv-import/model/anonymization/masker/constants/birth-date-mask';

export const maskBirthDate: MaskFn = () => BIRTH_DATE_MASK;
