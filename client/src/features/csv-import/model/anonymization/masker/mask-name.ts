import type { MaskFn } from './mask-fn';
import { NAME_MAX_BULLET_LENGTH } from './constants/name-max-bullet-length';

export const maskName: MaskFn = (s) =>
  s
    .split(/[\s-]+/)
    .filter((p) => p.length > 0)
    .map(
      (p) =>
        `${p[0]}${'•'.repeat(Math.min(p.length - 1, NAME_MAX_BULLET_LENGTH))}`,
    )
    .join(' ');
