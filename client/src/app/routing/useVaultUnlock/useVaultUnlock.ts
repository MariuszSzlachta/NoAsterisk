import {
  useCallback,
  useState,
  type ChangeEvent,
  type FormEvent,
  type KeyboardEvent,
} from 'react';
import { useTranslation } from 'react-i18next';

import { encryptedPersistence, type PersistenceSessionSnapshot } from '#shared/adapters/persistence';
import { hydrateFinancialStores } from '#app/providers/hydrate-financial-stores';

interface VaultUnlockState {
  readonly passphrase: string;
  readonly error: string | undefined;
  readonly isUnlocking: boolean;
  readonly handlePassphraseChange: (event: ChangeEvent<HTMLInputElement>) => void;
  readonly handlePassphraseKeyDown: (
    event: KeyboardEvent<HTMLInputElement>,
  ) => void;
  readonly handleSubmit: (event: FormEvent<HTMLFormElement>) => void;
}

export const useVaultUnlock = (snapshot: PersistenceSessionSnapshot): VaultUnlockState => {
  const { t } = useTranslation();
  const [passphrase, setPassphrase] = useState('');
  const [submitError, setSubmitError] = useState<string | undefined>();

  const handlePassphraseChange = useCallback(
    (event: ChangeEvent<HTMLInputElement>): void => {
      setPassphrase(event.currentTarget.value);
    },
    [],
  );

  const handlePassphraseKeyDown = useCallback(
    (event: KeyboardEvent<HTMLInputElement>): void => {
      if (
        event.key !== 'Enter' ||
        passphrase.length === 0 ||
        snapshot.status === 'unlocking'
      ) {
        return;
      }

      event.preventDefault();
      event.currentTarget.form?.requestSubmit();
    },
    [passphrase, snapshot.status],
  );

  const handleSubmit = useCallback(
    (event: FormEvent<HTMLFormElement>): void => {
      event.preventDefault();
      setSubmitError(undefined);
      void encryptedPersistence
        .unlock(passphrase, hydrateFinancialStores)
        .then(() => setPassphrase(''))
        .catch(() => setSubmitError(t('vaultUnlock.errors.failed')));
    },
    [passphrase, t],
  );

  return {
    passphrase,
    error: submitError ?? snapshot.error,
    isUnlocking: snapshot.status === 'unlocking',
    handlePassphraseChange,
    handlePassphraseKeyDown,
    handleSubmit,
  };
};
