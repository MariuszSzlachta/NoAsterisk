import { describe, expect, it, vi } from 'vitest';

const post = vi.fn();

vi.mock('#shared/api', () => ({
  apiClient: { post },
}));

describe('issueServerShare', () => {
  it('returns transient 32-byte material from the allowlisted response', async () => {
    post.mockResolvedValue({
      serverShare: btoa(String.fromCharCode(...new Uint8Array(32))),
      expiresAt: new Date(Date.now() + 60_000).toISOString(),
    });
    const { issueServerShare } =
      await import('#shared/api/vault-protocol/issue-server-share');
    await expect(issueServerShare('device-1')).resolves.toHaveLength(32);
  });

  it('rejects malformed responses and empty device IDs', async () => {
    post.mockResolvedValue({ serverShare: 'not-a-share', expiresAt: 'now' });
    const { issueServerShare } =
      await import('#shared/api/vault-protocol/issue-server-share');
    await expect(issueServerShare('device-1')).rejects.toThrow(
      'Invalid ServerShare',
    );
    await expect(issueServerShare('')).rejects.toThrow('Device ID');
  });
});
