export const subscribeToAuthSession = (callback: () => void): (() => void) => {
  window.addEventListener('auth:session-expired', callback);
  window.addEventListener('auth:login', callback);
  return () => {
    window.removeEventListener('auth:session-expired', callback);
    window.removeEventListener('auth:login', callback);
  };
};
