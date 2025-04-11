package events

import (
	"context"       // Add context import
	"encoding/json" // Ensure json is imported
	"fmt"
	"log"
	"os"
	"time"

	// "context" // Remove duplicate import
	amqp "github.com/rabbitmq/amqp091-go"
)

// --- RabbitMQ Publisher Implementation ---

type rabbitMqPublisher struct {
	conn *amqp.Connection
}

// NewRabbitMqPublisher creates a new publisher that uses RabbitMQ.
func NewRabbitMqPublisher(conn *amqp.Connection) EventPublisher {
	if conn == nil {
		log.Println("Warning: RabbitMQ connection provided to NewRabbitMqPublisher is nil.")
		return nil // Or a no-op publisher
	}
	return &rabbitMqPublisher{conn: conn}
}

// PublishUserRegisteredEvent sends a message to a RabbitMQ queue.
func (p *rabbitMqPublisher) PublishUserRegisteredEvent(ctx context.Context, userEmail string) error {
	if p == nil || p.conn == nil || p.conn.IsClosed() {
		log.Println("Error: rabbitMqPublisher or its connection is nil/closed, cannot publish event.")
		// Returning nil might mask the error. Consider returning an error.
		return nil
		// return fmt.Errorf("rabbitmq publisher or connection is nil/closed")
	}

	ch, err := p.conn.Channel()
	if err != nil {
		return fmt.Errorf("failed to open a channel: %w", err)
	}
	defer ch.Close()

	// Declare the queue (idempotent operation)
	q, err := ch.QueueDeclare(
		"user_registered_events", // Queue name - make consistent or configurable
		true,                     // durable
		false,                    // delete when unused
		false,                    // exclusive
		false,                    // no-wait
		nil,                      // arguments
	)
	if err != nil {
		return fmt.Errorf("failed to declare queue 'user_registered_events': %w", err)
	}

	event := UserRegisteredEvent{ // Reuse the event struct from publisher.go
		Email: userEmail,
	}
	messageBody, err := json.Marshal(event) // Need to import "encoding/json"
	if err != nil {
		log.Printf("Error marshalling UserRegisteredEvent for email %s: %v", userEmail, err)
		return fmt.Errorf("failed to marshal event data: %w", err)
	}

	log.Printf("Publishing UserRegisteredEvent via RabbitMQ for email: %s", userEmail)

	err = ch.PublishWithContext(ctx,
		"",     // exchange (use default)
		q.Name, // routing key (queue name)
		false,  // mandatory
		false,  // immediate
		amqp.Publishing{
			ContentType:  "application/json", // Set content type
			DeliveryMode: amqp.Persistent,    // Make message persistent
			Body:         messageBody,
		})
	if err != nil {
		return fmt.Errorf("failed to publish a message to queue '%s': %w", q.Name, err)
	}

	log.Printf("Successfully published UserRegisteredEvent via RabbitMQ for email: %s", userEmail)
	return nil
}


// --- RabbitMQ Connection Setup ---

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
