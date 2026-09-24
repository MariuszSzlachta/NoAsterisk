CREATE TABLE IF NOT EXISTS "vault_rotation_challenges" (
  "id" uuid PRIMARY KEY,
  "user_id" uuid NOT NULL REFERENCES "users"("id") ON DELETE CASCADE,
  "workspace_id" uuid NOT NULL REFERENCES "workspaces"("id") ON DELETE CASCADE,
  "vault_id" uuid NOT NULL REFERENCES "vaults"("id") ON DELETE CASCADE,
  "device_id" varchar(128) NOT NULL,
  "current_key_id" varchar(128) NOT NULL,
  "next_key_id" varchar(128) NOT NULL,
  "challenge" varchar(43) NOT NULL UNIQUE,
  "expires_at" timestamptz NOT NULL,
  "current_recovery_public_key" varchar(64) NOT NULL,
  "next_recovery_public_key" varchar(64) NOT NULL,
  "signing_public_key" text NOT NULL,
  "envelope_purpose" varchar(32) NOT NULL,
  "envelope" text NOT NULL,
  "passkey_envelope" text,
  "created_at" timestamptz NOT NULL,
  "consumed_at" timestamptz,
  CONSTRAINT "vault_rotation_challenges_format" CHECK ("challenge" ~ '^[A-Za-z0-9_-]{43}$'),
  CONSTRAINT "vault_rotation_challenges_ttl" CHECK ("expires_at" = "created_at" + interval '60 seconds'),
  CONSTRAINT "vault_rotation_challenges_recovery_keys" CHECK (
    "current_recovery_public_key" ~ '^[0-9a-f]{64}$' AND
    "next_recovery_public_key" ~ '^[0-9a-f]{64}$' AND
    "current_recovery_public_key" <> "next_recovery_public_key"
  ),
  CONSTRAINT "vault_rotation_challenges_lifecycle" CHECK (
    "consumed_at" IS NULL OR ("consumed_at" >= "created_at" AND "consumed_at" < "expires_at")
  )
);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "vault_rotation_challenges_scope_idx"
  ON "vault_rotation_challenges"("user_id", "workspace_id", "vault_id", "device_id");
