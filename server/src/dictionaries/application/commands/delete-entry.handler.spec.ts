import { NotFoundException } from '@nestjs/common';
import { DictionaryRepository } from '@dictionaries/domain/ports/dictionary.repository';
import { DeleteEntryHandler } from '@dictionaries/application/commands/delete-entry.handler';
import {
  buildMockRepo,
  buildEntry,
} from '@dictionaries/application/__test-helpers__/dictionary.builders';

describe('DeleteEntryHandler', () => {
  let repo: jest.Mocked<DictionaryRepository>;
  let handler: DeleteEntryHandler;

  beforeEach(() => {
    repo = buildMockRepo();
    handler = new DeleteEntryHandler(repo);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  afterAll(() => {
    jest.restoreAllMocks();
  });

  it('deletes entry when it exists', async () => {
    repo.findById.mockResolvedValue(buildEntry({ id: 'entry-1' }));
    repo.delete.mockResolvedValue(undefined);

    await handler.execute({ id: 'entry-1' });

    expect(repo.findById).toHaveBeenCalledWith('entry-1');
    expect(repo.delete).toHaveBeenCalledWith('entry-1');
  });

  it('throws NotFoundException when entry does not exist', async () => {
    repo.findById.mockResolvedValue(undefined);

    await expect(handler.execute({ id: 'non-existent' })).rejects.toThrow(
      NotFoundException,
    );

    expect(repo.delete).not.toHaveBeenCalled();
  });
});
