const CUTOVER_MARKER_KEY = 'budgetflow-v2-cutover-marker';
const CUTOVER_MARKER = 'v2-reset-complete';
const RESET_EVENT = 'budgetflow-v2-reset';

interface LegacyDatabaseFactory {
  readonly deleteDatabase: (name: string) => IDBOpenDBRequest;
  readonly databases?: () => Promise<ReadonlyArray<IDBDatabaseInfo>>;
}

interface CutoverStorage {
  readonly indexedDb: LegacyDatabaseFactory;
  readonly localStorage: Pick<Storage, 'getItem' | 'setItem' | 'removeItem'>;
  readonly broadcast: (message: string) => void;
}

interface CutoverResult {
  readonly status: 'completed' | 'already-completed' | 'dry-run';
  readonly deletedDatabases: ReadonlyArray<string>;
  readonly deletedStorageKeys: ReadonlyArray<string>;
}

interface CutoverOptions {
  readonly dryRun?: boolean;
  /**
   * The caller must keep the application locked while the destructive
   * operation is in flight and on any failure.  Cutover deliberately does
   * not own the vault session, so this hook is the narrow coordination
   * boundary between storage cleanup and the session lifecycle.
   */
  readonly lockOnFailure?: () => void | Promise<void>;
}

const deleteDatabase = (
  factory: LegacyDatabaseFactory,
  name: string,
): Promise<void> =>
  new Promise((resolve, reject) => {
    const request = factory.deleteDatabase(name);
    request.onsuccess = () => resolve();
    request.onerror = () =>
      reject(request.error ?? new Error('Legacy database deletion failed'));
    request.onblocked = () =>
      reject(new Error('Legacy database is still open'));
  });

const verifyDeleted = async (
  factory: LegacyDatabaseFactory,
  names: ReadonlyArray<string>,
): Promise<void> => {
  if (typeof factory.databases !== 'function') {
    return;
  }
  const remaining = (await factory.databases())
    .map((database) => database.name)
    .filter(
      (name): name is string => name !== undefined && names.includes(name),
    );
  if (remaining.length > 0) {
    throw new Error('Legacy database deletion could not be verified');
  }
};

const performLegacyCutover = async (
  databaseNames: ReadonlyArray<string>,
  storageKeys: ReadonlyArray<string>,
  storage: CutoverStorage = {
    indexedDb: indexedDB,
    localStorage,
    broadcast: (message) => {
      if (typeof BroadcastChannel === 'undefined') {
        return;
      }
      const channel = new BroadcastChannel('budgetflow-persistence');
      channel.postMessage(message);
      channel.close();
    },
  },
  options: CutoverOptions = {},
): Promise<CutoverResult> => {
  try {
    if (storage.localStorage.getItem(CUTOVER_MARKER_KEY) === CUTOVER_MARKER) {
      return {
        status: 'already-completed',
        deletedDatabases: [],
        deletedStorageKeys: [],
      };
    }
    const names = databaseNames.filter(
      (name, index, values) => name.length > 0 && values.indexOf(name) === index,
    );
    const keys = storageKeys.filter(
      (key, index, values) => key.length > 0 && values.indexOf(key) === index,
    );
    if (
      [...names, ...keys].some(
        (value) =>
          value.includes('*') || value.includes('?') || value.includes('..'),
      )
    ) {
      throw new Error('Legacy cutover requires exact allowlisted names');
    }
    if (options.dryRun === true) {
      return {
        status: 'dry-run',
        deletedDatabases: names,
        deletedStorageKeys: keys,
      };
    }
    storage.broadcast(RESET_EVENT);
    await Promise.all(
      names.map((name) => deleteDatabase(storage.indexedDb, name)),
    );
    await verifyDeleted(storage.indexedDb, names);
    keys.forEach((key) => storage.localStorage.removeItem(key));
    storage.localStorage.setItem(CUTOVER_MARKER_KEY, CUTOVER_MARKER);
    return {
      status: 'completed',
      deletedDatabases: names,
      deletedStorageKeys: keys,
    };
  } catch (error) {
    await options.lockOnFailure?.();
    throw error;
  }
};

export { performLegacyCutover };
