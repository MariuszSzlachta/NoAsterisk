import { CheckCircle, RefreshCw, XCircle } from 'lucide-react';

import type { VaultSyncStatus } from '#features/user-settings/model/types/vault-sync-status';

export const STATUS_ICONS: Record<VaultSyncStatus, React.ReactNode> = {
  synced: <CheckCircle size={20} className="text-income" />,
  unsynced: <RefreshCw size={20} className="text-warning" />,
  'no-backup': <XCircle size={20} className="text-expense" />,
};
