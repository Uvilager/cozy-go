package events

import (
	"context"
	"encoding/json"
	"fmt"
	"log"

	"github.com/Azure/azure-sdk-for-go/sdk/messaging/azservicebus"
)

// Event structure (example, adjust as needed)
type UserRegisteredEvent struct {
	Email string `json:"email"`
	// Add other relevant fields, e.g., UserID, Timestamp
}

// PublishUserRegisteredEvent sends a message to the Azure Service Bus queue.
func PublishUserRegisteredEvent(ctx context.Context, sender *azservicebus.Sender, userEmail string) error {
	if sender == nil {
		return fmt.Errorf("service bus sender is nil, cannot publish event")
	}

	event := UserRegisteredEvent{
		Email: userEmail,
		// Timestamp: time.Now(), // Example
	}

	// Marshal the event data to JSON
	messageBody, err := json.Marshal(event)
	if err != nil {
		log.Printf("Error marshalling UserRegisteredEvent for email %s: %v", userEmail, err)
		return fmt.Errorf("failed to marshal event data: %w", err)
	}

	// Create a Service Bus message
	message := &azservicebus.Message{
		Body:        messageBody,
		ContentType: Ptr("application/json"), // Helper function to get pointer
		// MessageID: // Optionally set a unique message ID
		// SessionID: // Optionally set if using sessions
	}

	log.Printf("Publishing UserRegisteredEvent for email: %s", userEmail)

	// Send the message
	err = sender.SendMessage(ctx, message, nil)
	if err != nil {
		log.Printf("Error sending message to Service Bus for email %s: %v", userEmail, err)
		return fmt.Errorf("failed to send message to service bus: %w", err)
	}

	log.Printf("Successfully published UserRegisteredEvent for email: %s", userEmail)
	return nil
}

// Ptr is a helper function to get a pointer to a string.
// Useful for Service Bus message properties that require pointers.
func Ptr(s string) *string {
	return &s
}

// --- Keep existing RabbitMQ publish function for reference or if needed elsewhere ---
// func PublishLoginEvent(conn *amqp.Connection, email string) error {
// 	ch, err := conn.Channel()
// 	if err != nil {
// 		return fmt.Errorf("failed to open a channel: %w", err)
// 	}
// 	defer ch.Close()

// 	q, err := ch.QueueDeclare(
// 		"login_events", // queue name
// 		false,          // durable
// 		false,          // delete when unused
// 		false,          // exclusive
// 		false,          // no-wait
// 		nil,            // arguments
// 	)
// 	if err != nil {
// 		return fmt.Errorf("failed to declare a queue: %w", err)
// 	}

// 	body := fmt.Sprintf("User logged in: %s", email)
// 	err = ch.PublishWithContext(context.Background(), // Use appropriate context
// 		"",     // exchange
// 		q.Name, // routing key (queue name)
// 		false,  // mandatory
// 		false,  // immediate
// 		amqp.Publishing{
// 			ContentType: "text/plain",
// 			Body:        []byte(body),
// 		})
// 	if err != nil {
// 		return fmt.Errorf("failed to publish a message: %w", err)
// 	}

// 	log.Printf(" [x] Sent %s", body)
// 	return nil
// }
