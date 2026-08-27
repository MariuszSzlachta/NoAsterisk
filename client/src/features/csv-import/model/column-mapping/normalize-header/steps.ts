import type { NormalizeStep } from '../types';

export const stripBom: NormalizeStep = (s) => s.replace(/^\uFEFF/, '');

export const stripLeadingHash: NormalizeStep = (s) => s.replace(/^#+\s*/, '');

export const stripSurroundingQuotes: NormalizeStep = (s) => s.replace(/^["']+|["']+$/g, '');

export const stripParenthetical: NormalizeStep = (s) => s.replace(/\s*\([^)]*\)\s*$/, '');

export const collapseWhitespace: NormalizeStep = (s) => s.replace(/\s+/g, ' ').trim();

export const toLower: NormalizeStep = (s) => s.toLowerCase();

export const DEFAULT_NORMALIZE_STEPS: readonly NormalizeStep[] = [
  stripBom,
  stripLeadingHash,
  stripSurroundingQuotes,
  stripParenthetical,
  collapseWhitespace,
  toLower,
];
