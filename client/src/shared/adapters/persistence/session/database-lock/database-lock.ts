const DATABASE_LOCK_NAME = 'budgetflow-encrypted-database-initialization';

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
