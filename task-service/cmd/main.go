package main

import (
	"log"
	"net/http"
	"os"
	"time"

	"cozy-go/task-service/internal/database"
	"cozy-go/task-service/internal/handlers"
	"cozy-go/task-service/internal/routes"
	"cozy-go/task-service/repository"

	_ "github.com/jackc/pgx/v5/stdlib" // Database driver
	"github.com/joho/godotenv"         // For loading .env file
)

func main() {
	// Load .env file (optional, allows overrides)
	err := godotenv.Load()
	if err != nil {
		log.Println("No .env file found, using environment variables")
	}

	// --- Configuration ---
	port := os.Getenv("TASK_SERVICE_PORT")
	if port == "" {
		port = "8083" // Default port for task-service
	}
	dbURL := os.Getenv("DATABASE_URL")
	if dbURL == "" {
		log.Fatal("DATABASE_URL environment variable is required")
	}

	// --- Logging ---
	log.SetFlags(log.LstdFlags | log.Lshortfile)
	log.Println("Starting Task Service...")

	// --- Database Connection ---
	pool, err := database.InitDB(dbURL) // Use pgxpool
	if err != nil {
		log.Fatalf("Failed to connect to database: %v", err)
	}
	defer pool.Close()
	log.Println("Database connection successful")

	// --- Dependency Injection ---
	taskRepo := repository.NewTaskRepository(pool)
	taskHandler := handlers.NewTaskHandler(taskRepo)

	// --- Routing ---
	// SetupRoutes now returns the final handler (including CORS)
	router := routes.SetupRoutes(taskHandler)

	// --- Start Server ---
	server := &http.Server{
		Addr:         ":" + port,
		Handler:      router, // Use the handler returned by SetupRoutes
		ReadTimeout:  10 * time.Second,
		WriteTimeout: 10 * time.Second,
		IdleTimeout:  120 * time.Second,
	}

	log.Printf("Server listening on port %s", port)
	if err := server.ListenAndServe(); err != nil && err != http.ErrServerClosed {
		log.Fatalf("Could not listen on %s: %v\n", port, err)
	}

	log.Println("Server stopped")
}
