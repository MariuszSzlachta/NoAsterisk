CREATE TABLE IF NOT EXISTS "vault_rotations" (
  "id" uuid PRIMARY KEY NOT NULL,
  "vault_id" uuid NOT NULL,
  "user_id" uuid NOT NULL,
  "device_id" uuid NOT NULL,
  "idempotency_key" varchar(128) NOT NULL,
  "current_key_id" varchar(128) NOT NULL,
  "next_key_id" varchar(128) NOT NULL,
  "envelope_purpose" varchar(32) NOT NULL,
  "envelope" text NOT NULL,
  "protocol_version" varchar(32) NOT NULL,
  "crypto_suite" varchar(128) NOT NULL,
  "revoked_device_count" integer NOT NULL,
  "created_at" timestamp with time zone NOT NULL,
  CONSTRAINT "vault_rotations_vault_id_vaults_id_fk"
    FOREIGN KEY ("vault_id") REFERENCES "public"."vaults"("id") ON DELETE cascade,
  CONSTRAINT "vault_rotations_user_id_users_id_fk"
    FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade,
  CONSTRAINT "vault_rotations_device_id_vault_devices_id_fk"
    FOREIGN KEY ("device_id") REFERENCES "public"."vault_devices"("id") ON DELETE cascade
);
CREATE UNIQUE INDEX IF NOT EXISTS "vault_rotations_vault_id_idempotency_key_unique"
  ON "vault_rotations" ("vault_id", "idempotency_key");
