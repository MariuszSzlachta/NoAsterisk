import type { MaskFn } from '#features/csv-import/model/anonymization/masker/mask-fn';

export const maskEmail: MaskFn = (s) => {
  const atIdx = s.indexOf('@');
  if (atIdx <= 0) {
    return '•••@•••';
  }
  return `${s[0]}•••@${s.slice(atIdx + 1)}`;
};
