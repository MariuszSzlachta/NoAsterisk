ALTER TABLE "vault_keysets" ADD COLUMN "recovery_public_key" varchar(64);
--> statement-breakpoint
ALTER TABLE "vault_keysets" ADD CONSTRAINT "vault_keysets_recovery_public_key_format"
CHECK ("recovery_public_key" IS NULL OR "recovery_public_key" ~ '^[0-9a-f]{64}$');
--> statement-breakpoint
CREATE TABLE "vault_recovery_authority_challenges" (
  "id" uuid PRIMARY KEY,
  "user_id" uuid NOT NULL REFERENCES "users"("id") ON DELETE CASCADE,
  "workspace_id" uuid NOT NULL REFERENCES "workspaces"("id") ON DELETE CASCADE,
  "vault_id" uuid NOT NULL REFERENCES "vaults"("id") ON DELETE CASCADE,
  "key_id" varchar(128) NOT NULL,
  "device_id" varchar(128) NOT NULL,
  "challenge" varchar(43) NOT NULL UNIQUE CHECK ("challenge" ~ '^[A-Za-z0-9_-]{43}$'),
  "signing_public_key" text NOT NULL,
  "recovery_public_key" varchar(64) NOT NULL CHECK ("recovery_public_key" ~ '^[0-9a-f]{64}$'),
  "created_at" timestamptz NOT NULL,
  "expires_at" timestamptz NOT NULL,
  "consumed_at" timestamptz,
  CONSTRAINT "vault_recovery_authority_challenges_ttl" CHECK ("expires_at" = "created_at" + interval '60 seconds'),
  CONSTRAINT "vault_recovery_authority_challenges_consumed_at" CHECK ("consumed_at" IS NULL OR ("consumed_at" >= "created_at" AND "consumed_at" < "expires_at"))
);
--> statement-breakpoint
CREATE INDEX "vault_recovery_authority_challenges_expiry_idx" ON "vault_recovery_authority_challenges"("expires_at");
