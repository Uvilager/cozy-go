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
	mux.HandleFunc("POST /projects", projectHandler.CreateProject)
	mux.HandleFunc("GET /projects/{id}", projectHandler.GetProjectByID)
	mux.HandleFunc("GET /projects", projectHandler.ListProjects)
	// TODO: Add PUT /projects/{id}
	// TODO: Add DELETE /projects/{id}

	// --- Task Routes ---
	// Note: Assumes Go 1.22+ for path parameters {projectID}
	mux.HandleFunc("POST /projects/{projectID}/tasks", taskHandler.CreateTask)
	mux.HandleFunc("GET /projects/{projectID}/tasks", taskHandler.ListTasksByProject)
	// TODO: Add GET /tasks/{id}
	// TODO: Add PUT /tasks/{id}
	// TODO: Add DELETE /tasks/{id}

	log.Println("Registered API routes")
}
