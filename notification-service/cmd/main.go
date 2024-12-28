package main

import (
	"log"
	"notification-service/internal/events"
)

func main() {
	// Connect to RabbitMQ
	conn, err := events.SetupRabbitMQ()
	if err != nil {
		log.Fatalf("Failed to connect to RabbitMQ: %v", err)
	}
	defer conn.Close()

	// Consume messages
	events.ConsumeMessages(conn)
}
