interface ActionFactoryResult<TValue> {
  readonly createActionHandler: (value: TValue) => () => void;
}
export const useActionFactory = <TValue>(
  action: (value: TValue) => void,
): ActionFactoryResult<TValue> => {
  const createActionHandler =
    (value: TValue): (() => void) =>
    (): void => {
      action(value);
    };
  return { createActionHandler };
};
