interface BoundActionResult {
  readonly handleAction: () => void;
}
export const useBoundAction = <TValue>(
  value: TValue,
  action: ((value: TValue) => void) | undefined,
): BoundActionResult => {
  const handleAction = (): void => {
    action?.(value);
  };
  return { handleAction };
};
