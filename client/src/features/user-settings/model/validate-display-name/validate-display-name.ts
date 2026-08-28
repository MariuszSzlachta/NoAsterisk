import { MAX_DISPLAY_NAME_LENGTH } from '#features/user-settings/model/validate-display-name/constants/max-display-name-length';
import type { DisplayNameError } from '#features/user-settings/model/validate-display-name/display-name-error';

export const validateDisplayName = (name: string): DisplayNameError | undefined => {
  if (name.length > MAX_DISPLAY_NAME_LENGTH) {
    return 'TOO_LONG';
  }
  return undefined;
};
