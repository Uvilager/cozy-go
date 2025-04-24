package handlers

import (
	"encoding/json"
	"errors"
	"log"
	"net/http"
	"strconv"
	"time"

	// "github.com/jackc/pgx/v5" // For checking specific DB errors like ErrNoRows

	"github.com/your-username/cozy-go/event-service/internal/middleware" // Import middleware
	"github.com/your-username/cozy-go/event-service/internal/models"     // Adjust import path
	"github.com/your-username/cozy-go/event-service/repository"          // Adjust import path
)

// EventHandler handles HTTP requests for events.
type EventHandler struct {
	repo repository.EventRepository
}

// NewEventHandler creates a new instance of EventHandler.
func NewEventHandler(repo repository.EventRepository) *EventHandler {
	return &EventHandler{repo: repo}
}

// CreateEvent handles POST requests to create a new event.
func (h *EventHandler) CreateEvent(w http.ResponseWriter, r *http.Request) {
	userID, ok := r.Context().Value(middleware.UserIDKey).(int) // Use middleware key
	if !ok {
		http.Error(w, "User ID not found in context", http.StatusUnauthorized) // Or StatusInternalServerError if it should always be there
		return
	}

	var event models.Event
	if err := json.NewDecoder(r.Body).Decode(&event); err != nil {
		http.Error(w, "Invalid request body", http.StatusBadRequest)
		return
	}
	defer r.Body.Close()

	// Basic validation (can be expanded)
	if event.Title == "" || event.StartTime.IsZero() || event.EndTime.IsZero() || event.CalendarID == 0 {
		http.Error(w, "Missing required fields (title, start_time, end_time, calendar_id)", http.StatusBadRequest)
		return
	}
	if event.EndTime.Before(event.StartTime) {
		http.Error(w, "End time cannot be before start time", http.StatusBadRequest)
		return
	}

	// Assign the user ID from context
	event.UserID = userID

	// TODO: Add validation to ensure the user owns the target CalendarID

	createdID, err := h.repo.CreateEvent(r.Context(), &event)
	if err != nil {
		log.Printf("Error creating event: %v", err)
		http.Error(w, "Failed to create event", http.StatusInternalServerError)
		return
	}

	event.ID = createdID // Set the ID in the response object

	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusCreated)
	if err := json.NewEncoder(w).Encode(event); err != nil {
		log.Printf("Error encoding created event response: %v", err)
	}
}

// GetEvent handles GET requests to retrieve a single event by ID.
func (h *EventHandler) GetEvent(w http.ResponseWriter, r *http.Request) {
	userID, ok := r.Context().Value(middleware.UserIDKey).(int) // Use middleware key
	if !ok {
		http.Error(w, "User ID not found in context", http.StatusUnauthorized)
		return
	}

	eventIDStr := r.PathValue("eventID") // Requires Go 1.22+ router or equivalent logic
	if eventIDStr == "" {
		// Fallback or alternative for older Go versions / different routers
		// e.g., using strings.Split(r.URL.Path, "/")
		http.Error(w, "Missing event ID in path", http.StatusBadRequest)
		return
	}

	eventID, err := strconv.Atoi(eventIDStr)
	if err != nil {
		http.Error(w, "Invalid event ID format", http.StatusBadRequest)
		return
	}

	event, err := h.repo.GetEventByID(r.Context(), eventID, userID)
	if err != nil {
		// Check for specific errors like "not found"
		// if errors.Is(err, pgx.ErrNoRows) { // Need to import pgx
		// 	http.Error(w, "Event not found or not owned by user", http.StatusNotFound)
		// 	return
		// }
		log.Printf("Error getting event %d: %v", eventID, err)
		// Don't leak potentially sensitive error details like "not owned" vs "not found" generically
		http.Error(w, "Failed to retrieve event", http.StatusInternalServerError) // Or StatusNotFound
		return
	}

	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusOK)
	if err := json.NewEncoder(w).Encode(event); err != nil {
		log.Printf("Error encoding get event response: %v", err)
	}
}

// ListEventsByCalendar handles GET requests to list events for a calendar within a time range.
func (h *EventHandler) ListEventsByCalendar(w http.ResponseWriter, r *http.Request) {
	userID, ok := r.Context().Value(middleware.UserIDKey).(int) // Use middleware key
	if !ok {
		http.Error(w, "User ID not found in context", http.StatusUnauthorized)
		return
	}

	calendarIDStr := r.PathValue("calendarID") // Requires Go 1.22+ router or equivalent logic
	if calendarIDStr == "" {
		http.Error(w, "Missing calendar ID in path", http.StatusBadRequest)
		return
	}
	calendarID, err := strconv.Atoi(calendarIDStr)
	if err != nil {
		http.Error(w, "Invalid calendar ID format", http.StatusBadRequest)
		return
	}

	// Get time range from query parameters (e.g., ?start=...&end=...)
	// Use RFC3339 format (e.g., 2023-10-27T10:00:00Z)
	startStr := r.URL.Query().Get("start")
	endStr := r.URL.Query().Get("end")

	if startStr == "" || endStr == "" {
		http.Error(w, "Missing required query parameters: start, end", http.StatusBadRequest)
		return
	}

	startTime, err := time.Parse(time.RFC3339, startStr)
	if err != nil {
		http.Error(w, "Invalid start time format (use RFC3339)", http.StatusBadRequest)
		return
	}
	endTime, err := time.Parse(time.RFC3339, endStr)
	if err != nil {
		http.Error(w, "Invalid end time format (use RFC3339)", http.StatusBadRequest)
		return
	}

	if endTime.Before(startTime) {
		http.Error(w, "End time cannot be before start time", http.StatusBadRequest)
		return
	}

	// TODO: Add validation to ensure the user owns the target CalendarID

	events, err := h.repo.ListEventsByCalendar(r.Context(), calendarID, userID, startTime, endTime)
	if err != nil {
		log.Printf("Error listing events for calendar %d: %v", calendarID, err)
		http.Error(w, "Failed to list events", http.StatusInternalServerError)
		return
	}

	// Return empty list instead of null if no events found
	if events == nil {
		events = []models.Event{}
	}

	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusOK)
	if err := json.NewEncoder(w).Encode(events); err != nil {
		log.Printf("Error encoding list events response: %v", err)
	}
}

// UpdateEvent handles PUT requests to update an existing event.
func (h *EventHandler) UpdateEvent(w http.ResponseWriter, r *http.Request) {
	userID, ok := r.Context().Value(middleware.UserIDKey).(int) // Use middleware key
	if !ok {
		http.Error(w, "User ID not found in context", http.StatusUnauthorized)
		return
	}

	eventIDStr := r.PathValue("eventID") // Requires Go 1.22+ router or equivalent logic
	if eventIDStr == "" {
		http.Error(w, "Missing event ID in path", http.StatusBadRequest)
		return
	}
	eventID, err := strconv.Atoi(eventIDStr)
	if err != nil {
		http.Error(w, "Invalid event ID format", http.StatusBadRequest)
		return
	}

	var eventUpdates models.Event
	if err := json.NewDecoder(r.Body).Decode(&eventUpdates); err != nil {
		http.Error(w, "Invalid request body", http.StatusBadRequest)
		return
	}
	defer r.Body.Close()

	// Basic validation
	if eventUpdates.Title == "" || eventUpdates.StartTime.IsZero() || eventUpdates.EndTime.IsZero() {
		http.Error(w, "Missing required fields (title, start_time, end_time)", http.StatusBadRequest)
		return
	}
	if eventUpdates.EndTime.Before(eventUpdates.StartTime) {
		http.Error(w, "End time cannot be before start time", http.StatusBadRequest)
		return
	}

	// Set the ID and UserID for the update operation (ownership checked in repo)
	eventUpdates.ID = eventID
	eventUpdates.UserID = userID
	// Note: CalendarID is usually not updatable, but if it were, ensure user owns the new calendar too.

	err = h.repo.UpdateEvent(r.Context(), &eventUpdates)
	if err != nil {
		// Check for specific errors like "not found or not owned"
		// This requires the repository to return specific error types or check the error message
		if errors.Is(err, errors.New("not found or not owned")) { // Example check, needs better error handling
			http.Error(w, "Event not found or not owned by user", http.StatusNotFound)
			return
		}
		log.Printf("Error updating event %d: %v", eventID, err)
		http.Error(w, "Failed to update event", http.StatusInternalServerError)
		return
	}

	w.WriteHeader(http.StatusOK) // Or http.StatusNoContent
	// Optionally return the updated event
	// updatedEvent, _ := h.repo.GetEventByID(r.Context(), eventID, userID)
	// json.NewEncoder(w).Encode(updatedEvent)
}

// DeleteEvent handles DELETE requests to remove an event.
func (h *EventHandler) DeleteEvent(w http.ResponseWriter, r *http.Request) {
	userID, ok := r.Context().Value(middleware.UserIDKey).(int) // Use middleware key
	if !ok {
		http.Error(w, "User ID not found in context", http.StatusUnauthorized)
		return
	}

	eventIDStr := r.PathValue("eventID") // Requires Go 1.22+ router or equivalent logic
	if eventIDStr == "" {
		http.Error(w, "Missing event ID in path", http.StatusBadRequest)
		return
	}
	eventID, err := strconv.Atoi(eventIDStr)
	if err != nil {
		http.Error(w, "Invalid event ID format", http.StatusBadRequest)
		return
	}

	err = h.repo.DeleteEvent(r.Context(), eventID, userID)
	if err != nil {
		// Check for specific errors like "not found or not owned"
		if errors.Is(err, errors.New("not found or not owned")) { // Example check
			http.Error(w, "Event not found or not owned by user", http.StatusNotFound)
			return
		}
		log.Printf("Error deleting event %d: %v", eventID, err)
		http.Error(w, "Failed to delete event", http.StatusInternalServerError)
		return
	}

	w.WriteHeader(http.StatusNoContent)
}

// Helper function for sending JSON errors (optional)
func writeJSONError(w http.ResponseWriter, message string, statusCode int) {
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(statusCode)
	json.NewEncoder(w).Encode(map[string]string{"error": message})
}
