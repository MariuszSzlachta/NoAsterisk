ALTER TABLE "webauthn_credentials"
  ADD COLUMN IF NOT EXISTS "revoked_at" timestamp with time zone;
