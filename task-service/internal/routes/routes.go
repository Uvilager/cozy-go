package routes

import (
	"fmt"
	"log"
	"net/http"

	"cozy-go/task-service/internal/handlers"
)

// SetupRoutes configures the application routes.
func SetupRoutes(mux *http.ServeMux, projectHandler *handlers.ProjectHandler, taskHandler *handlers.TaskHandler) {
	// Basic health check
	mux.HandleFunc("GET /health", func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Content-Type", "application/json")
		w.WriteHeader(http.StatusOK)
		fmt.Fprintln(w, `{"status": "healthy"}`)
		log.Println("Health check endpoint hit")
	})

	// --- Project Routes ---
	mux.HandleFunc("POST /projects", projectHandler.CreateProject)       // Create a new project
	mux.HandleFunc("GET /projects/{id}", projectHandler.GetProjectByID) // Get a specific project
	mux.HandleFunc("GET /projects", projectHandler.ListProjects)       // List all projects
	mux.HandleFunc("PUT /projects/{id}", projectHandler.UpdateProject) // Update a specific project
	mux.HandleFunc("DELETE /projects/{id}", projectHandler.DeleteProject) // Delete a specific project

	// --- Task Routes ---
	// Note: Assumes Go 1.22+ for path parameters like {projectID} and {taskID}
	mux.HandleFunc("POST /projects/{projectID}/tasks", taskHandler.CreateTask)       // Create a task within a project
	mux.HandleFunc("GET /projects/{projectID}/tasks", taskHandler.ListTasksByProject) // List tasks for a specific project
	mux.HandleFunc("GET /tasks/{taskID}", taskHandler.GetTask)                        // Get a specific task by its ID
	mux.HandleFunc("PUT /projects/{projectID}/tasks/{taskID}", taskHandler.UpdateTask) // Update a specific task
	mux.HandleFunc("DELETE /tasks/{taskID}", taskHandler.DeleteTask)                  // Delete a specific task
	// Optional: Route for updating only status (consider deprecating)
	mux.HandleFunc("PATCH /tasks/{taskID}/status", taskHandler.UpdateTaskStatusHandler)

	log.Println("Registered API routes")
}
