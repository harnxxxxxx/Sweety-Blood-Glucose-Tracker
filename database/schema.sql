-- Sweety databas: authentication foundation
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


-- Glucose readings table
CREATE TABLE IF NOT EXISTS glucose_readings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Connect each reading to its registered user
  user_id UUID NOT NULL
    REFERENCES users(id) ON DELETE CASCADE,

  -- Date on which glucose was measured
  reading_date DATE NOT NULL,

  -- One of the four permitted time slots
  time_slot VARCHAR(30) NOT NULL
    CHECK (
      time_slot IN (
        'morning',
        'after_breakfast',
        'after_lunch',
        'after_dinner'
      )
    ),

  -- Glucose value in mg/dl
  glucose_value INTEGER NOT NULL
    CHECK (glucose_value BETWEEN 40 AND 600),

  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  -- Prevent duplicate slots for the same user and date
  CONSTRAINT unique_user_daily_slot
    UNIQUE (user_id, reading_date, time_slot)
);

-- Improve reading retrieval performance
CREATE INDEX IF NOT EXISTS idx_glucose_readings_user_date
ON glucose_readings (user_id, reading_date DESC);

