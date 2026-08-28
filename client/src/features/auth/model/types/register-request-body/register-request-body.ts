export interface RegisterRequestBody {
  readonly email: string;
  readonly password: string;
  readonly inviteCode?: string;
}
