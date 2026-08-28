export const createNationalIdPattern = (): RegExp =>
  /\b([A-Z]{3})\s?(\d{6})\b/g;
