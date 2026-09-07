interface CardBrandPrefixes {
  readonly visa: string;
  readonly mastercardRangeStart: string;
  readonly mastercardRangeEnd: string;
  readonly mastercard2RangeStart: string;
  readonly mastercard2RangeEnd: string;
  readonly maestro: string;
  readonly maestro50: string;
  readonly amex34: string;
  readonly amex37: string;
}

export const CARD_BRAND_PREFIXES: CardBrandPrefixes = {
  visa: '4',
  mastercardRangeStart: '51',
  mastercardRangeEnd: '55',
  mastercard2RangeStart: '2221',
  mastercard2RangeEnd: '2720',
  maestro: '6',
  maestro50: '50',
  amex34: '34',
  amex37: '37',
};
