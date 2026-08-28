export const createPlPhonePattern = (): RegExp =>
  /(?:\+48[\s-]?)?(\d{3})[\s-]?(\d{3})[\s-]?(\d{3})\b/g;
