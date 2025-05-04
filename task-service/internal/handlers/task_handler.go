package handlers

import (
	"encoding/json"
	"log"
	"net/http"

	// Assuming Go 1.22+ and http.ServeMux or similar for r.PathValue

	"cozy-go/task-service/internal/middleware" // Placeholder for task middleware
	"cozy-go/task-service/internal/models"
	"cozy-go/task-service/repository"

	"github.com/google/uuid"
	"github.com/jackc/pgx/v5" // For pgx.ErrNoRows
)

// TaskHandler holds dependencies for task handlers.
type TaskHandler struct {
	Repo repository.TaskRepository
}

// NewTaskHandler creates a new TaskHandler.
func NewTaskHandler(repo repository.TaskRepository) *TaskHandler {
	return &TaskHandler{Repo: repo}
}

// CreateTask handles POST requests to create a new task.
func (h *TaskHandler) CreateTask(w http.ResponseWriter, r *http.Request) {
	userID, ok := middleware.GetUserIDFromContext(r.Context()) // Assuming middleware provides UUID
	if !ok {
		http.Error(w, "User ID not found in context", http.StatusInternalServerError)
		return
	}

	var task models.Task
	if err := json.NewDecoder(r.Body).Decode(&task); err != nil {
		http.Error(w, "Invalid request body", http.StatusBadRequest)
		return
	}
	defer r.Body.Close()

	// Assign the authenticated user's ID
	task.UserID = userID

	// TODO: Implement and call task.Validate() here
	// if err := task.Validate(); err != nil {
	// 	http.Error(w, err.Error(), http.StatusBadRequest)
	// 	return
	// }

	newID, err := h.Repo.CreateTask(r.Context(), &task)
	if err != nil {
		log.Printf("Error creating task for user %s: %v", userID, err)
		http.Error(w, "Failed to create task", http.StatusInternalServerError)
		return
	}
	task.ID = newID // Set the ID returned by the repository

	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusCreated)
	json.NewEncoder(w).Encode(task)
}

// ListTasks handles GET requests to list tasks for the authenticated user.
func (h *TaskHandler) ListTasks(w http.ResponseWriter, r *http.Request) {
	userID, ok := middleware.GetUserIDFromContext(r.Context())
	if !ok {
		http.Error(w, "User ID not found in context", http.StatusInternalServerError)
		return
	}

	tasks, err := h.Repo.ListTasksByUserID(r.Context(), userID)
	if err != nil {
		log.Printf("Error listing tasks for user %s: %v", userID, err)
		http.Error(w, "Failed to retrieve tasks", http.StatusInternalServerError)
		return
	}

	// Handle case where no tasks are found (return empty array, not error)
	if tasks == nil {
		tasks = []models.Task{}
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(tasks)
}

// GetTask handles GET requests for a specific task.
func (h *TaskHandler) GetTask(w http.ResponseWriter, r *http.Request) {
	userID, ok := middleware.GetUserIDFromContext(r.Context())
	if !ok {
		http.Error(w, "User ID not found in context", http.StatusInternalServerError)
		return
	}

	idStr := r.PathValue("id") // Requires Go 1.22+ and router setup
	if idStr == "" {
		http.Error(w, "Missing task ID in URL path", http.StatusBadRequest)
		return
	}

	taskID, err := uuid.Parse(idStr)
	if err != nil {
		http.Error(w, "Invalid task ID format", http.StatusBadRequest)
		return
	}

	task, err := h.Repo.GetTaskByID(r.Context(), taskID)
	if err != nil {
		if err == pgx.ErrNoRows {
			http.Error(w, "Task not found", http.StatusNotFound)
		} else {
			log.Printf("Error getting task %s: %v", taskID, err)
			http.Error(w, "Failed to retrieve task", http.StatusInternalServerError)
		}
		return
	}

	// Authorization check: Ensure the fetched task belongs to the authenticated user
	if task.UserID != userID {
		http.Error(w, "Forbidden: You do not have access to this task", http.StatusForbidden)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(task)
}

// UpdateTask handles PUT requests to update a task.
func (h *TaskHandler) UpdateTask(w http.ResponseWriter, r *http.Request) {
	userID, ok := middleware.GetUserIDFromContext(r.Context())
	if !ok {
		http.Error(w, "User ID not found in context", http.StatusInternalServerError)
		return
	}

	idStr := r.PathValue("id") // Requires Go 1.22+ and router setup
	if idStr == "" {
		http.Error(w, "Missing task ID in URL path", http.StatusBadRequest)
		return
	}
	taskID, err := uuid.Parse(idStr)
	if err != nil {
		http.Error(w, "Invalid task ID format", http.StatusBadRequest)
		return
	}

	// Fetch existing task first to verify ownership
	existingTask, err := h.Repo.GetTaskByID(r.Context(), taskID)
	if err != nil {
		if err == pgx.ErrNoRows {
			http.Error(w, "Task not found", http.StatusNotFound)
		} else {
			log.Printf("Error finding task %s for update: %v", taskID, err)
			http.Error(w, "Failed to retrieve task", http.StatusInternalServerError)
		}
		return
	}
	if existingTask.UserID != userID {
		http.Error(w, "Forbidden: You cannot update this task", http.StatusForbidden)
		return
	}

	var updates models.Task
	if err := json.NewDecoder(r.Body).Decode(&updates); err != nil {
		http.Error(w, "Invalid request body", http.StatusBadRequest)
		return
	}
	defer r.Body.Close()

	// Apply updates - Ensure ID and UserID are not changed from request body
	existingTask.Title = updates.Title
	existingTask.Description = updates.Description
	existingTask.DueDate = updates.DueDate
	existingTask.Completed = updates.Completed
	existingTask.Priority = updates.Priority
	// UserID and ID remain the same from existingTask

	// TODO: Implement and call existingTask.Validate() here
	// if err := existingTask.Validate(); err != nil {
	// 	http.Error(w, err.Error(), http.StatusBadRequest)
	// 	return
	// }

	if err := h.Repo.UpdateTask(r.Context(), existingTask); err != nil {
		log.Printf("Error updating task %s: %v", taskID, err)
		http.Error(w, "Failed to update task", http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(existingTask) // Return updated task
}

// DeleteTask handles DELETE requests for a specific task.
func (h *TaskHandler) DeleteTask(w http.ResponseWriter, r *http.Request) {
	userID, ok := middleware.GetUserIDFromContext(r.Context())
	if !ok {
		http.Error(w, "User ID not found in context", http.StatusInternalServerError)
		return
	}

	idStr := r.PathValue("id") // Requires Go 1.22+ and router setup
	if idStr == "" {
		http.Error(w, "Missing task ID in URL path", http.StatusBadRequest)
		return
	}
	taskID, err := uuid.Parse(idStr)
	if err != nil {
		http.Error(w, "Invalid task ID format", http.StatusBadRequest)
		return
	}

	// Fetch existing task first to verify ownership (optional but good practice)
	existingTask, err := h.Repo.GetTaskByID(r.Context(), taskID)
	if err != nil {
		if err == pgx.ErrNoRows {
			http.Error(w, "Task not found", http.StatusNotFound) // Already deleted or never existed
		} else {
			log.Printf("Error finding task %s for deletion check: %v", taskID, err)
			http.Error(w, "Failed to retrieve task", http.StatusInternalServerError)
		}
		return
	}
	if existingTask.UserID != userID {
		http.Error(w, "Forbidden: You cannot delete this task", http.StatusForbidden)
		return
	}

	if err := h.Repo.DeleteTask(r.Context(), taskID); err != nil {
		log.Printf("Error deleting task %s: %v", taskID, err)
		http.Error(w, "Failed to delete task", http.StatusInternalServerError)
		return
	}

	w.WriteHeader(http.StatusNoContent) // Success, no content to return
}
