export const ID_CONTEXT = [
  'dowód',
  'dowodu',
  'nr dowodu',
  'dowód osobisty',
  'seria i nr',
  'dokument',
  'tożsamości',
  'id card',
] as const;

export const ID_WEIGHTS = [7, 3, 1, 0, 7, 3, 1, 7, 3] as const;

export const WITH_CONTEXT_CONFIDENCE = 0.95;
export const WITHOUT_CONTEXT_CONFIDENCE = 0.80;
