CREATE TABLE IF NOT EXISTS "vault_keysets" (
  "id" uuid PRIMARY KEY NOT NULL,
  "vault_id" uuid NOT NULL UNIQUE,
  "key_id" varchar(128) NOT NULL,
  "protocol_version" varchar(32) NOT NULL,
  "crypto_suite" varchar(128) NOT NULL,
  "created_at" timestamp with time zone NOT NULL,
  "updated_at" timestamp with time zone NOT NULL,
  CONSTRAINT "vault_keysets_vault_id_vaults_id_fk"
    FOREIGN KEY ("vault_id") REFERENCES "public"."vaults"("id") ON DELETE cascade
);
CREATE TABLE IF NOT EXISTS "vault_devices" (
  "id" uuid PRIMARY KEY NOT NULL,
  "user_id" uuid NOT NULL,
  "keyset_id" uuid NOT NULL,
  "device_id" varchar(128) NOT NULL,
  "status" varchar(32) NOT NULL,
  "revoked" boolean NOT NULL DEFAULT false,
  "created_at" timestamp with time zone NOT NULL,
  "last_seen_at" timestamp with time zone NOT NULL,
  "revoked_at" timestamp with time zone,
  CONSTRAINT "vault_devices_user_id_users_id_fk"
    FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade,
  CONSTRAINT "vault_devices_keyset_id_vault_keysets_id_fk"
    FOREIGN KEY ("keyset_id") REFERENCES "public"."vault_keysets"("id") ON DELETE cascade
);
CREATE TABLE IF NOT EXISTS "webauthn_credentials" (
  "id" uuid PRIMARY KEY NOT NULL,
  "user_id" uuid NOT NULL,
  "credential_id" varchar(1024) NOT NULL UNIQUE,
  "public_key" text NOT NULL,
  "counter" varchar(32) NOT NULL,
  "transports" varchar(256),
  "supports_prf" integer NOT NULL DEFAULT 0,
  "created_at" timestamp with time zone NOT NULL,
  "last_used_at" timestamp with time zone,
  CONSTRAINT "webauthn_credentials_user_id_users_id_fk"
    FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade
);
CREATE TABLE IF NOT EXISTS "vault_server_shares" (
  "id" uuid PRIMARY KEY NOT NULL,
  "device_id" uuid NOT NULL UNIQUE,
  "ciphertext" text NOT NULL,
  "nonce" text NOT NULL,
  "auth_tag" text NOT NULL,
  "infrastructure_key_version" integer NOT NULL,
  "created_at" timestamp with time zone NOT NULL,
  "updated_at" timestamp with time zone NOT NULL,
  CONSTRAINT "vault_server_shares_device_id_vault_devices_id_fk"
    FOREIGN KEY ("device_id") REFERENCES "public"."vault_devices"("id") ON DELETE cascade
);
CREATE UNIQUE INDEX IF NOT EXISTS "vault_devices_user_device_unique"
  ON "vault_devices" ("user_id", "device_id");
CREATE TABLE IF NOT EXISTS "vault_device_envelopes" (
  "id" uuid PRIMARY KEY NOT NULL,
  "device_id" uuid NOT NULL,
  "keyset_id" uuid NOT NULL,
  "purpose" varchar(32) NOT NULL,
  "envelope" text NOT NULL,
  "protocol_version" varchar(32) NOT NULL,
  "created_at" timestamp with time zone NOT NULL,
  "updated_at" timestamp with time zone NOT NULL,
  CONSTRAINT "vault_device_envelopes_device_id_vault_devices_id_fk"
    FOREIGN KEY ("device_id") REFERENCES "public"."vault_devices"("id") ON DELETE cascade,
  CONSTRAINT "vault_device_envelopes_keyset_id_vault_keysets_id_fk"
    FOREIGN KEY ("keyset_id") REFERENCES "public"."vault_keysets"("id") ON DELETE cascade
);
CREATE UNIQUE INDEX IF NOT EXISTS "vault_device_envelopes_device_purpose_unique"
  ON "vault_device_envelopes" ("device_id", "purpose");
