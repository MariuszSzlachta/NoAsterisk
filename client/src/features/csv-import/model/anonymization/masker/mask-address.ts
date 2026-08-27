import type { MaskFn } from './mask-fn';

export const maskAddress: MaskFn = (s) => {
  const prefix = s.match(/^(ul\.|al\.|os\.|pl\.|\d{2}-\d{3})/i);
  return prefix ? `${prefix[0]} •••` : '••• •••';
};
