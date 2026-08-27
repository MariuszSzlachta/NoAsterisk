import type { DictionaryProvider, DictionarySet } from '#features/csv-import/model/anonymization/types';
import { buildFromStubs } from './stub-builder';

/**
 * Creates a DictionaryProvider with its own cache instance.
 * Pass a custom loader to override the default (bundled stubs).
 *
 * Implements single-flight: concurrent loadAll() calls share one in-flight promise.
 *
 * `let` is intentional here — the provider is a stateful cache by design.
 */
export const createDictionaryProvider = (
  loader: () => Promise<DictionarySet> = () => Promise.resolve(buildFromStubs()),
  options: { isStub?: boolean } = {},
): DictionaryProvider & { resetCache: () => void } => {
  let cache: DictionarySet | null = null;
  let inflight: Promise<DictionarySet> | null = null;
  const stubFallback = options.isStub ?? true;

  return {
    loadAll: (): Promise<DictionarySet> => {
      if (cache) {
        return Promise.resolve(cache);
      }
      if (!inflight) {
        inflight = loader()
          .then((result) => {
            cache = result;
            inflight = null;
            return result;
          })
          .catch((err: unknown) => {
            inflight = null;
            throw err;
          });
      }
      return inflight;
    },
    isLoaded: (): boolean => cache !== null,
    isStubFallback: (): boolean => stubFallback,
    resetCache: (): void => {
      cache = null;
      inflight = null;
    },
  };
};
