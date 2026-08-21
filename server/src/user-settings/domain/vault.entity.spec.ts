import { Vault } from './vault.entity';

describe('Vault', () => {
  describe('constructor invariants', () => {
    it('creates valid vault', () => {
      const vault = new Vault(
        'vault-1',
        'ws-1',
        'base64data',
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
        () => new Vault(props.id, props.ws, props.blob, new Date(), new Date()),
      ).toThrow();
    });
  });

  describe('create', () => {
    it('generates unique id and current timestamps', () => {
      const before = new Date();
      const vault = Vault.create({
        workspaceId: 'ws-1',
        encryptedBlob: 'encrypted-content',
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
      const v1 = Vault.create({ workspaceId: 'ws-1', encryptedBlob: 'a' });
      const v2 = Vault.create({ workspaceId: 'ws-1', encryptedBlob: 'b' });
      expect(v1.id).not.toBe(v2.id);
    });
  });

  describe('updateBlob', () => {
    it('returns new vault with updated blob and updatedAt', () => {
      const original = new Vault(
        'v-1',
        'ws-1',
        'old-blob',
        new Date('2026-01-01'),
        new Date('2026-01-01'),
      );

      const updated = original.updateBlob('new-blob');

      expect(updated.id).toBe('v-1');
      expect(updated.workspaceId).toBe('ws-1');
      expect(updated.encryptedBlob).toBe('new-blob');
      expect(updated.createdAt).toEqual(new Date('2026-01-01'));
      expect(updated.updatedAt.getTime()).toBeGreaterThan(
        original.updatedAt.getTime(),
      );
    });

    it('throws for empty blob', () => {
      const vault = Vault.create({
        workspaceId: 'ws-1',
        encryptedBlob: 'data',
      });

      expect(() => vault.updateBlob('')).toThrow();
    });
  });
});
