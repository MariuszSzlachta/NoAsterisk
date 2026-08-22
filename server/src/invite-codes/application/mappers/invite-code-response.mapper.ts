import { InviteCode } from '@invite-codes/domain/invite-code.entity';
import { InviteCodeStatus } from '@invite-codes/domain/invite-code-status.enum';
import { InviteCodeResponseDto } from '@invite-codes/application/dto/invite-code-response.dto';

const STATUS_MAP: Record<InviteCodeStatus, InviteCodeResponseDto['status']> = {
  [InviteCodeStatus.Available]: 'Available',
  [InviteCodeStatus.Used]: 'Used',
  [InviteCodeStatus.Expired]: 'Expired',
};

export class InviteCodeResponseMapper {
  static toDto(entity: InviteCode): InviteCodeResponseDto {
    return {
      id: entity.id,
      code: entity.code,
      status: InviteCodeResponseMapper.computeEffectiveStatus(entity),
      createdAt: entity.createdAt.toISOString(),
      expiresAt: entity.expiresAt?.toISOString() ?? null,
      usedBy: entity.usedBy ?? null,
      usedAt: entity.usedAt?.toISOString() ?? null,
    };
  }

  static toDtoList(
    entities: ReadonlyArray<InviteCode>,
  ): ReadonlyArray<InviteCodeResponseDto> {
    return entities.map((entity) => InviteCodeResponseMapper.toDto(entity));
  }

  /**
   * Computes effective display status: if the code is nominally Available
   * but has a past expiresAt, display it as Expired.
   */
  private static computeEffectiveStatus(
    entity: InviteCode,
  ): InviteCodeResponseDto['status'] {
    if (
      entity.status === InviteCodeStatus.Available &&
      entity.expiresAt &&
      entity.expiresAt < new Date()
    ) {
      return 'Expired';
    }
    return STATUS_MAP[entity.status];
  }
}
