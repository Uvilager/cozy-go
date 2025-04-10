package handlers

import (
	"encoding/json"
	"log"
	"net/http"

	"auth-service/internal/events"
	"auth-service/internal/models"
	"auth-service/internal/utils"
	"auth-service/repository"

	"github.com/Azure/azure-sdk-for-go/sdk/messaging/azservicebus"
	"github.com/go-playground/validator/v10"
)

type AuthHandler struct {
	repo        repository.AuthRepository
	eventSender *azservicebus.Sender // Changed from RabbitMQ connection to Service Bus Sender
}

// NewAuthHandler updated to accept an azservicebus.Sender
func NewAuthHandler(repo repository.AuthRepository, sender *azservicebus.Sender) *AuthHandler {
	return &AuthHandler{repo: repo, eventSender: sender}
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

	// Fetch full user details (including ID) after successful authentication
	// Assuming Authenticate only validates password, we need to get the user record
	// We might need a GetUserByEmail method in the repository
	dbUser, err := h.repo.GetUserByEmail(r.Context(), req.Email) // Assuming this method exists
	if err != nil {
		log.Printf("Failed to retrieve user details after authentication for email %s: %v", req.Email, err)
		// Handle cases like user found during auth but not found now (unlikely but possible)
		http.Error(w, "Failed to retrieve user details", http.StatusInternalServerError)
		return
	}
	if dbUser == nil {
		// Should not happen if Authenticate passed, but good practice to check
		log.Printf("User %s authenticated but not found in database.", req.Email)
		http.Error(w, "User not found after authentication", http.StatusInternalServerError)
		return
	}

	// Generate JWT token using the fetched user details (especially ID)
	token, err := utils.GenerateJWT(*dbUser) // Pass the full user struct from DB
	if err != nil {
		http.Error(w, "Failed to generate token", http.StatusInternalServerError)
		return
	}

	// Emit login event using Azure Service Bus Sender
	// We'll need to update/create a function in the events package for this
	err = events.PublishUserRegisteredEvent(r.Context(), h.eventSender, dbUser.Email) // Assuming a function like this exists/will exist
	if err != nil {
		// Log the error but maybe don't fail the login just because event publishing failed?
		// Depends on requirements. For now, we'll log and continue.
		log.Printf("Failed to publish login event for user %s: %v", dbUser.Email, err)
		http.Error(w, "Failed to process login event", http.StatusInternalServerError)
		return
	}

	// Prepare the response including token and user details
	// Important: Exclude sensitive fields like password hash from the response user object
	responseUser := models.UserResponse{ // Assuming a UserResponse struct exists or create one
		ID:       dbUser.ID,
		Username: dbUser.Username,
		Email:    dbUser.Email,
		// Add other safe fields as needed
	}
	responsePayload := map[string]interface{}{
		"token": token,
		"user":  responseUser,
	}

	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusOK) // Send 200 OK
	if err := json.NewEncoder(w).Encode(responsePayload); err != nil {
		log.Printf("Error encoding login response for user %s: %v", dbUser.Email, err)
	}
	log.Printf("Successfully handled Login request for user ID: %d", dbUser.ID)
}
