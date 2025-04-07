-- +goose Up
-- SQL in this section is executed when the migration is applied.
-- Add user_id column to projects table
-- We assume user IDs are integers coming from the auth service.
-- Not adding a foreign key constraint as users table is in a different service/DB.
ALTER TABLE projects
ADD COLUMN user_id INT;

-- Optionally, add an index for faster lookups by user_id
CREATE INDEX IF NOT EXISTS idx_projects_user_id ON projects (user_id);

-- +goose Down
-- SQL in this section is executed when the migration is rolled back.
DROP INDEX IF EXISTS idx_projects_user_id;
ALTER TABLE projects
DROP COLUMN IF EXISTS user_id;
