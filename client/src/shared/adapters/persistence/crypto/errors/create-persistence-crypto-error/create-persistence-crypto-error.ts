export const createPersistenceCryptoError = (message: string): Error => {
  const error = new Error(message);
  error.name = 'PersistenceCryptoError';
  return error;
};
