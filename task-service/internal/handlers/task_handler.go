package handlers

import (
	"encoding/json"
	"log"
	"net/http"
	"strconv" // Needed for parsing project ID from URL path

	"errors" // For checking pgx.ErrNoRows

	"cozy-go/task-service/internal/models"
	"cozy-go/task-service/repository"

	"github.com/jackc/pgx/v5" // Import pgx for ErrNoRows
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

	// Validate incoming or set default values AND validate them
	if task.Status == "" {
		task.Status = models.StatusTodo // Or StatusBacklog? Align with desired default
	} else if !task.Status.IsValid() {
		log.Printf("Invalid status value provided during creation: %s", task.Status)
		http.Error(w, "Invalid status value provided", http.StatusBadRequest)
		return
	}

	// Decide on default label handling - leave empty or set a default
	if task.Label == "" {
		// task.Label = models.LabelFeature // Example: Set a default if required
		// Assuming empty label is valid based on IsValid method
	} else if !task.Label.IsValid() {
		log.Printf("Invalid label value provided during creation: %s", task.Label)
		http.Error(w, "Invalid label value provided", http.StatusBadRequest)
		return
	}

	if task.Priority == "" {
		task.Priority = models.PriorityMedium // Default to medium priority
	} else if !task.Priority.IsValid() {
		log.Printf("Invalid priority value provided during creation: %s", task.Priority)
		http.Error(w, "Invalid priority value provided", http.StatusBadRequest)
		return
	}

	// Now that all fields are validated (or defaulted and implicitly valid), create the task
	createdID, err := h.repo.CreateTask(r.Context(), &task)
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
		// Don't return here, just log the encoding error
	}
	log.Printf("Successfully handled CreateTask request for task ID: %d in project ID: %d", createdID, task.ProjectID)
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
	log.Printf("Successfully handled ListTasksByProject request for project ID: %d, found %d tasks", projectID, len(tasks))
}

// GetTask handles the GET /tasks/{taskID} request.
func (h *TaskHandler) GetTask(w http.ResponseWriter, r *http.Request) {
	taskIDStr := r.PathValue("taskID")
	if taskIDStr == "" {
		log.Println("Task ID not found in path for GetTask")
		http.Error(w, "Task ID missing in URL path", http.StatusBadRequest)
		return
	}

	taskID, err := strconv.Atoi(taskIDStr)
	if err != nil {
		log.Printf("Invalid task ID format in GetTask: %s", taskIDStr)
		http.Error(w, "Invalid task ID format", http.StatusBadRequest)
		return
	}

	task, err := h.repo.GetTaskByID(r.Context(), taskID)
	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			log.Printf("Task not found for ID: %d", taskID)
			http.Error(w, "Task not found", http.StatusNotFound)
		} else {
			log.Printf("Error calling repository GetTaskByID for task %d: %v", taskID, err)
			http.Error(w, "Failed to retrieve task", http.StatusInternalServerError)
		}
		return
	}

	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusOK)
	if err := json.NewEncoder(w).Encode(task); err != nil {
		log.Printf("Error encoding get task response: %v", err)
	}
	log.Printf("Successfully handled GetTask request for task ID: %d", taskID)
}

// UpdateTask handles the PUT /projects/{projectID}/tasks/{taskID} request.
func (h *TaskHandler) UpdateTask(w http.ResponseWriter, r *http.Request) {
	projectIDStr := r.PathValue("projectID")
	taskIDStr := r.PathValue("taskID")
	if projectIDStr == "" || taskIDStr == "" {
		log.Println("Project ID or Task ID not found in path for UpdateTask")
		http.Error(w, "Project ID or Task ID missing in URL path", http.StatusBadRequest)
		return
	}

	projectID, err := strconv.Atoi(projectIDStr)
	if err != nil {
		log.Printf("Invalid project ID format in UpdateTask: %s", projectIDStr)
		http.Error(w, "Invalid project ID format", http.StatusBadRequest)
		return
	}
	taskID, err := strconv.Atoi(taskIDStr)
	if err != nil {
		log.Printf("Invalid task ID format in UpdateTask: %s", taskIDStr)
		http.Error(w, "Invalid task ID format", http.StatusBadRequest)
		return
	}

	var taskUpdates models.Task
	if err := json.NewDecoder(r.Body).Decode(&taskUpdates); err != nil {
		log.Printf("Error decoding update task request: %v", err)
		http.Error(w, "Invalid request body", http.StatusBadRequest)
		return
	}
	defer r.Body.Close()

	// Basic validation
	if taskUpdates.Title == "" {
		http.Error(w, "Task title is required", http.StatusBadRequest)
		return
	}

	// Validate incoming status, label, and priority
	if !taskUpdates.Status.IsValid() {
		http.Error(w, "Invalid status value provided", http.StatusBadRequest)
		return
	}
	if !taskUpdates.Label.IsValid() {
		// Assuming empty label is valid based on IsValid method, otherwise add check for empty if needed
		http.Error(w, "Invalid label value provided", http.StatusBadRequest)
		return
	}
	if !taskUpdates.Priority.IsValid() {
		http.Error(w, "Invalid priority value provided", http.StatusBadRequest)
		return
	}


	// Set IDs from path parameters
	taskUpdates.ID = taskID
	taskUpdates.ProjectID = projectID

	err = h.repo.UpdateTask(r.Context(), &taskUpdates)
	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			log.Printf("Task not found for update with ID: %d in project %d", taskID, projectID)
			http.Error(w, "Task not found", http.StatusNotFound)
		} else {
			log.Printf("Error calling repository UpdateTask for task %d: %v", taskID, err)
			http.Error(w, "Failed to update task", http.StatusInternalServerError)
		}
		return
	}

	// Respond with 200 OK and the updated task (optional, could also be 204 No Content)
	// Fetch the updated task again to ensure we return the latest state including updated_at
	updatedTask, fetchErr := h.repo.GetTaskByID(r.Context(), taskID)
	if fetchErr != nil {
		log.Printf("Error fetching updated task %d after update: %v", taskID, fetchErr)
		// Still return 200 OK as the update itself succeeded
		w.WriteHeader(http.StatusOK)
		w.Write([]byte(`{"message": "Task updated successfully, but failed to fetch updated details."}`))
		return
	}


	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusOK)
	if err := json.NewEncoder(w).Encode(updatedTask); err != nil {
		log.Printf("Error encoding update task response: %v", err)
	}
	log.Printf("Successfully handled UpdateTask request for task ID: %d in project ID: %d", taskID, projectID)

}

// DeleteTask handles the DELETE /tasks/{taskID} request.
func (h *TaskHandler) DeleteTask(w http.ResponseWriter, r *http.Request) {
	taskIDStr := r.PathValue("taskID")
	if taskIDStr == "" {
		log.Println("Task ID not found in path for DeleteTask")
		http.Error(w, "Task ID missing in URL path", http.StatusBadRequest)
		return
	}

	taskID, err := strconv.Atoi(taskIDStr)
	if err != nil {
		log.Printf("Invalid task ID format in DeleteTask: %s", taskIDStr)
		http.Error(w, "Invalid task ID format", http.StatusBadRequest)
		return
	}

	err = h.repo.DeleteTask(r.Context(), taskID)
	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			log.Printf("Task not found for deletion with ID: %d", taskID)
			http.Error(w, "Task not found", http.StatusNotFound)
		} else {
			log.Printf("Error calling repository DeleteTask for task %d: %v", taskID, err)
			http.Error(w, "Failed to delete task", http.StatusInternalServerError)
		}
		return
	}

	w.WriteHeader(http.StatusNoContent) // 204 No Content is standard for successful DELETE
	log.Printf("Successfully handled DeleteTask request for task ID: %d", taskID)
}

// UpdateTaskStatusHandler handles PATCH /tasks/{taskID}/status - Consider deprecating
func (h *TaskHandler) UpdateTaskStatusHandler(w http.ResponseWriter, r *http.Request) {
	taskIDStr := r.PathValue("taskID")
	if taskIDStr == "" {
		log.Println("Task ID not found in path for UpdateTaskStatus")
		http.Error(w, "Task ID missing in URL path", http.StatusBadRequest)
		return
	}

	taskID, err := strconv.Atoi(taskIDStr)
	if err != nil {
		log.Printf("Invalid task ID format in UpdateTaskStatus: %s", taskIDStr)
		http.Error(w, "Invalid task ID format", http.StatusBadRequest)
		return
	}

	// Define payload struct specifically for this handler
	var payload struct {
		Status models.Status `json:"status"` // Use the custom Status type
	}

	if err := json.NewDecoder(r.Body).Decode(&payload); err != nil {
		log.Printf("Error decoding update task status request: %v", err)
		http.Error(w, "Invalid request body", http.StatusBadRequest)
		return
	}
	defer r.Body.Close()

	if payload.Status == "" {
		http.Error(w, "Status is required in request body", http.StatusBadRequest)
		return
	}

	// Validate the status using the IsValid method
	if !payload.Status.IsValid() {
		log.Printf("Invalid status value provided for task %d: %s", taskID, payload.Status)
		http.Error(w, "Invalid status value provided", http.StatusBadRequest)
		return
	}


	err = h.repo.UpdateTaskStatus(r.Context(), taskID, payload.Status) // Pass the models.Status type
	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			log.Printf("Task not found for status update with ID: %d", taskID)
			http.Error(w, "Task not found", http.StatusNotFound)
		} else {
			log.Printf("Error calling repository UpdateTaskStatus for task %d: %v", taskID, err)
			http.Error(w, "Failed to update task status", http.StatusInternalServerError)
		}
		return
	}

	w.WriteHeader(http.StatusOK) // Or 204 No Content
	log.Printf("Successfully handled UpdateTaskStatus request for task ID: %d", taskID)
}
