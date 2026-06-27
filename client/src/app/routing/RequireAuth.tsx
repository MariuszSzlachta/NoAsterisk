import { useSyncExternalStore } from 'react';
import { Navigate, Outlet } from 'react-router-dom';

const subscribe = (callback: () => void): (() => void) => {
  window.addEventListener('auth:session-expired', callback);
  window.addEventListener('auth:login', callback);
  return () => {
    window.removeEventListener('auth:session-expired', callback);
    window.removeEventListener('auth:login', callback);
  };
};

// todo: handle better
// const getIsAuthenticated = (): boolean => authTokens.getAccessToken() !== undefined;
const getIsAuthenticated = (): boolean => true;

export const RequireAuth = (): React.JSX.Element => {
  const isAuthenticated = useSyncExternalStore(subscribe, getIsAuthenticated);

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return <Outlet />;
};
