package handlers

import (
	"net/http"

	"auth-service/repository"
)

type HealthHandler struct {
	repo repository.HealthRepository
}

func NewHealthHandler(repo repository.HealthRepository) *HealthHandler {
	return &HealthHandler{repo: repo}
}

func (h *HealthHandler) HealthCheck(w http.ResponseWriter, r *http.Request) {
	if err := h.repo.CheckHealth(); err != nil {
		http.Error(w, "Service Unavailable", http.StatusServiceUnavailable)
		return
	}
	w.WriteHeader(http.StatusOK)
	w.Write([]byte("OK"))
}
