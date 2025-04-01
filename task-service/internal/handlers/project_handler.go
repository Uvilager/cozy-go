package handlers

import (
	"encoding/json"
	"log"
	"net/http"
	"strconv"

	"cozy-go/task-service/internal/models"
	"cozy-go/task-service/repository"
)

// ProjectHandler handles HTTP requests related to projects.
type ProjectHandler struct {
	repo repository.ProjectRepository
}

// NewProjectHandler creates a new ProjectHandler.
func NewProjectHandler(repo repository.ProjectRepository) *ProjectHandler {
	return &ProjectHandler{repo: repo}
}

// CreateProject handles the POST /projects request.
func (h *ProjectHandler) CreateProject(w http.ResponseWriter, r *http.Request) {
	var project models.Project

	// Decode the request body
	if err := json.NewDecoder(r.Body).Decode(&project); err != nil {
		log.Printf("Error decoding create project request: %v", err)
		http.Error(w, "Invalid request body", http.StatusBadRequest)
		return
	}
	defer r.Body.Close()

	// Basic validation (can be expanded)
	if project.Name == "" {
		http.Error(w, "Project name is required", http.StatusBadRequest)
		return
	}

	// Call the repository to create the project
	_, err := h.repo.CreateProject(r.Context(), &project)
	if err != nil {
		log.Printf("Error calling repository CreateProject: %v", err)
		http.Error(w, "Failed to create project", http.StatusInternalServerError)
		return
	}

	// Respond with the created project
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusCreated)
	if err := json.NewEncoder(w).Encode(project); err != nil {
		// Log error if response writing fails, but status is already sent
		log.Printf("Error encoding create project response: %v", err)
	}
	log.Printf("Successfully handled CreateProject request for project ID: %d", project.ID)
}

func (h *ProjectHandler) GetProjectByID(w http.ResponseWriter, r *http.Request) {
	projectIDStr := r.PathValue("id")
	if projectIDStr == "" {
		log.Println("Project ID not found in path for GetProjectByID")
		http.Error(w, "Project ID missing in URL path", http.StatusBadRequest)
		return
	}

	projectID, err := strconv.Atoi(projectIDStr)
	if err != nil {
		log.Printf("Invalid project ID format in GetProjectByID: %s", projectIDStr)
		http.Error(w, "Invalid project ID format", http.StatusBadRequest)
		return
	}

	project, err := h.repo.GetProjectByID(r.Context(), projectID)
	if err != nil {
		log.Printf("Error calling repository GetProjectByID for project %d: %v", projectID, err)
		http.Error(w, "Failed to retrieve project", http.StatusInternalServerError)
		return
	}

	if project == nil {
		http.Error(w, "Project not found", http.StatusNotFound)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusOK)
	if err := json.NewEncoder(w).Encode(project); err != nil {
		log.Printf("Error encoding GetProjectByID response: %v", err)
	}
	log.Printf("Successfully handled GetProjectByID request for project ID: %d", projectID)
}

func (h *ProjectHandler) ListProjects(w http.ResponseWriter, r *http.Request) {
	projects, err := h.repo.GetAllProjects(r.Context())
	if err != nil {
		log.Printf("Error calling repository GetAllProjects: %v", err)
		http.Error(w, "Failed to retrieve projects", http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusOK)
	if err := json.NewEncoder(w).Encode(projects); err != nil {
		log.Printf("Error encoding ListProjects response: %v", err)
	}
	log.Println("Successfully handled ListProjects request")
}

// TODO: Implement handlers for GetProject, UpdateProject, DeleteProject, ListProjects
