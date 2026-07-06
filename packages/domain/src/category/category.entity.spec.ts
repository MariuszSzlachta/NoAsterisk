import { describe, it, expect } from 'vitest';
import { Category } from '#domain/category/category.entity';
import { DomainError } from '#domain/shared/domain-error';

describe('Category', () => {
  describe('constructor invariants', () => {
    it('throws when id is empty', () => {
      expect(() => new Category('', 'ws-1', 'Groceries', new Date())).toThrow(DomainError);
    });

    it('throws when workspaceId is empty', () => {
      expect(() => new Category('cat-1', '', 'Groceries', new Date())).toThrow(DomainError);
    });

    it('throws when name is empty', () => {
      expect(() => new Category('cat-1', 'ws-1', '', new Date())).toThrow(DomainError);
    });

    it('throws when name is whitespace only', () => {
      expect(() => new Category('cat-1', 'ws-1', '   ', new Date())).toThrow(DomainError);
    });

    it('throws when name exceeds 100 characters', () => {
      expect(() => new Category('cat-1', 'ws-1', 'x'.repeat(101), new Date())).toThrow(DomainError);
    });

    it('creates valid instance', () => {
      const cat = new Category('cat-1', 'ws-1', 'Groceries', new Date('2026-01-01'));
      expect(cat.id).toBe('cat-1');
      expect(cat.workspaceId).toBe('ws-1');
      expect(cat.name).toBe('Groceries');
    });
  });

  describe('create', () => {
    it('generates id and sets createdAt', () => {
      const cat = Category.create({ workspaceId: 'ws-1', name: 'Transport' });
      expect(cat.id).toBeDefined();
      expect(cat.id.length).toBeGreaterThan(0);
      expect(cat.workspaceId).toBe('ws-1');
      expect(cat.name).toBe('Transport');
      expect(cat.createdAt).toBeInstanceOf(Date);
    });
  });

  describe('rename', () => {
    it('returns new instance with updated name', () => {
      const cat = new Category('cat-1', 'ws-1', 'Groceries', new Date('2026-01-01'));
      const renamed = cat.rename('Food');
      expect(renamed.name).toBe('Food');
      expect(renamed.id).toBe('cat-1');
      expect(renamed.workspaceId).toBe('ws-1');
      expect(renamed.createdAt).toEqual(new Date('2026-01-01'));
    });

    it('does not mutate original', () => {
      const cat = new Category('cat-1', 'ws-1', 'Groceries', new Date());
      cat.rename('Food');
      expect(cat.name).toBe('Groceries');
    });

    it('validates new name', () => {
      const cat = new Category('cat-1', 'ws-1', 'Groceries', new Date());
      expect(() => cat.rename('')).toThrow(DomainError);
    });
  });
});
