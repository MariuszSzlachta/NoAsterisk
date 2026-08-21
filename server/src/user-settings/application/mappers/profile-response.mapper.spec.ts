import { ProfileResponseMapper } from './profile-response.mapper';
import { User } from '@auth/domain/user.entity';
import { UserRole } from '@auth/domain/user-role.enum';

describe('ProfileResponseMapper', () => {
  it('maps Member user to ProfileResponseDto', () => {
    const user = new User(
      'user-1',
      'test@example.com',
      '$2b$hash',
      UserRole.Member,
      'ws-1',
      new Date('2026-01-15T10:00:00Z'),
      'John Doe',
    );

    const dto = ProfileResponseMapper.toDto(user);

    expect(dto).toEqual({
      id: 'user-1',
      email: 'test@example.com',
      displayName: 'John Doe',
      role: 'Member',
      workspaceId: 'ws-1',
      createdAt: '2026-01-15T10:00:00.000Z',
    });
  });

  it('maps Superuser role correctly', () => {
    const user = new User(
      'user-2',
      'admin@example.com',
      '$2b$hash',
      UserRole.Superuser,
      'ws-2',
      new Date('2026-02-01T08:00:00Z'),
    );

    const dto = ProfileResponseMapper.toDto(user);

    expect(dto.role).toBe('Superuser');
    expect(dto.displayName).toBeUndefined();
  });
});
