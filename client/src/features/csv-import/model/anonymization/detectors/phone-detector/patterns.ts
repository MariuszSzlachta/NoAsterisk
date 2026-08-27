export const createPlPhonePattern = (): RegExp =>
  /(?:\+48[\s-]?)?(\d{3})[\s-]?(\d{3})[\s-]?(\d{3})\b/g;

export const createIntPhonePattern = (): RegExp =>
  /\+\d{1,3}[\s-]?\d{3,4}[\s-]?\d{3,4}[\s-]?\d{2,4}\b/g;

export const createNoSpacePrefixPattern = (): RegExp =>
  /(?:\(\+?\d{1,3}\)|\+\d{1,3})\d{7,12}\b/g;
