package routes

import (
	"net/http"

	"auth-service/internal/handlers"
)

func RegisterRoutes(mux *http.ServeMux, authHandler *handlers.AuthHandler, healthHandler *handlers.HealthHandler) {
	mux.HandleFunc("/register", authHandler.Register)
	mux.HandleFunc("/login", authHandler.Login)
	mux.HandleFunc("/health", healthHandler.HealthCheck)
}
