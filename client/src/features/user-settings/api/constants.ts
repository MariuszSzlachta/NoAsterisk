import { USERS_ME_CHANGE_PASSWORD_PATH } from '#features/user-settings/api/constants/users-me-change-password-path';
import { USERS_ME_DELETE_PATH } from '#features/user-settings/api/constants/users-me-delete-path';
import { USERS_ME_LOGOUT_PATH } from '#features/user-settings/api/constants/users-me-logout-path';
import { USERS_ME_PATH } from '#features/user-settings/api/constants/users-me-path';
import { USERS_ME_PREFERENCES_PATH } from '#features/user-settings/api/constants/users-me-preferences-path';
import { USERS_ME_VAULT_PATH } from '#features/user-settings/api/constants/users-me-vault-path';

export const API_CONTRACT = {
  API_PATHS: {
    USERS_ME: USERS_ME_PATH,
    USERS_ME_CHANGE_PASSWORD: USERS_ME_CHANGE_PASSWORD_PATH,
    USERS_ME_DELETE: USERS_ME_DELETE_PATH,
    USERS_ME_LOGOUT: USERS_ME_LOGOUT_PATH,
    USERS_ME_PREFERENCES: USERS_ME_PREFERENCES_PATH,
    USERS_ME_VAULT: USERS_ME_VAULT_PATH,
  },
  QUERY_KEYS: {},
};
