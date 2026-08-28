import type { MaskFn } from '#features/csv-import/model/anonymization/masker/mask-fn';
import { EMAIL_FALLBACK_MASK } from '#features/csv-import/model/anonymization/masker/constants/email-fallback';

export const maskEmail: MaskFn = (s) => {
  const atIdx = s.indexOf('@');
  if (atIdx <= 0) {
    return EMAIL_FALLBACK_MASK;
  }
  return `${s[0]}•••@${s.slice(atIdx + 1)}`;
};
