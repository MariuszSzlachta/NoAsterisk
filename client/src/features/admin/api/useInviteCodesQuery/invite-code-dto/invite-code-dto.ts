export interface InviteCodeDto {
  readonly id: string;
  readonly code: string;
  readonly status: 'Available' | 'Used' | 'Expired';
  readonly createdAt: string;
  readonly expiresAt: string | null;
  readonly usedBy: string | null;
  readonly usedAt: string | null;
}
