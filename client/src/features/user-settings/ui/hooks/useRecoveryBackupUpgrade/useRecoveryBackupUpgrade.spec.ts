import { createElement } from 'react';

import '@testing-library/jest-dom/vitest';

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import {
  act,
  fireEvent,
  render,
  renderHook,
  screen,
  waitFor,
} from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { upgradeRecoveryBackup } from '#features/user-settings/api/upgrade-recovery-backup';
import { useRecoveryBackupAvailabilityQuery } from '#features/user-settings/api/useRecoveryBackupAvailabilityQuery';
import { useRecoveryBackupUpgradeStore } from '#features/user-settings/store/useRecoveryBackupUpgradeStore';
import { useRecoveryBackupUpgrade } from '#features/user-settings/ui/hooks/useRecoveryBackupUpgrade';
import { RecoveryBackupUpgrade } from '#features/user-settings/ui/RecoveryBackupUpgrade';
import { encryptedPersistence } from '#shared/adapters/persistence';
import { encodeRecoveryBackup } from '#shared/adapters/vault-protocol/recovery-backup';

const boundary = vi.hoisted(() => ({
  availability: vi.fn<typeof useRecoveryBackupAvailabilityQuery>(),
  upgrade: vi.fn<typeof upgradeRecoveryBackup>(),
  subscribe: vi.fn<typeof encryptedPersistence.subscribe>(),
  generation: vi.fn(() => 5),
  unlocked: vi.fn(() => true),
}));
vi.mock(
  '#features/user-settings/api/useRecoveryBackupAvailabilityQuery',
  () => ({ useRecoveryBackupAvailabilityQuery: boundary.availability }),
);
vi.mock('#features/user-settings/api/upgrade-recovery-backup', () => ({
  upgradeRecoveryBackup: boundary.upgrade,
}));
vi.mock('#shared/adapters/persistence', () => ({
  encryptedPersistence: {
    subscribe: boundary.subscribe,
    getGeneration: boundary.generation,
    isUnlocked: boundary.unlocked,
  },
}));
vi.mock('react-i18next', () => ({
  useTranslation: () => ({ t: (key: string) => key }),
}));
const renderUpgrade = () => {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  return renderHook(useRecoveryBackupUpgrade, {
    wrapper: ({ children }) =>
      createElement(QueryClientProvider, { client }, children),
  });
};
beforeEach(() => {
  vi.resetAllMocks();
  boundary.generation.mockReturnValue(5);
  boundary.unlocked.mockReturnValue(true);
  boundary.subscribe.mockReturnValue(() => {});
  boundary.availability.mockReturnValue({
    status: 'loaded',
    data: { isRegistered: false },
  });
  useRecoveryBackupUpgradeStore.getState().reset();
});
afterEach(() => vi.restoreAllMocks());
describe('useRecoveryBackupUpgrade', () => {
  it('should retain the uncertain-registration warning when status readback also fails', async () => {
    boundary.upgrade.mockRejectedValue(new Error('Network failed'));
    const hook = renderUpgrade();
    act(() => {
      const state = hook.result.current.state;
      if (state.status !== 'loaded') throw new Error('Expected view');
      state.data.handleStart();
    });
    await waitFor(() =>
      expect(hook.result.current.operationError).toBe(
        'settings.vault.backupUpgradeFailed',
      ),
    );
    boundary.availability.mockReturnValue({
      status: 'error',
      error: 'Network failed',
    });
    hook.rerender();
    expect(hook.result.current.state.status).toBe('error');
    expect(hook.result.current.operationError).toBe(
      'settings.vault.backupUpgradeFailed',
    );
    expect(hook.result.current.code).toBeUndefined();
    hook.unmount();
  });
  it('should confirm only the complete saved code and remove all backup content before reporting success', async () => {
    const code = await encodeRecoveryBackup({
      vmk: new Uint8Array(32),
      recoverySeed: new Uint8Array(32).fill(1),
    });
    boundary.upgrade.mockImplementation(async (confirm) =>
      (await confirm(code)) ? 'registered' : 'cancelled',
    );
    const client = new QueryClient();
    const view = render(
      createElement(
        QueryClientProvider,
        { client },
        createElement(RecoveryBackupUpgrade),
      ),
    );
    fireEvent.click(
      screen.getByRole('button', { name: 'settings.vault.backupUpgradeStart' }),
    );
    await screen.findByRole('dialog');
    const input = screen.getByRole('textbox');
    const confirm = screen.getByRole('button', {
      name: 'settings.vault.backupUpgradeConfirm',
    });
    fireEvent.change(input, { target: { value: 'invalid test code' } });
    expect(confirm).toBeDisabled();
    fireEvent.change(input, { target: { value: code } });
    expect(confirm).toBeEnabled();
    fireEvent.click(confirm);
    await waitFor(() =>
      expect(screen.queryByRole('dialog')).not.toBeInTheDocument(),
    );
    await waitFor(() =>
      expect(useRecoveryBackupUpgradeStore.getState().phase).toBe('completed'),
    );
    expect(screen.queryByText(code)).not.toBeInTheDocument();
    view.unmount();
  });
  it('should prevent duplicate operations and clear backup after cancellation', async () => {
    const code = await encodeRecoveryBackup({
      vmk: new Uint8Array(32),
      recoverySeed: new Uint8Array(32).fill(1),
    });
    boundary.upgrade.mockImplementation(async (confirm) =>
      (await confirm(code)) ? 'registered' : 'cancelled',
    );
    const hook = renderUpgrade();
    act(() => {
      const state = hook.result.current.state;
      if (state.status !== 'loaded') throw new Error('Expected loaded view');
      state.data.handleStart();
      state.data.handleStart();
    });
    await waitFor(() => expect(hook.result.current.code).toBe(code));
    expect(
      JSON.stringify(useRecoveryBackupUpgradeStore.getState()),
    ).not.toContain(code);
    expect(boundary.upgrade).toHaveBeenCalledOnce();
    expect(hook.result.current.canConfirm).toBe(false);
    act(() => hook.result.current.handleConfirm());
    expect(hook.result.current.code).toBe(code);
    act(() => hook.result.current.handleCancel());
    await waitFor(() => expect(hook.result.current.code).toBeUndefined());
    expect(hook.result.current.qrSvg).toBeUndefined();
    expect(useRecoveryBackupUpgradeStore.getState().phase).toBe('idle');
    hook.unmount();
  });
  it.each(['lock', 'generation', 'unmount'])(
    'should discard a late successful registration after %s',
    async (reason) => {
      let complete: ((result: 'registered') => void) | undefined;
      let listener: (() => void) | undefined;
      boundary.subscribe.mockImplementation((callback) => {
        listener = callback;
        return () => {};
      });
      boundary.upgrade.mockImplementation(
        () =>
          new Promise((resolve) => {
            complete = resolve;
          }),
      );
      const hook = renderUpgrade();
      act(() => {
        const state = hook.result.current.state;
        if (state.status !== 'loaded') throw new Error('Expected view');
        state.data.handleStart();
      });
      if (reason === 'unmount') hook.unmount();
      else
        act(() => {
          if (reason === 'lock') boundary.unlocked.mockReturnValue(false);
          else boundary.generation.mockReturnValue(6);
          listener?.();
        });
      await act(async () => complete?.('registered'));
      expect(useRecoveryBackupUpgradeStore.getState().phase).toBe('idle');
      if (reason !== 'unmount') hook.unmount();
    },
  );
  it('should never offer an upgrade or create a backup for a registered authority', () => {
    boundary.availability.mockReturnValue({
      status: 'loaded',
      data: { isRegistered: true },
    });
    const hook = renderUpgrade();
    const state = hook.result.current.state;
    if (state.status !== 'loaded') throw new Error('Expected view');
    expect(state.data.canStart).toBe(false);
    act(state.data.handleStart);
    expect(boundary.upgrade).not.toHaveBeenCalled();
    hook.unmount();
  });
});
