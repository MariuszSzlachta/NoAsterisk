import { ConflictException, BadRequestException } from '@nestjs/common';
import { DictionaryRepository } from '@dictionaries/domain/ports/dictionary.repository';
import { AddEntryHandler } from '@dictionaries/application/commands/add-entry.handler';
import { buildMockRepo } from '@dictionaries/application/__test-helpers__/dictionary.builders';

describe('AddEntryHandler', () => {
  let repo: jest.Mocked<DictionaryRepository>;
  let handler: AddEntryHandler;

  beforeEach(() => {
    repo = buildMockRepo();
    handler = new AddEntryHandler(repo);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  afterAll(() => {
    jest.restoreAllMocks();
  });

  it('creates and saves entry when not duplicate', async () => {
    repo.existsByTypeAndValue.mockResolvedValue(false);
    repo.save.mockImplementation(async (entry) => entry);

    const result = await handler.execute({
      type: 'Merchant',
      value: 'zabka',
    });

    expect(result.value).toBe('ZABKA');
    expect(result.id).toBeDefined();
    expect(repo.save).toHaveBeenCalled();
  });

  it('throws ConflictException when duplicate exists', async () => {
    repo.existsByTypeAndValue.mockResolvedValue(true);

    await expect(
      handler.execute({ type: 'Merchant', value: 'biedronka' }),
    ).rejects.toThrow(ConflictException);

    expect(repo.save).not.toHaveBeenCalled();
  });

  it('throws BadRequestException for invalid dictionary type', async () => {
    await expect(
      handler.execute({ type: 'InvalidType', value: 'test' }),
    ).rejects.toThrow(BadRequestException);

    expect(repo.save).not.toHaveBeenCalled();
  });
});
