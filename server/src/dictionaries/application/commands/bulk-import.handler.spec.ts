import { BadRequestException } from '@nestjs/common';
import { DictionaryRepository } from '@dictionaries/domain/ports/dictionary.repository';
import { BulkImportHandler } from '@dictionaries/application/commands/bulk-import.handler';
import {
  buildMockRepo,
  buildEntry,
} from '@dictionaries/application/__test-helpers__/dictionary.builders';
import { DictionaryType } from '@dictionaries/domain/dictionary-type.enum';

describe('BulkImportHandler', () => {
  let repo: jest.Mocked<DictionaryRepository>;
  let handler: BulkImportHandler;

  beforeEach(() => {
    repo = buildMockRepo();
    handler = new BulkImportHandler(repo);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  afterAll(() => {
    jest.restoreAllMocks();
  });

  it('imports non-duplicate entries and returns counts', async () => {
    repo.findByType.mockResolvedValue([]);
    repo.saveBatch.mockResolvedValue(3);

    const result = await handler.execute({
      type: 'FirstName',
      values: ['Jan', 'Anna', 'Piotr'],
    });

    expect(result.imported).toBe(3);
    expect(result.skipped).toBe(0);
    expect(repo.saveBatch).toHaveBeenCalledWith(
      expect.arrayContaining([
        expect.objectContaining({ value: 'jan' }),
        expect.objectContaining({ value: 'anna' }),
        expect.objectContaining({ value: 'piotr' }),
      ]),
    );
  });

  it('skips entries that already exist in repository', async () => {
    repo.findByType.mockResolvedValue([
      buildEntry({ value: 'jan', type: DictionaryType.FirstName }),
    ]);
    repo.saveBatch.mockResolvedValue(2);

    const result = await handler.execute({
      type: 'FirstName',
      values: ['Jan', 'Anna', 'Piotr'],
    });

    expect(result.imported).toBe(2);
    expect(result.skipped).toBe(1);
  });

  it('deduplicates within the same batch', async () => {
    repo.findByType.mockResolvedValue([]);
    repo.saveBatch.mockResolvedValue(1);

    const result = await handler.execute({
      type: 'FirstName',
      values: ['Jan', 'jan', ' JAN '],
    });

    expect(result.imported).toBe(1);
    expect(result.skipped).toBe(2);
  });

  it('returns zero imported when all entries exist', async () => {
    repo.findByType.mockResolvedValue([
      buildEntry({ value: 'jan', type: DictionaryType.FirstName }),
      buildEntry({ id: 'e2', value: 'anna', type: DictionaryType.FirstName }),
    ]);

    const result = await handler.execute({
      type: 'FirstName',
      values: ['Jan', 'Anna'],
    });

    expect(result.imported).toBe(0);
    expect(result.skipped).toBe(2);
    expect(repo.saveBatch).not.toHaveBeenCalled();
  });

  it('throws BadRequestException for invalid dictionary type', async () => {
    await expect(
      handler.execute({ type: 'InvalidType', values: ['test'] }),
    ).rejects.toThrow(BadRequestException);

    expect(repo.findByType).not.toHaveBeenCalled();
  });
});
