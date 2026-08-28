import { BYTES_PER_KB } from '#features/user-settings/model/estimate-size-kb/constants/bytes-per-kb';

export const estimateSizeKb = (data: string): number =>
  Math.round(new TextEncoder().encode(data).length / BYTES_PER_KB);
