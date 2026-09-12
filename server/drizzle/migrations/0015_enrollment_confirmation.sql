ALTER TABLE "vault_enrollment_challenges"
  ADD COLUMN IF NOT EXISTS "confirmed_at" timestamp with time zone;
