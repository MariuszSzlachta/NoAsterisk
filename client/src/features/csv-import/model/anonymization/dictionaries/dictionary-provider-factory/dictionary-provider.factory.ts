import type { DictionaryProvider } from '#features/csv-import/model/anonymization/types/dictionary-provider';
import type { DictionarySet } from '#features/csv-import/model/anonymization/types/dictionary-set';
import { buildFromStubs } from '#features/csv-import/model/anonymization/dictionaries/build-from-stubs';
import { DEFAULT_STUB_FALLBACK } from '#features/csv-import/model/anonymization/dictionaries/dictionary-provider-factory/constants/default-stub-fallback';

// `let` is intentional — the provider is a stateful cache by design
export const createDictionaryProvider = (
  loader: () => Promise<DictionarySet> = () =>
    Promise.resolve(buildFromStubs()),
  options: { isStub?: boolean } = {},
): DictionaryProvider & { resetCache: () => void } => {
  let cache: DictionarySet | null = null;
  let inflight: Promise<DictionarySet> | null = null;
  const stubFallback = options.isStub ?? DEFAULT_STUB_FALLBACK;

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
