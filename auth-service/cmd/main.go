package main

import (
	"context"
	"log"
	"net/http"

	"auth-service/internal/database"
	"auth-service/internal/events"
	"auth-service/internal/handlers"
	"auth-service/internal/routes"
	"auth-service/repository"

	"github.com/rs/cors"
)

func main() {
	log.Println("Auth Service Starting...") // Add initial log message

	// Initialize database connection first
	dbpool, err := database.InitDB() // Assuming InitDB returns (error, *pgxpool.Pool)
	if err != nil {
		log.Fatalf("Failed to initialize database: %v", err)
	}
	// Defer closing the database pool using the global variable set in InitDB
	// Note: Ensure InitDB actually sets a global `database.DB` or returns the pool to be closed.
	// If InitDB returns the pool like `dbpool, err := database.InitDB()`,
	// then defer dbpool.Close() might be more direct if dbpool isn't shadowed later.
	// Assuming CloseDB uses the global var for now based on previous context.
	defer database.CloseDB()

	// Setup Event Publisher (Service Bus or RabbitMQ based on env)
	// Use context.Background() for setup, consider more specific contexts if needed
	eventPublisher, publisherCloser := events.NewEventPublisherFromEnv(context.Background())
	if eventPublisher == nil {
		log.Println("Warning: Event Publisher could not be initialized. Running without event publishing.")
		// No need to fatal here, handler checks for nil publisher
	}
	// Defer closing the publisher's underlying connection/client
	if publisherCloser != nil {
		defer publisherCloser(context.Background()) // Use background context for cleanup
	}

	// Initialize repositories using the obtained dbpool
	authRepo := repository.NewAuthRepository(dbpool)
	healthRepo := repository.NewHealthRepository(dbpool)

	// Initialize HTTP handlers
	// Pass the EventPublisher interface (which might be nil)
	authHandler := handlers.NewAuthHandler(authRepo, eventPublisher)
	healthHandler := handlers.NewHealthHandler(healthRepo)
	protectedHandler := handlers.NewProtectedHandler()

	// Start HTTP server
	mux := http.NewServeMux()
	routes.RegisterRoutes(mux, authHandler, healthHandler, protectedHandler)

	// Configure CORS
	// TODO: Consider using an environment variable for allowed origins in production
	// For local dev with docker-compose, allowing '*' might be okay, but tighten for Azure.
	allowedOrigins := []string{"*"} // Consider restricting this more
	log.Printf("Configuring CORS for origins: %v", allowedOrigins)

	c := cors.New(cors.Options{
		AllowedOrigins:   allowedOrigins,
		AllowedMethods:   []string{"GET", "POST", "PUT", "DELETE", "OPTIONS"},
		AllowedHeaders:   []string{"Content-Type", "Authorization"},
		AllowCredentials: true,
		// Enable Debugging for testing, consider disabling in production
		// Debug: true,
	})

	handler := c.Handler(mux)

	log.Println("Starting HTTP server on port 8080")
	err = http.ListenAndServe(":8080", handler) // Use the CORS wrapped handler
	if err != nil {
		log.Fatalf("Failed to start HTTP server: %v", err)
	}
}
