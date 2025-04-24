package routes

import (
	"fmt"
	"net/http"

	"github.com/your-username/cozy-go/event-service/internal/handlers"   // Adjust import path
	"github.com/your-username/cozy-go/event-service/internal/middleware" // Adjust import path
	// Import other necessary packages like CORS if needed
)

// SetupRoutes configures the routes for the event service.
func SetupRoutes(eventHandler *handlers.EventHandler) http.Handler {
	mux := http.NewServeMux()

	// Public health check endpoint
	mux.HandleFunc("GET /health", func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Content-Type", "application/json")
		w.WriteHeader(http.StatusOK)
		fmt.Fprintln(w, `{"status": "ok"}`)
	})

	// --- Protected Event Routes ---
	// Create a sub-router or group for routes requiring authentication
	// Here, we apply the middleware directly to each protected handler function.
	mux.Handle("POST /events", middleware.AuthMiddleware(http.HandlerFunc(eventHandler.CreateEvent)))
	mux.Handle("GET /calendars/{calendarID}/events", middleware.AuthMiddleware(http.HandlerFunc(eventHandler.ListEventsByCalendar)))
	mux.Handle("GET /events/{eventID}", middleware.AuthMiddleware(http.HandlerFunc(eventHandler.GetEvent)))
	mux.Handle("PUT /events/{eventID}", middleware.AuthMiddleware(http.HandlerFunc(eventHandler.UpdateEvent)))
	mux.Handle("DELETE /events/{eventID}", middleware.AuthMiddleware(http.HandlerFunc(eventHandler.DeleteEvent)))
	// --- End Protected Event Routes ---

	// TODO: Add CORS middleware wrapper if needed
	// corsHandler := cors.Default().Handler(mux)
	// return corsHandler

	return mux // Return the main mux for now
}
