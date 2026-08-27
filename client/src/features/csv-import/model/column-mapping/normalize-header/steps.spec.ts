import { describe, expect, it } from 'vitest';

import {
  collapseWhitespace,
  stripBom,
  stripLeadingHash,
  stripParenthetical,
  stripSurroundingQuotes,
  toLower,
} from './steps';

describe('stripBom', () => {
  it('removes BOM from start', () => {
    expect(stripBom('\uFEFFData')).toBe('Data');
  });

  it('returns unchanged when no BOM', () => {
    expect(stripBom('Data')).toBe('Data');
  });
});

describe('stripLeadingHash', () => {
  it('removes single #', () => {
    expect(stripLeadingHash('#Kwota')).toBe('Kwota');
  });

  it('removes multiple ##', () => {
    expect(stripLeadingHash('##Opis')).toBe('Opis');
  });

  it('removes # with trailing space', () => {
    expect(stripLeadingHash('# Data operacji')).toBe('Data operacji');
  });

  it('returns unchanged when no #', () => {
    expect(stripLeadingHash('Kwota')).toBe('Kwota');
  });
});

describe('stripSurroundingQuotes', () => {
  it('removes double quotes', () => {
    expect(stripSurroundingQuotes('"Kwota"')).toBe('Kwota');
  });

  it('removes single quotes', () => {
    expect(stripSurroundingQuotes("'Saldo'")).toBe('Saldo');
  });

  it('returns unchanged when no quotes', () => {
    expect(stripSurroundingQuotes('Kwota')).toBe('Kwota');
  });
});

describe('stripParenthetical', () => {
  it('removes trailing parenthetical', () => {
    expect(stripParenthetical('Kwota (PLN)')).toBe('Kwota');
  });

  it('returns unchanged when no parenthetical', () => {
    expect(stripParenthetical('Kwota')).toBe('Kwota');
  });

  it('only strips trailing parenthetical, not mid-string', () => {
    expect(stripParenthetical('Kwota (PLN) extra')).toBe('Kwota (PLN) extra');
  });
});

describe('collapseWhitespace', () => {
  it('collapses multiple spaces', () => {
    expect(collapseWhitespace('Data   operacji')).toBe('Data operacji');
  });

  it('trims leading/trailing', () => {
    expect(collapseWhitespace('  Kwota  ')).toBe('Kwota');
  });

  it('handles tabs', () => {
    expect(collapseWhitespace('\tData\t')).toBe('Data');
  });
});

describe('toLower', () => {
  it('lowercases', () => {
    expect(toLower('DATA OPERACJI')).toBe('data operacji');
  });
});
