export const createPeselPattern = (): RegExp =>
  /(?<!\d)(\d{11})(?!\d)/g;
