import { DomainError } from '@budget/domain';
import { CreateImportProfileHandler } from '@import-profiles/application/commands/create-import-profile.handler';
import { UpdateImportProfileHandler } from '@import-profiles/application/commands/update-import-profile.handler';
import { DeleteImportProfileHandler } from '@import-profiles/application/commands/delete-import-profile.handler';
import { GetImportProfilesHandler } from '@import-profiles/application/queries/get-import-profiles.handler';
import { GetImportProfileByIdHandler } from '@import-profiles/application/queries/get-import-profile-by-id.handler';
import { ImportProfileRepository } from '@import-profiles/application/ports/import-profile.repository';
import { ImportProfile } from '@import-profiles/domain/import-profile.entity';
import { ColumnMapping } from '@import-profiles/domain/value-objects/column-mapping';
import { ParserConfig } from '@import-profiles/domain/value-objects/parser-config';
import { AnonymizationConfig } from '@import-profiles/domain/value-objects/anonymization-config';
import { AnonymizationStrategy } from '@import-profiles/domain/anonymization-strategy.enum';

const buildRepo = (): jest.Mocked<ImportProfileRepository> => ({
  save: jest.fn().mockImplementation((p) => Promise.resolve(p)),
  findById: jest.fn(),
  findByWorkspaceId: jest.fn(),
  findByName: jest.fn(),
  delete: jest.fn(),
});

const columnMappingsRaw = [
  { sourceColumn: 'date', targetField: 'date', isRequired: true },
  { sourceColumn: 'amount', targetField: 'amount', isRequired: true },
];
const parserConfigRaw = {
  delimiter: ',',
  hasHeader: true,
  dateFormat: 'YYYY-MM-DD',
  encoding: 'UTF-8',
};
const anonymizationConfigRaw = {
  fieldsToAnonymize: ['title'],
  strategy: 'Hash' as const,
};

const buildProfile = (
  overrides?: Partial<{ id: string; workspaceId: string; name: string }>,
): ImportProfile =>
  new ImportProfile(
    overrides?.id ?? 'profile-1',
    overrides?.workspaceId ?? 'ws-1',
    overrides?.name ?? 'My Bank',
    [
      new ColumnMapping('date', 'date', true),
      new ColumnMapping('amount', 'amount', true),
    ],
    new ParserConfig(',', true, 'YYYY-MM-DD', 'UTF-8'),
    new AnonymizationConfig(['title'], AnonymizationStrategy.Hash),
    new Date('2026-06-01'),
    new Date('2026-06-01'),
  );

describe('CreateImportProfileHandler', () => {
  afterEach(() => jest.clearAllMocks());

  it('creates profile and returns DTO', async () => {
    const repo = buildRepo();
    repo.findByName.mockResolvedValue(undefined);
    const handler = new CreateImportProfileHandler(repo);

    const result = await handler.execute({
      workspaceId: 'ws-1',
      name: 'My Bank',
      columnMappings: columnMappingsRaw,
      parserConfig: parserConfigRaw,
      anonymizationConfig: anonymizationConfigRaw,
    });

    expect(result.name).toBe('My Bank');
    expect(result.columnMappings).toHaveLength(2);
    expect(result.anonymizationConfig.strategy).toBe('Hash');
    expect(repo.save).toHaveBeenCalled();
  });

  it('throws DomainError when name already exists', async () => {
    const repo = buildRepo();
    repo.findByName.mockResolvedValue(buildProfile());
    const handler = new CreateImportProfileHandler(repo);

    await expect(
      handler.execute({
        workspaceId: 'ws-1',
        name: 'My Bank',
        columnMappings: columnMappingsRaw,
        parserConfig: parserConfigRaw,
        anonymizationConfig: anonymizationConfigRaw,
      }),
    ).rejects.toThrow(DomainError);
  });
});

describe('UpdateImportProfileHandler', () => {
  afterEach(() => jest.clearAllMocks());

  it('updates and returns DTO', async () => {
    const repo = buildRepo();
    repo.findById.mockResolvedValue(buildProfile());
    repo.findByName.mockResolvedValue(undefined);
    const handler = new UpdateImportProfileHandler(repo);

    const result = await handler.execute({
      workspaceId: 'ws-1',
      id: 'profile-1',
      name: 'New Name',
    });

    expect(result?.name).toBe('New Name');
    expect(repo.save).toHaveBeenCalled();
  });

  it('returns undefined when not found', async () => {
    const repo = buildRepo();
    repo.findById.mockResolvedValue(undefined);
    const handler = new UpdateImportProfileHandler(repo);

    const result = await handler.execute({
      workspaceId: 'ws-1',
      id: 'nonexistent',
    });

    expect(result).toBeUndefined();
  });

  it('throws DomainError when new name already taken', async () => {
    const repo = buildRepo();
    repo.findById.mockResolvedValue(buildProfile());
    repo.findByName.mockResolvedValue(buildProfile({ id: 'other-profile' }));
    const handler = new UpdateImportProfileHandler(repo);

    await expect(
      handler.execute({
        workspaceId: 'ws-1',
        id: 'profile-1',
        name: 'Taken Name',
      }),
    ).rejects.toThrow(DomainError);
  });
});

describe('DeleteImportProfileHandler', () => {
  afterEach(() => jest.clearAllMocks());

  it('returns true when profile exists and is deleted', async () => {
    const repo = buildRepo();
    repo.findById.mockResolvedValue(buildProfile());
    const handler = new DeleteImportProfileHandler(repo);

    const result = await handler.execute({
      workspaceId: 'ws-1',
      id: 'profile-1',
    });

    expect(result).toBe(true);
    expect(repo.delete).toHaveBeenCalledWith('ws-1', 'profile-1');
  });

  it('returns false when profile not found', async () => {
    const repo = buildRepo();
    repo.findById.mockResolvedValue(undefined);
    const handler = new DeleteImportProfileHandler(repo);

    const result = await handler.execute({
      workspaceId: 'ws-1',
      id: 'nonexistent',
    });

    expect(result).toBe(false);
    expect(repo.delete).not.toHaveBeenCalled();
  });

  it('returns false when workspaceId does not match', async () => {
    const repo = buildRepo();
    repo.findById.mockResolvedValue(undefined);
    const handler = new DeleteImportProfileHandler(repo);

    const result = await handler.execute({
      workspaceId: 'wrong-ws',
      id: 'profile-1',
    });

    expect(result).toBe(false);
    expect(repo.delete).not.toHaveBeenCalled();
  });
});

describe('GetImportProfilesHandler', () => {
  afterEach(() => jest.clearAllMocks());

  it('returns mapped profiles for workspace', async () => {
    const repo = buildRepo();
    repo.findByWorkspaceId.mockResolvedValue([
      buildProfile(),
      buildProfile({ id: 'profile-2', name: 'Other Bank' }),
    ]);
    const handler = new GetImportProfilesHandler(repo);

    const result = await handler.execute('ws-1');

    expect(result).toHaveLength(2);
    expect(result[0]?.name).toBe('My Bank');
    expect(result[1]?.name).toBe('Other Bank');
  });
});

describe('GetImportProfileByIdHandler', () => {
  afterEach(() => jest.clearAllMocks());

  it('returns profile when found', async () => {
    const repo = buildRepo();
    repo.findById.mockResolvedValue(buildProfile());
    const handler = new GetImportProfileByIdHandler(repo);

    const result = await handler.execute('ws-1', 'profile-1');

    expect(result).toBeDefined();
    expect(result?.name).toBe('My Bank');
  });

  it('returns undefined when not found', async () => {
    const repo = buildRepo();
    repo.findById.mockResolvedValue(undefined);
    const handler = new GetImportProfileByIdHandler(repo);

    const result = await handler.execute('ws-1', 'nonexistent');

    expect(result).toBeUndefined();
  });
});
