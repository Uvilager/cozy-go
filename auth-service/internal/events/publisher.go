package events

import (
	"context"
	// Removed unused imports: "encoding/json", "fmt", "log", "os"
	// Removed unused import: "github.com/Azure/azure-sdk-for-go/sdk/messaging/azservicebus"
)

// EventPublisher defines the interface for publishing events.
type EventPublisher interface {
	PublishUserRegisteredEvent(ctx context.Context, userEmail string) error
}

// Event structure (example, adjust as needed)
// Keep this shared definition here or move to a models package if preferred
type UserRegisteredEvent struct {
	Email string `json:"email"`
	// Add other relevant fields, e.g., UserID, Timestamp
}

// NOTE: serviceBusPublisher struct, NewServiceBusPublisher function,
// PublishUserRegisteredEvent method for serviceBusPublisher,
// and NewEventPublisherFromEnv factory function have been moved
// to servicebus.go and factory.go respectively.
// The Ptr helper function was moved to servicebus.go as it was specific to it.
