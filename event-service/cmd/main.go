package main

import (
	"log"
	"net/http"
	"os"

	"github.com/joho/godotenv"

	"github.com/your-username/cozy-go/event-service/internal/database" // Adjust import path
	"github.com/your-username/cozy-go/event-service/internal/handlers" // Adjust import path
	"github.com/your-username/cozy-go/event-service/internal/middleware"
	"github.com/your-username/cozy-go/event-service/internal/routes" // Adjust import path
	"github.com/your-username/cozy-go/event-service/repository"      // Adjust import path
)

func main() {
	// Load .env file, ignore error if it doesn't exist
	_ = godotenv.Load()

	port := os.Getenv("EVENT_SERVICE_PORT")
	if port == "" {
		port = "8082" // Default port if not specified
	}

	// Initialize Database Connection
	dbPool, err := database.InitDB()
	if err != nil {
		log.Fatalf("Failed to initialize database: %v", err)
	}
	defer dbPool.Close()
	log.Println("Database connection successful.")

	// Initialize Repositories
	eventRepo := repository.NewEventRepository(dbPool)

	// Initialize Handlers
	eventHandler := handlers.NewEventHandler(eventRepo)

	// Setup Routes
	router := routes.SetupRoutes(eventHandler)

	corsHandler := middleware.EnableCORS(router) // Apply CORS to the main mux


	// Start Server
	serverAddr := ":" + port
	log.Printf("Event service starting on port %s\n", port)

	server := &http.Server{
		Addr:    serverAddr,
		Handler: corsHandler, // Use the router from routes package
		// Add timeouts later for production hardening
		// ReadTimeout:  5 * time.Second,
		// WriteTimeout: 10 * time.Second,
		// IdleTimeout:  120 * time.Second,
	}

	if err := server.ListenAndServe(); err != nil && err != http.ErrServerClosed {
		log.Fatalf("Could not listen on %s: %v\n", serverAddr, err)
	}
}
