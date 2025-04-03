package repository

import (
	"context"
	"log"
	"time"

	"cozy-go/task-service/internal/database"
	"cozy-go/task-service/internal/models"

	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgxpool"
)

// TaskRepository defines the interface for task data operations.
type TaskRepository interface {
	CreateTask(ctx context.Context, task *models.Task) (int, error)
	GetTaskByID(ctx context.Context, id int) (*models.Task, error)
	GetTasksByProjectID(ctx context.Context, projectID int) ([]models.Task, error)
	UpdateTask(ctx context.Context, task *models.Task) error // Updated to handle full task update
	DeleteTask(ctx context.Context, id int) error
	// UpdateTaskStatus might be deprecated or refactored into UpdateTask
	UpdateTaskStatus(ctx context.Context, id int, status models.Status) error // Changed status type
}

// pgTaskRepository implements TaskRepository using pgxpool.
type pgTaskRepository struct {
	db *pgxpool.Pool
}

// NewTaskRepository creates a new instance of TaskRepository.
func NewTaskRepository() TaskRepository {
	if database.DB == nil {
		log.Fatal("Database pool is not initialized")
	}
	return &pgTaskRepository{db: database.DB}
}

// CreateTask inserts a new task into the database.
func (r *pgTaskRepository) CreateTask(ctx context.Context, task *models.Task) (int, error) {
	query := `INSERT INTO tasks (project_id, title, description, status, label, priority, due_date, created_at, updated_at)
              VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
              RETURNING id, created_at, updated_at`
	now := time.Now()
	// Ensure default values if empty
	if task.Status == "" {
		task.Status = models.StatusTodo // Or perhaps StatusBacklog based on frontend?
	}
	if task.Label == "" {
		// Decide on a default label, e.g., "" or a specific default like "feature"
		// task.Label = models.LabelFeature
	}
	if task.Priority == "" {
		task.Priority = models.PriorityMedium // Default to medium priority
	}

	err := r.db.QueryRow(ctx, query,
		task.ProjectID, task.Title, task.Description, string(task.Status), string(task.Label), string(task.Priority), task.DueDate, now, now, // Cast Status, Label, Priority
	).Scan(&task.ID, &task.CreatedAt, &task.UpdatedAt)
	if err != nil {
		log.Printf("Error creating task: %v", err)
		return 0, err
	}
	log.Printf("Created task with ID: %d for project ID: %d", task.ID, task.ProjectID)
	return task.ID, nil
}

// GetTaskByID retrieves a task by its ID.
func (r *pgTaskRepository) GetTaskByID(ctx context.Context, id int) (*models.Task, error) {
	query := `SELECT id, project_id, title, description, status, label, priority, due_date, created_at, updated_at
              FROM tasks
              WHERE id = $1`
	task := &models.Task{}
	err := r.db.QueryRow(ctx, query, id).Scan(
		&task.ID,
		&task.ProjectID,
		&task.Title,
		&task.Description,
		&task.Status,
		&task.Label,
		&task.Priority,
		&task.DueDate,
		&task.CreatedAt,
		&task.UpdatedAt,
	)
	if err != nil {
		if err == pgx.ErrNoRows {
			return nil, nil // Not found
		}
		log.Printf("Error getting task by ID %d: %v", id, err)
		return nil, err
	}
	return task, nil
}

// GetTasksByProjectID retrieves all tasks for a given project ID.
func (r *pgTaskRepository) GetTasksByProjectID(ctx context.Context, projectID int) ([]models.Task, error) {
	query := `SELECT id, project_id, title, description, status, label, priority, due_date, created_at, updated_at
              FROM tasks
              WHERE project_id = $1
              ORDER BY created_at DESC` // Example ordering

	rows, err := r.db.Query(ctx, query, projectID)
	if err != nil {
		log.Printf("Error querying tasks for project ID %d: %v", projectID, err)
		return nil, err
	}
	defer rows.Close()

	tasks := []models.Task{}
	for rows.Next() {
		var task models.Task
		err := rows.Scan(
			&task.ID,
			&task.ProjectID,
			&task.Title,
			&task.Description,
			&task.Status,
			&task.Label,
			&task.Priority,
			&task.DueDate,
			&task.CreatedAt,
			&task.UpdatedAt,
		)
		if err != nil {
			log.Printf("Error scanning task row: %v", err)
			return nil, err // Return error if scanning fails
		}
		tasks = append(tasks, task)
	}

	if err = rows.Err(); err != nil {
		log.Printf("Error iterating task rows: %v", err)
		return nil, err
	}

	return tasks, nil
}

// UpdateTask updates an existing task in the database.
// Note: This updates all fields provided in the task struct.
func (r *pgTaskRepository) UpdateTask(ctx context.Context, task *models.Task) error {
	query := `UPDATE tasks
              SET title = $1, description = $2, status = $3, label = $4, priority = $5, due_date = $6, updated_at = $7
              WHERE id = $8 AND project_id = $9` // Ensure project_id matches for safety? Or just use id?
	now := time.Now()
	commandTag, err := r.db.Exec(ctx, query,
		task.Title, task.Description, string(task.Status), string(task.Label), string(task.Priority), task.DueDate, now, // Cast Status, Label, Priority
		task.ID, task.ProjectID, // Pass ID and ProjectID for the WHERE clause
	)
	if err != nil {
		log.Printf("Error updating task ID %d: %v", task.ID, err)
		return err
	}
	if commandTag.RowsAffected() == 0 {
		log.Printf("No task found with ID %d to update", task.ID)
		return pgx.ErrNoRows // Or a custom not found error
	}
	log.Printf("Updated task ID: %d", task.ID)
	return nil
}

// DeleteTask removes a task from the database.
func (r *pgTaskRepository) DeleteTask(ctx context.Context, id int) error {
	query := `DELETE FROM tasks WHERE id = $1`
	commandTag, err := r.db.Exec(ctx, query, id)
	if err != nil {
		log.Printf("Error deleting task ID %d: %v", id, err)
		return err
	}
	if commandTag.RowsAffected() == 0 {
		log.Printf("No task found with ID %d to delete", id)
		return pgx.ErrNoRows // Or a custom not found error
	}
	log.Printf("Deleted task ID: %d", id)
	return nil
}


// UpdateTaskStatus updates only the status of a specific task. Consider deprecating in favor of UpdateTask.
func (r *pgTaskRepository) UpdateTaskStatus(ctx context.Context, id int, status models.Status) error { // Changed status type
	query := `UPDATE tasks SET status = $1, updated_at = $2 WHERE id = $3`
	now := time.Now()
	commandTag, err := r.db.Exec(ctx, query, string(status), now, id) // Cast Status to string
	if err != nil {
		log.Printf("Error updating status for task ID %d: %v", id, err)
		return err
	}
	if commandTag.RowsAffected() == 0 {
		log.Printf("No task found with ID %d to update status", id)
		return pgx.ErrNoRows // Or a custom not found error
	}
	log.Printf("Updated status for task ID: %d", id)
	return nil
}
