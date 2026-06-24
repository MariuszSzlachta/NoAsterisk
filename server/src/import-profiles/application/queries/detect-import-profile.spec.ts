import { DetectImportProfileHandler } from '@import-profiles/application/queries/detect-import-profile.handler';
import { ImportProfileRepository } from '@import-profiles/application/ports/import-profile.repository';
import { ImportProfile } from '@import-profiles/domain/import-profile.entity';
import { ColumnMapping } from '@import-profiles/domain/value-objects/column-mapping';
import { ParserConfig } from '@import-profiles/domain/value-objects/parser-config';
import { AnonymizationConfig } from '@import-profiles/domain/value-objects/anonymization-config';
import { AnonymizationStrategy } from '@import-profiles/domain/anonymization-strategy.enum';

const buildRepo = (): jest.Mocked<ImportProfileRepository> => ({
  save: jest.fn(),
  findById: jest.fn(),
  findByWorkspaceId: jest.fn(),
  findByName: jest.fn(),
  delete: jest.fn(),
});

const buildProfile = (overrides?: {
  id?: string;
  name?: string;
  mappings?: ColumnMapping[];
}): ImportProfile =>
  new ImportProfile(
    overrides?.id ?? 'profile-1',
    'ws-1',
    overrides?.name ?? 'Bank A',
    overrides?.mappings ?? [
      new ColumnMapping('date', 'date', true),
      new ColumnMapping('amount', 'amount', true),
      new ColumnMapping('note', 'description', false),
    ],
    new ParserConfig(',', true, 'YYYY-MM-DD', 'UTF-8'),
    new AnonymizationConfig(['title'], AnonymizationStrategy.Hash),
    new Date('2026-06-01'),
    new Date('2026-06-01'),
  );

describe('DetectImportProfileHandler', () => {
  afterEach(() => jest.clearAllMocks());

  it('returns matching profile when headers match', async () => {
    const repo = buildRepo();
    const profile = buildProfile();
    repo.findByWorkspaceId.mockResolvedValue([profile]);
    const handler = new DetectImportProfileHandler(repo);

    const result = await handler.execute({
      workspaceId: 'ws-1',
      headers: ['date', 'amount', 'note'],
    });

    expect(result).toBeDefined();
    expect(result!.id).toBe('profile-1');
    expect(result!.name).toBe('Bank A');
  });

  it('returns undefined when no profile matches', async () => {
    const repo = buildRepo();
    const profile = buildProfile();
    repo.findByWorkspaceId.mockResolvedValue([profile]);
    const handler = new DetectImportProfileHandler(repo);

    const result = await handler.execute({
      workspaceId: 'ws-1',
      headers: ['foo', 'bar'],
    });

    expect(result).toBeUndefined();
  });

  it('returns first match when multiple profiles match', async () => {
    const repo = buildRepo();
    const profile1 = buildProfile({ id: 'p-1', name: 'First' });
    const profile2 = buildProfile({ id: 'p-2', name: 'Second' });
    repo.findByWorkspaceId.mockResolvedValue([profile1, profile2]);
    const handler = new DetectImportProfileHandler(repo);

    const result = await handler.execute({
      workspaceId: 'ws-1',
      headers: ['date', 'amount'],
    });

    expect(result).toBeDefined();
    expect(result!.id).toBe('p-1');
    expect(result!.name).toBe('First');
  });
});
