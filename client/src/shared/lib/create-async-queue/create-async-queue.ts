export const createAsyncQueue = (): (<TResult>(
  operation: () => Promise<TResult>,
) => Promise<TResult>) => {
  let tail: Promise<void> = Promise.resolve();
  return <TResult>(operation: () => Promise<TResult>): Promise<TResult> => {
    const result = tail.then(operation, operation);
    tail = result.then(
      () => undefined,
      () => undefined,
    );
    return result;
  };
};
