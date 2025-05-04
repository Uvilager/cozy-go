-- +goose Up
-- +goose StatementBegin
ALTER TABLE tasks
ADD COLUMN start_time TIMESTAMPTZ NULL,
ADD COLUMN end_time TIMESTAMPTZ NULL;

COMMENT ON COLUMN tasks.start_time IS 'Optional start time for the task/event';
COMMENT ON COLUMN tasks.end_time IS 'Optional end time for the task/event';
-- +goose StatementEnd

-- +goose Down
-- +goose StatementBegin
ALTER TABLE tasks
DROP COLUMN start_time,
DROP COLUMN end_time;
-- +goose StatementEnd
