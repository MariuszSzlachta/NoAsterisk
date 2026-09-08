const DATABASE_LOCK_NAME = 'budgetflow-encrypted-database-initialization';

/**
 * Serializes persistence critical sections across tabs with Web Locks, falling
 * back to a promise tail when the browser does not expose that API.
 */
export const createDatabaseLock = (): (<TResult>(task: () => Promise<TResult>) => Promise<TResult>) => {
  let localLockTail: Promise<void> = Promise.resolve();

  return async <TResult>(task: () => Promise<TResult>): Promise<TResult> => {
    if (typeof navigator !== 'undefined' && navigator.locks) {
      return navigator.locks.request(
        DATABASE_LOCK_NAME,
        { mode: 'exclusive' },
        task,
      );
    }

    const currentTask = localLockTail.then(task, task);
    localLockTail = currentTask.then(
      () => undefined,
      () => undefined,
    );
    return currentTask;
  };
};
