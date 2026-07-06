import { describe, it, expect } from 'vitest';
import { CategorizationRule } from '#domain/categorization-rule/categorization-rule.entity';
import { MatcherType } from '#domain/categorization-rule/matcher-type.enum';
import { DomainError } from '#domain/shared/domain-error';

describe('CategorizationRule', () => {
  describe('constructor invariants', () => {
    it('throws when id is empty', () => {
      expect(
        () =>
          new CategorizationRule(
            '',
            'ws-1',
            'kw',
            'cat',
            MatcherType.Contains,
            0,
            new Date(),
          ),
      ).toThrow(DomainError);
    });

    it('throws when workspaceId is empty', () => {
      expect(
        () =>
          new CategorizationRule(
            'r1',
            '',
            'kw',
            'cat',
            MatcherType.Contains,
            0,
            new Date(),
          ),
      ).toThrow(DomainError);
    });

    it('throws when keyword is empty/whitespace', () => {
      expect(
        () =>
          new CategorizationRule(
            'r1',
            'ws',
            '  ',
            'cat',
            MatcherType.Contains,
            0,
            new Date(),
          ),
      ).toThrow(DomainError);
    });

    it('throws when keyword exceeds 255 chars', () => {
      expect(
        () =>
          new CategorizationRule(
            'r1',
            'ws',
            'x'.repeat(256),
            'cat',
            MatcherType.Contains,
            0,
            new Date(),
          ),
      ).toThrow(DomainError);
    });

    it('throws when categoryId is empty', () => {
      expect(
        () =>
          new CategorizationRule(
            'r1',
            'ws',
            'kw',
            '',
            MatcherType.Contains,
            0,
            new Date(),
          ),
      ).toThrow(DomainError);
    });

    it('throws when priority is negative', () => {
      expect(
        () =>
          new CategorizationRule(
            'r1',
            'ws',
            'kw',
            'cat',
            MatcherType.Contains,
            -1,
            new Date(),
          ),
      ).toThrow(DomainError);
    });

    it('creates valid instance', () => {
      const rule = new CategorizationRule(
        'rule-1',
        'ws-1',
        'BIEDRONKA',
        'cat-1',
        MatcherType.Contains,
        1,
        new Date(),
      );
      expect(rule.id).toBe('rule-1');
      expect(rule.keyword).toBe('BIEDRONKA');
    });
  });

  describe('create', () => {
    it('generates id and sets defaults', () => {
      const rule = CategorizationRule.create({
        workspaceId: 'ws-1',
        keyword: 'ŻABKA',
        categoryId: 'cat-1',
        matcherType: MatcherType.Contains,
      });

      expect(rule.id).toBeDefined();
      expect(rule.priority).toBe(0);
      expect(rule.keyword).toBe('ŻABKA');
    });

    it('trims keyword', () => {
      const rule = CategorizationRule.create({
        workspaceId: 'ws-1',
        keyword: '  LIDL  ',
        categoryId: 'cat-1',
        matcherType: MatcherType.Exact,
      });

      expect(rule.keyword).toBe('LIDL');
    });

    it('accepts custom priority', () => {
      const rule = CategorizationRule.create({
        workspaceId: 'ws-1',
        keyword: 'NETFLIX',
        categoryId: 'cat-2',
        matcherType: MatcherType.Exact,
        priority: 5,
      });

      expect(rule.priority).toBe(5);
    });
  });

  describe('update', () => {
    const rule = CategorizationRule.create({
      workspaceId: 'ws-1',
      keyword: 'BIEDRONKA',
      categoryId: 'cat-1',
      matcherType: MatcherType.Contains,
      priority: 1,
    });

    it('returns new instance with updated fields', () => {
      const updated = rule.update({ keyword: 'LIDL', priority: 2 });

      expect(updated.keyword).toBe('LIDL');
      expect(updated.priority).toBe(2);
      expect(updated.categoryId).toBe('cat-1');
      expect(updated.id).toBe(rule.id);
    });

    it('preserves unchanged fields', () => {
      const updated = rule.update({ priority: 10 });

      expect(updated.keyword).toBe('BIEDRONKA');
      expect(updated.matcherType).toBe(MatcherType.Contains);
      expect(updated.workspaceId).toBe('ws-1');
    });
  });

  describe('matches', () => {
    describe('Contains matcher', () => {
      const rule = CategorizationRule.create({
        workspaceId: 'ws-1',
        keyword: 'biedronka',
        categoryId: 'cat-1',
        matcherType: MatcherType.Contains,
      });

      it('matches when description contains keyword (case-insensitive)', () => {
        expect(rule.matches('Zakupy BIEDRONKA ul. Kwiatowa')).toBe(true);
      });

      it('does not match when keyword absent', () => {
        expect(rule.matches('Zakupy LIDL')).toBe(false);
      });
    });

    describe('Exact matcher', () => {
      const rule = CategorizationRule.create({
        workspaceId: 'ws-1',
        keyword: 'Netflix',
        categoryId: 'cat-2',
        matcherType: MatcherType.Exact,
      });

      it('matches exact (case-insensitive)', () => {
        expect(rule.matches('NETFLIX')).toBe(true);
        expect(rule.matches('netflix')).toBe(true);
      });

      it('does not match partial', () => {
        expect(rule.matches('Netflix subscription')).toBe(false);
      });
    });
  });
});
