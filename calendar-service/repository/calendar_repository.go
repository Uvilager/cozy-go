package repository

import (
	"context"
	"time"

	"cozy-go/calendar-service/internal/models" // Corrected import path

	"github.com/jackc/pgx/v5/pgxpool"
)

// CalendarRepository defines the interface for calendar data operations.
type CalendarRepository interface {
	CreateCalendar(ctx context.Context, calendar *models.Calendar) (int, error)
	GetCalendarByID(ctx context.Context, id int) (*models.Calendar, error)
	ListCalendarsByUserID(ctx context.Context, userID int) ([]models.Calendar, error)
	UpdateCalendar(ctx context.Context, calendar *models.Calendar) error
	DeleteCalendar(ctx context.Context, id int) error
}

// pgCalendarRepository implements CalendarRepository using pgxpool.
type pgCalendarRepository struct {
	pool *pgxpool.Pool
}

// NewCalendarRepository creates a new instance of pgCalendarRepository.
func NewCalendarRepository(pool *pgxpool.Pool) CalendarRepository {
	return &pgCalendarRepository{pool: pool}
}

// CreateCalendar inserts a new calendar record into the database.
func (r *pgCalendarRepository) CreateCalendar(ctx context.Context, calendar *models.Calendar) (int, error) {
	query := `
		INSERT INTO calendars (user_id, name, description, color, created_at, updated_at)
		VALUES ($1, $2, $3, $4, $5, $6)
		RETURNING id`
	now := time.Now()
	err := r.pool.QueryRow(ctx, query,
		calendar.UserID,
		calendar.Name,
		calendar.Description,
		calendar.Color,
		now, // Set created_at
		now, // Set updated_at
	).Scan(&calendar.ID)

	if err != nil {
		// TODO: Add more specific error handling (e.g., duplicate name?)
		return 0, err
	}
	calendar.CreatedAt = now
	calendar.UpdatedAt = now
	return calendar.ID, nil
}

// GetCalendarByID retrieves a calendar by its ID.
func (r *pgCalendarRepository) GetCalendarByID(ctx context.Context, id int) (*models.Calendar, error) {
	query := `
		SELECT id, user_id, name, description, color, created_at, updated_at
		FROM calendars
		WHERE id = $1`
	calendar := &models.Calendar{}
	err := r.pool.QueryRow(ctx, query, id).Scan(
		&calendar.ID,
		&calendar.UserID,
		&calendar.Name,
		&calendar.Description,
		&calendar.Color,
		&calendar.CreatedAt,
		&calendar.UpdatedAt,
	)
	if err != nil {
		// TODO: Handle pgx.ErrNoRows specifically
		return nil, err
	}
	return calendar, nil
}

// ListCalendarsByUserID retrieves all calendars for a specific user.
func (r *pgCalendarRepository) ListCalendarsByUserID(ctx context.Context, userID int) ([]models.Calendar, error) {
	query := `
		SELECT id, user_id, name, description, color, created_at, updated_at
		FROM calendars
		WHERE user_id = $1
		ORDER BY created_at DESC` // Or order by name, etc.

	rows, err := r.pool.Query(ctx, query, userID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	calendars := []models.Calendar{}
	for rows.Next() {
		var cal models.Calendar
		err := rows.Scan(
			&cal.ID,
			&cal.UserID,
			&cal.Name,
			&cal.Description,
			&cal.Color,
			&cal.CreatedAt,
			&cal.UpdatedAt,
		)
		if err != nil {
			return nil, err // Return partial results or handle error differently?
		}
		calendars = append(calendars, cal)
	}

	if err = rows.Err(); err != nil {
		return nil, err
	}

	return calendars, nil
}

// UpdateCalendar updates an existing calendar record.
func (r *pgCalendarRepository) UpdateCalendar(ctx context.Context, calendar *models.Calendar) error {
	query := `
		UPDATE calendars
		SET name = $1, description = $2, color = $3, updated_at = $4
		WHERE id = $5`
	now := time.Now()
	_, err := r.pool.Exec(ctx, query,
		calendar.Name,
		calendar.Description,
		calendar.Color,
		now, // Update updated_at
		calendar.ID,
	)
	// TODO: Check command tag result for rows affected if needed
	return err
}

// DeleteCalendar removes a calendar record from the database.
func (r *pgCalendarRepository) DeleteCalendar(ctx context.Context, id int) error {
	query := `DELETE FROM calendars WHERE id = $1`
	_, err := r.pool.Exec(ctx, query, id)
	// TODO: Check command tag result for rows affected if needed
	return err
}
