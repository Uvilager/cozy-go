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
	// TODO: Add methods for UpdateProject, DeleteProject, ListProjects etc.
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
