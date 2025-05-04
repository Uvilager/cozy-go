package middleware

import (
	"context"
	"errors"
	"log"
	"net/http"
	"os"
	"strings"

	"github.com/golang-jwt/jwt/v5"
	"github.com/google/uuid" // Import UUID package
)

// Define a type for the user ID context key to avoid collisions
type contextKey string

const UserIDContextKey contextKey = "userID"

// validateToken parses and validates the JWT token.
// It ensures the signing method is HMAC and uses the JWT_SECRET environment variable.
func validateToken(tokenString string) (*jwt.RegisteredClaims, error) {
	jwtSecret := []byte(os.Getenv("JWT_SECRET"))
	if len(jwtSecret) == 0 {
		log.Println("CRITICAL: JWT_SECRET environment variable not set.")
		return nil, errors.New("JWT secret key is not configured")
	}

	token, err := jwt.ParseWithClaims(tokenString, &jwt.RegisteredClaims{}, func(token *jwt.Token) (interface{}, error) {
		if _, ok := token.Method.(*jwt.SigningMethodHMAC); !ok {
			log.Printf("AuthMiddleware: Unexpected signing method: %v", token.Header["alg"])
			return nil, errors.New("unexpected signing method")
		}
		return jwtSecret, nil
	})

	if err != nil {
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
		return nil, err
	}

	if claims, ok := token.Claims.(*jwt.RegisteredClaims); ok && token.Valid {
		if claims.Subject == "" {
			log.Println("AuthMiddleware: User ID (sub) claim missing from token")
			return nil, errors.New("invalid token claims: missing user ID")
		}
		// Validate if the Subject is a valid UUID string before returning
		if _, parseErr := uuid.Parse(claims.Subject); parseErr != nil {
			log.Printf("AuthMiddleware: User ID (sub) claim '%s' is not a valid UUID: %v", claims.Subject, parseErr)
			return nil, errors.New("invalid token claims: user ID is not a valid UUID")
		}
		return claims, nil
	}

	log.Println("AuthMiddleware: Invalid token claims")
	return nil, jwt.ErrTokenInvalidClaims
}

// AuthMiddleware validates the JWT token and adds the user ID (as UUID) to the request context.
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
			http.Error(w, "Invalid or expired token", http.StatusUnauthorized)
			return
		}

		// Extract User ID from Subject claim and parse as UUID
		userID, err := uuid.Parse(claims.Subject)
		if err != nil {
			// This should theoretically not happen due to check in validateToken, but check anyway.
			log.Printf("AuthMiddleware: Could not parse user ID (sub) '%s' from token as UUID: %v", claims.Subject, err)
			http.Error(w, "Invalid token claims: user ID format error", http.StatusUnauthorized)
			return
		}

		log.Printf("AuthMiddleware: Token validated successfully for user ID: %s", userID.String())

		// Add UUID user ID to the request context
		ctx := context.WithValue(r.Context(), UserIDContextKey, userID)

		next.ServeHTTP(w, r.WithContext(ctx))
	})
}

// GetUserIDFromContext retrieves the user ID (as UUID) stored in the context by AuthMiddleware.
// Returns the user ID and true if found, otherwise uuid.Nil and false.
func GetUserIDFromContext(ctx context.Context) (uuid.UUID, bool) {
	userID, ok := ctx.Value(UserIDContextKey).(uuid.UUID)
	if !ok {
		return uuid.Nil, false // Return Nil UUID if not found or type assertion fails
	}
	return userID, ok
}
