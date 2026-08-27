export const createMixedCaseNamePattern = (): RegExp =>
  /\b([A-ZĄĆĘŁŃÓŚŹŻ][a-ząćęłńóśźż]{2,})(?:[\s-]([A-ZĄĆĘŁŃÓŚŹŻ][a-ząćęłńóśźż]{2,})){1,2}\b/g;

export const createAllCapsWordPattern = (): RegExp => /\b[A-ZĄĆĘŁŃÓŚŹŻ]{3,}\b/g;
