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

	// Setup Azure Service Bus
	// Use context.Background() for setup, consider more specific contexts if needed
	sbClient, err := events.SetupServiceBus(context.Background())
	if err != nil {
		log.Fatalf("Failed to setup Azure Service Bus: %v", err)
	}
	// Defer closing the client and sender
	defer sbClient.Close(context.Background()) // Use background context for cleanup

	// Initialize database connection
	dbpool, err := database.InitDB(); 
	if err != nil {
        log.Fatalf("Failed to initialize database: %v", err)
    }
    defer database.CloseDB()

	// Initialize repositories
	authRepo := repository.NewAuthRepository(dbpool)
	healthRepo := repository.NewHealthRepository(dbpool)

	// Initialize HTTP handlers
	// Pass the Service Bus Sender to the AuthHandler
	authHandler := handlers.NewAuthHandler(authRepo, sbClient.Sender)
	healthHandler := handlers.NewHealthHandler(healthRepo)
	protectedHandler := handlers.NewProtectedHandler()

	// Start HTTP server
	mux := http.NewServeMux()
	routes.RegisterRoutes(mux, authHandler, healthHandler, protectedHandler)

	// Configure CORS
	// TODO: Consider using an environment variable for allowed origins in production
	allowedOrigins := []string{"*"}
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
