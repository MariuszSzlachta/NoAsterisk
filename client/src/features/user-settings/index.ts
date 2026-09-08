export { decryptVault } from './model/decrypt-vault';
export { decryptVaultPayload } from './model/decrypt-vault-payload';
export { parseVaultPayload } from './model/decrypt-vault-payload';
export { encryptVault } from './model/encrypt-vault';
export { VaultDecryptionError } from './model/vault-decryption-error';
export { VaultPayloadError } from './model/vault-payload-error';
export { VaultSizeError } from './model/vault-size-error';
export type { VaultPayload } from './model/vault-payload';
export {
  createVaultPayload,
  digestVaultRecords,
  serializeVaultPayload,
} from './model/vault-payload';
export { isVaultPayload } from './model/vault-payload';
export { createValidatedVaultPayload } from './model/create-validated-vault-payload';
export type {
  DecryptedVaultPayload,
  LegacyVaultPayload,
  VaultRecords,
} from './model/vault-payload';
export { restoreVaultPayload } from './ui/hooks/restore-vault-payload';
export {
  MAX_ENCRYPTED_VAULT_LENGTH,
  MAX_PLAINTEXT_VAULT_LENGTH,
} from './model/vault-limits';
export { isPasswordFormValid } from './model/is-password-form-valid';
export { validateDisplayName } from './model/validate-display-name';
export type { DisplayNameError } from './model/validate-display-name/display-name-error';
export { validatePasswordForm } from './model/validate-password-form';
export { computeVaultStatus } from './model/compute-vault-status';
export { estimateSizeKb } from './model/estimate-size-kb';
export { formatSyncDate } from './model/format-sync-date';
export type { DataStats } from './model/types/data-stats';
export type { PasswordFormValues } from './model/types/password-form-values';
export type { PasswordValidationRules } from './model/types/password-validation-rules';
export type { PreferencesValues } from './model/types/preferences-values';
export type { ProfileData } from './model/types/profile-data';
export type { UserRole } from './model/types/user-role';
export type { VaultInfo } from './model/types/vault-info';
export type { VaultSyncStatus } from './model/types/vault-sync-status';
export { usePreferencesStore } from './store/usePreferencesStore';
export { useProfileQuery } from './api/useProfileQuery';
export { ConfirmDialog } from './ui/ConfirmDialog';
export { DangerSection } from './ui/DangerSection';
export { PreferencesSection } from './ui/PreferencesSection';
export { ProfileSection } from './ui/ProfileSection';
export { RestoreDialog } from './ui/RestoreDialog';
export { RestoreOnLoginGuard } from './ui/RestoreOnLoginGuard';
export { SecuritySection } from './ui/SecuritySection';
export { UserMenu } from './ui/UserMenu';
export { useUserMenu } from './ui/hooks/useUserMenu';
export { VaultPasswordDialog } from './ui/VaultPasswordDialog';
export { VaultSection } from './ui/VaultSection';
