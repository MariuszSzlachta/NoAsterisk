import { renderHook } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { useWorkspaceClipboard } from '#features/user-settings/ui/hooks/useWorkspaceClipboard';

afterEach(() => vi.unstubAllGlobals());
describe('useWorkspaceClipboard', () => {
  it('should copy only the current workspace identifier when requested', async () => {
    const writeText = vi.fn().mockResolvedValue(undefined);
    vi.stubGlobal('navigator', { clipboard: { writeText } });
    const { result } = renderHook(() =>
      useWorkspaceClipboard('synthetic-workspace'),
    );
    expect(writeText).not.toHaveBeenCalled();
    await result.current.handleCopyWorkspaceId();
    expect(writeText).toHaveBeenCalledWith('synthetic-workspace');
  });
});
