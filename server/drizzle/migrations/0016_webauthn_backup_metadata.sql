ALTER TABLE "webauthn_credentials"
  ADD COLUMN IF NOT EXISTS "credential_device_type" varchar(32),
  ADD COLUMN IF NOT EXISTS "credential_backed_up" integer NOT NULL DEFAULT 0;
