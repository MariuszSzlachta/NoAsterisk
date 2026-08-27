export const FULL_CARD = (): RegExp =>
  /\b(\d{4})[\s-](\d{4})[\s-](\d{4})[\s-](\d{4})\b/g;

export const COMPACT_CARD = (): RegExp => /\b(\d{16})\b/g;

export const MASKED_CARD_SPACED = (): RegExp =>
  /[*Xx]{4}[\s-][*Xx]{4}[\s-][*Xx]{4}[\s-]\d{4}/g;

export const DOTTED_CARD = (): RegExp => /\b\d{4}[.*]{2,8}\d{4}\b/g;

export const SHORT_MASKED = (): RegExp => /[*Xx]{4}\d{4}\b/g;

export const BIN_LAST4 = (): RegExp => /\b\d{6}[*Xx]{4,6}\d{4}\b/g;
