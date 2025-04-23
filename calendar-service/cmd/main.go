package main

import (
	"log"
	"net/http"
	"os"
	"time"

	"cozy-go/calendar-service/internal/database"
	"cozy-go/calendar-service/internal/middleware"
	"cozy-go/calendar-service/internal/routes"

	_ "github.com/jackc/pgx/v5/stdlib"
	"github.com/joho/godotenv"
)

func main() {
	// Load .env file
	err := godotenv.Load()
	if err != nil {
		log.Println("No .env file found, using environment variables")
	}

	// --- Configuration ---
	port := os.Getenv("CALENDAR_SERVICE_PORT")
	if port == "" {
		port = "8082" // Default port
	}
	dbURL := os.Getenv("DATABASE_URL")
	if dbURL == "" {
		log.Fatal("DATABASE_URL environment variable is required")
	}

	// --- Logging ---
	log.SetFlags(log.LstdFlags | log.Lshortfile)
	log.Println("Starting Calendar Service...")

	// --- Database Connection ---
	pool, err := database.InitDB(dbURL) // Use pgxpool
	if err != nil {
		log.Fatalf("Failed to connect to database: %v", err)
	}
	defer pool.Close() // Close the pool when main exits
	log.Println("Database connection successful")

	// --- HTTP Server Setup ---
	mux := http.NewServeMux()

	// --- Routing ---
	routes.SetupRoutes(mux, pool) // Pass pool to routes

	// --- Middleware ---
	// Auth is applied within routes.SetupRoutes now
	corsHandler := middleware.EnableCORS(mux) // Apply CORS to the main mux

	// --- Start Server ---
	server := &http.Server{
		Addr:    ":" + port,
		Handler: corsHandler, // Use the CORS handler
		// Handler: middleware.LoggingMiddleware(corsHandler), // Example with logging middleware
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
