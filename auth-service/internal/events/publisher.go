package events

import (
	"log"

	amqp "github.com/rabbitmq/amqp091-go"
)

func PublishLoginEvent(conn *amqp.Connection, username string) error {
	ch, err := conn.Channel()
	if err != nil {
		log.Printf("Failed to open a channel: %v", err)
		return err
	}
	defer ch.Close()

	err = ch.Publish(
		"",             // exchange
		"login_events", // routing key
		false,          // mandatory
		false,          // immediate
		amqp.Publishing{
			ContentType: "text/plain",
			Body:        []byte(username + " logged in"),
		})
	if err != nil {
		log.Printf("Failed to publish a message: %v", err)
		return err
	}

	log.Printf(" [x] Sent %s\n", username+" logged in")
	return nil
}
