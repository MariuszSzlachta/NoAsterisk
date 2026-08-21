// ═══════════════════════════════════════════════════════════════════
// User Settings — Vault Crypto Unit Tests
// ═══════════════════════════════════════════════════════════════════

import { describe, expect, it } from 'vitest';

import { decryptVault, decryptVaultPayload, encryptVault, VaultDecryptionError } from './crypto';

describe('vault crypto', () => {
  describe('encryptVault + decryptVault roundtrip', () => {
    it('encrypts and decrypts back to original plaintext', async () => {
      const data = JSON.stringify({ transactions: [{ id: '1', amount: 100 }] });
      const password = 'testPassword123!';

      const encrypted = await encryptVault(data, password);
      const decrypted = await decryptVault(encrypted, password);

      expect(decrypted).toBe(data);
    });

    it('produces different ciphertext for same input (random salt/iv)', async () => {
      const data = 'hello world';
      const password = 'pass123';

      const e1 = await encryptVault(data, password);
      const e2 = await encryptVault(data, password);

      expect(e1).not.toBe(e2);
    });

    it('handles empty string', async () => {
      const encrypted = await encryptVault('', 'securePass!');
      const decrypted = await decryptVault(encrypted, 'securePass!');

      expect(decrypted).toBe('');
    });

    it('handles unicode content', async () => {
      const data = 'Zażółć gęślą jaźń — €100,00 💰';
      const password = 'hasło!@#$%';

      const encrypted = await encryptVault(data, password);
      const decrypted = await decryptVault(encrypted, password);

      expect(decrypted).toBe(data);
    });

    it('handles large payload (100KB)', async () => {
      const data = 'x'.repeat(100_000);
      const password = 'pass';

      const encrypted = await encryptVault(data, password);
      const decrypted = await decryptVault(encrypted, password);

      expect(decrypted).toBe(data);
    });

    it('handles realistic JSON vault data', async () => {
      const vaultData = JSON.stringify({
        transactions: Array.from({ length: 500 }, (_, i) => ({
          id: `tx-${i}`,
          amount: Math.random() * 10000,
          title: `Transaction ${i}`,
          date: '2026-01-15',
          category: 'groceries',
        })),
        rules: [
          { id: 'r1', keyword: 'BIEDRONKA', matcherType: 'Contains', categoryId: 'groceries' },
          { id: 'r2', keyword: 'SPOTIFY', matcherType: 'Exact', categoryId: 'subscriptions' },
        ],
      });
      const password = 'MyVaultP@ss2026!';

      const encrypted = await encryptVault(vaultData, password);
      const decrypted = await decryptVault(encrypted, password);

      expect(decrypted).toBe(vaultData);
    });
  });

  describe('output format', () => {
    it('produces valid base64 output', async () => {
      const encrypted = await encryptVault('test', 'pass');

      expect(() => atob(encrypted)).not.toThrow();
    });

    it('output is longer than input (salt + iv + auth tag overhead)', async () => {
      const plaintext = 'short';
      const encrypted = await encryptVault(plaintext, 'pass');

      // base64 of salt(16) + iv(12) + ciphertext(5 + 16 auth tag) = 49 bytes → ~68 base64 chars
      expect(encrypted.length).toBeGreaterThan(plaintext.length);
    });
  });

  describe('decryption failure', () => {
    it('throws VaultDecryptionError with wrong password', async () => {
      const encrypted = await encryptVault('secret data', 'correctPassword');

      await expect(decryptVault(encrypted, 'wrongPassword')).rejects.toThrow(VaultDecryptionError);
    });

    it('throws VaultDecryptionError for corrupted data', async () => {
      const encrypted = await encryptVault('data', 'pass');
      // Corrupt the base64 by flipping characters in the middle
      const corrupted = encrypted.slice(0, 20) + 'AAAA' + encrypted.slice(24);

      await expect(decryptVault(corrupted, 'pass')).rejects.toThrow(VaultDecryptionError);
    });

    it('throws VaultDecryptionError for too-short input', async () => {
      // Less than salt(16) + iv(12) + 1 byte = 29 bytes minimum
      const tooShort = btoa('too_short');

      await expect(decryptVault(tooShort, 'pass')).rejects.toThrow(VaultDecryptionError);
      await expect(decryptVault(tooShort, 'pass')).rejects.toThrow('too short');
    });

    it('error message does not leak plaintext or password values', async () => {
      const encrypted = await encryptVault('supersecret', 'mypassword');

      try {
        await decryptVault(encrypted, 'wrongAttempt');
      } catch (err) {
        const message = (err as Error).message;
        expect(message).not.toContain('supersecret');
        expect(message).not.toContain('mypassword');
        expect(message).not.toContain('wrongAttempt');
      }
    });
  });

  describe('security properties', () => {
    it('different passwords produce different ciphertext', async () => {
      const data = 'same data';

      const e1 = await encryptVault(data, 'password1');
      const e2 = await encryptVault(data, 'password2');

      expect(e1).not.toBe(e2);
    });

    it('cannot decrypt with empty password if encrypted with real password', async () => {
      const encrypted = await encryptVault('data', 'realPassword!');

      await expect(decryptVault(encrypted, '')).rejects.toThrow(VaultDecryptionError);
    });
  });

  describe('decryptVaultPayload', () => {
    it('roundtrips valid vault data', async () => {
      const data = JSON.stringify({
        transactions: [{ id: 'tx-1', amount: 100 }, { id: 'tx-2', amount: 200 }],
        rules: [{ id: 'r-1', keyword: 'BIEDRONKA' }],
      });
      const encrypted = await encryptVault(data, 'pass');

      const payload = await decryptVaultPayload(encrypted, 'pass');

      expect(payload.transactions).toHaveLength(2);
      expect(payload.rules).toHaveLength(1);
    });

    it('throws VaultDecryptionError with wrong password', async () => {
      const data = JSON.stringify({ transactions: [], rules: [] });
      const encrypted = await encryptVault(data, 'correct');

      await expect(decryptVaultPayload(encrypted, 'wrong')).rejects.toThrow(VaultDecryptionError);
    });

    it('returns empty arrays when keys are missing', async () => {
      const data = JSON.stringify({ other: 'stuff' });
      const encrypted = await encryptVault(data, 'pass');

      const payload = await decryptVaultPayload(encrypted, 'pass');

      expect(payload.transactions).toHaveLength(0);
      expect(payload.rules).toHaveLength(0);
    });

    it('filters out items without id field', async () => {
      const data = JSON.stringify({
        transactions: [
          { id: 'valid', amount: 50 },
          { amount: 100 }, // no id
          null,
          42,
          'string',
        ],
        rules: [
          { id: 'r1', keyword: 'TEST' },
          { keyword: 'NO_ID' }, // no id
        ],
      });
      const encrypted = await encryptVault(data, 'pass');

      const payload = await decryptVaultPayload(encrypted, 'pass');

      expect(payload.transactions).toHaveLength(1);
      expect(payload.rules).toHaveLength(1);
    });

    it('throws VaultDecryptionError for non-object payload', async () => {
      const data = '"just a string"';
      const encrypted = await encryptVault(data, 'pass');

      await expect(decryptVaultPayload(encrypted, 'pass')).rejects.toThrow(
        'Decrypted payload is not an object',
      );
    });

    it('throws VaultDecryptionError for array payload', async () => {
      const data = '[1, 2, 3]';
      const encrypted = await encryptVault(data, 'pass');

      await expect(decryptVaultPayload(encrypted, 'pass')).rejects.toThrow(
        'Decrypted payload is not an object',
      );
    });
  });
});
