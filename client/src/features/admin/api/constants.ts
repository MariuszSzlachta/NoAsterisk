import { ADMIN_USERS_PATH } from '#features/admin/api/constants/admin-users-path';
import { ADMIN_USERS_QUERY_KEY } from '#features/admin/api/constants/admin-users-query-key';
import { INVITE_CODES_PATH } from '#features/admin/api/constants/invite-codes-path';
import { INVITE_CODES_QUERY_KEY } from '#features/admin/api/constants/invite-codes-query-key';

export const API_CONTRACT = {
  API_PATHS: {
    ADMIN_USERS: ADMIN_USERS_PATH,
    INVITE_CODES: INVITE_CODES_PATH,
  },
  QUERY_KEYS: {
    ADMIN_USERS: ADMIN_USERS_QUERY_KEY,
    INVITE_CODES: INVITE_CODES_QUERY_KEY,
  },
};
