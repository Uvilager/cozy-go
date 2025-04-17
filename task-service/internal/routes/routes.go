package routes

import (
	"fmt"
	"log"
	"net/http"

	"cozy-go/task-service/internal/handlers"
	"cozy-go/task-service/internal/middleware" // Import the middleware package
)

// Helper function to wrap a handler with middleware
func applyAuth(handler http.HandlerFunc) http.Handler {
	return middleware.AuthMiddleware(handler)
}

// SetupRoutes configures the application routes.
func SetupRoutes(mux *http.ServeMux, projectHandler *handlers.ProjectHandler, taskHandler *handlers.TaskHandler) {
	// Basic health check (public)
	mux.HandleFunc("GET /health", func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Content-Type", "application/json")
		w.WriteHeader(http.StatusOK)
		fmt.Fprintln(w, `{"status": "healthy"}`)
		log.Println("Health check endpoint hit")
	})

	// --- Project Routes (Protected) ---
	mux.Handle("POST /projects", applyAuth(projectHandler.CreateProject))
	mux.Handle("GET /projects/{id}", applyAuth(projectHandler.GetProjectByID))
	mux.Handle("GET /projects", applyAuth(projectHandler.ListProjects))
	mux.Handle("PUT /projects/{id}", applyAuth(projectHandler.UpdateProject))
	mux.Handle("DELETE /projects/{id}", applyAuth(projectHandler.DeleteProject))

	// --- Task Routes (Protected) ---
	// Note: Assumes Go 1.22+ for path parameters like {projectID} and {taskID}
	mux.Handle("POST /projects/{projectID}/tasks", applyAuth(taskHandler.CreateTask))
	mux.Handle("GET /projects/{projectID}/tasks", applyAuth(taskHandler.ListTasksByProject))
	mux.Handle("GET /tasks/{taskID}", applyAuth(taskHandler.GetTask))
	mux.Handle("PUT /projects/{projectID}/tasks/{taskID}", applyAuth(taskHandler.UpdateTask))
	mux.Handle("DELETE /tasks/{taskID}", applyAuth(taskHandler.DeleteTask))
	// Optional: Route for updating only status (consider deprecating)
	mux.Handle("PATCH /tasks/{taskID}/status", applyAuth(taskHandler.UpdateTaskStatusHandler))


	log.Println("Registered protected API routes with AuthMiddleware")
}
