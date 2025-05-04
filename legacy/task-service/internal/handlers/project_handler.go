package handlers

import (
	"encoding/json"
	"errors" // Keep errors import if needed elsewhere, or remove if not
	"log"
	"net/http"
	"strconv"

	// Keep middleware import for context key
	"cozy-go/task-service/internal/models"
	"cozy-go/task-service/internal/utils" // Import the new utils package
	"cozy-go/task-service/repository"

	"github.com/jackc/pgx/v5" // Import pgx for ErrNoRows check
)

// Removed local helper function getUserIDFromContext

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

	// Get UserID from context using the utility function
	userID, err := utils.GetUserIDFromContext(r)
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError) // Consider StatusUnauthorized if context missing implies bad auth
		return
	}

	// Set the UserID on the project model
	project.UserID = userID

	// Call the repository to create the project
	_, err = h.repo.CreateProject(r.Context(), &project)
	if err != nil {
		log.Printf("Error calling repository CreateProject for user %d: %v", userID, err)
		http.Error(w, "Failed to create project", http.StatusInternalServerError)
		return
	}

	// Respond with the created project (including UserID now)
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusCreated)
	if err := json.NewEncoder(w).Encode(project); err != nil {
		// Log error if response writing fails, but status is already sent
		log.Printf("Error encoding create project response: %v", err)
	}
	log.Printf("Successfully handled CreateProject request for project ID: %d", project.ID)
}

// GetProjectByID handles GET /projects/{id}
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

	// Get UserID from context using the utility function
	userID, err := utils.GetUserIDFromContext(r)
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	project, err := h.repo.GetProjectByID(r.Context(), projectID, userID) // Pass userID
	if err != nil {
		// Check for specific "not found" error from repository
		if errors.Is(err, pgx.ErrNoRows) {
			log.Printf("Project %d not found or not owned by user %d", projectID, userID)
			http.Error(w, "Project not found", http.StatusNotFound)
		} else {
			log.Printf("Error calling repository GetProjectByID for project %d, user %d: %v", projectID, userID, err)
			http.Error(w, "Failed to retrieve project", http.StatusInternalServerError)
		}
		return
	}

	// If repo returns (nil, nil) for not found (as pgx.ErrNoRows might be handled internally)
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

// ListProjects handles GET /projects
func (h *ProjectHandler) ListProjects(w http.ResponseWriter, r *http.Request) {
	// Get UserID from context using the utility function
	userID, err := utils.GetUserIDFromContext(r)
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	projects, err := h.repo.GetProjectsByUserID(r.Context(), userID) // Use renamed method and pass userID
	if err != nil {
		log.Printf("Error calling repository GetProjectsByUserID for user %d: %v", userID, err)
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

	// 2. Decode request body into a temporary struct or map to check which fields were provided
	// Using models.Project directly makes it hard to distinguish "not provided" vs "set to empty"
	var payload map[string]interface{} // Use a map to see provided fields
	if err := json.NewDecoder(r.Body).Decode(&payload); err != nil {
		log.Printf("Error decoding update project request for ID %d: %v", projectID, err)
		http.Error(w, "Invalid request body", http.StatusBadRequest)
		return
	}
	defer r.Body.Close()

	// 3. Construct the update model, validating provided fields
	updateData := models.Project{ID: projectID} // Set ID
	updateNeeded := false

	if nameVal, ok := payload["name"]; ok {
		if nameStr, ok := nameVal.(string); ok && nameStr != "" {
			updateData.Name = nameStr
			updateNeeded = true
		} else {
			http.Error(w, "Project name cannot be empty if provided", http.StatusBadRequest)
			return
		}
	}

	if descVal, ok := payload["description"]; ok {
		if descStr, ok := descVal.(string); ok {
			updateData.Description = descStr // Allow setting empty description
			updateNeeded = true
		} else {
			http.Error(w, "Invalid description format", http.StatusBadRequest)
			return
		}
	}

	if !updateNeeded {
		// If only ID was sent or no valid fields, maybe return 304 Not Modified or just success?
		// Fetching and returning current might be safest.
		log.Printf("No valid fields provided for update for project ID: %d", projectID)
		// Let's fetch and return current state for simplicity
		userIDCtx, errCtx := utils.GetUserIDFromContext(r)
		if errCtx != nil {
			http.Error(w, errCtx.Error(), http.StatusInternalServerError)
			return
		}
		currentProject, errFetch := h.repo.GetProjectByID(r.Context(), projectID, userIDCtx)
		if errFetch != nil || currentProject == nil {
			http.Error(w, "Project not found", http.StatusNotFound)
			return
		}
		w.Header().Set("Content-Type", "application/json")
		w.WriteHeader(http.StatusOK)
		json.NewEncoder(w).Encode(currentProject)
		return
	}


	// 4. Call Repository
	// Get UserID from context using the utility function
	userID, err := utils.GetUserIDFromContext(r)
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	// Pass userID for authorization check in repository
	// Pass the constructed updateData which only contains ID and fields to change
	updatedProject, err := h.repo.UpdateProject(r.Context(), &updateData, userID)
	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			log.Printf("Project %d not found or not owned by user %d during update", projectID, userID)
			http.Error(w, "Project not found or not authorized", http.StatusNotFound) // More accurate error
		} else {
			log.Printf("Error calling repository UpdateProject for project %d, user %d: %v", projectID, userID, err)
			http.Error(w, "Failed to update project", http.StatusInternalServerError)
		}
		return
	}

	// If repo returns (nil, nil) on not found (shouldn't happen with ErrNoRows check now)
	if updatedProject == nil {
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

	// Get UserID from context using the utility function
	userID, err := utils.GetUserIDFromContext(r)
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	// 2. Call Repository, passing userID for authorization
	err = h.repo.DeleteProject(r.Context(), projectID, userID)
	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			log.Printf("Project %d not found or not owned by user %d for deletion", projectID, userID)
			http.Error(w, "Project not found or not authorized", http.StatusNotFound) // More accurate error
		} else {
			log.Printf("Error calling repository DeleteProject for project %d, user %d: %v", projectID, userID, err)
			http.Error(w, "Failed to delete project", http.StatusInternalServerError)
		}
		return
	}

	// 3. Respond
	// Typically 200 OK or 204 No Content for successful DELETE
	w.WriteHeader(http.StatusNoContent) // 204 No Content is common
	log.Printf("Successfully handled DeleteProject request for project ID: %d", projectID)
}
