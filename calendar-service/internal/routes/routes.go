package routes

import (
	"net/http"

	"cozy-go/calendar-service/internal/handlers"   // Corrected import path
	"cozy-go/calendar-service/internal/middleware" // Corrected import path
	"cozy-go/calendar-service/repository"          // Corrected import path

	"github.com/jackc/pgx/v5/pgxpool"
)

// SetupRoutes configures the routes for the calendar service.
func SetupRoutes(mux *http.ServeMux, pool *pgxpool.Pool) {
	// Initialize repository and handler
	calendarRepo := repository.NewCalendarRepository(pool)
	calendarHandler := handlers.NewCalendarHandler(calendarRepo)

	// Public health check endpoint (no auth needed)
	mux.HandleFunc("GET /health", func(w http.ResponseWriter, r *http.Request) {
		// TODO: Enhance health check to ping DB via repository or pool
		w.WriteHeader(http.StatusOK)
		w.Write([]byte("Calendar Service is healthy"))
	})

	// --- Calendar Routes (Protected by Auth Middleware) ---

	// Create a new ServeMux for authenticated routes to easily apply middleware
	authMux := http.NewServeMux()

	// Route definitions using Go 1.22+ pattern matching
	authMux.HandleFunc("POST /calendars", calendarHandler.CreateCalendar)
	authMux.HandleFunc("GET /calendars", calendarHandler.ListCalendars)
	authMux.HandleFunc("GET /calendars/{id}", calendarHandler.GetCalendar)
	authMux.HandleFunc("PUT /calendars/{id}", calendarHandler.UpdateCalendar)
	authMux.HandleFunc("DELETE /calendars/{id}", calendarHandler.DeleteCalendar)

	// Apply AuthMiddleware to the authenticated routes
	// The root path "/" for Handle means it catches all paths starting with "/"
	// We mount this protected handler group under "/api/v1" or similar in main.go
	mux.Handle("/", middleware.AuthMiddleware(authMux))

	// Note: If you need different middleware for different groups,
	// you might create multiple sub-muxes or use a more advanced router.
}
