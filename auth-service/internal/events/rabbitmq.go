package events

import (
	"fmt"
	"log"
	"os"
	"time"

	amqp "github.com/rabbitmq/amqp091-go"
)

func SetupRabbitMQ() (*amqp.Connection, error) {
	rabbitMQURL := os.Getenv("RABBITMQ_URL")
	if rabbitMQURL == "" {
		// Fallback for local development if needed, but ideally set env var everywhere
		rabbitMQURL = "amqp://guest:guest@localhost:5672/"
		log.Printf("RABBITMQ_URL environment variable not set, using default: %s", rabbitMQURL)
		// Alternatively, return an error if the env var is mandatory:
		// return nil, fmt.Errorf("RABBITMQ_URL environment variable is not set")
	}

	var conn *amqp.Connection
	var err error
	maxRetries := 5
	retryDelay := 3 * time.Second

	for i := 0; i < maxRetries; i++ {
		log.Printf("Attempting to connect to RabbitMQ at %s (attempt %d/%d)...", rabbitMQURL, i+1, maxRetries)
		conn, err = amqp.Dial(rabbitMQURL)
		if err == nil {
			log.Println("Successfully connected to RabbitMQ.")
			break // Connection successful
		}
		log.Printf("Failed to connect to RabbitMQ (attempt %d/%d): %v", i+1, maxRetries, err)
		if i < maxRetries-1 {
			log.Printf("Retrying in %v...", retryDelay)
			time.Sleep(retryDelay)
		}
	}

	if err != nil {
		// Return the last error after all retries failed
		return nil, fmt.Errorf("failed to connect to RabbitMQ after %d attempts: %w", maxRetries, err)
	}

	// Connection is established
	return conn, nil
}
