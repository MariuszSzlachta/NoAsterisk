import {
  INITIAL_PERSISTENCE_SNAPSHOT,
  type PersistenceSessionSnapshot,
} from '#shared/adapters/persistence/session/session-types';

export const createPersistenceSnapshot = () => {
  const listeners = new Set<() => void>();
  let snapshot: PersistenceSessionSnapshot = INITIAL_PERSISTENCE_SNAPSHOT;

  const getSnapshot = (): PersistenceSessionSnapshot => snapshot;

  const setSnapshot = (update: Partial<PersistenceSessionSnapshot>): void => {
    snapshot = { ...snapshot, ...update };
    listeners.forEach((listener) => listener());
  };

  const subscribe = (listener: () => void): (() => void) => {
    listeners.add(listener);
    return () => listeners.delete(listener);
  };

  return { getSnapshot, setSnapshot, subscribe };
};
