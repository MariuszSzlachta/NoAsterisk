CREATE TABLE signed_enrollment_challenges (
  id uuid PRIMARY KEY,
  user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  workspace_id uuid NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  vault_id uuid NOT NULL,
  device_id varchar(128) NOT NULL,
  challenge varchar(43) NOT NULL UNIQUE,
  intent text NOT NULL,
  encrypted_share text NOT NULL,
  created_at timestamptz NOT NULL,
  expires_at timestamptz NOT NULL,
  consumed_at timestamptz,
  confirmed_at timestamptz,
  CONSTRAINT signed_enrollment_challenge_format CHECK (challenge ~ '^[A-Za-z0-9_-]{43}$'),
  CONSTRAINT signed_enrollment_ttl CHECK (expires_at = created_at + interval '60 seconds'),
  CONSTRAINT signed_enrollment_lifecycle CHECK (
    (consumed_at IS NULL AND confirmed_at IS NULL) OR
    (consumed_at >= created_at AND consumed_at < expires_at AND
      (confirmed_at IS NULL OR (confirmed_at >= consumed_at AND confirmed_at < expires_at)))
  )
);
