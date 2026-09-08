export const createPersistenceLockedError = (): Error => {
  const error = new Error('Encrypted financial persistence is locked');
  error.name = 'PersistenceLockedError';
  return error;
};
