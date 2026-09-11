import { useEffect, useRef } from 'react';

import { clearHydratedFinancialStores } from '#app/providers/hydrate-financial-stores';
import { encryptedPersistence } from '#shared/adapters/persistence';
import { isAutoLockEnabled } from './auto-lock-config';

const AUTO_LOCK_AFTER_MS = 15 * 60 * 1000;
const AUTO_LOCK_ENABLED = isAutoLockEnabled(
  import.meta.env.DEV,
  import.meta.env.VITE_AUTO_LOCK_ENABLED,
);
const ACTIVITY_EVENTS = ['pointerdown', 'keydown', 'touchstart'] as const;

export const usePersistenceLifecycle = (): void => {
  const autoLockTimer = useRef<ReturnType<typeof setTimeout> | undefined>(
    undefined,
  );

  useEffect(() => {
    void encryptedPersistence.requestPersistentStorage();
  }, []);

  useEffect(() => {
    if (encryptedPersistence.getSnapshot().status !== 'unlocked') {
      clearHydratedFinancialStores();
    }
  }, []);

  useEffect(() => {
    const clearAutoLockTimer = (): void => {
      if (autoLockTimer.current !== undefined) {
        clearTimeout(autoLockTimer.current);
        autoLockTimer.current = undefined;
      }
    };
    const scheduleAutoLock = (): void => {
      clearAutoLockTimer();
      if (!AUTO_LOCK_ENABLED || !encryptedPersistence.isUnlocked()) return;
      autoLockTimer.current = setTimeout(
        () => encryptedPersistence.lock(),
        AUTO_LOCK_AFTER_MS,
      );
    };
    const handleActivity = (): void => {
      if (document.visibilityState === 'visible') scheduleAutoLock();
    };
    const handleVisibilityChange = (): void => {
      if (document.visibilityState === 'visible') {
        scheduleAutoLock();
      }
    };
    const handlePageHide = (): void => {
      clearAutoLockTimer();
      if (!AUTO_LOCK_ENABLED) return;
      encryptedPersistence.lock();
    };

    ACTIVITY_EVENTS.forEach((event) =>
      window.addEventListener(event, handleActivity),
    );
    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('pagehide', handlePageHide);
    const unsubscribe = encryptedPersistence.subscribe(() => {
      if (encryptedPersistence.getSnapshot().status !== 'unlocked')
        clearHydratedFinancialStores();
      scheduleAutoLock();
    });
    scheduleAutoLock();

    return () => {
      clearAutoLockTimer();
      ACTIVITY_EVENTS.forEach((event) =>
        window.removeEventListener(event, handleActivity),
      );
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('pagehide', handlePageHide);
      unsubscribe();
    };
  }, []);
};
