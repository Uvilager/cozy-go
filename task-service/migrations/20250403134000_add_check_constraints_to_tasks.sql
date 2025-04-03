-- +goose Up
-- Add CHECK constraints to ensure data integrity for status, label, and priority

-- Constraint for Status
ALTER TABLE tasks
ADD CONSTRAINT check_task_status CHECK (status IN ('backlog', 'todo', 'in progress', 'done', 'canceled'));

-- Constraint for Label
-- Note: Assumes empty string '' is a valid label based on the IsValid() method in models.go.
-- If labels are mandatory and cannot be empty, adjust the check accordingly (e.g., remove '' from the list).
ALTER TABLE tasks
ADD CONSTRAINT check_task_label CHECK (label IN ('bug', 'feature', 'documentation', ''));

-- Constraint for Priority
ALTER TABLE tasks
ADD CONSTRAINT check_task_priority CHECK (priority IN ('low', 'medium', 'high'));


-- +goose Down
-- Remove the CHECK constraints

ALTER TABLE tasks
DROP CONSTRAINT check_task_status;

ALTER TABLE tasks
DROP CONSTRAINT check_task_label;

ALTER TABLE tasks
DROP CONSTRAINT check_task_priority;
