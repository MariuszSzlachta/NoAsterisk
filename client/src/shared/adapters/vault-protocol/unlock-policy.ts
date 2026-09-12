type UnlockMode = 'standard' | 'high-security';
type UnlockMethod = 'split' | 'prf';

interface UnlockPolicy {
  readonly chooseMethod: (
    mode: UnlockMode,
    prfConfirmedForCredential: boolean,
  ) => UnlockMethod;
}

export const unlockPolicy: UnlockPolicy = Object.freeze({
  chooseMethod: (mode: UnlockMode, prfConfirmedForCredential: boolean) => {
    if (prfConfirmedForCredential) return 'prf';
    if (mode === 'high-security') {
      throw new Error('High-security mode requires confirmed passkey PRF');
    }
    return 'split';
  },
});
