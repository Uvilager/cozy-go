-- +goose Up
-- +goose StatementBegin

CREATE TABLE projects (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    -- TODO: Add user_id foreign key if needed
);

-- +goose StatementEnd
-- +goose StatementBegin

CREATE TABLE tasks (
    id SERIAL PRIMARY KEY,
    project_id INTEGER NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    status VARCHAR(50) NOT NULL DEFAULT 'Todo', -- e.g., 'Todo', 'In Progress', 'Completed'
    due_date TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    -- TODO: Add assigned_user_id foreign key if needed
);

-- +goose StatementEnd
-- +goose StatementBegin

-- Add indexes for frequently queried columns
CREATE INDEX idx_tasks_project_id ON tasks(project_id);
CREATE INDEX idx_tasks_status ON tasks(status);

-- +goose StatementEnd
-- +goose StatementBegin

-- Function to update updated_at timestamp automatically
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
   NEW.updated_at = NOW();
   RETURN NEW;
END;
$$ language 'plpgsql';

-- Trigger for projects table
CREATE TRIGGER update_projects_updated_at
BEFORE UPDATE ON projects
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

-- Trigger for tasks table
CREATE TRIGGER update_tasks_updated_at
BEFORE UPDATE ON tasks
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

-- +goose StatementEnd


-- +goose Down
-- +goose StatementBegin

DROP TRIGGER IF EXISTS update_tasks_updated_at ON tasks;
DROP TRIGGER IF EXISTS update_projects_updated_at ON projects;
DROP FUNCTION IF EXISTS update_updated_at_column();
DROP TABLE IF EXISTS tasks;
DROP TABLE IF EXISTS projects;

-- +goose StatementEnd
