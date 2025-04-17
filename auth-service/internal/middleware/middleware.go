package middleware

import (
	"context" // Import context
	"errors"  // Import errors
	"log"
	"net/http"
	"os"
	"strings"

	"github.com/golang-jwt/jwt/v5"
)

// Define context key type (can be shared or redefined)
type contextKey string
const UserIDContextKey contextKey = "userID"


func JWTAuth(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		authHeader := r.Header.Get("Authorization")
		if authHeader == "" {
			http.Error(w, "Missing token", http.StatusUnauthorized)
			return
		}

		tokenString := strings.TrimPrefix(authHeader, "Bearer ")
		log.Println("Auth Service Middleware: Received Token:", tokenString)

		// Use the correct environment variable and handle missing secret
		secretKey := os.Getenv("JWT_SECRET")
		if secretKey == "" {
			log.Println("Error: JWT_SECRET environment variable not set in auth-service middleware.")
			http.Error(w, "Internal server configuration error", http.StatusInternalServerError)
			return
		}

		// Parse using RegisteredClaims to match generation and task-service validation
		token, err := jwt.ParseWithClaims(tokenString, &jwt.RegisteredClaims{}, func(token *jwt.Token) (interface{}, error) {
			if _, ok := token.Method.(*jwt.SigningMethodHMAC); !ok {
				// Log the unexpected algorithm type found in the token's header
				alg := "unknown"
				if token.Header != nil {
					if algStr, ok := token.Header["alg"].(string); ok {
						alg = algStr
					}
				}
				log.Printf("Auth Service Middleware: Unexpected signing method: %v", alg)
				return nil, errors.New("invalid signing method") // Return a specific error
			}
			return []byte(secretKey), nil
		})

		if err != nil {
			log.Printf("Auth Service Middleware: Token parsing/validation error: %v", err)
			// Check for specific errors if needed (e.g., expired token)
			// if errors.Is(err, jwt.ErrTokenExpired) { ... }
			http.Error(w, "Invalid or expired token", http.StatusUnauthorized)
			return
		}

		// Extract claims if needed within auth-service protected routes
		if claims, ok := token.Claims.(*jwt.RegisteredClaims); ok && token.Valid {
			userIDStr := claims.Subject
			if userIDStr == "" {
				log.Println("Auth Service Middleware: User ID (sub) not found in token claims")
				http.Error(w, "Invalid token claims", http.StatusUnauthorized)
				return
			}
			log.Printf("Auth Service Middleware: Token validated for user ID (sub): %s", userIDStr)
			// Add user ID to context if subsequent handlers in auth-service need it
			ctx := context.WithValue(r.Context(), UserIDContextKey, userIDStr)
			next.ServeHTTP(w, r.WithContext(ctx))
		} else {
			log.Println("Auth Service Middleware: Invalid Token (claims parsing failed or token invalid)")
			http.Error(w, "Invalid token", http.StatusUnauthorized)
			return
		}
	})
}
