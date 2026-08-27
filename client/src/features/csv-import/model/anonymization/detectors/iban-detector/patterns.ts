export const IBAN_PATTERN = (): RegExp =>
  /\b([A-Z]{2})\s?(\d{2})[\s]?(\d{4})[\s]?(\d{4})[\s]?(\d{4})[\s]?(\d{4})[\s]?(\d{4})[\s]?(\d{4})\b/g;

export const IBAN_COMPACT = (): RegExp => /\b([A-Z]{2})(\d{26})\b/g;

export const BARE_PL_IBAN = (): RegExp =>
  /(?<!\d)'?(\d{2})[\s]?(\d{4})[\s]?(\d{4})[\s]?(\d{4})[\s]?(\d{4})[\s]?(\d{4})[\s]?(\d{4})(?!\d)/g;

export const BARE_PL_COMPACT = (): RegExp => /(?<!\d)'?(\d{26})(?!\d)/g;
