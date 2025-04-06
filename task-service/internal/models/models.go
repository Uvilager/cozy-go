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
	Status      Status    `json:"status"`    // Use custom Status type
	Label       Label     `json:"label"`     // Use custom Label type
	Priority    Priority  `json:"priority"`  // Use custom Priority type
	DueDate     *time.Time `json:"due_date,omitempty"` // Pointer to allow null
	CreatedAt   time.Time `json:"created_at"`
	UpdatedAt   time.Time `json:"updated_at"`
	// TODO: Add relation to User (Assignee) if needed later
}

// Status defines allowed values for task status.
type Status string

// Constants for Task Status based on frontend/src/components/tasks/data/data.tsx
const (
	StatusBacklog    Status = "backlog"
	StatusTodo       Status = "todo"
	StatusInProgress Status = "in progress"
	StatusDone       Status = "done"
	StatusCanceled   Status = "canceled"
)

// IsValid checks if the status value is one of the predefined constants.
func (s Status) IsValid() bool {
	switch s {
	case StatusBacklog, StatusTodo, StatusInProgress, StatusDone, StatusCanceled:
		return true
	default:
		return false
	}
}

// Label defines allowed values for task label.
type Label string

// Constants for Task Label based on frontend/src/components/tasks/data/data.tsx
const (
	LabelBug           Label = "bug"
	LabelFeature       Label = "feature"
	LabelDocumentation Label = "documentation"
)

// IsValid checks if the label value is one of the predefined constants.
func (l Label) IsValid() bool {
	switch l {
	case LabelBug, LabelFeature, LabelDocumentation:
		return true
	// Allow empty label? If not, remove this case.
	case "":
		return true // Or false if labels are mandatory
	default:
		return false
	}
}


// Priority defines allowed values for task priority.
type Priority string

// Constants for Task Priority based on frontend/src/components/tasks/data/data.tsx
const (
	PriorityLow    Priority = "low"
	PriorityMedium Priority = "medium"
	PriorityHigh   Priority = "high"
)

// IsValid checks if the priority value is one of the predefined constants.
func (p Priority) IsValid() bool {
	switch p {
	case PriorityLow, PriorityMedium, PriorityHigh:
		return true
	default:
		return false
	}
}
