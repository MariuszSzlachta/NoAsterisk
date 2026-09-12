import {
  act,
  fireEvent,
  render,
  renderHook,
  screen,
} from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { useRotationRecoveryConfirmation } from '#features/user-settings/ui/hooks/useRotationRecoveryConfirmation';
import { RotationRecoveryDialog } from '#features/user-settings/ui/RotationRecoveryDialog';
import { encryptedPersistence } from '#shared/adapters/persistence';

describe('RotationRecoveryDialog', () => {
  afterEach(() => vi.restoreAllMocks());
  it('should require the exact saved code before confirming the backup', async () => {
    vi.spyOn(encryptedPersistence, 'isUnlocked').mockReturnValue(true);
    const { result } = renderHook(() => useRotationRecoveryConfirmation());
    let backup: Promise<boolean> | undefined;
    act(() => {
      backup = result.current.confirmRecoveryCode('local-fixture');
    });
    const { rerender } = render(
      <RotationRecoveryDialog confirmation={result.current} />,
    );
    const confirm = screen.getByRole('button', {
      name: 'settings.vault.rotationBackupCommit',
    });
    expect(confirm).toBeDisabled();
    fireEvent.change(screen.getByRole('textbox'), {
      target: { value: 'wrong' },
    });
    rerender(<RotationRecoveryDialog confirmation={result.current} />);
    expect(confirm).toBeDisabled();
    fireEvent.change(screen.getByRole('textbox'), {
      target: { value: 'local-fixture' },
    });
    rerender(<RotationRecoveryDialog confirmation={result.current} />);
    expect(confirm).toBeEnabled();
    fireEvent.click(confirm);
    await expect(backup).resolves.toBe(true);
    expect(result.current.recoveryCode).toBeUndefined();
  });
});
