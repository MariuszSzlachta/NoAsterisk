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

    it('throws when color is empty string', () => {
      expect(() => new Category('cat-1', 'ws-1', 'Groceries', new Date(), '')).toThrow(DomainError);
    });

    it('throws when color is whitespace only', () => {
      expect(() => new Category('cat-1', 'ws-1', 'Groceries', new Date(), '   ')).toThrow(DomainError);
    });

    it('throws when icon is empty string', () => {
      expect(() => new Category('cat-1', 'ws-1', 'Groceries', new Date(), '#34d399', '')).toThrow(DomainError);
    });

    it('throws when icon is whitespace only', () => {
      expect(() => new Category('cat-1', 'ws-1', 'Groceries', new Date(), '#34d399', '   ')).toThrow(DomainError);
    });

    it('creates valid instance without color and icon', () => {
      const cat = new Category('cat-1', 'ws-1', 'Groceries', new Date('2026-01-01'));
      expect(cat.id).toBe('cat-1');
      expect(cat.workspaceId).toBe('ws-1');
      expect(cat.name).toBe('Groceries');
      expect(cat.color).toBeUndefined();
      expect(cat.icon).toBeUndefined();
    });

    it('creates valid instance with color and icon', () => {
      const cat = new Category('cat-1', 'ws-1', 'Groceries', new Date('2026-01-01'), '#34d399', '🛒');
      expect(cat.color).toBe('#34d399');
      expect(cat.icon).toBe('🛒');
    });

    it('accepts undefined color and icon explicitly', () => {
      const cat = new Category('cat-1', 'ws-1', 'Groceries', new Date(), undefined, undefined);
      expect(cat.color).toBeUndefined();
      expect(cat.icon).toBeUndefined();
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

    it('creates with color and icon', () => {
      const cat = Category.create({
        workspaceId: 'ws-1',
        name: 'Food',
        color: '#22c55e',
        icon: '🍔',
      });
      expect(cat.color).toBe('#22c55e');
      expect(cat.icon).toBe('🍔');
    });

    it('creates without color and icon (defaults to undefined)', () => {
      const cat = Category.create({ workspaceId: 'ws-1', name: 'Bills' });
      expect(cat.color).toBeUndefined();
      expect(cat.icon).toBeUndefined();
    });
  });

  describe('rename', () => {
    it('returns new instance with updated name', () => {
      const cat = new Category('cat-1', 'ws-1', 'Groceries', new Date('2026-01-01'), '#34d399', '🛒');
      const renamed = cat.rename('Food');
      expect(renamed.name).toBe('Food');
      expect(renamed.id).toBe('cat-1');
      expect(renamed.workspaceId).toBe('ws-1');
      expect(renamed.createdAt).toEqual(new Date('2026-01-01'));
    });

    it('preserves color and icon on rename', () => {
      const cat = new Category('cat-1', 'ws-1', 'Groceries', new Date(), '#34d399', '🛒');
      const renamed = cat.rename('Food');
      expect(renamed.color).toBe('#34d399');
      expect(renamed.icon).toBe('🛒');
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

  describe('changeColor', () => {
    it('returns new instance with updated color', () => {
      const cat = new Category('cat-1', 'ws-1', 'Groceries', new Date(), '#34d399', '🛒');
      const updated = cat.changeColor('#ef4444');
      expect(updated.color).toBe('#ef4444');
      expect(updated.id).toBe('cat-1');
      expect(updated.name).toBe('Groceries');
      expect(updated.icon).toBe('🛒');
    });

    it('allows setting color to undefined (remove color)', () => {
      const cat = new Category('cat-1', 'ws-1', 'Groceries', new Date(), '#34d399');
      const updated = cat.changeColor(undefined);
      expect(updated.color).toBeUndefined();
    });

    it('throws when new color is empty string', () => {
      const cat = new Category('cat-1', 'ws-1', 'Groceries', new Date());
      expect(() => cat.changeColor('')).toThrow('Category color cannot be empty');
    });

    it('preserves all other fields', () => {
      const cat = new Category('cat-1', 'ws-1', 'Groceries', new Date('2026-01-01'), undefined, '🛒');
      const updated = cat.changeColor('#22c55e');
      expect(updated.workspaceId).toBe('ws-1');
      expect(updated.name).toBe('Groceries');
      expect(updated.createdAt).toEqual(new Date('2026-01-01'));
      expect(updated.icon).toBe('🛒');
    });
  });

  describe('changeIcon', () => {
    it('returns new instance with updated icon', () => {
      const cat = new Category('cat-1', 'ws-1', 'Groceries', new Date(), '#34d399', '🛒');
      const updated = cat.changeIcon('🍎');
      expect(updated.icon).toBe('🍎');
      expect(updated.color).toBe('#34d399');
    });

    it('allows setting icon to undefined (remove icon)', () => {
      const cat = new Category('cat-1', 'ws-1', 'Groceries', new Date(), '#34d399', '🛒');
      const updated = cat.changeIcon(undefined);
      expect(updated.icon).toBeUndefined();
    });

    it('throws when new icon is empty string', () => {
      const cat = new Category('cat-1', 'ws-1', 'Groceries', new Date());
      expect(() => cat.changeIcon('')).toThrow('Category icon cannot be empty');
    });

    it('preserves all other fields', () => {
      const cat = new Category('cat-1', 'ws-1', 'Groceries', new Date('2026-01-01'), '#34d399');
      const updated = cat.changeIcon('🥕');
      expect(updated.id).toBe('cat-1');
      expect(updated.workspaceId).toBe('ws-1');
      expect(updated.name).toBe('Groceries');
      expect(updated.createdAt).toEqual(new Date('2026-01-01'));
      expect(updated.color).toBe('#34d399');
    });
  });
});
