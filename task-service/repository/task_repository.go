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
	// CreateTask needs userID to verify project ownership before insert
	CreateTask(ctx context.Context, task *models.Task, userID int) (int, error)
	// GetTaskByID needs userID to verify ownership
	GetTaskByID(ctx context.Context, id int, userID int) (*models.Task, error)
	// GetTasksByProjectID needs userID to verify ownership of the project
	GetTasksByProjectID(ctx context.Context, projectID int, userID int) ([]models.Task, error)
	// UpdateTask needs userID to verify ownership
	UpdateTask(ctx context.Context, task *models.Task, userID int) error
	// DeleteTask needs userID to verify ownership
	DeleteTask(ctx context.Context, id int, userID int) error
	// UpdateTaskStatus needs userID to verify ownership
	UpdateTaskStatus(ctx context.Context, id int, status models.Status, userID int) error
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

// checkProjectOwnership verifies if a project belongs to a specific user.
// Returns pgx.ErrNoRows if not found/owned, other errors on DB issues.
func (r *pgTaskRepository) checkProjectOwnership(ctx context.Context, projectID int, userID int) error {
	var exists bool
	checkQuery := `SELECT EXISTS(SELECT 1 FROM projects WHERE id = $1 AND user_id = $2)`
	err := r.db.QueryRow(ctx, checkQuery, projectID, userID).Scan(&exists)
	if err != nil { // Handle potential DB errors during the check
		log.Printf("Error checking project ownership for project %d, user %d: %v", projectID, userID, err)
		return err
	}
	if !exists {
		log.Printf("Ownership check failed: Project %d not found or not owned by user %d", projectID, userID)
		return pgx.ErrNoRows // Use ErrNoRows to indicate not found or not authorized
	}
	return nil // Ownership verified
}


// CreateTask inserts a new task into the database after verifying project ownership.
func (r *pgTaskRepository) CreateTask(ctx context.Context, task *models.Task, userID int) (int, error) {
	// 1. Verify ownership of the project first
	if err := r.checkProjectOwnership(ctx, task.ProjectID, userID); err != nil {
		// If ownership check fails (ErrNoRows or other DB error), return error
		return 0, err
	}

	// 2. Proceed with task insertion if ownership is verified
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
		task.ProjectID, task.Title, task.Description, string(task.Status), string(task.Label), string(task.Priority), task.DueDate, now, now,
	).Scan(&task.ID, &task.CreatedAt, &task.UpdatedAt)
	if err != nil {
		log.Printf("Error creating task for project %d, user %d: %v", task.ProjectID, userID, err)
		return 0, err
	}
	log.Printf("Created task with ID: %d for project ID: %d", task.ID, task.ProjectID)
	return task.ID, nil
}

// GetTaskByID retrieves a task by its ID, ensuring it belongs to the given user via the project.
func (r *pgTaskRepository) GetTaskByID(ctx context.Context, id int, userID int) (*models.Task, error) {
	query := `SELECT t.id, t.project_id, t.title, t.description, t.status, t.label, t.priority, t.due_date, t.created_at, t.updated_at
              FROM tasks t
              JOIN projects p ON t.project_id = p.id
              WHERE t.id = $1 AND p.user_id = $2` // Check task ID and project ownership
	task := &models.Task{}
	err := r.db.QueryRow(ctx, query, id, userID).Scan(
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
			log.Printf("Task %d not found or not owned by user %d", id, userID)
			return nil, nil // Not found or not authorized
		}
		log.Printf("Error getting task by ID %d for user %d: %v", id, userID, err)
		return nil, err
	}
	return task, nil
}

// GetTasksByProjectID retrieves all tasks for a given project ID, ensuring the user owns the project.
func (r *pgTaskRepository) GetTasksByProjectID(ctx context.Context, projectID int, userID int) ([]models.Task, error) {
	// 1. Verify ownership of the project first
	if err := r.checkProjectOwnership(ctx, projectID, userID); err != nil {
		// If ownership check fails (ErrNoRows or other DB error), return error
		// Return empty slice and no error if ErrNoRows, or the actual error otherwise
		if err == pgx.ErrNoRows {
			return []models.Task{}, nil // Return empty slice if project not found/owned
		}
		return nil, err
	}

	// 2. Proceed with fetching tasks if ownership is verified
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

// UpdateTask updates an existing task after verifying project ownership.
func (r *pgTaskRepository) UpdateTask(ctx context.Context, task *models.Task, userID int) error {
	// 1. Verify ownership of the project the task belongs to
	if err := r.checkProjectOwnership(ctx, task.ProjectID, userID); err != nil {
		return err // Return ErrNoRows or DB error
	}

	// 2. Proceed with update if ownership is verified
	query := `UPDATE tasks
              SET title = $1, description = $2, status = $3, label = $4, priority = $5, due_date = $6, updated_at = $7
              WHERE id = $8` // Only need task ID here, ownership checked via project
	now := time.Now()
	commandTag, err := r.db.Exec(ctx, query,
		task.Title, task.Description, string(task.Status), string(task.Label), string(task.Priority), task.DueDate, now,
		task.ID, // Only task ID needed for WHERE clause now
	)
	if err != nil {
		log.Printf("Error updating task ID %d for user %d: %v", task.ID, userID, err)
		return err
	}
	if commandTag.RowsAffected() == 0 {
		log.Printf("No task found with ID %d to update", task.ID)
		return pgx.ErrNoRows // Or a custom not found error
	}
	log.Printf("Updated task ID: %d", task.ID)
	return nil
}

// DeleteTask removes a task from the database after verifying ownership via the project.
func (r *pgTaskRepository) DeleteTask(ctx context.Context, id int, userID int) error {
	// 1. Get the project ID associated with the task to check ownership
	var projectID int
	projectIDQuery := `SELECT project_id FROM tasks WHERE id = $1`
	err := r.db.QueryRow(ctx, projectIDQuery, id).Scan(&projectID)
	if err != nil {
		if err == pgx.ErrNoRows {
			log.Printf("Task %d not found for deletion check", id)
			return pgx.ErrNoRows // Task doesn't exist
		}
		log.Printf("Error fetching project_id for task %d: %v", id, err)
		return err // Other DB error
	}

	// 2. Verify ownership of the project
	if err := r.checkProjectOwnership(ctx, projectID, userID); err != nil {
		// Return ErrNoRows if not found/owned, or other DB error
		return err
	}

	// 3. Proceed with deletion if ownership is verified
	query := `DELETE FROM tasks WHERE id = $1`
	commandTag, err := r.db.Exec(ctx, query, id)
	if err != nil {
		log.Printf("Error deleting task ID %d for user %d: %v", id, userID, err)
		return err
	}
	if commandTag.RowsAffected() == 0 {
		log.Printf("No task found with ID %d to delete", id)
		return pgx.ErrNoRows // Or a custom not found error
	}
	log.Printf("Deleted task ID: %d", id)
	return nil
}


// UpdateTaskStatus updates only the status of a specific task after verifying ownership.
func (r *pgTaskRepository) UpdateTaskStatus(ctx context.Context, id int, status models.Status, userID int) error {
	// 1. Get the project ID associated with the task to check ownership
	var projectID int
	projectIDQuery := `SELECT project_id FROM tasks WHERE id = $1`
	err := r.db.QueryRow(ctx, projectIDQuery, id).Scan(&projectID)
	if err != nil {
		if err == pgx.ErrNoRows {
			log.Printf("Task %d not found for status update check", id)
			return pgx.ErrNoRows // Task doesn't exist
		}
		log.Printf("Error fetching project_id for task %d: %v", id, err)
		return err // Other DB error
	}

	// 2. Verify ownership of the project
	if err := r.checkProjectOwnership(ctx, projectID, userID); err != nil {
		// Return ErrNoRows if not found/owned, or other DB error
		return err
	}

	// 3. Proceed with status update if ownership is verified
	query := `UPDATE tasks SET status = $1, updated_at = $2 WHERE id = $3`
	now := time.Now()
	commandTag, err := r.db.Exec(ctx, query, string(status), now, id)
	if err != nil {
		log.Printf("Error updating status for task ID %d for user %d: %v", id, userID, err)
		return err
	}
	if commandTag.RowsAffected() == 0 {
		log.Printf("No task found with ID %d to update status", id)
		return pgx.ErrNoRows // Or a custom not found error
	}
	log.Printf("Updated status for task ID: %d", id)
	return nil
}
