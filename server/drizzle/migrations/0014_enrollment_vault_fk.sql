DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'vault_enrollment_challenges_vault_id_vaults_id_fk'
  ) THEN
    ALTER TABLE "vault_enrollment_challenges"
      ADD CONSTRAINT "vault_enrollment_challenges_vault_id_vaults_id_fk"
      FOREIGN KEY ("vault_id") REFERENCES "public"."vaults"("id")
      ON DELETE cascade;
  END IF;
END $$;
