ALTER TABLE "vault_devices" ADD COLUMN IF NOT EXISTS "signing_public_key" text;
CREATE TABLE IF NOT EXISTS "webauthn_challenges" (
  "id" uuid PRIMARY KEY NOT NULL,
  "user_id" uuid NOT NULL,
  "vault_id" uuid NOT NULL,
  "device_id" varchar(128) NOT NULL,
  "challenge" varchar(128) NOT NULL UNIQUE,
  "type" varchar(32) NOT NULL,
  "expires_at" timestamp with time zone NOT NULL,
  "consumed_at" timestamp with time zone,
  "created_at" timestamp with time zone NOT NULL,
  CONSTRAINT "webauthn_challenges_user_id_users_id_fk"
    FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade,
  CONSTRAINT "webauthn_challenges_vault_id_vaults_id_fk"
    FOREIGN KEY ("vault_id") REFERENCES "public"."vaults"("id") ON DELETE cascade
);
