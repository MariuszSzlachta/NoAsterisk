import type { MaskFn } from './mask-fn';

export const maskNationalId: MaskFn = (s) => `${s.slice(0, 3)} ••••••`;
