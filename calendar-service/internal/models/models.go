package models

import (
	"errors"
	"regexp"
	"strings"
	"time"
)

var hexColorRegex = regexp.MustCompile(`^#[0-9a-fA-F]{6}$`)

// Calendar represents a user's calendar.
type Calendar struct {
	ID          int       `json:"id"`
	UserID      int       `json:"user_id"` // Assuming association with a user from auth-service
	Name        string    `json:"name"`
	Description string    `json:"description,omitempty"`
	Color       string    `json:"color,omitempty"` // e.g., hex code like "#FFFFFF"
	CreatedAt   time.Time `json:"created_at"`
	UpdatedAt   time.Time `json:"updated_at"`
}

// Validate checks if the Calendar struct fields are valid.
// It checks for required fields and format constraints.
func (c *Calendar) Validate() error {
	// Trim whitespace from name for validation
	c.Name = strings.TrimSpace(c.Name)
	if c.Name == "" {
		return errors.New("calendar name is required")
	}
	// UserID should be set by the handler/auth middleware, but basic check here
	if c.UserID <= 0 {
		// This check might be redundant if middleware always guarantees a valid ID,
		// but provides an extra layer of safety.
		return errors.New("invalid user ID associated with calendar")
	}

	// Validate color format if provided
	if c.Color != "" {
		c.Color = strings.TrimSpace(c.Color)
		if !hexColorRegex.MatchString(c.Color) {
			return errors.New("invalid color format, must be #RRGGBB hex code")
		}
	}

	// Add other validation rules as needed (e.g., length limits for name/description)

	return nil // No validation errors
}
