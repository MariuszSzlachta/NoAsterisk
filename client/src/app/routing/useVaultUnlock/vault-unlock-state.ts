export const shouldResetVaultUnlockAttempt = (
  previousContext: string,
  nextContext: string,
): boolean => previousContext !== nextContext;
