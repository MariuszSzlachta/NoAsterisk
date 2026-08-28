export const createNoSpacePrefixPattern = (): RegExp =>
  /(?:\(\+?\d{1,3}\)|\+\d{1,3})\d{7,12}\b/g;
