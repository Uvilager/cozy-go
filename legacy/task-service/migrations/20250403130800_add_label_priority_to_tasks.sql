-- +goose Up
-- +goose StatementBegin
ALTER TABLE tasks
ADD COLUMN label VARCHAR(50),
ADD COLUMN priority VARCHAR(50);
-- +goose StatementEnd

-- +goose Down
-- +goose StatementBegin
ALTER TABLE tasks
DROP COLUMN label,
DROP COLUMN priority;
-- +goose StatementEnd
