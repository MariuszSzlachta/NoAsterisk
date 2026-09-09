CREATE EXTENSION IF NOT EXISTS pgcrypto;
--> statement-breakpoint
ALTER TABLE "vaults"
  ADD COLUMN "content_hash" varchar(64),
  ADD COLUMN "byte_size" integer,
  ADD COLUMN "revision" integer;
--> statement-breakpoint
UPDATE "vaults"
SET
  "content_hash" = encode(digest("encrypted_blob", 'sha256'), 'hex'),
  "byte_size" = octet_length("encrypted_blob"),
  "revision" = 1
WHERE "content_hash" IS NULL;
--> statement-breakpoint
ALTER TABLE "vaults"
  ALTER COLUMN "content_hash" SET NOT NULL,
  ALTER COLUMN "byte_size" SET NOT NULL,
  ALTER COLUMN "revision" SET NOT NULL,
  ALTER COLUMN "revision" SET DEFAULT 1;
