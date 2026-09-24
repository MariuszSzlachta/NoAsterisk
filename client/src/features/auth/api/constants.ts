import { LOGIN_ENDPOINT } from '#features/auth/api/constants/login-endpoint';
import { PASSKEY_OPTIONS_ENDPOINT } from '#features/auth/api/constants/passkey-options-endpoint';
import { PASSKEY_VERIFY_ENDPOINT } from '#features/auth/api/constants/passkey-verify-endpoint';
import { REFRESH_ENDPOINT } from '#features/auth/api/constants/refresh-endpoint';
import { REGISTER_ENDPOINT } from '#features/auth/api/constants/register-endpoint';

export const API_CONTRACT = {
  API_PATHS: {
    LOGIN: LOGIN_ENDPOINT,
    REFRESH: REFRESH_ENDPOINT,
    REGISTER: REGISTER_ENDPOINT,
    PASSKEY_OPTIONS: PASSKEY_OPTIONS_ENDPOINT,
    PASSKEY_VERIFY: PASSKEY_VERIFY_ENDPOINT,
  },
  QUERY_KEYS: {},
};
