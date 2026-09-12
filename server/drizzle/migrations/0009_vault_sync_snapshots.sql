CREATE TABLE IF NOT EXISTS "vault_sync_snapshots" (
  "id" uuid PRIMARY KEY NOT NULL,
  "vault_id" uuid NOT NULL,
  "device_id" uuid NOT NULL,
  "key_id" varchar(128) NOT NULL,
  "revision" integer NOT NULL,
  "envelope_hash" varchar(128) NOT NULL,
  "previous_envelope_hash" varchar(128) NOT NULL,
  "header" text NOT NULL,
  "ciphertext" text NOT NULL,
  "signature" text NOT NULL,
  "created_at" timestamp with time zone NOT NULL,
  CONSTRAINT "vault_sync_snapshots_vault_id_vaults_id_fk"
    FOREIGN KEY ("vault_id") REFERENCES "public"."vaults"("id") ON DELETE cascade,
  CONSTRAINT "vault_sync_snapshots_device_id_vault_devices_id_fk"
    FOREIGN KEY ("device_id") REFERENCES "public"."vault_devices"("id") ON DELETE cascade,
  CONSTRAINT "vault_sync_snapshots_vault_revision_unique" UNIQUE ("vault_id", "revision")
);
