// Standard email: local-part@domain.tld with minimum 2-char TLD
export const createEmailPattern = (): RegExp =>
  /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}\b/g;
