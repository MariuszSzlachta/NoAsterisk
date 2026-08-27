import { createDictionaryProvider } from './dictionary-provider.factory';

/** Dev/test provider — uses bundled JSON stubs only (no HTTP). */
export const devDictionaryProvider = createDictionaryProvider();
