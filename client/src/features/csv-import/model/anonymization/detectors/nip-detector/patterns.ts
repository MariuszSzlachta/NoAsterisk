export const createNipDashedPattern = (): RegExp =>
  /(?<!\d)(\d{3})-(\d{3})-(\d{2})-(\d{2})(?!\d)/g;

export const createNipCompactPattern = (): RegExp =>
  /(?<!\d)(\d{10})(?!\d)/g;
