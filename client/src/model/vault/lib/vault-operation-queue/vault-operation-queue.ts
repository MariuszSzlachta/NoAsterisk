import { createAsyncQueue } from '#shared/lib/create-async-queue';

// Sync and restore share a queue, separate from the re-entrant persistence call
// boundaries they use internally. A rejected operation must not poison it.
export const vaultOperationQueue = createAsyncQueue();
