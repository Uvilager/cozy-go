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
	UpdateTaskStatus(ctx context.Context, id int, status string) error
	// TODO: Add methods for UpdateTask, DeleteTask etc.
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
	query := `INSERT INTO tasks (project_id, title, description, status, due_date, created_at, updated_at)
              VALUES ($1, $2, $3, $4, $5, $6, $7)
              RETURNING id, created_at, updated_at`
	now := time.Now()
	// Ensure default status if empty
	if task.Status == "" {
		task.Status = models.StatusTodo
	}
	err := r.db.QueryRow(ctx, query,
		task.ProjectID, task.Title, task.Description, task.Status, task.DueDate, now, now,
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
	query := `SELECT id, project_id, title, description, status, due_date, created_at, updated_at
              FROM tasks
              WHERE id = $1`
	task := &models.Task{}
	err := r.db.QueryRow(ctx, query, id).Scan(
		&task.ID,
		&task.ProjectID,
		&task.Title,
		&task.Description,
		&task.Status,
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
	query := `SELECT id, project_id, title, description, status, due_date, created_at, updated_at
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

// UpdateTaskStatus updates the status of a specific task.
func (r *pgTaskRepository) UpdateTaskStatus(ctx context.Context, id int, status string) error {
	query := `UPDATE tasks SET status = $1, updated_at = $2 WHERE id = $3`
	now := time.Now()
	commandTag, err := r.db.Exec(ctx, query, status, now, id)
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
