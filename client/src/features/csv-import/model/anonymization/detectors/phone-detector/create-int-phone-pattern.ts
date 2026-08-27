export const createIntPhonePattern = (): RegExp =>
  /\+\d{1,3}[\s-]?\d{3,4}[\s-]?\d{3,4}[\s-]?\d{2,4}\b/g;
