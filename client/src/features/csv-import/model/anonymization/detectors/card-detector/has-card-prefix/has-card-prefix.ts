import { CARD_BRAND_PREFIXES } from '#features/csv-import/model/anonymization/detectors/card-detector/constants/card-brand-prefixes';

export const hasCardPrefix = (digits: string): boolean => {
  const first = digits[0];
  const firstTwo = digits.slice(0, 2);
  const firstFour = digits.slice(0, 4);

  if (first === CARD_BRAND_PREFIXES.visa) {
    return true;
  }
  if (
    (firstTwo >= CARD_BRAND_PREFIXES.mastercardRangeStart && firstTwo <= CARD_BRAND_PREFIXES.mastercardRangeEnd) ||
    (firstFour >= CARD_BRAND_PREFIXES.mastercard2RangeStart && firstFour <= CARD_BRAND_PREFIXES.mastercard2RangeEnd)
  ) {
    return true;
  }
  if (first === CARD_BRAND_PREFIXES.maestro || firstTwo === CARD_BRAND_PREFIXES.maestro50) {
    return true;
  }
  if (firstTwo === CARD_BRAND_PREFIXES.amex34 || firstTwo === CARD_BRAND_PREFIXES.amex37) {
    return true;
  }

  return false;
};
