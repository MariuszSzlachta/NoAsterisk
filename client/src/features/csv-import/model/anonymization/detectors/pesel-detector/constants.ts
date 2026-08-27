export const PESEL_CONTEXT = [
  'pesel',
  'pesel:',
  'nr pesel',
  'numer pesel',
] as const;

export const PESEL_WEIGHTS = [1, 3, 7, 9, 1, 3, 7, 9, 1, 3] as const;

export const WITH_CONTEXT_CONFIDENCE = 0.99;
export const WITHOUT_CONTEXT_CONFIDENCE = 0.88;
