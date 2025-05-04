package database

import (
	"context"
	"fmt"
	"log"
	"os"
	"time"

	"github.com/jackc/pgx/v5/pgxpool"
)

// InitDB initializes and returns a PostgreSQL connection pool using pgxpool.
func InitDB(dbURL string) (*pgxpool.Pool, error) {
	config, err := pgxpool.ParseConfig(dbURL)
	if err != nil {
		return nil, fmt.Errorf("unable to parse database URL: %w", err)
	}

	// Optional: Configure pool settings
	config.MaxConns = int32(getEnvAsInt("DB_MAX_CONNS", 10))
	config.MinConns = int32(getEnvAsInt("DB_MIN_CONNS", 2))
	config.MaxConnLifetime = getEnvAsDuration("DB_MAX_CONN_LIFETIME", time.Hour)
	config.MaxConnIdleTime = getEnvAsDuration("DB_MAX_CONN_IDLE_TIME", 30*time.Minute)
	config.HealthCheckPeriod = getEnvAsDuration("DB_HEALTH_CHECK_PERIOD", time.Minute)
	config.ConnConfig.ConnectTimeout = getEnvAsDuration("DB_CONNECT_TIMEOUT", 5*time.Second)

	log.Println("Connecting to database...")
	pool, err := pgxpool.NewWithConfig(context.Background(), config)
	if err != nil {
		return nil, fmt.Errorf("unable to create connection pool: %w", err)
	}

	// Ping the database to verify connection
	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()
	if err = pool.Ping(ctx); err != nil {
		pool.Close() // Close pool if ping fails
		return nil, fmt.Errorf("unable to ping database: %w", err)
	}

	log.Println("Database connection pool established successfully.")
	return pool, nil
}

// Helper function to get environment variable as integer
func getEnvAsInt(name string, defaultValue int) int {
	valueStr := os.Getenv(name)
	if valueStr == "" {
		return defaultValue
	}
	var value int
	_, err := fmt.Sscan(valueStr, &value)
	if err != nil {
		log.Printf("Warning: Invalid integer value for %s: %v. Using default %d.", name, err, defaultValue)
		return defaultValue
	}
	return value
}

// Helper function to get environment variable as duration
func getEnvAsDuration(name string, defaultValue time.Duration) time.Duration {
	valueStr := os.Getenv(name)
	if valueStr == "" {
		return defaultValue
	}
	value, err := time.ParseDuration(valueStr)
	if err != nil {
		log.Printf("Warning: Invalid duration value for %s: %v. Using default %s.", name, err, defaultValue)
		return defaultValue
	}
	return value
}
