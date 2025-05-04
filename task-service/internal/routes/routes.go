package routes

import (
	"net/http"

	"cozy-go/task-service/internal/handlers"
	"cozy-go/task-service/internal/middleware"
)

// SetupRoutes configures the routes for the task service.
// It uses the standard library's http.ServeMux.
func SetupRoutes(taskHandler *handlers.TaskHandler) http.Handler {
	mux := http.NewServeMux()

	// Task routes requiring authentication
	mux.Handle("POST /tasks", middleware.AuthMiddleware(http.HandlerFunc(taskHandler.CreateTask)))
	mux.Handle("GET /tasks", middleware.AuthMiddleware(http.HandlerFunc(taskHandler.ListTasks)))
	mux.Handle("GET /tasks/{id}", middleware.AuthMiddleware(http.HandlerFunc(taskHandler.GetTask)))
	mux.Handle("PUT /tasks/{id}", middleware.AuthMiddleware(http.HandlerFunc(taskHandler.UpdateTask)))
	mux.Handle("DELETE /tasks/{id}", middleware.AuthMiddleware(http.HandlerFunc(taskHandler.DeleteTask)))

	// Add a simple health check endpoint (optional, but good practice)
	mux.HandleFunc("GET /health", func(w http.ResponseWriter, r *http.Request) {
		w.WriteHeader(http.StatusOK)
		w.Write([]byte("OK"))
	})

	// Apply CORS middleware to the entire mux
	// Note: Middleware order matters. CORS should usually wrap other middleware/handlers.
	handler := middleware.EnableCORS(mux)

	return handler
}
