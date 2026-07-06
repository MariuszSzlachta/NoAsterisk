import { describe, it, expect } from 'vitest';
import { Account } from '#domain/account/account.entity';
import { DomainError } from '#domain/shared/domain-error';

describe('Account', () => {
  const validProps = {
    id: 'acc-001',
    workspaceId: 'ws-001',
    name: 'mBank Główne',
    type: 'operational',
    currency: 'PLN',
    initialBalance: 1000,
    createdAt: new Date('2026-01-01'),
    isArchived: false,
  };

  const buildAccount = (overrides?: Partial<typeof validProps>): Account =>
    new Account(
      overrides?.id ?? validProps.id,
      overrides?.workspaceId ?? validProps.workspaceId,
      overrides?.name ?? validProps.name,
      overrides?.type ?? validProps.type,
      overrides?.currency ?? validProps.currency,
      overrides?.initialBalance ?? validProps.initialBalance,
      overrides?.createdAt ?? validProps.createdAt,
      overrides?.isArchived ?? validProps.isArchived,
    );

  describe('constructor invariants', () => {
    it('throws when id is empty', () => {
      expect(() => buildAccount({ id: '' })).toThrow(DomainError);
    });

    it('throws when workspaceId is empty', () => {
      expect(() => buildAccount({ workspaceId: '' })).toThrow(DomainError);
    });

    it('throws when name is empty', () => {
      expect(() => buildAccount({ name: '' })).toThrow(DomainError);
    });

    it('throws when name is whitespace only', () => {
      expect(() => buildAccount({ name: '   ' })).toThrow(DomainError);
    });

    it('throws when name exceeds 100 characters', () => {
      expect(() => buildAccount({ name: 'x'.repeat(101) })).toThrow(DomainError);
    });

    it('throws when type is empty', () => {
      expect(() => buildAccount({ type: '' })).toThrow(DomainError);
    });

    it('throws when type is whitespace only', () => {
      expect(() => buildAccount({ type: '   ' })).toThrow(DomainError);
    });

    it('throws when currency is not 3 characters', () => {
      expect(() => buildAccount({ currency: 'PL' })).toThrow(DomainError);
      expect(() => buildAccount({ currency: 'PLNX' })).toThrow(DomainError);
      expect(() => buildAccount({ currency: '' })).toThrow(DomainError);
    });

    it('creates valid instance with all fields', () => {
      const acc = buildAccount();
      expect(acc.id).toBe('acc-001');
      expect(acc.workspaceId).toBe('ws-001');
      expect(acc.name).toBe('mBank Główne');
      expect(acc.type).toBe('operational');
      expect(acc.currency).toBe('PLN');
      expect(acc.initialBalance).toBe(1000);
      expect(acc.isArchived).toBe(false);
    });

    it('accepts zero initial balance', () => {
      const acc = buildAccount({ initialBalance: 0 });
      expect(acc.initialBalance).toBe(0);
    });

    it('accepts negative initial balance (credit accounts)', () => {
      const acc = buildAccount({ initialBalance: -500 });
      expect(acc.initialBalance).toBe(-500);
    });
  });

  describe('create', () => {
    it('generates id, sets defaults, trims name', () => {
      const acc = Account.create({
        workspaceId: 'ws-001',
        name: '  Gotówka  ',
        type: 'cash',
        currency: 'pln',
      });

      expect(acc.id).toBeDefined();
      expect(acc.id.length).toBeGreaterThan(0);
      expect(acc.workspaceId).toBe('ws-001');
      expect(acc.name).toBe('Gotówka');
      expect(acc.type).toBe('cash');
      expect(acc.currency).toBe('PLN');
      expect(acc.initialBalance).toBe(0);
      expect(acc.isArchived).toBe(false);
      expect(acc.createdAt).toBeInstanceOf(Date);
    });

    it('accepts custom initial balance', () => {
      const acc = Account.create({
        workspaceId: 'ws-001',
        name: 'Savings',
        type: 'savings',
        currency: 'EUR',
        initialBalance: 5000,
      });

      expect(acc.initialBalance).toBe(5000);
    });

    it('validates input', () => {
      expect(() => Account.create({ workspaceId: 'ws-001', name: '', type: 'cash', currency: 'PLN' })).toThrow(DomainError);
    });
  });

  describe('rename', () => {
    it('returns new instance with updated name', () => {
      const acc = buildAccount();
      const renamed = acc.rename('ING Główne');
      expect(renamed.name).toBe('ING Główne');
      expect(renamed.id).toBe(acc.id);
      expect(renamed.workspaceId).toBe(acc.workspaceId);
      expect(renamed.type).toBe(acc.type);
      expect(renamed.currency).toBe(acc.currency);
      expect(renamed.initialBalance).toBe(acc.initialBalance);
      expect(renamed.createdAt).toBe(acc.createdAt);
      expect(renamed.isArchived).toBe(acc.isArchived);
    });

    it('trims the new name', () => {
      const acc = buildAccount();
      const renamed = acc.rename('  Trimmed  ');
      expect(renamed.name).toBe('Trimmed');
    });

    it('validates new name', () => {
      const acc = buildAccount();
      expect(() => acc.rename('')).toThrow(DomainError);
      expect(() => acc.rename('   ')).toThrow(DomainError);
    });

    it('does not mutate original', () => {
      const acc = buildAccount();
      acc.rename('New Name');
      expect(acc.name).toBe('mBank Główne');
    });
  });

  describe('archive', () => {
    it('returns new instance with isArchived = true', () => {
      const acc = buildAccount({ isArchived: false });
      const archived = acc.archive();
      expect(archived.isArchived).toBe(true);
      expect(archived.id).toBe(acc.id);
      expect(archived.name).toBe(acc.name);
    });

    it('returns same instance when already archived (idempotent)', () => {
      const acc = buildAccount({ isArchived: true });
      const archived = acc.archive();
      expect(archived).toBe(acc);
    });
  });

  describe('unarchive', () => {
    it('returns new instance with isArchived = false', () => {
      const acc = buildAccount({ isArchived: true });
      const unarchived = acc.unarchive();
      expect(unarchived.isArchived).toBe(false);
      expect(unarchived.id).toBe(acc.id);
      expect(unarchived.name).toBe(acc.name);
    });

    it('returns same instance when not archived (idempotent)', () => {
      const acc = buildAccount({ isArchived: false });
      const unarchived = acc.unarchive();
      expect(unarchived).toBe(acc);
    });
  });
});
