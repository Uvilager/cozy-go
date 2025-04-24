package database

import (
	"context"
	"fmt"
	"log"
	"os"
	"time"

	"github.com/jackc/pgx/v5/pgxpool"
)

// InitDB initializes and returns a connection pool to the PostgreSQL database.
func InitDB() (*pgxpool.Pool, error) {
	dbURL := os.Getenv("EVENT_DB_URL")
	if dbURL == "" {
		// Provide a default for local development if needed, or return error
		// Example: "postgres://user:password@localhost:5432/event_db?sslmode=disable"
		return nil, fmt.Errorf("EVENT_DB_URL environment variable not set")
	}

	config, err := pgxpool.ParseConfig(dbURL)
	if err != nil {
		return nil, fmt.Errorf("unable to parse database URL: %w", err)
	}

	// Optional: Configure pool settings
	config.MaxConns = int32(10) // Example: max 10 connections
	config.MinConns = int32(2)  // Example: min 2 connections
	config.MaxConnLifetime = time.Hour
	config.MaxConnIdleTime = 30 * time.Minute
	config.HealthCheckPeriod = time.Minute
	config.ConnConfig.ConnectTimeout = 5 * time.Second

	// Establish the connection pool
	pool, err := pgxpool.NewWithConfig(context.Background(), config)
	if err != nil {
		return nil, fmt.Errorf("unable to create connection pool: %w", err)
	}

	// Ping the database to verify connection
	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()
	if err := pool.Ping(ctx); err != nil {
		pool.Close() // Close pool if ping fails
		return nil, fmt.Errorf("unable to ping database: %w", err)
	}

	log.Println("Successfully connected to the database.")
	return pool, nil
}
