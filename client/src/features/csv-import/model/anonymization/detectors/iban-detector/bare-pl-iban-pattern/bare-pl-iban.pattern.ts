export const BARE_PL_IBAN = (): RegExp =>
  /(?<!\d)'?(\d{2})[\s]?(\d{4})[\s]?(\d{4})[\s]?(\d{4})[\s]?(\d{4})[\s]?(\d{4})[\s]?(\d{4})(?!\d)/g;
