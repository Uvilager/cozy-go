package handlers

import (
	"encoding/json"
	"log"
	"net/http"

	"auth-service/internal/events"
	"auth-service/internal/models"
	"auth-service/internal/utils"
	"auth-service/repository"

	// "github.com/Azure/azure-sdk-for-go/sdk/messaging/azservicebus" // No longer needed directly
	"github.com/go-playground/validator/v10"
)

type AuthHandler struct {
	repo           repository.AuthRepository
	eventPublisher events.EventPublisher // Use the EventPublisher interface
}

// NewAuthHandler updated to accept an events.EventPublisher
func NewAuthHandler(repo repository.AuthRepository, publisher events.EventPublisher) *AuthHandler {
	return &AuthHandler{repo: repo, eventPublisher: publisher}
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

	// Publish event after successful registration
	if h.eventPublisher != nil { // Check if publisher is configured
		err = h.eventPublisher.PublishUserRegisteredEvent(r.Context(), user.Email)
		if err != nil {
			// Log the error but don't fail the registration request
			log.Printf("Warning: Failed to publish user registered event for email %s: %v", user.Email, err)
			// Decide if this should be a hard failure or just a warning
		}
	} else {
		log.Println("Warning: Event publisher not configured in handler, skipping event publication for registration.")
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
	dbUser, err := h.repo.GetUserByEmail(r.Context(), req.Email)
	if err != nil {
		log.Printf("Failed to retrieve user details after authentication for email %s: %v", req.Email, err)
		http.Error(w, "Failed to retrieve user details", http.StatusInternalServerError)
		return
	}
	if dbUser == nil {
		log.Printf("User %s authenticated but not found in database.", req.Email)
		http.Error(w, "User not found after authentication", http.StatusInternalServerError)
		return
	}

	// Generate JWT token using the fetched user details (especially ID)
	token, err := utils.GenerateJWT(*dbUser)
	if err != nil {
		http.Error(w, "Failed to generate token", http.StatusInternalServerError)
		return
	}

	// Emit login event using the EventPublisher interface
	if h.eventPublisher != nil { // Check if publisher is configured
		// TODO: Consider creating a specific PublishUserLoggedInEvent method/event type
		err = h.eventPublisher.PublishUserRegisteredEvent(r.Context(), dbUser.Email) // Using the interface method
		if err != nil {
			// Log the error but maybe don't fail the login just because event publishing failed?
			// Depends on requirements. For now, we'll log and continue.
			log.Printf("Failed to publish login event for user %s: %v", dbUser.Email, err)
			// Optionally return error if event publishing is critical
			// http.Error(w, "Failed to process login event", http.StatusInternalServerError)
			// return
		} // <<< Ensure this closing brace is present
	} else {
		log.Println("Warning: Event publisher not configured in handler, skipping event publication for login.")
	}

	// Prepare the response including token and user details
	responseUser := models.UserResponse{
		ID:       dbUser.ID,
		Username: dbUser.Username,
		Email:    dbUser.Email,
	}
	responsePayload := map[string]interface{}{
		"token": token,
		"user":  responseUser,
	}

	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusOK)
	if err := json.NewEncoder(w).Encode(responsePayload); err != nil {
		log.Printf("Error encoding login response for user %s: %v", dbUser.Email, err)
	}
	log.Printf("Successfully handled Login request for user ID: %d", dbUser.ID)
}
