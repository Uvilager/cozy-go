package models

import "time"

// Project represents a collection of tasks
type Project struct {
	ID          int       `json:"id"`
	Name        string    `json:"name"`
	Description string    `json:"description,omitempty"`
	CreatedAt   time.Time `json:"created_at"`
	UpdatedAt   time.Time `json:"updated_at"`
	// TODO: Add relation to User (Owner/Creator) if needed later
}

// Task represents a single task within a project
type Task struct {
	ID          int       `json:"id"`
	ProjectID   int       `json:"project_id"` // Foreign key to Project
	Title       string    `json:"title"`
	Description string    `json:"description,omitempty"`
	Status      string    `json:"status"` // e.g., "Todo", "In Progress", "Completed"
	DueDate     *time.Time `json:"due_date,omitempty"` // Pointer to allow null
	CreatedAt   time.Time `json:"created_at"`
	UpdatedAt   time.Time `json:"updated_at"`
	// TODO: Add relation to User (Assignee) if needed later
}

// Potential Status values (consider using constants or an enum type)
const (
	StatusTodo       = "Todo"
	StatusInProgress = "In Progress"
	StatusCompleted  = "Completed"
)
