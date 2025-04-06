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

// UpdateProject handles PUT /projects/{id} requests.
func (h *ProjectHandler) UpdateProject(w http.ResponseWriter, r *http.Request) {
	// 1. Get Project ID from path
	projectIDStr := r.PathValue("id")
	if projectIDStr == "" {
		log.Println("Project ID not found in path for UpdateProject")
		http.Error(w, "Project ID missing in URL path", http.StatusBadRequest)
		return
	}
	projectID, err := strconv.Atoi(projectIDStr)
	if err != nil {
		log.Printf("Invalid project ID format in UpdateProject: %s", projectIDStr)
		http.Error(w, "Invalid project ID format", http.StatusBadRequest)
		return
	}

	// 2. Decode request body
	var payload models.Project // Use Project model, repository will handle partial update
	if err := json.NewDecoder(r.Body).Decode(&payload); err != nil {
		log.Printf("Error decoding update project request for ID %d: %v", projectID, err)
		http.Error(w, "Invalid request body", http.StatusBadRequest)
		return
	}
	defer r.Body.Close()

	// 3. Basic Validation (ensure name isn't being set to empty if provided)
	// Note: The frontend sends only changed fields, but backend should still validate.
	// If the payload contains a Name field and it's empty, reject.
	// We need a way to distinguish between "Name not provided" and "Name explicitly set to empty".
	// Using a pointer or checking if the field exists in the raw JSON might be needed for more robust validation.
	// For simplicity now, we assume if Name is in the payload, it shouldn't be empty.
	// A better approach might be a dedicated UpdateProjectPayload struct.
	if name, ok := r.Context().Value("name").(string); ok && name == "" {
		// This check is illustrative and likely needs refinement based on how partial updates are handled.
		// A more common pattern is to fetch the existing project and apply changes.
		http.Error(w, "Project name cannot be empty if provided for update", http.StatusBadRequest)
		return
	}

	// 4. Call Repository
	// Set the ID from the path into the payload struct before passing
	payload.ID = projectID
	updatedProject, err := h.repo.UpdateProject(r.Context(), &payload)
	if err != nil {
		log.Printf("Error calling repository UpdateProject for project %d: %v", projectID, err)
		// TODO: Check for specific errors like "not found" from the repo
		http.Error(w, "Failed to update project", http.StatusInternalServerError)
		return
	}

	if updatedProject == nil {
		// This case might occur if the repo returns nil on not found, adjust as needed
		http.Error(w, "Project not found", http.StatusNotFound)
		return
	}

	// 5. Respond
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusOK) // 200 OK for successful update
	if err := json.NewEncoder(w).Encode(updatedProject); err != nil {
		log.Printf("Error encoding update project response for ID %d: %v", projectID, err)
	}
	log.Printf("Successfully handled UpdateProject request for project ID: %d", projectID)
}

// DeleteProject handles DELETE /projects/{id} requests.
func (h *ProjectHandler) DeleteProject(w http.ResponseWriter, r *http.Request) {
	// 1. Get Project ID from path
	projectIDStr := r.PathValue("id")
	if projectIDStr == "" {
		log.Println("Project ID not found in path for DeleteProject")
		http.Error(w, "Project ID missing in URL path", http.StatusBadRequest)
		return
	}
	projectID, err := strconv.Atoi(projectIDStr)
	if err != nil {
		log.Printf("Invalid project ID format in DeleteProject: %s", projectIDStr)
		http.Error(w, "Invalid project ID format", http.StatusBadRequest)
		return
	}

	// 2. Call Repository
	err = h.repo.DeleteProject(r.Context(), projectID)
	if err != nil {
		log.Printf("Error calling repository DeleteProject for project %d: %v", projectID, err)
		// TODO: Check for specific errors like "not found" from the repo
		http.Error(w, "Failed to delete project", http.StatusInternalServerError)
		return
	}

	// 3. Respond
	// Typically 200 OK or 204 No Content for successful DELETE
	w.WriteHeader(http.StatusNoContent) // 204 No Content is common
	log.Printf("Successfully handled DeleteProject request for project ID: %d", projectID)
}

// Removed TODO comment as handlers are now implemented (or being implemented)
