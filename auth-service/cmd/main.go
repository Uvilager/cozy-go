package main

import (
	"context"
	"log"
	"net/http"
	"os"

	"github.com/jackc/pgx/v5/pgxpool"

	"auth-service/internal/events"
	"auth-service/internal/handlers"
	"auth-service/internal/routes"
	"auth-service/repository"
)

func main() {
	// Connect to RabbitMQ
	conn, err := events.SetupRabbitMQ()
	if err != nil {
		log.Fatalf("Failed to connect to RabbitMQ: %v", err)
	}
	defer conn.Close()

	// Initialize database connection
	log.Println("Attempting to connect to Postgres...")
	connStr := "postgres://" + os.Getenv("POSTGRES_USER") + ":" + os.Getenv("POSTGRES_PASSWORD") +
		"@db:5432/" + os.Getenv("POSTGRES_DB") + "?sslmode=disable"
	dbpool, err := pgxpool.New(context.Background(), connStr)
	if err != nil {
		log.Fatalf("Failed to connect to database: %v", err)
	}
	defer dbpool.Close()

	// Initialize repositories
	authRepo := repository.NewAuthRepository(dbpool)
	healthRepo := repository.NewHealthRepository(dbpool)

	// Initialize HTTP handlers
	authHandler := handlers.NewAuthHandler(authRepo, conn)
	healthHandler := handlers.NewHealthHandler(healthRepo)
	protectedHandler := handlers.NewProtectedHandler()

	// Start HTTP server
	mux := http.NewServeMux()
	routes.RegisterRoutes(mux, authHandler, healthHandler, protectedHandler)
	log.Println("Starting HTTP server on port 8080")
	err = http.ListenAndServe(":8080", mux)
	if err != nil {
		log.Fatalf("Failed to start HTTP server: %v", err)
	}
}
