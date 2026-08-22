// ═══════════════════════════════════════════════════════════════════
// Admin Feature — Public API
// ═══════════════════════════════════════════════════════════════════

// ─── API Layer ───────────────────────────────────────────────────

export { useAdminUsersQuery } from './api/useAdminUsersQuery';
export { useBlockUserMutation } from './api/useBlockUserMutation';
export { useDeleteInviteCodeMutation } from './api/useDeleteInviteCodeMutation';
export { useDeleteUserMutation } from './api/useDeleteUserMutation';
export { useGenerateCodeMutation } from './api/useGenerateCodeMutation';
export { useInviteCodesQuery } from './api/useInviteCodesQuery';

// ─── Model Layer ─────────────────────────────────────────────────

export type {
  AdminDashboardStats,
  AdminUserRole,
  AdminUserViewModel,
  DictionaryEntryViewModel,
  DictionaryType,
  DictionaryTypeInfo,
  InviteCodeStatus,
  InviteCodeViewModel,
} from './model/types';

// ─── UI Layer ────────────────────────────────────────────────────

export { AdminDashboard } from './ui/AdminDashboard';
export { DictionariesTab } from './ui/DictionariesTab';
export { InviteCodesTab } from './ui/InviteCodesTab';
export { UsersTab } from './ui/UsersTab';
