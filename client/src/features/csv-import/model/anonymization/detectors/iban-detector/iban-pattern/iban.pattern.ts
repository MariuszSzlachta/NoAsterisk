export const IBAN_PATTERN = (): RegExp =>
  /\b([A-Z]{2})\s?(\d{2})[\s]?(\d{4})[\s]?(\d{4})[\s]?(\d{4})[\s]?(\d{4})[\s]?(\d{4})[\s]?(\d{4})\b/g;
