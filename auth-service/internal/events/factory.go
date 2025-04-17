package events

import (
	"context"
	"log"
	"os"
	// We need access to the constructors and setup functions
	// but the specific types (like *amqp.Connection, *ServiceBusClient)
	// are handled within their respective files.
)

// NewEventPublisherFromEnv creates an EventPublisher based on environment variables.
// It prioritizes Azure Service Bus if SERVICEBUS_CONNECTION_STRING is set,
// otherwise it falls back to RabbitMQ using RABBITMQ_URL.
// It returns the publisher and a closer function for the underlying connection/client.
func NewEventPublisherFromEnv(ctx context.Context) (EventPublisher, func(ctx context.Context)) {
	serviceBusConnString := os.Getenv("SERVICEBUS_CONNECTION_STRING")

	if serviceBusConnString != "" {
		log.Println("SERVICEBUS_CONNECTION_STRING found, attempting to connect to Azure Service Bus...")
		// Call SetupServiceBus from servicebus.go
		sbClient, err := SetupServiceBus(ctx)
		if err != nil {
			log.Printf("Warning: Failed to setup Azure Service Bus: %v. Event publishing will be disabled.", err)
			return nil, func(ctx context.Context) {} // Return no-op closer
		}
		// Use NewServiceBusPublisher from servicebus.go
		publisher := NewServiceBusPublisher(sbClient)
		closer := func(ctx context.Context) {
			log.Println("Closing Azure Service Bus client...")
			sbClient.Close(ctx) // Use the Close method from servicebus.go
		}
		log.Println("Successfully connected to Azure Service Bus.")
		return publisher, closer
	} else {
		log.Println("SERVICEBUS_CONNECTION_STRING not found, attempting to connect to RabbitMQ...")
		// Call SetupRabbitMQ from rabbitmq.go
		rabbitConn, err := SetupRabbitMQ()
		if err != nil {
			log.Printf("Warning: Failed to setup RabbitMQ: %v. Event publishing will be disabled.", err)
			return nil, func(ctx context.Context) {} // Return no-op closer
		}
		// Use NewRabbitMqPublisher from rabbitmq.go
		publisher := NewRabbitMqPublisher(rabbitConn)
		closer := func(ctx context.Context) {
			log.Println("Closing RabbitMQ connection...")
			// rabbitConn is *amqp.Connection, its Close doesn't take context or return error
			if err := rabbitConn.Close(); err != nil {
				log.Printf("Error closing RabbitMQ connection: %v", err)
			}
		}
		log.Println("Successfully connected to RabbitMQ.")
		return publisher, closer
	}
}
