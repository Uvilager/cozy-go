package middleware

import (
	"context"
	"errors" // Import the errors package
	"log"
	"net/http"
	"os"
	"strings"

	// Assuming JWT utility functions will be placed here or imported
	// "cozy-go/task-service/internal/utils" // Example path if utils are added

	"github.com/golang-jwt/jwt/v5"
)

// Define a type for the user ID context key to avoid collisions
type contextKey string

const UserIDContextKey contextKey = "userID"

// TODO: Replace with actual JWT validation logic (likely copied/adapted from auth-service)
// This is a placeholder structure.
func validateToken(tokenString string) (*jwt.RegisteredClaims, error) {
	// 1. Get the secret key (MUST be the same as in auth-service)
	jwtSecret := []byte(os.Getenv("JWT_SECRET")) // Ensure JWT_SECRET env var is set
	if len(jwtSecret) == 0 {
		log.Println("Warning: JWT_SECRET environment variable not set.")
		// Depending on policy, either deny all or allow if secret is missing (unsafe)
		return nil, errors.New("JWT secret key is not configured") // Use standard error
	}

	// 2. Parse and validate the token
	token, err := jwt.ParseWithClaims(tokenString, &jwt.RegisteredClaims{}, func(token *jwt.Token) (interface{}, error) {
		// Don't forget to validate the alg is what you expect:
		if _, ok := token.Method.(*jwt.SigningMethodHMAC); !ok {
			return nil, log.Output(1, "Unexpected signing method: "+token.Header["alg"].(string))
		}
		return jwtSecret, nil
	})

	if err != nil {
		log.Printf("Error validating token: %v", err)
		return nil, err // Return specific errors like ErrTokenExpired, ErrSignatureInvalid etc.
	}

	// 3. Check if claims are valid and extract them
	if claims, ok := token.Claims.(*jwt.RegisteredClaims); ok && token.Valid {
		// TODO: Extract user ID from claims. Subject ('sub') is common.
		// Need to know how user ID was stored in auth-service/utils/GenerateJWT
		// Example: userIDStr := claims.Subject
		// userID, err := strconv.Atoi(userIDStr) ... handle error ...
		return claims, nil
	}

	return nil, jwt.ErrTokenInvalidClaims
}


// AuthMiddleware validates the JWT token from the Authorization header.
func AuthMiddleware(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		authHeader := r.Header.Get("Authorization")
		if authHeader == "" {
			log.Println("AuthMiddleware: Missing Authorization header")
			http.Error(w, "Authorization header required", http.StatusUnauthorized)
			return
		}

		// Check if the header format is Bearer <token>
		parts := strings.Split(authHeader, " ")
		if len(parts) != 2 || strings.ToLower(parts[0]) != "bearer" {
			log.Println("AuthMiddleware: Invalid Authorization header format")
			http.Error(w, "Invalid Authorization header format", http.StatusUnauthorized)
			return
		}

		tokenString := parts[1]

		// Validate the token (using placeholder function for now)
		claims, err := validateToken(tokenString) // TODO: Implement actual validation
		if err != nil {
			log.Printf("AuthMiddleware: Token validation failed: %v", err)
			http.Error(w, "Invalid or expired token", http.StatusUnauthorized)
			return
		}

		// --- TODO: Extract User ID from claims and add to context ---
		// Example: Assuming user ID is stored in the 'Subject' claim
		userIDStr := claims.Subject
		if userIDStr == "" {
			 log.Println("AuthMiddleware: User ID (sub) not found in token claims")
			 http.Error(w, "Invalid token claims", http.StatusUnauthorized)
			 return
		}
		// Convert userIDStr to appropriate type (e.g., int) if needed
		// For now, let's assume it's a string and add it directly. Adjust as needed.
		// userID, err := strconv.Atoi(userIDStr) ... handle error ...

		log.Printf("AuthMiddleware: Token validated successfully for user ID (sub): %s", userIDStr)

		// Add user ID to the request context
		ctx := context.WithValue(r.Context(), UserIDContextKey, userIDStr) // Use string ID for now

		// Call the next handler with the modified context
		next.ServeHTTP(w, r.WithContext(ctx))
	})
}
