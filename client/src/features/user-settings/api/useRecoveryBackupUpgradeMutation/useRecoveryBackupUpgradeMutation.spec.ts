import { createElement } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { act, renderHook, waitFor } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { API_CONTRACT } from '#features/user-settings/api/constants';
import { upgradeRecoveryBackup } from '#features/user-settings/api/upgrade-recovery-backup';
import { useRecoveryBackupUpgradeMutation } from '#features/user-settings/api/useRecoveryBackupUpgradeMutation';

vi.mock('#features/user-settings/api/upgrade-recovery-backup', () => ({
  upgradeRecoveryBackup: vi.fn(),
}));
afterEach(() => {
  vi.resetAllMocks();
});
describe('useRecoveryBackupUpgradeMutation', () => {
  it.each(['success', 'uncertain-failure'])(
    'should refresh authority metadata without retrying registration after %s',
    async (outcome) => {
      const register = vi.mocked(upgradeRecoveryBackup);
      if (outcome === 'success') register.mockResolvedValue('registered');
      else register.mockRejectedValue(new Error('Response lost'));
      const client = new QueryClient();
      const key = [API_CONTRACT.QUERY_KEYS.RECOVERY_BACKUP];
      client.setQueryData(key, { isRegistered: false });
      const hook = renderHook(useRecoveryBackupUpgradeMutation, {
        wrapper: ({ children }) =>
          createElement(QueryClientProvider, { client }, children),
      });
      await act(async () => {
        const operation = hook.result.current.registerBackup({
          confirmBackup: async () => false,
          assertCurrent: () => {},
        });
        if (outcome === 'success')
          await expect(operation).resolves.toBe('registered');
        else await expect(operation).rejects.toThrow('Response lost');
      });
      expect(register).toHaveBeenCalledTimes(1);
      expect(client.getQueryState(key)?.isInvalidated).toBe(true);
      hook.unmount();
      await waitFor(() =>
        expect(client.getMutationCache().getAll()).toHaveLength(0),
      );
      client.clear();
    },
  );
});
