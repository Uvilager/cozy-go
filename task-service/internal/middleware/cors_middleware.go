package middleware

import (
	"net/http"

	"github.com/rs/cors"
)

// EnableCORS applies CORS middleware to a handler.
func EnableCORS(handler http.Handler) http.Handler {
	// Configure CORS options
	// TODO: Make AllowedOrigins configurable via environment variables for production
	c := cors.New(cors.Options{
		AllowedOrigins:   []string{"*"}, // Allow all origins for now
		AllowedMethods:   []string{"GET", "POST", "PUT", "DELETE", "OPTIONS"},
		AllowedHeaders:   []string{"Authorization", "Content-Type", "X-Requested-With"},
		AllowCredentials: true,
		Debug:            false, // Set to true for debugging CORS issues
	})

	return c.Handler(handler)
}
