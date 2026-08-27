import { afterEach, describe, expect, it, vi } from 'vitest';

import type { DictionarySet } from '#features/csv-import/model/anonymization/types';

import { createDictionaryProvider } from './dictionary-provider.factory';

const STUB_DICTS: DictionarySet = {
  firstNames: new Set(['jan']),
  surnames: new Set(['kowalski']),
  merchants: new Set(['BIEDRONKA']),
  cities: new Set(['WARSZAWA']),
  phrases: new Set(['przelew']),
};

afterEach(() => {
  vi.restoreAllMocks();
});

describe('createDictionaryProvider', () => {
  it('loads dictionaries from loader', () => {
    const provider = createDictionaryProvider(() =>
      Promise.resolve(STUB_DICTS),
    );
    return expect(provider.loadAll()).resolves.toBe(STUB_DICTS);
  });

  it('caches result after first load', () => {
    const loader = vi.fn(() => Promise.resolve(STUB_DICTS));
    const provider = createDictionaryProvider(loader);

    return provider
      .loadAll()
      .then(() => provider.loadAll())
      .then(() => {
        expect(loader).toHaveBeenCalledTimes(1);
      });
  });

  it('reports isLoaded correctly', () => {
    const provider = createDictionaryProvider(() =>
      Promise.resolve(STUB_DICTS),
    );

    expect(provider.isLoaded()).toBe(false);
    return provider.loadAll().then(() => {
      expect(provider.isLoaded()).toBe(true);
    });
  });

  it('resets cache on resetCache()', () => {
    const loader = vi.fn(() => Promise.resolve(STUB_DICTS));
    const provider = createDictionaryProvider(loader);

    return provider
      .loadAll()
      .then(() => {
        provider.resetCache();
        expect(provider.isLoaded()).toBe(false);
        return provider.loadAll();
      })
      .then(() => {
        expect(loader).toHaveBeenCalledTimes(2);
      });
  });

  it('defaults isStubFallback to true', () => {
    const provider = createDictionaryProvider(() =>
      Promise.resolve(STUB_DICTS),
    );
    expect(provider.isStubFallback()).toBe(true);
  });

  it('respects isStub option', () => {
    const provider = createDictionaryProvider(
      () => Promise.resolve(STUB_DICTS),
      {
        isStub: false,
      },
    );
    expect(provider.isStubFallback()).toBe(false);
  });

  it('shares single in-flight promise for concurrent calls', () => {
    const loader = vi.fn(() => Promise.resolve(STUB_DICTS));
    const provider = createDictionaryProvider(loader);

    return Promise.all([
      provider.loadAll(),
      provider.loadAll(),
      provider.loadAll(),
    ]).then(([r1, r2, r3]) => {
      expect(loader).toHaveBeenCalledTimes(1);
      expect(r1).toBe(r2);
      expect(r2).toBe(r3);
    });
  });

  it('clears inflight on error so retry is possible', () => {
    const loader = vi
      .fn<() => Promise<DictionarySet>>()
      .mockReturnValueOnce(Promise.reject(new Error('network')))
      .mockReturnValueOnce(Promise.resolve(STUB_DICTS));

    const provider = createDictionaryProvider(loader);

    return provider
      .loadAll()
      .then(() => {
        throw new Error('should have rejected');
      })
      .catch((err: Error) => {
        expect(err.message).toBe('network');
        return provider.loadAll();
      })
      .then((result) => {
        expect(result).toBe(STUB_DICTS);
        expect(loader).toHaveBeenCalledTimes(2);
      });
  });
});
