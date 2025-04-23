-- +goose Up
-- SQL in this section is executed when the migration is applied.
CREATE TABLE calendars (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL, -- Foreign key constraint can be added later if users table is in the same DB
    name VARCHAR(255) NOT NULL,
    description TEXT,
    color VARCHAR(7), -- For hex color codes like #RRGGBB
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Optional: Add index on user_id for faster lookups
CREATE INDEX idx_calendars_user_id ON calendars (user_id);

-- Optional: Add constraint for color format if needed
-- ALTER TABLE calendars ADD CONSTRAINT check_color_format CHECK (color ~ '^#[0-9A-Fa-f]{6}$');


-- +goose Down
-- SQL in this section is executed when the migration is rolled back.
DROP INDEX IF EXISTS idx_calendars_user_id;
DROP TABLE IF EXISTS calendars;
