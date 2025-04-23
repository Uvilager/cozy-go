package handlers

import (
	"encoding/json"
	"log"
	"net/http"
	"strconv"

	// Use path instead of mux for path parameters with standard library
	// "github.com/gorilla/mux" // Or use standard library URL parsing

	"cozy-go/calendar-service/internal/middleware" // Corrected import path
	"cozy-go/calendar-service/internal/models"     // Corrected import path
	"cozy-go/calendar-service/repository"          // Corrected import path
)

// CalendarHandler holds dependencies for calendar handlers.
type CalendarHandler struct {
	Repo repository.CalendarRepository
}

// NewCalendarHandler creates a new CalendarHandler.
func NewCalendarHandler(repo repository.CalendarRepository) *CalendarHandler {
	return &CalendarHandler{Repo: repo}
}

// CreateCalendar handles POST requests to create a new calendar.
func (h *CalendarHandler) CreateCalendar(w http.ResponseWriter, r *http.Request) {
	userID, ok := middleware.GetUserIDFromContext(r.Context())
	if !ok {
		http.Error(w, "User ID not found in context", http.StatusInternalServerError)
		return
	}

	var calendar models.Calendar
	if err := json.NewDecoder(r.Body).Decode(&calendar); err != nil {
		http.Error(w, "Invalid request body", http.StatusBadRequest)
		return
	}
	defer r.Body.Close()

	// Assign the authenticated user's ID
	calendar.UserID = userID

	// Validate the incoming calendar data using the model's Validate method
	if err := calendar.Validate(); err != nil {
		http.Error(w, err.Error(), http.StatusBadRequest)
		return
	}

	// Proceed with creation if validation passes
	newID, err := h.Repo.CreateCalendar(r.Context(), &calendar)
	if err != nil {
		log.Printf("Error creating calendar: %v", err)
		http.Error(w, "Failed to create calendar", http.StatusInternalServerError)
		return
	}
	calendar.ID = newID // Set the ID returned by the repository

	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusCreated)
	json.NewEncoder(w).Encode(calendar)
}

// ListCalendars handles GET requests to list calendars for the authenticated user.
func (h *CalendarHandler) ListCalendars(w http.ResponseWriter, r *http.Request) {
	userID, ok := middleware.GetUserIDFromContext(r.Context())
	if !ok {
		http.Error(w, "User ID not found in context", http.StatusInternalServerError)
		return
	}

	calendars, err := h.Repo.ListCalendarsByUserID(r.Context(), userID)
	if err != nil {
		log.Printf("Error listing calendars for user %d: %v", userID, err)
		http.Error(w, "Failed to retrieve calendars", http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(calendars)
}

// GetCalendar handles GET requests for a specific calendar.
func (h *CalendarHandler) GetCalendar(w http.ResponseWriter, r *http.Request) {
	userID, ok := middleware.GetUserIDFromContext(r.Context())
	if !ok {
		http.Error(w, "User ID not found in context", http.StatusInternalServerError)
		return
	}

	// Extract ID from URL path (e.g., /calendars/{id})
	// Using standard library path parsing - requires specific routing setup
	idStr := r.PathValue("id") // Requires Go 1.22+ and router setup
	if idStr == "" {
		http.Error(w, "Missing calendar ID in URL path", http.StatusBadRequest)
		return
	}

	id, err := strconv.Atoi(idStr)
	if err != nil {
		http.Error(w, "Invalid calendar ID format", http.StatusBadRequest)
		return
	}

	calendar, err := h.Repo.GetCalendarByID(r.Context(), id)
	if err != nil {
		// TODO: Handle specific errors like not found (pgx.ErrNoRows)
		log.Printf("Error getting calendar %d: %v", id, err)
		http.Error(w, "Calendar not found or error retrieving", http.StatusNotFound) // Or InternalServerError
		return
	}

	// Authorization check: Ensure the fetched calendar belongs to the authenticated user
	if calendar.UserID != userID {
		http.Error(w, "Forbidden: You do not have access to this calendar", http.StatusForbidden)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(calendar)
}

// UpdateCalendar handles PUT requests to update a calendar.
func (h *CalendarHandler) UpdateCalendar(w http.ResponseWriter, r *http.Request) {
	userID, ok := middleware.GetUserIDFromContext(r.Context())
	if !ok {
		http.Error(w, "User ID not found in context", http.StatusInternalServerError)
		return
	}

	idStr := r.PathValue("id") // Requires Go 1.22+ and router setup
	if idStr == "" {
		http.Error(w, "Missing calendar ID in URL path", http.StatusBadRequest)
		return
	}
	id, err := strconv.Atoi(idStr)
	if err != nil {
		http.Error(w, "Invalid calendar ID format", http.StatusBadRequest)
		return
	}

	// Fetch existing calendar first to verify ownership
	existingCalendar, err := h.Repo.GetCalendarByID(r.Context(), id)
	if err != nil {
		log.Printf("Error finding calendar %d for update: %v", id, err)
		http.Error(w, "Calendar not found or error retrieving", http.StatusNotFound)
		return
	}
	if existingCalendar.UserID != userID {
		http.Error(w, "Forbidden: You cannot update this calendar", http.StatusForbidden)
		return
	}

	var updates models.Calendar
	if err := json.NewDecoder(r.Body).Decode(&updates); err != nil {
		http.Error(w, "Invalid request body", http.StatusBadRequest)
		return
	}
	defer r.Body.Close()

	// Apply updates - Ensure ID and UserID are not changed from request body
	existingCalendar.Name = updates.Name
	existingCalendar.Description = updates.Description
	existingCalendar.Color = updates.Color
	// UserID and ID remain the same from existingCalendar

	// Validate the updated calendar data
	if err := existingCalendar.Validate(); err != nil {
		http.Error(w, err.Error(), http.StatusBadRequest)
		return
	}

	// Proceed with update if validation passes
	if err := h.Repo.UpdateCalendar(r.Context(), existingCalendar); err != nil {
		log.Printf("Error updating calendar %d: %v", id, err)
		http.Error(w, "Failed to update calendar", http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(existingCalendar) // Return updated calendar
}

// DeleteCalendar handles DELETE requests for a specific calendar.
func (h *CalendarHandler) DeleteCalendar(w http.ResponseWriter, r *http.Request) {
	userID, ok := middleware.GetUserIDFromContext(r.Context())
	if !ok {
		http.Error(w, "User ID not found in context", http.StatusInternalServerError)
		return
	}

	idStr := r.PathValue("id") // Requires Go 1.22+ and router setup
	if idStr == "" {
		http.Error(w, "Missing calendar ID in URL path", http.StatusBadRequest)
		return
	}
	id, err := strconv.Atoi(idStr)
	if err != nil {
		http.Error(w, "Invalid calendar ID format", http.StatusBadRequest)
		return
	}

	// Fetch existing calendar first to verify ownership
	existingCalendar, err := h.Repo.GetCalendarByID(r.Context(), id)
	if err != nil {
		log.Printf("Error finding calendar %d for deletion: %v", id, err)
		http.Error(w, "Calendar not found or error retrieving", http.StatusNotFound)
		return
	}
	if existingCalendar.UserID != userID {
		http.Error(w, "Forbidden: You cannot delete this calendar", http.StatusForbidden)
		return
	}

	if err := h.Repo.DeleteCalendar(r.Context(), id); err != nil {
		log.Printf("Error deleting calendar %d: %v", id, err)
		http.Error(w, "Failed to delete calendar", http.StatusInternalServerError)
		return
	}

	w.WriteHeader(http.StatusNoContent) // Success, no content to return
}
