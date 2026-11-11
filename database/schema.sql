-- Sweety database schema: authentication foundation.
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(100) NOT NULL,
  email VARCHAR(255) NOT NULL,
  password_hash TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT users_name_not_blank CHECK (length(trim(name)) > 0)
);

-- Case-insensitive email uniqueness without requiring the citext extension.
CREATE UNIQUE INDEX IF NOT EXISTS users_email_lower_unique ON users (lower(email));
