ALTER TABLE "users"
  ADD COLUMN "privacy_policy_version" varchar(64),
  ADD COLUMN "terms_version" varchar(64),
  ADD COLUMN "consent_at" timestamp with time zone;
