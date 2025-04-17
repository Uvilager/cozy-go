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
	// CreateProject now requires UserID within the project model
	CreateProject(ctx context.Context, project *models.Project) (int, error)
	// GetProjectByID now requires userID for authorization
	GetProjectByID(ctx context.Context, id int, userID int) (*models.Project, error)
	// Renamed GetAllProjects to GetProjectsByUserID and requires userID
	GetProjectsByUserID(ctx context.Context, userID int) ([]models.Project, error)
	// UpdateProject now requires userID for authorization
	UpdateProject(ctx context.Context, project *models.Project, userID int) (*models.Project, error)
	// DeleteProject now requires userID for authorization
	DeleteProject(ctx context.Context, id int, userID int) error
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

// CreateProject inserts a new project into the database, including the user_id.
func (r *pgProjectRepository) CreateProject(ctx context.Context, project *models.Project) (int, error) {
	query := `INSERT INTO projects (name, description, user_id, created_at, updated_at)
              VALUES ($1, $2, $3, $4, $5)
              RETURNING id, created_at, updated_at` // Also return UserID? Not strictly needed here.
	now := time.Now()
	// project.UserID should be set by the handler before calling this
	err := r.db.QueryRow(ctx, query, project.Name, project.Description, project.UserID, now, now).Scan(
		&project.ID,
		&project.CreatedAt,
		&project.UpdatedAt,
	)
	if err != nil {
		log.Printf("Error creating project for user %d: %v", project.UserID, err)
		return 0, err
	}
	log.Printf("Created project with ID: %d for user ID: %d", project.ID, project.UserID)
	return project.ID, nil
}

// GetProjectByID retrieves a specific project by its ID, ensuring it belongs to the given user.
func (r *pgProjectRepository) GetProjectByID(ctx context.Context, id int, userID int) (*models.Project, error) {
	query := `SELECT id, name, description, user_id, created_at, updated_at
              FROM projects
              WHERE id = $1 AND user_id = $2` // Added user_id check
	project := &models.Project{}
	err := r.db.QueryRow(ctx, query, id, userID).Scan(
		&project.ID,
		&project.Name,
		&project.Description,
		&project.UserID, // Scan UserID
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

// GetProjectsByUserID retrieves all projects belonging to a specific user.
func (r *pgProjectRepository) GetProjectsByUserID(ctx context.Context, userID int) ([]models.Project, error) {
	query := `SELECT id, name, description, user_id, created_at, updated_at
              FROM projects
              WHERE user_id = $1
              ORDER BY created_at DESC` // Filter by user_id
	rows, err := r.db.Query(ctx, query, userID)
	if err != nil {
		log.Printf("Error querying projects for user %d: %v", userID, err)
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
			&project.UserID, // Scan UserID
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
// Note: This implementation requires the handler to verify ownership before calling.
// It updates fields based on the input project struct for the given project ID and user ID.
func (r *pgProjectRepository) UpdateProject(ctx context.Context, project *models.Project, userID int) (*models.Project, error) { // Added userID parameter
	// We don't need to fetch the existing project here if we trust the handler
	// to have verified ownership and prepared the 'project' struct with updates.
	// However, the WHERE clause ensures we only update if the user ID matches.

	// --- Simplification: Update name and description based on input 'project' ---
	// This requires the handler to ensure 'project' has the correct values.
	// It also assumes the handler has already put the correct project.ID.
	// We'll update name and description if they are in the payload.
	// IMPORTANT: This assumes the frontend sends the full object or at least the fields to update.
	// A better approach uses specific update structs or checks for zero values carefully.

	// For simplicity, let's assume we always update name and description if provided in the payload.
	// The handler decodes into models.Project, so we check if fields are non-zero/non-empty.
	// This is NOT robust for clearing fields (e.g., setting description to "").
	// A map[string]interface{} or dedicated update struct is better.

	// Let's try a slightly better approach: Fetch first, then update.
	// We need to pass the userID here as well to ensure we fetch the correct project
	existingProject, err := r.GetProjectByID(ctx, project.ID, userID) // Pass userID
	if err != nil {
		log.Printf("Error fetching project %d for user %d before update: %v", project.ID, userID, err)
		return nil, err // Could be not found or other error
	}
	if existingProject == nil {
		return nil, pgx.ErrNoRows // Explicitly return not found error
	}

	// Apply changes from input 'project' to 'existingProject'
	// Only update if the field was actually provided in the request (how to know?)
	// Assuming the handler decoded into 'project', we check its fields.
	// --- This logic to decide which fields to update should ideally be more robust ---
	// --- or handled by constructing the query dynamically based on non-zero/non-nil fields ---
	// --- For now, we update name and description based on the input 'project' struct ---
	query := `UPDATE projects
              SET name = $1, description = $2, updated_at = $3
              WHERE id = $4 AND user_id = $5 -- Added user_id check
              RETURNING id, name, description, user_id, created_at, updated_at`
	now := time.Now()

	// Use the name/description from the input 'project' struct
	// The handler should ensure these are the intended values (e.g., fetched existing if not provided)
	updatedName := project.Name
	updatedDescription := project.Description
	// If name is empty in the payload, keep the existing one?
	// This depends on whether an empty name is allowed or means "don't update".
	// Let's assume for now the handler ensures name is valid if present.
	if updatedName == "" && existingProject != nil { // Check existingProject is not nil
		updatedName = existingProject.Name
	}
	// Note: Handling setting description explicitly to "" vs. not providing it is tricky here.

	var updatedProject models.Project
	err = r.db.QueryRow(ctx, query, updatedName, updatedDescription, now, project.ID, userID).Scan( // Use err = instead of :=
		&updatedProject.ID,
		&updatedProject.Name,
		&updatedProject.Description,
		&updatedProject.UserID, // Scan UserID
		&updatedProject.CreatedAt,
		&updatedProject.UpdatedAt,
	)

	if err != nil {
		if err == pgx.ErrNoRows {
			// This means either the project ID didn't exist OR it didn't belong to the user
			log.Printf("Error updating project %d for user %d: project not found or not owned by user", project.ID, userID)
			return nil, err // Return ErrNoRows
		}
		log.Printf("Error updating project %d for user %d: %v", project.ID, userID, err)
		return nil, err
	}
	log.Printf("Updated project with ID: %d for user ID: %d", updatedProject.ID, updatedProject.UserID)
	return &updatedProject, nil
}


// DeleteProject deletes a project and its associated tasks from the database, ensuring ownership.
func (r *pgProjectRepository) DeleteProject(ctx context.Context, id int, userID int) error { // Added userID parameter
	// Use a transaction to ensure atomicity
	tx, err := r.db.Begin(ctx)
	if err != nil {
		log.Printf("Error starting transaction for deleting project %d for user %d: %v", id, userID, err)
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


	// 2. Delete the project itself, ensuring the user owns it
	projectQuery := `DELETE FROM projects WHERE id = $1 AND user_id = $2` // Added user_id check
	cmdTag, err := tx.Exec(ctx, projectQuery, id, userID)
	if err != nil {
		log.Printf("Error deleting project %d for user %d: %v", id, userID, err)
		return err
	}

	// Check if any row was actually deleted (if 0, means project didn't exist or wasn't owned by user)
	if cmdTag.RowsAffected() == 0 {
		log.Printf("Project with ID %d not found for deletion or not owned by user %d.", id, userID)
		// Return a specific error or nil? Returning nil might be acceptable if "delete non-existent" is ok.
		// return fmt.Errorf("project with ID %d not found or not owned by user %d", id, userID)
		return pgx.ErrNoRows // Indicate not found
	}


	// Commit the transaction
	err = tx.Commit(ctx)
	if err != nil {
		log.Printf("Error committing transaction for deleting project %d for user %d: %v", id, userID, err)
		return err
	}

	log.Printf("Deleted project with ID: %d for user ID: %d", id, userID)
	return nil
}
