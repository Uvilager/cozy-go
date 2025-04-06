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

// ProjectRepository defines the interface for project data operations.
type ProjectRepository interface {
	CreateProject(ctx context.Context, project *models.Project) (int, error)
	GetProjectByID(ctx context.Context, id int) (*models.Project, error)
	GetAllProjects(ctx context.Context) ([]models.Project, error)
	UpdateProject(ctx context.Context, project *models.Project) (*models.Project, error) // Takes project data, returns updated project
	DeleteProject(ctx context.Context, id int) error                                  // Takes ID, returns error
}

// pgProjectRepository implements ProjectRepository using pgxpool.
type pgProjectRepository struct {
	db *pgxpool.Pool // Use the global DB pool variable from the database package
}

// NewProjectRepository creates a new instance of ProjectRepository.
// Note: This relies on the database.DB pool being initialized already.
func NewProjectRepository() ProjectRepository {
	if database.DB == nil {
		// This should ideally not happen if InitDB is called correctly in main.
		log.Fatal("Database pool is not initialized")
	}
	return &pgProjectRepository{db: database.DB}
}

// CreateProject inserts a new project into the database.
func (r *pgProjectRepository) CreateProject(ctx context.Context, project *models.Project) (int, error) {
	query := `INSERT INTO projects (name, description, created_at, updated_at)
              VALUES ($1, $2, $3, $4)
              RETURNING id, created_at, updated_at`
	now := time.Now()
	err := r.db.QueryRow(ctx, query, project.Name, project.Description, now, now).Scan(&project.ID, &project.CreatedAt, &project.UpdatedAt)
	if err != nil {
		log.Printf("Error creating project: %v", err)
		return 0, err
	}
	log.Printf("Created project with ID: %d", project.ID)
	return project.ID, nil
}

// GetProjectByID retrieves a project by its ID.
func (r *pgProjectRepository) GetProjectByID(ctx context.Context, id int) (*models.Project, error) {
	query := `SELECT id, name, description, created_at, updated_at
              FROM projects
              WHERE id = $1`
	project := &models.Project{}
	err := r.db.QueryRow(ctx, query, id).Scan(
		&project.ID,
		&project.Name,
		&project.Description,
		&project.CreatedAt,
		&project.UpdatedAt,
	)
	if err != nil {
		if err == pgx.ErrNoRows {
			return nil, nil // Or return a specific "not found" error
		}
		log.Printf("Error getting project by ID %d: %v", id, err)
		return nil, err
	}
	return project, nil
}

// GetAllProjects retrieves all projects from the database.
func (r *pgProjectRepository) GetAllProjects(ctx context.Context) ([]models.Project, error) {
	query := `SELECT id, name, description, created_at, updated_at
              FROM projects
              ORDER BY created_at DESC`
	rows, err := r.db.Query(ctx, query)
	if err != nil {
		log.Printf("Error querying all projects: %v", err)
		return nil, err
	}
	defer rows.Close()

	projects := []models.Project{}
	for rows.Next() {
		var project models.Project
		err := rows.Scan(
			&project.ID,
			&project.Name,
			&project.Description,
			&project.CreatedAt,
			&project.UpdatedAt,
		)
		if err != nil {
			log.Printf("Error scanning project row: %v", err)
			return nil, err
		}
		projects = append(projects, project)
	}

	if err = rows.Err(); err != nil {
		log.Printf("Error iterating project rows: %v", err)
		return nil, err
	}

	return projects, nil
}

// UpdateProject updates an existing project in the database.
// It only updates fields that are provided in the input project struct.
// Note: This implementation assumes the input 'project' contains the ID and only the fields to be updated.
// A more robust implementation might fetch the existing project first.
func (r *pgProjectRepository) UpdateProject(ctx context.Context, project *models.Project) (*models.Project, error) {
	// Build the update query dynamically based on provided fields
	// This is complex; a simpler approach for now is to update all allowed fields if provided.
	// We'll update name and description if they are in the payload.
	// IMPORTANT: This assumes the frontend sends the full object or at least the fields to update.
	// A better approach uses specific update structs or checks for zero values carefully.

	// For simplicity, let's assume we always update name and description if provided in the payload.
	// The handler decodes into models.Project, so we check if fields are non-zero/non-empty.
	// This is NOT robust for clearing fields (e.g., setting description to "").
	// A map[string]interface{} or dedicated update struct is better.

	// Let's try a slightly better approach: Fetch first, then update.
	existingProject, err := r.GetProjectByID(ctx, project.ID)
	if err != nil {
		log.Printf("Error fetching project %d before update: %v", project.ID, err)
		return nil, err // Could be not found or other error
	}
	if existingProject == nil {
		return nil, pgx.ErrNoRows // Explicitly return not found error
	}

	// Apply changes from input 'project' to 'existingProject'
	// Only update if the field was actually provided in the request (how to know?)
	// Assuming the handler decoded into 'project', we check its fields.
	// This is still flawed if the user wants to set description to "".
	// Let's assume the frontend payload (UpdateProjectPayload) dictates what to update.
	// We need to pass that info here or adjust the handler.

	// --- Simplification for now: Update name and description based on input 'project' ---
	// This requires the handler to ensure 'project' has the correct values.
	query := `UPDATE projects
              SET name = $1, description = $2, updated_at = $3
              WHERE id = $4
              RETURNING id, name, description, created_at, updated_at`
	now := time.Now()

	// Use the name/description from the input 'project' struct
	updatedName := project.Name
	updatedDescription := project.Description
	// If the input name is empty, maybe keep the existing one? This depends on requirements.
	// Let's assume the handler validated that name is not empty if provided.
	if updatedName == "" {
		updatedName = existingProject.Name // Keep existing if input is empty (adjust if needed)
	}

	err = r.db.QueryRow(ctx, query, updatedName, updatedDescription, now, project.ID).Scan(
		&project.ID,
		&project.Name,
		&project.Description,
		&project.CreatedAt, // Note: returning created_at might not be necessary
		&project.UpdatedAt,
	)

	if err != nil {
		log.Printf("Error updating project %d: %v", project.ID, err)
		return nil, err
	}
	log.Printf("Updated project with ID: %d", project.ID)
	return project, nil
}


// DeleteProject deletes a project and its associated tasks from the database.
func (r *pgProjectRepository) DeleteProject(ctx context.Context, id int) error {
	// Use a transaction to ensure atomicity
	tx, err := r.db.Begin(ctx)
	if err != nil {
		log.Printf("Error starting transaction for deleting project %d: %v", id, err)
		return err
	}
	defer tx.Rollback(ctx) // Rollback if anything fails

	// 1. Delete associated tasks first
	taskQuery := `DELETE FROM tasks WHERE project_id = $1`
	_, err = tx.Exec(ctx, taskQuery, id)
	if err != nil {
		log.Printf("Error deleting tasks for project %d: %v", id, err)
		return err
	}
	log.Printf("Deleted tasks associated with project ID: %d", id)


	// 2. Delete the project itself
	projectQuery := `DELETE FROM projects WHERE id = $1`
	cmdTag, err := tx.Exec(ctx, projectQuery, id)
	if err != nil {
		log.Printf("Error deleting project %d: %v", id, err)
		return err
	}

	// Check if any row was actually deleted
	if cmdTag.RowsAffected() == 0 {
		log.Printf("Project with ID %d not found for deletion.", id)
		// Return a specific error or nil? Returning nil might be acceptable if "delete non-existent" is ok.
		// return fmt.Errorf("project with ID %d not found", id) // Or pgx.ErrNoRows?
		return pgx.ErrNoRows // Indicate not found
	}


	// Commit the transaction
	err = tx.Commit(ctx)
	if err != nil {
		log.Printf("Error committing transaction for deleting project %d: %v", id, err)
		return err
	}

	log.Printf("Deleted project with ID: %d", id)
	return nil
}
