import { Vault } from './vault.entity';

describe('Vault', () => {
  describe('constructor invariants', () => {
    it('creates valid vault', () => {
      const vault = new Vault(
        'vault-1',
        'ws-1',
        'base64data',
        'hash-1',
        10,
        1,
        new Date('2026-01-01'),
        new Date('2026-01-02'),
      );
      expect(vault.id).toBe('vault-1');
      expect(vault.workspaceId).toBe('ws-1');
      expect(vault.encryptedBlob).toBe('base64data');
    });

    it.each([
      ['empty id', { id: '', ws: 'ws-1', blob: 'data' }],
      ['empty workspaceId', { id: 'v-1', ws: '', blob: 'data' }],
      ['empty encryptedBlob', { id: 'v-1', ws: 'ws-1', blob: '' }],
    ])('throws for %s', (_, props) => {
      expect(
        () =>
          new Vault(
            props.id,
            props.ws,
            props.blob,
            'hash-1',
            10,
            1,
            new Date(),
            new Date(),
          ),
      ).toThrow();
    });
  });

  describe('create', () => {
    it('generates unique id and current timestamps', () => {
      const before = new Date();
      const vault = Vault.create({
        workspaceId: 'ws-1',
        encryptedBlob: 'encrypted-content',
        contentHash: 'hash-1',
        byteSize: 17,
      });

      expect(vault.id).toBeDefined();
      expect(vault.id.length).toBeGreaterThan(0);
      expect(vault.workspaceId).toBe('ws-1');
      expect(vault.encryptedBlob).toBe('encrypted-content');
      expect(vault.createdAt.getTime()).toBeGreaterThanOrEqual(
        before.getTime(),
      );
      expect(vault.updatedAt.getTime()).toBeGreaterThanOrEqual(
        before.getTime(),
      );
    });

    it('generates different ids for each call', () => {
      const v1 = Vault.create({
        workspaceId: 'ws-1',
        encryptedBlob: 'a',
        contentHash: 'hash-a',
        byteSize: 1,
      });
      const v2 = Vault.create({
        workspaceId: 'ws-1',
        encryptedBlob: 'b',
        contentHash: 'hash-b',
        byteSize: 1,
      });
      expect(v1.id).not.toBe(v2.id);
    });
  });

  describe('updateBlob', () => {
    it('returns new vault with updated blob and updatedAt', () => {
      const original = new Vault(
        'v-1',
        'ws-1',
        'old-blob',
        'old-hash',
        8,
        1,
        new Date('2026-01-01'),
        new Date('2026-01-01'),
      );

      const updated = original.updateBlob('new-blob', 'new-hash', 8);

      expect(updated.id).toBe('v-1');
      expect(updated.workspaceId).toBe('ws-1');
      expect(updated.encryptedBlob).toBe('new-blob');
      expect(updated.contentHash).toBe('new-hash');
      expect(updated.revision).toBe(2);
      expect(updated.createdAt).toEqual(new Date('2026-01-01'));
      expect(updated.updatedAt.getTime()).toBeGreaterThan(
        original.updatedAt.getTime(),
      );
    });

    it('throws for empty blob', () => {
      const vault = Vault.create({
        workspaceId: 'ws-1',
        encryptedBlob: 'data',
        contentHash: 'hash-1',
        byteSize: 4,
      });

      expect(() => vault.updateBlob('', 'hash-2', 1)).toThrow();
    });

    it('rejects invalid transport metadata', () => {
      expect(
        () =>
          new Vault('v-1', 'ws-1', 'blob', '', 4, 1, new Date(), new Date()),
      ).toThrow();
    });
  });
});
