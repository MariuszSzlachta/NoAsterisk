import { BadRequestException } from '@nestjs/common';
import { DictionaryRepository } from '@dictionaries/domain/ports/dictionary.repository';
import { GetDictionariesByTypeHandler } from '@dictionaries/application/queries/get-dictionaries-by-type.handler';
import {
  buildMockRepo,
  buildEntry,
} from '@dictionaries/application/__test-helpers__/dictionary.builders';

describe('GetDictionariesByTypeHandler', () => {
  let repo: jest.Mocked<DictionaryRepository>;
  let handler: GetDictionariesByTypeHandler;

  beforeEach(() => {
    repo = buildMockRepo();
    handler = new GetDictionariesByTypeHandler(repo);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  afterAll(() => {
    jest.restoreAllMocks();
  });

  it('returns values list for given type', async () => {
    repo.findByType.mockResolvedValue([
      buildEntry({ value: 'jan' }),
      buildEntry({ id: 'entry-2', value: 'anna' }),
    ]);

    const result = await handler.execute('FirstName');

    expect(result).toEqual(['jan', 'anna']);
  });

  it('returns empty array when no entries for type', async () => {
    repo.findByType.mockResolvedValue([]);

    const result = await handler.execute('Surname');

    expect(result).toEqual([]);
  });

  it('throws BadRequestException for invalid type', async () => {
    await expect(handler.execute('InvalidType')).rejects.toThrow(
      BadRequestException,
    );
  });
});
