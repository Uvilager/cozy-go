package handlers

import (
	"encoding/json"
	"errors"
	"log"
	"net/http"
	"strconv"
	"strings" // Added strings import

	"cozy-go/task-service/internal/models"
	"cozy-go/task-service/internal/utils" // Import utils package
	"cozy-go/task-service/repository"

	"github.com/jackc/pgx/v5"
)

// Removed local helper function getUserIDFromContext

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
func (h *TaskHandler) CreateTask(w http.ResponseWriter, r *http.Request) {
	// Extract projectID from URL path
	projectIDStr := r.PathValue("projectID")
	if projectIDStr == "" {
		log.Println("Project ID not found in path")
		http.Error(w, "Project ID missing in URL path", http.StatusBadRequest)
		return
	}
	projectID, err := strconv.Atoi(projectIDStr)
	if err != nil {
		log.Printf("Invalid project ID format: %s", projectIDStr)
		http.Error(w, "Invalid project ID format", http.StatusBadRequest)
		return
	}

	var task models.Task
	if err := json.NewDecoder(r.Body).Decode(&task); err != nil {
		log.Printf("Error decoding create task request: %v", err)
		http.Error(w, "Invalid request body", http.StatusBadRequest)
		return
	}
	defer r.Body.Close()

	if task.Title == "" {
		http.Error(w, "Task title is required", http.StatusBadRequest)
		return
	}
	task.ProjectID = projectID // Assign project ID from path

	// Validate enums or set defaults
	if task.Status == "" { task.Status = models.StatusTodo }
	if !task.Status.IsValid() { http.Error(w, "Invalid status value", http.StatusBadRequest); return }
	if !task.Label.IsValid() { http.Error(w, "Invalid label value", http.StatusBadRequest); return } // Assuming empty is valid
	if task.Priority == "" { task.Priority = models.PriorityMedium }
	if !task.Priority.IsValid() { http.Error(w, "Invalid priority value", http.StatusBadRequest); return }

	// Get UserID from context
	userID, err := utils.GetUserIDFromContext(r)
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	// Call repository with userID
	createdID, err := h.repo.CreateTask(r.Context(), &task, userID)
	if err != nil {
		// Check if the error is due to project ownership check failing
		if errors.Is(err, pgx.ErrNoRows) {
			log.Printf("Failed to create task: Project %d not found or not owned by user %d", projectID, userID)
			http.Error(w, "Project not found or not authorized", http.StatusForbidden) // 403 Forbidden might be more appropriate
		} else {
			log.Printf("Error calling repository CreateTask for user %d: %v", userID, err)
			http.Error(w, "Failed to create task", http.StatusInternalServerError)
		}
		return
	}

	// Respond with the created task (fetch again to get all fields like created_at)
	createdTask, fetchErr := h.repo.GetTaskByID(r.Context(), createdID, userID)
	if fetchErr != nil || createdTask == nil {
		log.Printf("Error fetching newly created task %d: %v", createdID, fetchErr)
		// Still return 201, but maybe with a warning or just the ID
		w.Header().Set("Content-Type", "application/json")
		w.WriteHeader(http.StatusCreated)
		json.NewEncoder(w).Encode(map[string]interface{}{"id": createdID, "message": "Task created, but failed to fetch details"})
		return
	}


	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusCreated)
	if err := json.NewEncoder(w).Encode(createdTask); err != nil {
		log.Printf("Error encoding create task response: %v", err)
	}
	log.Printf("Successfully handled CreateTask request for task ID: %d in project ID: %d", createdID, task.ProjectID)
}

// ListTasks handles the GET /tasks?project_ids=... request.
func (h *TaskHandler) ListTasks(w http.ResponseWriter, r *http.Request) {
	// Get UserID from context first
	userID, err := utils.GetUserIDFromContext(r)
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	// Get project_ids from query parameter
	projectIDsStr := r.URL.Query().Get("project_ids")
	var projectIDs []int

	if projectIDsStr != "" {
		// Split the comma-separated string
		idsStr := strings.Split(projectIDsStr, ",")
		projectIDs = make([]int, 0, len(idsStr))
		for _, idStr := range idsStr {
			id, err := strconv.Atoi(strings.TrimSpace(idStr))
			if err != nil {
				log.Printf("Invalid project ID format in query parameter 'project_ids': %s", idStr)
				http.Error(w, "Invalid project ID format in query parameter 'project_ids'", http.StatusBadRequest)
				return
			}
			projectIDs = append(projectIDs, id)
		}
	}
	// If projectIDsStr is empty, projectIDs remains an empty slice,
	// and the repository method will handle returning an empty task list.

	// Call repository with userID and the slice of project IDs
	tasks, err := h.repo.GetTasksByProjectIDs(r.Context(), projectIDs, userID)
	if err != nil {
		// Repo handles ErrNoRows check for ownership, returns empty slice if not owned/found
		log.Printf("Error calling repository GetTasksByProjectIDs for projects %v, user %d: %v", projectIDs, userID, err)
		http.Error(w, "Failed to retrieve tasks", http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusOK)
	if err := json.NewEncoder(w).Encode(tasks); err != nil {
		log.Printf("Error encoding list tasks response: %v", err)
	}
	log.Printf("Successfully handled ListTasks request for project IDs: %v, found %d tasks", projectIDs, len(tasks))
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

	// Get UserID from context
	userID, err := utils.GetUserIDFromContext(r)
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	// Call repository with userID
	task, err := h.repo.GetTaskByID(r.Context(), taskID, userID)
	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			log.Printf("Task %d not found or not owned by user %d", taskID, userID)
			http.Error(w, "Task not found", http.StatusNotFound)
		} else {
			log.Printf("Error calling repository GetTaskByID for task %d, user %d: %v", taskID, userID, err)
			http.Error(w, "Failed to retrieve task", http.StatusInternalServerError)
		}
		return
	}
	// Repo returns (nil, nil) if not found/owned
	if task == nil {
		http.Error(w, "Task not found", http.StatusNotFound)
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
	// Extract IDs
	projectIDStr := r.PathValue("projectID") // Keep projectID for consistency, though repo checks ownership via task->project
	taskIDStr := r.PathValue("taskID")
	if projectIDStr == "" || taskIDStr == "" {
		http.Error(w, "Project ID or Task ID missing in URL path", http.StatusBadRequest)
		return
	}
	projectID, errP := strconv.Atoi(projectIDStr)
	taskID, errT := strconv.Atoi(taskIDStr)
	if errP != nil || errT != nil {
		http.Error(w, "Invalid project or task ID format", http.StatusBadRequest)
		return
	}

	// Decode payload
	var taskUpdates models.Task
	if err := json.NewDecoder(r.Body).Decode(&taskUpdates); err != nil {
		http.Error(w, "Invalid request body", http.StatusBadRequest)
		return
	}
	defer r.Body.Close()

	// Validate payload
	if taskUpdates.Title == "" { http.Error(w, "Task title is required", http.StatusBadRequest); return }
	if !taskUpdates.Status.IsValid() { http.Error(w, "Invalid status value", http.StatusBadRequest); return }
	if !taskUpdates.Label.IsValid() { http.Error(w, "Invalid label value", http.StatusBadRequest); return }
	if !taskUpdates.Priority.IsValid() { http.Error(w, "Invalid priority value", http.StatusBadRequest); return }

	// Set IDs from path
	taskUpdates.ID = taskID
	taskUpdates.ProjectID = projectID // Include projectID in the model being passed

	// Get UserID from context
	userID, err := utils.GetUserIDFromContext(r)
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	// Call repository with userID
	err = h.repo.UpdateTask(r.Context(), &taskUpdates, userID)
	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			log.Printf("Task %d not found or not owned by user %d for update", taskID, userID)
			http.Error(w, "Task not found or not authorized", http.StatusNotFound) // 404 or 403?
		} else {
			log.Printf("Error calling repository UpdateTask for task %d, user %d: %v", taskID, userID, err)
			http.Error(w, "Failed to update task", http.StatusInternalServerError)
		}
		return
	}

	// Fetch the updated task again to return it
	updatedTask, fetchErr := h.repo.GetTaskByID(r.Context(), taskID, userID) // Pass userID
	if fetchErr != nil || updatedTask == nil {
		log.Printf("Error fetching updated task %d after update for user %d: %v", taskID, userID, fetchErr)
		http.Error(w, "Task updated but failed to fetch details", http.StatusInternalServerError)
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
		http.Error(w, "Task ID missing in URL path", http.StatusBadRequest)
		return
	}
	taskID, err := strconv.Atoi(taskIDStr)
	if err != nil {
		http.Error(w, "Invalid task ID format", http.StatusBadRequest)
		return
	}

	// Get UserID from context
	userID, err := utils.GetUserIDFromContext(r)
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	// Call repository with userID
	err = h.repo.DeleteTask(r.Context(), taskID, userID)
	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			log.Printf("Task %d not found or not owned by user %d for deletion", taskID, userID)
			http.Error(w, "Task not found or not authorized", http.StatusNotFound) // 404 or 403?
		} else {
			log.Printf("Error calling repository DeleteTask for task %d, user %d: %v", taskID, userID, err)
			http.Error(w, "Failed to delete task", http.StatusInternalServerError)
		}
		return
	}

	w.WriteHeader(http.StatusNoContent)
	log.Printf("Successfully handled DeleteTask request for task ID: %d", taskID)
}

// UpdateTaskStatusHandler handles PATCH /tasks/{taskID}/status - Consider deprecating
func (h *TaskHandler) UpdateTaskStatusHandler(w http.ResponseWriter, r *http.Request) {
	taskIDStr := r.PathValue("taskID")
	if taskIDStr == "" {
		http.Error(w, "Task ID missing in URL path", http.StatusBadRequest)
		return
	}
	taskID, err := strconv.Atoi(taskIDStr)
	if err != nil {
		http.Error(w, "Invalid task ID format", http.StatusBadRequest)
		return
	}

	var payload struct { Status models.Status `json:"status"` }
	if err := json.NewDecoder(r.Body).Decode(&payload); err != nil {
		http.Error(w, "Invalid request body", http.StatusBadRequest)
		return
	}
	defer r.Body.Close()

	if payload.Status == "" { http.Error(w, "Status is required", http.StatusBadRequest); return }
	if !payload.Status.IsValid() { http.Error(w, "Invalid status value", http.StatusBadRequest); return }

	// Get UserID from context
	userID, err := utils.GetUserIDFromContext(r)
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	// Call repository with userID
	err = h.repo.UpdateTaskStatus(r.Context(), taskID, payload.Status, userID)
	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			log.Printf("Task %d not found or not owned by user %d for status update", taskID, userID)
			http.Error(w, "Task not found or not authorized", http.StatusNotFound) // 404 or 403?
		} else {
			log.Printf("Error calling repository UpdateTaskStatus for task %d, user %d: %v", taskID, userID, err)
			http.Error(w, "Failed to update task status", http.StatusInternalServerError)
		}
		return
	}

	w.WriteHeader(http.StatusOK) // Or 204 No Content
	log.Printf("Successfully handled UpdateTaskStatus request for task ID: %d", taskID)
}
