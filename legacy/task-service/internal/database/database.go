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
func InitDB() error {
	dbHost := os.Getenv("TASK_DB_HOST")
	dbPort := os.Getenv("TASK_DB_PORT")
	dbUser := os.Getenv("TASK_DB_USER")
	dbPassword := os.Getenv("TASK_DB_PASSWORD")
	dbName := os.Getenv("TASK_DB_NAME")

	// Construct the connection string
	// Example: "postgres://taskuser:taskpassword@taskdb:5432/taskdb?sslmode=require"
	connString := fmt.Sprintf("postgres://%s:%s@%s:%s/%s?sslmode=disable", // Changed sslmode to require for Azure PG
		dbUser, dbPassword, dbHost, dbPort, dbName)

	// Configure the connection pool
	config, err := pgxpool.ParseConfig(connString)
	if err != nil {
		return fmt.Errorf("failed to parse database config: %w", err)
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
				return nil
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
	return fmt.Errorf("failed to connect to database after %d attempts: %w", maxRetries, err)
}

// CloseDB closes the database connection pool.
func CloseDB() {
	if DB != nil {
		log.Println("Closing database connection pool...")
		DB.Close()
	}
}
