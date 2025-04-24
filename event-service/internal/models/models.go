package models

import "time"

// Event represents a calendar event, similar to Google Calendar.
type Event struct {
	ID          int       `json:"id"`
	CalendarID  int       `json:"calendar_id"` // Foreign key to the calendar it belongs to
	UserID      int       `json:"user_id"`     // Foreign key to the user who owns the event
	Title       string    `json:"title"`
	Description string    `json:"description,omitempty"`
	StartTime   time.Time `json:"start_time"`
	EndTime     time.Time `json:"end_time"`
	Location    string    `json:"location,omitempty"`
	Color       string    `json:"color,omitempty"` // e.g., hex code for event color
	CreatedAt   time.Time `json:"created_at"`
	UpdatedAt   time.Time `json:"updated_at"`
	// Future fields: RecurrenceRule, Attendees, Reminders etc.
}

// Add other models related to events if needed, e.g., Attendee, Reminder
