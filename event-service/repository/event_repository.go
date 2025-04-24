package repository

import (
	"context"
	"fmt"
	"time"

	"github.com/jackc/pgx/v5/pgxpool"
	"github.com/your-username/cozy-go/event-service/internal/models" // Adjust import path if needed
)

// EventRepository defines the interface for event data operations.
type EventRepository interface {
	CreateEvent(ctx context.Context, event *models.Event) (int, error)
	GetEventByID(ctx context.Context, eventID int, userID int) (*models.Event, error) // Include userID for authorization check
	// Renamed and updated to accept multiple calendar IDs
	ListEventsByCalendarIDs(ctx context.Context, calendarIDs []int, userID int, startTime, endTime time.Time) ([]models.Event, error)
	UpdateEvent(ctx context.Context, event *models.Event) error
	DeleteEvent(ctx context.Context, eventID int, userID int) error // Include userID for authorization check
}

// pgEventRepository implements EventRepository using pgxpool.
type pgEventRepository struct {
	db *pgxpool.Pool
}

// NewEventRepository creates a new instance of pgEventRepository.
func NewEventRepository(db *pgxpool.Pool) EventRepository {
	return &pgEventRepository{db: db}
}

// CreateEvent inserts a new event into the database.
func (r *pgEventRepository) CreateEvent(ctx context.Context, event *models.Event) (int, error) {
	query := `
		INSERT INTO events (calendar_id, user_id, title, description, start_time, end_time, location, color, created_at, updated_at)
		VALUES ($1, $2, $3, $4, $5, $6, $7, $8, NOW(), NOW())
		RETURNING id`

	err := r.db.QueryRow(ctx, query,
		event.CalendarID, event.UserID, event.Title, event.Description, event.StartTime, event.EndTime, event.Location, event.Color,
	).Scan(&event.ID)

	if err != nil {
		return 0, fmt.Errorf("failed to create event: %w", err)
	}

	return event.ID, nil
}

// GetEventByID retrieves a single event by its ID, ensuring it belongs to the user.
func (r *pgEventRepository) GetEventByID(ctx context.Context, eventID int, userID int) (*models.Event, error) {
	query := `
		SELECT id, calendar_id, user_id, title, description, start_time, end_time, location, color, created_at, updated_at
		FROM events
		WHERE id = $1 AND user_id = $2` // Check ownership

	event := &models.Event{}
	err := r.db.QueryRow(ctx, query, eventID, userID).Scan(
		&event.ID, &event.CalendarID, &event.UserID, &event.Title, &event.Description,
		&event.StartTime, &event.EndTime, &event.Location, &event.Color, &event.CreatedAt, &event.UpdatedAt,
	)

	if err != nil {
		// Consider pgx.ErrNoRows specifically for not found errors
		return nil, fmt.Errorf("failed to get event by ID %d for user %d: %w", eventID, userID, err)
	}

	return event, nil
}

// ListEventsByCalendarIDs retrieves events for multiple calendars within a time range, ensuring ownership.
func (r *pgEventRepository) ListEventsByCalendarIDs(ctx context.Context, calendarIDs []int, userID int, startTime, endTime time.Time) ([]models.Event, error) {
	// Ensure the user owns the calendars (this might require joining with a calendars table or a separate check)
	// For now, we assume the check happens in the handler or middleware based on calendarID ownership.
	// We still filter by user_id on the event itself as a safety measure.
	query := `
		SELECT id, calendar_id, user_id, title, description, start_time, end_time, location, color, created_at, updated_at
		FROM events
		WHERE calendar_id = ANY($1) -- Use ANY operator for the array/slice
		  AND user_id = $2
		  AND start_time < $4 -- Events starting before the end time
		  AND end_time > $3   -- Events ending after the start time
		ORDER BY start_time ASC`

	// Pass the slice directly to the query method
	rows, err := r.db.Query(ctx, query, calendarIDs, userID, startTime, endTime)
	if err != nil {
		// Update error message to reflect multiple IDs
		return nil, fmt.Errorf("failed to list events for calendars %v: %w", calendarIDs, err)
	}
	defer rows.Close()

	events := []models.Event{}
	for rows.Next() {
		var event models.Event
		err := rows.Scan(
			&event.ID, &event.CalendarID, &event.UserID, &event.Title, &event.Description,
			&event.StartTime, &event.EndTime, &event.Location, &event.Color, &event.CreatedAt, &event.UpdatedAt,
		)
		if err != nil {
			// Log or handle individual row scan errors
			return nil, fmt.Errorf("failed to scan event row: %w", err)
		}
		events = append(events, event)
	}

	if err := rows.Err(); err != nil {
		return nil, fmt.Errorf("error iterating event rows: %w", err)
	}

	return events, nil
}

// UpdateEvent updates an existing event in the database, ensuring ownership.
func (r *pgEventRepository) UpdateEvent(ctx context.Context, event *models.Event) error {
	query := `
		UPDATE events
		SET title = $1, description = $2, start_time = $3, end_time = $4, location = $5, color = $6, updated_at = NOW()
		WHERE id = $7 AND user_id = $8` // Check ownership

	cmdTag, err := r.db.Exec(ctx, query,
		event.Title, event.Description, event.StartTime, event.EndTime, event.Location, event.Color,
		event.ID, event.UserID,
	)

	if err != nil {
		return fmt.Errorf("failed to update event ID %d: %w", event.ID, err)
	}
	if cmdTag.RowsAffected() == 0 {
		// This could mean the event didn't exist or the user didn't own it
		return fmt.Errorf("event ID %d not found or not owned by user %d", event.ID, event.UserID) // Consider a more specific error type
	}

	return nil
}

// DeleteEvent removes an event from the database, ensuring ownership.
func (r *pgEventRepository) DeleteEvent(ctx context.Context, eventID int, userID int) error {
	query := `DELETE FROM events WHERE id = $1 AND user_id = $2` // Check ownership

	cmdTag, err := r.db.Exec(ctx, query, eventID, userID)
	if err != nil {
		return fmt.Errorf("failed to delete event ID %d: %w", eventID, err)
	}
	if cmdTag.RowsAffected() == 0 {
		// This could mean the event didn't exist or the user didn't own it
		return fmt.Errorf("event ID %d not found or not owned by user %d", eventID, userID) // Consider a more specific error type
	}

	return nil
}
