package events

import (
	"context"
	"fmt"
	"log"
	"os"
	"time"

	"github.com/Azure/azure-sdk-for-go/sdk/messaging/azservicebus"
)

// ServiceBusClient holds the client and sender for a specific queue.
type ServiceBusClient struct {
	Client *azservicebus.Client
	Sender *azservicebus.Sender
}

// SetupServiceBus initializes the Azure Service Bus client and a sender for the specified queue.
func SetupServiceBus(ctx context.Context) (*ServiceBusClient, error) {
	connectionString := os.Getenv("SERVICEBUS_CONNECTION_STRING")
	if connectionString == "" {
		return nil, fmt.Errorf("SERVICEBUS_CONNECTION_STRING environment variable is not set")
	}

	queueName := os.Getenv("SERVICEBUS_QUEUE_NAME") // Get queue name from env var
	if queueName == "" {
		queueName = "user_registered" // Default if not set
		log.Printf("SERVICEBUS_QUEUE_NAME not set, using default: %s", queueName)
	}

	var client *azservicebus.Client
	var err error

	// Retry logic for establishing the initial client connection
	maxRetries := 5
	retryDelay := 3 * time.Second

	for i := 0; i < maxRetries; i++ {
		log.Printf("Attempting to connect to Azure Service Bus (attempt %d/%d)...", i+1, maxRetries)
		client, err = azservicebus.NewClientFromConnectionString(connectionString, nil)
		if err == nil {
			log.Println("Successfully created Service Bus client.")
			break // Client created successfully
		}
		log.Printf("Failed to create Service Bus client (attempt %d/%d): %v", i+1, maxRetries, err)
		if i < maxRetries-1 {
			log.Printf("Retrying in %v...", retryDelay)
			time.Sleep(retryDelay)
		}
	}
	if err != nil {
		return nil, fmt.Errorf("failed to create Service Bus client after %d attempts: %w", maxRetries, err)
	}

	// Create a sender for the specific queue
	// No explicit retry here, assuming client connection implies namespace is reachable.
	// Errors during sending will be handled later.
	log.Printf("Creating sender for queue: %s", queueName)
	sender, err := client.NewSender(queueName, nil)
	if err != nil {
		// Clean up client if sender creation fails
		_ = client.Close(ctx)
		return nil, fmt.Errorf("failed to create Service Bus sender for queue %s: %w", queueName, err)
	}
	log.Printf("Successfully created sender for queue: %s", queueName)

	return &ServiceBusClient{
		Client: client,
		Sender: sender,
	}, nil
}

// Close cleans up the Service Bus sender and client.
func (sb *ServiceBusClient) Close(ctx context.Context) {
	if sb.Sender != nil {
		log.Println("Closing Service Bus sender...")
		if err := sb.Sender.Close(ctx); err != nil {
			log.Printf("Error closing Service Bus sender: %v", err)
		}
	}
	if sb.Client != nil {
		log.Println("Closing Service Bus client...")
		if err := sb.Client.Close(ctx); err != nil {
			log.Printf("Error closing Service Bus client: %v", err)
		}
	}
}
