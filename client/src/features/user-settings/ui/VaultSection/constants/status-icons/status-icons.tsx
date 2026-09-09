import {
  AlertTriangle,
  CheckCircle,
  Cloud,
  RefreshCw,
  XCircle,
} from 'lucide-react';

import type { VaultSyncStatus } from '#features/user-settings/model/types/vault-sync-status';

export const STATUS_ICONS: Record<VaultSyncStatus, React.ReactNode> = {
  'up-to-date': <CheckCircle size={20} className="text-income" />,
  'local-changes': <RefreshCw size={20} className="text-warning" />,
  'never-synced': <Cloud size={20} className="text-muted-foreground" />,
  'remote-newer': <Cloud size={20} className="text-warning" />,
  syncing: <RefreshCw size={20} className="animate-spin text-primary" />,
  conflict: <AlertTriangle size={20} className="text-expense" />,
  error: <XCircle size={20} className="text-expense" />,
};
