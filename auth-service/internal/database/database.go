package database

import (
	"context"
	"fmt"
	"log"
	"os"
	"time"

	"github.com/jackc/pgx/v5/pgxpool"
)

// DB holds the database connection pool.
var DB *pgxpool.Pool

// InitDB initializes the database connection pool.
func InitDB() (*pgxpool.Pool, error) {
	var connString string

	// Try DATABASE_URL first (set by Terraform for Azure)
	databaseURL := os.Getenv("DATABASE_URL")
	if databaseURL != "" {
		log.Println("Using DATABASE_URL environment variable (expected in Azure).")
		connString = databaseURL // Assume it includes sslmode=require from Terraform
	} else {
		// Fallback to individual variables (for local/docker-compose)
		log.Println("DATABASE_URL not set, using individual POSTGRES_* variables (expected locally).")
		dbHost := os.Getenv("POSTGRES_HOST")
		dbPort := os.Getenv("POSTGRES_PORT")
		dbUser := os.Getenv("POSTGRES_USER")
		dbPassword := os.Getenv("POSTGRES_PASSWORD")
		dbName := os.Getenv("POSTGRES_DB")

		// Construct the connection string, ensuring sslmode=require for consistency or Azure needs
		// If local PG doesn't use SSL, adjust "?sslmode=require" to "?sslmode=disable" or remove it.
		connString = fmt.Sprintf("postgres://%s:%s@%s:%s/%s?sslmode=disable",
			dbUser, dbPassword, dbHost, dbPort, dbName)
	}

	// Configure the connection pool
	config, err := pgxpool.ParseConfig(connString)
	if err != nil {
		return nil, fmt.Errorf("failed to parse database config: %w", err)
	}

	// Optional: Configure pool settings
	config.MaxConns = 10 // Example: Limit max connections
	config.MinConns = 2  // Example: Keep minimum connections open
	config.MaxConnLifetime = time.Hour
	config.MaxConnIdleTime = 30 * time.Minute

	log.Println("Attempting to connect to database...")

	// Connect to the database with retry logic
	var pool *pgxpool.Pool
	maxRetries := 5
	retryDelay := 5 * time.Second

	for i := 0; i < maxRetries; i++ {
		pool, err = pgxpool.NewWithConfig(context.Background(), config)
		if err == nil {
			// Try pinging the database
			err = pool.Ping(context.Background())
			if err == nil {
				log.Println("Database connection successful!")
				DB = pool // Assign the successful pool to the global variable
				return DB, nil
			}
			log.Printf("Database ping failed: %v. Retrying...", err)
			pool.Close() // Close the pool if ping failed
		} else {
			log.Printf("Database connection attempt %d failed: %v. Retrying...", i+1, err)
		}

		if i < maxRetries-1 {
			time.Sleep(retryDelay)
		}
	}

	// If all retries fail
	return nil, fmt.Errorf("failed to connect to database after %d attempts: %w", maxRetries, err)
}

// CloseDB closes the database connection pool.
func CloseDB() {
	if DB != nil {
		log.Println("Closing database connection pool...")
		DB.Close()
	}
}
