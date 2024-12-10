package handlers

import (
	"net/http"
)

type ProtectedHandler struct{}

func NewProtectedHandler() *ProtectedHandler {
	return &ProtectedHandler{}
}

func (h *ProtectedHandler) Protected(w http.ResponseWriter, r *http.Request) {
	w.WriteHeader(http.StatusOK)
	w.Write([]byte("This is a protected route"))
}
