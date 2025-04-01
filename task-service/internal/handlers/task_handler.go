package handlers

import (
	"encoding/json"
	"log"
	"net/http"
	"strconv" // Needed for parsing project ID from URL path

	"cozy-go/task-service/internal/models"
	"cozy-go/task-service/repository"
	// TODO: Import router if needed for path parameters (e.g., chi.URLParam)
)

// TaskHandler handles HTTP requests related to tasks.
type TaskHandler struct {
	repo repository.TaskRepository
	// Optionally include ProjectRepository if needed for validation (e.g., check if project exists)
	// projectRepo repository.ProjectRepository
}

// NewTaskHandler creates a new TaskHandler.
func NewTaskHandler(repo repository.TaskRepository) *TaskHandler {
	return &TaskHandler{repo: repo}
}

// CreateTask handles the POST /projects/{projectID}/tasks request.
// Note: This assumes projectID will be extracted from the URL path by the router.
func (h *TaskHandler) CreateTask(w http.ResponseWriter, r *http.Request) {
	// --- Extract projectID from URL path ---
	// This part depends heavily on the chosen router (e.g., chi, mux).
	// Using standard library's PathValue (Go 1.22+) as an example:
	projectIDStr := r.PathValue("projectID")
	if projectIDStr == "" {
		// Fallback or alternative method if not using PathValue or older Go version
		// e.g., using chi: projectIDStr := chi.URLParam(r, "projectID")
		// e.g., using gorilla/mux: vars := mux.Vars(r); projectIDStr := vars["projectID"]
		log.Println("Project ID not found in path") // Adjust log/error as needed
		http.Error(w, "Project ID missing in URL path", http.StatusBadRequest)
		return
	}

	projectID, err := strconv.Atoi(projectIDStr)
	if err != nil {
		log.Printf("Invalid project ID format: %s", projectIDStr)
		http.Error(w, "Invalid project ID format", http.StatusBadRequest)
		return
	}
	// --- End of projectID extraction ---

	var task models.Task

	// Decode the request body
	if err := json.NewDecoder(r.Body).Decode(&task); err != nil {
		log.Printf("Error decoding create task request: %v", err)
		http.Error(w, "Invalid request body", http.StatusBadRequest)
		return
	}
	defer r.Body.Close()

	// Basic validation
	if task.Title == "" {
		http.Error(w, "Task title is required", http.StatusBadRequest)
		return
	}

	// Assign the project ID from the path
	task.ProjectID = projectID

	// TODO: Optional - Validate if projectID exists using ProjectRepository

	// Call the repository to create the task
	_, err = h.repo.CreateTask(r.Context(), &task)
	if err != nil {
		log.Printf("Error calling repository CreateTask: %v", err)
		http.Error(w, "Failed to create task", http.StatusInternalServerError)
		return
	}

	// Respond with the created task
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusCreated)
	if err := json.NewEncoder(w).Encode(task); err != nil {
		log.Printf("Error encoding create task response: %v", err)
	}
	log.Printf("Successfully handled CreateTask request for task ID: %d in project ID: %d", task.ID, task.ProjectID)
}

// ListTasksByProject handles the GET /projects/{projectID}/tasks request.
func (h *TaskHandler) ListTasksByProject(w http.ResponseWriter, r *http.Request) {
	// Extract projectID from URL path
	projectIDStr := r.PathValue("projectID")
	if projectIDStr == "" {
		log.Println("Project ID not found in path for ListTasksByProject")
		http.Error(w, "Project ID missing in URL path", http.StatusBadRequest)
		return
	}

	projectID, err := strconv.Atoi(projectIDStr)
	if err != nil {
		log.Printf("Invalid project ID format in ListTasksByProject: %s", projectIDStr)
		http.Error(w, "Invalid project ID format", http.StatusBadRequest)
		return
	}

	// Call the repository to get tasks
	tasks, err := h.repo.GetTasksByProjectID(r.Context(), projectID)
	if err != nil {
		// Note: GetTasksByProjectID doesn't return ErrNoRows specifically,
		// an empty slice is the indicator for no tasks found.
		log.Printf("Error calling repository GetTasksByProjectID for project %d: %v", projectID, err)
		http.Error(w, "Failed to retrieve tasks", http.StatusInternalServerError)
		return
	}

	// Respond with the list of tasks (will be an empty array [] if none found)
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusOK)
	if err := json.NewEncoder(w).Encode(tasks); err != nil {
		log.Printf("Error encoding list tasks response: %v", err)
	}
	log.Printf("Successfully handled ListTasksByProject request for project ID: %d", projectID)
}

// TODO: Implement handlers for GetTask, UpdateTask, DeleteTask
