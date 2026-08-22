import { DictionaryType } from '@dictionaries/domain/dictionary-type.enum';
import { DictionaryRepository } from '@dictionaries/domain/ports/dictionary.repository';
import { GetAllDictionariesHandler } from '@dictionaries/application/queries/get-all-dictionaries.handler';
import {
  buildMockRepo,
  buildEntry,
} from '@dictionaries/application/__test-helpers__/dictionary.builders';

describe('GetAllDictionariesHandler', () => {
  let repo: jest.Mocked<DictionaryRepository>;
  let handler: GetAllDictionariesHandler;

  beforeEach(() => {
    repo = buildMockRepo();
    handler = new GetAllDictionariesHandler(repo);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  afterAll(() => {
    jest.restoreAllMocks();
  });

  it('returns entries grouped by type', async () => {
    repo.findAll.mockResolvedValue([
      buildEntry({ type: DictionaryType.FirstName, value: 'jan' }),
      buildEntry({
        id: 'entry-2',
        type: DictionaryType.Merchant,
        value: 'BIEDRONKA',
      }),
      buildEntry({
        id: 'entry-3',
        type: DictionaryType.City,
        value: 'WARSZAWA',
      }),
    ]);

    const result = await handler.execute();

    expect(result.firstNames).toEqual(['jan']);
    expect(result.merchants).toEqual(['BIEDRONKA']);
    expect(result.cities).toEqual(['WARSZAWA']);
    expect(result.surnames).toEqual([]);
    expect(result.phrases).toEqual([]);
  });

  it('returns empty groups when no entries exist', async () => {
    repo.findAll.mockResolvedValue([]);

    const result = await handler.execute();

    expect(result.firstNames).toEqual([]);
    expect(result.surnames).toEqual([]);
    expect(result.merchants).toEqual([]);
    expect(result.cities).toEqual([]);
    expect(result.phrases).toEqual([]);
  });
});
