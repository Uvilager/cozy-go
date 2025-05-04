package repository

import (
	"context"
	"time"

	"cozy-go/task-service/internal/models" // Import task models

	"github.com/google/uuid"
	"github.com/jackc/pgx/v5/pgxpool"
)

// TaskRepository defines the interface for task data operations.
type TaskRepository interface {
	CreateTask(ctx context.Context, task *models.Task) (uuid.UUID, error)
	GetTaskByID(ctx context.Context, id uuid.UUID) (*models.Task, error)
	ListTasksByUserID(ctx context.Context, userID uuid.UUID) ([]models.Task, error)
	UpdateTask(ctx context.Context, task *models.Task) error
	DeleteTask(ctx context.Context, id uuid.UUID) error
}

// pgTaskRepository implements TaskRepository using pgxpool.
type pgTaskRepository struct {
	pool *pgxpool.Pool
}

// NewTaskRepository creates a new instance of pgTaskRepository.
func NewTaskRepository(pool *pgxpool.Pool) TaskRepository {
	return &pgTaskRepository{pool: pool}
}

// CreateTask inserts a new task record into the database.
func (r *pgTaskRepository) CreateTask(ctx context.Context, task *models.Task) (uuid.UUID, error) {
	query := `
		INSERT INTO tasks (user_id, title, description, due_date, completed, priority, created_at, updated_at)
		VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
		RETURNING id`
	now := time.Now()
	var newID uuid.UUID
	err := r.pool.QueryRow(ctx, query,
		task.UserID,
		task.Title,
		task.Description,
		task.DueDate,
		task.Completed,
		task.Priority,
		now, // Set created_at
		now, // Set updated_at
	).Scan(&newID)

	if err != nil {
		// TODO: Add more specific error handling
		return uuid.Nil, err
	}
	task.ID = newID
	task.CreatedAt = now
	task.UpdatedAt = now
	return newID, nil
}

// GetTaskByID retrieves a task by its ID.
func (r *pgTaskRepository) GetTaskByID(ctx context.Context, id uuid.UUID) (*models.Task, error) {
	query := `
		SELECT id, user_id, title, description, due_date, completed, priority, created_at, updated_at
		FROM tasks
		WHERE id = $1`
	task := &models.Task{}
	err := r.pool.QueryRow(ctx, query, id).Scan(
		&task.ID,
		&task.UserID,
		&task.Title,
		&task.Description,
		&task.DueDate,
		&task.Completed,
		&task.Priority,
		&task.CreatedAt,
		&task.UpdatedAt,
	)
	if err != nil {
		// TODO: Handle pgx.ErrNoRows specifically
		return nil, err
	}
	return task, nil
}

// ListTasksByUserID retrieves all tasks for a specific user.
func (r *pgTaskRepository) ListTasksByUserID(ctx context.Context, userID uuid.UUID) ([]models.Task, error) {
	query := `
		SELECT id, user_id, title, description, due_date, completed, priority, created_at, updated_at
		FROM tasks
		WHERE user_id = $1
		ORDER BY created_at DESC` // Or order by due_date, priority, etc.

	rows, err := r.pool.Query(ctx, query, userID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	tasks := []models.Task{}
	for rows.Next() {
		var t models.Task
		err := rows.Scan(
			&t.ID,
			&t.UserID,
			&t.Title,
			&t.Description,
			&t.DueDate,
			&t.Completed,
			&t.Priority,
			&t.CreatedAt,
			&t.UpdatedAt,
		)
		if err != nil {
			return nil, err // Return partial results or handle error differently?
		}
		tasks = append(tasks, t)
	}

	if err = rows.Err(); err != nil {
		return nil, err
	}

	return tasks, nil
}

// UpdateTask updates an existing task record.
func (r *pgTaskRepository) UpdateTask(ctx context.Context, task *models.Task) error {
	query := `
		UPDATE tasks
		SET title = $1, description = $2, due_date = $3, completed = $4, priority = $5, updated_at = $6
		WHERE id = $7`
	now := time.Now()
	_, err := r.pool.Exec(ctx, query,
		task.Title,
		task.Description,
		task.DueDate,
		task.Completed,
		task.Priority,
		now, // Update updated_at
		task.ID,
	)
	// TODO: Check command tag result for rows affected if needed
	return err
}

// DeleteTask removes a task record from the database.
func (r *pgTaskRepository) DeleteTask(ctx context.Context, id uuid.UUID) error {
	query := `DELETE FROM tasks WHERE id = $1`
	_, err := r.pool.Exec(ctx, query, id)
	// TODO: Check command tag result for rows affected if needed
	return err
}
