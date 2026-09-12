export const assertEnrollmentInitializationCurrent = (
  assertCurrent: () => void,
  isActive: () => boolean,
): void => {
  assertCurrent();
  if (!isActive()) throw new Error('Enrollment initialization invalidated');
};
