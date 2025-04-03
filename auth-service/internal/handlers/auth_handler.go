package handlers

import (
	"encoding/json"
	"log"
	"net/http"

	"auth-service/internal/events"
	"auth-service/internal/models"
	"auth-service/internal/utils"
	"auth-service/repository"

	"github.com/go-playground/validator/v10"
	amqp "github.com/rabbitmq/amqp091-go"
)

type AuthHandler struct {
	repo         repository.AuthRepository
	rabbitMQConn *amqp.Connection
}

func NewAuthHandler(repo repository.AuthRepository, rabbitMQConn *amqp.Connection) *AuthHandler {
	return &AuthHandler{repo: repo, rabbitMQConn: rabbitMQConn}
}

func (h *AuthHandler) Register(w http.ResponseWriter, r *http.Request) {
	var req models.RegisterRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, "Invalid request payload", http.StatusBadRequest)
		return
	}

	// Validate the request struct
	validate := validator.New()
	if err := validate.Struct(req); err != nil {
		http.Error(w, "Invalid request payload", http.StatusBadRequest)
		return
	}

	// Create a User object from the RegisterRequest
	user := models.User{
		Username: req.Username,
		Email:    req.Email,
		Password: req.Password,
	}

	// Hash the user's password
	hashedPassword, err := utils.HashPassword(user.Password)
	if err != nil {
		http.Error(w, "Failed to hash password", http.StatusInternalServerError)
		return
	}
	user.Password = hashedPassword

	// Save user to the database
	_, err = h.repo.Register(user)
	if err != nil {
		log.Printf("Failed to register user: %v", err)
		w.Header().Set("Content-Type", "application/json")
		w.WriteHeader(http.StatusInternalServerError) // Set the status code before writing the JSON
		json.NewEncoder(w).Encode(map[string]string{"message": "Failed to register user"})
		return
	}

	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusCreated)
	json.NewEncoder(w).Encode(map[string]string{"message": "User registered successfully"}) // Send a success message
}

func (h *AuthHandler) Login(w http.ResponseWriter, r *http.Request) {
	var req models.LoginRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, "Invalid request payload", http.StatusBadRequest)
		return
	}

	// Validate the request struct
	validate := validator.New()
	if err := validate.Struct(req); err != nil {
		http.Error(w, "Invalid request payload", http.StatusBadRequest)
		return
	}

	// Authenticate the user
	user := models.User{
		Email:    req.Email,
		Password: req.Password,
	}

	valid, err := h.repo.Authenticate(user)
	if err != nil || !valid {
		log.Printf("Failed to authenticate user: %v", err)
		http.Error(w, "Invalid email or password", http.StatusUnauthorized)
		return
	}

	// Generate JWT token
	token, err := utils.GenerateJWT(user)
	if err != nil {
		http.Error(w, "Failed to generate token", http.StatusInternalServerError)
		return
	}

	// Emit login event to RabbitMQ
	err = events.PublishLoginEvent(h.rabbitMQConn, user.Email)
	if err != nil {
		http.Error(w, "Failed to process login event", http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(map[string]string{"token": token})
}
