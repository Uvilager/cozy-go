package models

import (
	"time"

	"github.com/google/uuid"
)

// Task represents a task item in the system.
type Task struct {
	ID          uuid.UUID `json:"id"`
	UserID      uuid.UUID `json:"user_id"` // Assuming UserID is also a UUID based on auth service likely using UUIDs
	Title       string    `json:"title"`
	Description string    `json:"description"`
	DueDate     time.Time `json:"due_date"`
	Completed   bool      `json:"completed"`
	Priority    int       `json:"priority"` // Consider using an enum or constants later
	CreatedAt   time.Time `json:"created_at"`
	UpdatedAt   time.Time `json:"updated_at"`
}
