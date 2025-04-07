package utils

import (
	"errors"
	"log"
	"net/http"
	"strconv"

	"cozy-go/task-service/internal/middleware" // Import middleware to access context key type
)

// GetUserIDFromContext extracts the user ID (as int) from the request context.
// It assumes the AuthMiddleware has already placed the user ID string into the context.
func GetUserIDFromContext(r *http.Request) (int, error) {
	userIDStr, ok := r.Context().Value(middleware.UserIDContextKey).(string)
	if !ok || userIDStr == "" {
		log.Println("Error getting user ID from context")
		// This should technically not happen if middleware runs correctly
		return 0, errors.New("user ID not found in context")
	}
	userID, err := strconv.Atoi(userIDStr)
	if err != nil {
		log.Printf("Error converting userID string '%s' to int: %v", userIDStr, err)
		return 0, errors.New("invalid user ID format in context")
	}
	return userID, nil
}
