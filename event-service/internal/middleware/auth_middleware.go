package middleware

import (
	"context"
	"errors"
	"fmt"
	"log"
	"net/http"
	"os"
	"strconv"
	"strings"

	"github.com/golang-jwt/jwt/v5"
)

// Define a key type for context to avoid collisions
type ContextKey string // Export the type

const UserIDKey ContextKey = "userID" // Export the key

// validateToken parses and validates the JWT token using RegisteredClaims.
func validateToken(tokenString string) (*jwt.RegisteredClaims, error) {
	jwtSecret := []byte(os.Getenv("JWT_SECRET"))
	if len(jwtSecret) == 0 {
		log.Println("CRITICAL: JWT_SECRET environment variable not set.")
		return nil, errors.New("JWT secret key is not configured")
	}

	token, err := jwt.ParseWithClaims(tokenString, &jwt.RegisteredClaims{}, func(token *jwt.Token) (interface{}, error) {
		// Validate the alg is HMAC
		if _, ok := token.Method.(*jwt.SigningMethodHMAC); !ok {
			log.Printf("AuthMiddleware: Unexpected signing method: %v", token.Header["alg"])
			return nil, fmt.Errorf("unexpected signing method: %v", token.Header["alg"])
		}
		return jwtSecret, nil
	})

	if err != nil {
		// Log specific JWT errors
		if errors.Is(err, jwt.ErrTokenMalformed) {
			log.Println("AuthMiddleware: Malformed token")
		} else if errors.Is(err, jwt.ErrTokenExpired) {
			log.Println("AuthMiddleware: Token has expired")
		} else if errors.Is(err, jwt.ErrTokenNotValidYet) {
			log.Println("AuthMiddleware: Token not active yet")
		} else if errors.Is(err, jwt.ErrSignatureInvalid) {
			log.Println("AuthMiddleware: Invalid token signature")
		} else {
			log.Printf("AuthMiddleware: Error validating token: %v", err)
		}
		return nil, err // Return the original error for generic handling
	}

	// Check if claims can be asserted and token is valid
	if claims, ok := token.Claims.(*jwt.RegisteredClaims); ok && token.Valid {
		// Check if the Subject (user ID) claim exists
		if claims.Subject == "" {
			log.Println("AuthMiddleware: User ID (sub) claim missing from token")
			return nil, errors.New("invalid token claims: missing user ID")
		}
		return claims, nil
	}

	log.Println("AuthMiddleware: Token claims invalid or token is not valid")
	return nil, jwt.ErrTokenInvalidClaims // Use standard JWT error
}

// AuthMiddleware validates the JWT token and adds the user ID to the request context.
func AuthMiddleware(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		authHeader := r.Header.Get("Authorization")
		if authHeader == "" {
			log.Println("AuthMiddleware: Missing Authorization header")
			http.Error(w, "Authorization header required", http.StatusUnauthorized)
			return
		}

		parts := strings.Split(authHeader, " ")
		if len(parts) != 2 || strings.ToLower(parts[0]) != "bearer" {
			log.Println("AuthMiddleware: Invalid Authorization header format")
			http.Error(w, "Invalid Authorization header format", http.StatusUnauthorized)
			return
		}

		tokenString := parts[1]

		claims, err := validateToken(tokenString)
		if err != nil {
			// validateToken already logs details
			http.Error(w, "Invalid or expired token", http.StatusUnauthorized) // Generic error to client
			return
		}

		// Extract User ID from Subject claim and convert to integer
		userID, err := strconv.Atoi(claims.Subject)
		if err != nil {
			log.Printf("AuthMiddleware: Could not parse user ID (sub) '%s' from token: %v", claims.Subject, err)
			http.Error(w, "Invalid token claims: user ID format error", http.StatusUnauthorized)
			return
		}

		log.Printf("AuthMiddleware: Token validated successfully for user ID: %d", userID)

		// Add integer user ID to the request context using the defined key
		ctx := context.WithValue(r.Context(), UserIDKey, userID)

		next.ServeHTTP(w, r.WithContext(ctx))
	})
}

// GetUserIDFromContext retrieves the user ID stored in the request context.
// Returns 0 and false if not found or not an int.
func GetUserIDFromContext(ctx context.Context) (int, bool) {
	userID, ok := ctx.Value(UserIDKey).(int)
	return userID, ok
}
