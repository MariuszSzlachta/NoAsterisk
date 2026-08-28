import { createDictionaryProvider } from '#features/csv-import/model/anonymization/dictionaries/dictionary-provider-factory';

/** Dev/test provider — uses bundled JSON stubs only (no HTTP). */
export const devDictionaryProvider = createDictionaryProvider();
