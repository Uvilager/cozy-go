package tests

import (
	"bytes"
	"context"
	"encoding/json"

	// "fmt" // No longer needed
	// "log" // No longer needed
	"net/http"
	"net/http/httptest"
	"testing"

	_ "auth-service/internal/events" // Use blank identifier for events import
	"auth-service/internal/handlers"
	"auth-service/internal/models"
	_ "auth-service/repository" // Use blank identifier for repository import

	// "github.com/jackc/pgx/v5/pgxpool" // No longer needed
	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/mock" // Import testify mock
)

// --- Mock AuthRepository ---
type MockAuthRepository struct {
	mock.Mock
}

func (m *MockAuthRepository) Authenticate(user models.User) (bool, error) {
	args := m.Called(user)
	return args.Bool(0), args.Error(1)
}

func (m *MockAuthRepository) Register(user models.User) (int, error) {
	args := m.Called(user)
	return args.Int(0), args.Error(1)
}

func (m *MockAuthRepository) GetUserByID(ctx context.Context, id int) (*models.User, error) {
	args := m.Called(ctx, id)
	if args.Get(0) == nil {
		return nil, args.Error(1)
	}
	return args.Get(0).(*models.User), args.Error(1)
}

func (m *MockAuthRepository) GetUserByEmail(ctx context.Context, email string) (*models.User, error) {
	args := m.Called(ctx, email)
	// Handle potential nil return for user
	if args.Get(0) == nil {
		return nil, args.Error(1)
	}
	return args.Get(0).(*models.User), args.Error(1)
}

// --- Mock EventPublisher ---
type MockEventPublisher struct {
	mock.Mock
}

func (m *MockEventPublisher) PublishUserRegisteredEvent(ctx context.Context, userEmail string) error {
	args := m.Called(ctx, userEmail)
	return args.Error(0)
}

// --- Tests ---

func TestRegisterHandler_Success(t *testing.T) {
	// 1. Setup Mocks
	mockRepo := new(MockAuthRepository)
	mockPublisher := new(MockEventPublisher)

	// Input data for the request
	registerReq := models.RegisterRequest{
		Username: "testuser",
		Password: "password123",
		Email:    "test@example.com",
	}
	// Expected user data passed to repo (password will be hashed by handler)
	expectedUserArg := mock.MatchedBy(func(user models.User) bool {
		// Basic check: username and email match. Password hash verification is complex here.
		return user.Username == registerReq.Username && user.Email == registerReq.Email
	})
	expectedUserID := 1 // Example user ID returned by mock repo

	// Configure mock expectations
	mockRepo.On("Register", expectedUserArg).Return(expectedUserID, nil)
	mockPublisher.On("PublishUserRegisteredEvent", mock.AnythingOfType("*context.valueCtx"), registerReq.Email).Return(nil) // Use AnythingOfType for context

	// 2. Create Handler with Mocks
	handler := handlers.NewAuthHandler(mockRepo, mockPublisher)

	// 3. Prepare HTTP Request
	body, _ := json.Marshal(registerReq)
	req, _ := http.NewRequest("POST", "/register", bytes.NewBuffer(body))
	rr := httptest.NewRecorder()

	// 4. Execute Handler
	handler.Register(rr, req)

	// 5. Assert Results
	assert.Equal(t, http.StatusCreated, rr.Code, "Expected status code 201 Created")
	var response map[string]string
	err := json.NewDecoder(rr.Body).Decode(&response)
	assert.NoError(t, err, "Response body should be valid JSON")
	assert.Equal(t, "User registered successfully", response["message"])

	// 6. Verify Mock Expectations
	mockRepo.AssertExpectations(t)
	mockPublisher.AssertExpectations(t)
}

// TODO: Add TestRegisterHandler_UserExistsError
// TODO: Add TestRegisterHandler_HashingError (harder to trigger without more mocking)
// TODO: Add TestRegisterHandler_EventPublishError

func TestLoginHandler_Success(t *testing.T) {
	// 1. Setup Mock
	mockRepo := new(MockAuthRepository)
	mockPublisher := new(MockEventPublisher) // Create mock publisher

	// Input data
	loginReq := models.LoginRequest{
		Email:    "test@example.com",
		Password: "password123",
	}
	// Expected user data passed to Authenticate
	expectedAuthUserArg := models.User{
		Email:    loginReq.Email,
		Password: loginReq.Password,
	}
	// User data returned by GetUserByEmail mock
	mockDbUser := &models.User{
		ID:       1,
		Username: "testuser",
		Email:    loginReq.Email,
		Password: "hashedpassword", // The repo returns the hashed password
	}

	// Configure mock expectations
	mockRepo.On("Authenticate", expectedAuthUserArg).Return(true, nil)
	mockRepo.On("GetUserByEmail", mock.AnythingOfType("*context.valueCtx"), loginReq.Email).Return(mockDbUser, nil) // Use AnythingOfType for context
	// Expect event to be published on successful login
	mockPublisher.On("PublishUserRegisteredEvent", mock.AnythingOfType("*context.valueCtx"), loginReq.Email).Return(nil) // Use AnythingOfType for context

	// 2. Create Handler with Mock
	handler := handlers.NewAuthHandler(mockRepo, mockPublisher) // Pass mock publisher

	// 3. Prepare HTTP Request
	body, _ := json.Marshal(loginReq)
	req, _ := http.NewRequest("POST", "/login", bytes.NewBuffer(body))
	rr := httptest.NewRecorder()

	// 4. Execute Handler
	handler.Login(rr, req)

	// 5. Assert Results
	assert.Equal(t, http.StatusOK, rr.Code, "Expected status code 200 OK")
	var response map[string]interface{}
	err := json.NewDecoder(rr.Body).Decode(&response)
	assert.NoError(t, err, "Response body should be valid JSON")
	assert.NotEmpty(t, response["token"], "Response should contain a token")

	userData, ok := response["user"].(map[string]interface{})
	assert.True(t, ok, "Response should contain user data")
	if ok {
		assert.Equal(t, float64(mockDbUser.ID), userData["ID"], "User ID in response should match")
		assert.Equal(t, mockDbUser.Username, userData["Username"], "Username in response should match")
		assert.Equal(t, mockDbUser.Email, userData["Email"], "Email in response should match")
	}

	// 6. Verify Mock Expectations
	mockRepo.AssertExpectations(t)
	mockPublisher.AssertExpectations(t)
}

// TODO: Add TestLoginHandler_InvalidCredentials
// TODO: Add TestLoginHandler_UserNotFound
// TODO: Add TestLoginHandler_TokenGenerationError
// TODO: Add TestLoginHandler_EventPublishError
