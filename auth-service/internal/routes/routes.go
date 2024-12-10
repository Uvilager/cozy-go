package routes

import (
	"net/http"

	"auth-service/internal/handlers"
	"auth-service/internal/middleware"
)

func RegisterRoutes(mux *http.ServeMux, authHandler *handlers.AuthHandler, healthHandler *handlers.HealthHandler, protectedHandler *handlers.ProtectedHandler) {
	mux.HandleFunc("/register", authHandler.Register)
	mux.HandleFunc("/login", authHandler.Login)
	mux.HandleFunc("/health", healthHandler.HealthCheck)
	mux.Handle("/protected", middleware.JWTAuth(http.HandlerFunc(protectedHandler.Protected)))
}
