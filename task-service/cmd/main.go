package main

import (
	"log"
	"net/http"
	"os"

	"cozy-go/task-service/internal/database" // Import database package
	"cozy-go/task-service/internal/handlers"
	"cozy-go/task-service/internal/routes" // Import routes package
	"cozy-go/task-service/repository"      // Import repository package

	"github.com/rs/cors" // Import CORS package
)

func main() {
	// Basic configuration (replace with proper config loading later)
	port := os.Getenv("TASK_SERVICE_PORT")
	if port == "" {
		port = "8081" // Default port for task-service
	}

	// Initialize database connection
	if err := database.InitDB(); err != nil {
		log.Fatalf("Failed to initialize database: %v", err)
	}
	defer database.CloseDB() // Ensure DB connection is closed on exit

	// Initialize repositories
	projectRepo := repository.NewProjectRepository()
	taskRepo := repository.NewTaskRepository()
	// Use _ to avoid unused variable errors for now
	_ = projectRepo
	_ = taskRepo

	// Initialize handlers
	projectHandler := handlers.NewProjectHandler(projectRepo)
	taskHandler := handlers.NewTaskHandler(taskRepo)

	// Basic router setup (using standard library ServeMux)
	mux := http.NewServeMux()

	// Setup routes using the routes package
	routes.SetupRoutes(mux, projectHandler, taskHandler)

	// Setup CORS middleware
	c := cors.New(cors.Options{
		AllowedOrigins: []string{"*"}, // Allow all origins for now
		AllowedMethods: []string{"GET", "POST", "PUT", "DELETE", "OPTIONS"},
		AllowedHeaders: []string{"Content-Type", "Authorization"},
	})
	handler := c.Handler(mux) // Wrap the existing mux

	log.Printf("Task service starting on port %s", port)
	server := &http.Server{
		Addr:    ":" + port,
		Handler: handler, // Use the CORS wrapped handler
	}

	err := server.ListenAndServe()
	if err != nil && err != http.ErrServerClosed {
		log.Fatalf("Could not start server: %s\n", err)
	}
}
