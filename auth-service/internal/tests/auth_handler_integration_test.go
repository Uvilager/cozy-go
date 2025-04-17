//go:build integration

package tests

import (
	"bytes"
	"context" // Using database/sql for direct interaction might be needed
	"encoding/json"
	"log"
	"net/http"
	"net/http/httptest"
	"os"
	"testing"
	"time"

	"auth-service/internal/events"
	"auth-service/internal/handlers"
	"auth-service/internal/models"
	"auth-service/repository"

	"github.com/jackc/pgx/v5/pgxpool"
	_ "github.com/jackc/pgx/v5/stdlib" // Import pgx stdlib driver for database/sql
	amqp "github.com/rabbitmq/amqp091-go"
	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require" // Use require for setup failures
)

var (
	testDbPool *pgxpool.Pool
	testRabbitConn *amqp.Connection
	testAuthHandler *handlers.AuthHandler
)

// setupIntegrationTest initializes connections for integration tests.
// It reads connection details from environment variables.
func setupIntegrationTest(t *testing.T) func() {
	// --- Database Setup ---
	// Use different env vars for test DB to avoid conflict
	testDbURL := os.Getenv("TEST_DB_URL")
	if testDbURL == "" {
		testDbURL = "postgres://username:password@localhost:5433/testdb?sslmode=disable"
		log.Printf("TEST_DB_URL not set, using default: %s", testDbURL)
	}

	var err error
	maxRetries := 5
	retryDelay := 2 * time.Second

	for i := 0; i < maxRetries; i++ {
		log.Printf("Attempting to connect to Test DB (attempt %d/%d)...", i+1, maxRetries)
		testDbPool, err = pgxpool.New(context.Background(), testDbURL)
		if err == nil {
			err = testDbPool.Ping(context.Background())
			if err == nil {
				log.Println("Test DB connection successful.")
				break
			}
			testDbPool.Close() // Close if ping failed
		}
		log.Printf("Failed to connect/ping Test DB: %v", err)
		if i < maxRetries-1 {
			time.Sleep(retryDelay)
		}
	}
	require.NoError(t, err, "Failed to connect to test database after retries")

	// --- RabbitMQ Setup ---
	testRabbitURL := os.Getenv("TEST_RABBITMQ_URL")
	if testRabbitURL == "" {
		testRabbitURL = "amqp://guest:guest@localhost:5672/"
		log.Printf("TEST_RABBITMQ_URL not set, using default: %s", testRabbitURL)
	}

	for i := 0; i < maxRetries; i++ {
		log.Printf("Attempting to connect to Test RabbitMQ (attempt %d/%d)...", i+1, maxRetries)
		testRabbitConn, err = amqp.Dial(testRabbitURL)
		if err == nil {
			log.Println("Test RabbitMQ connection successful.")
			break
		}
		log.Printf("Failed to connect to Test RabbitMQ: %v", err)
		if i < maxRetries-1 {
			time.Sleep(retryDelay)
		}
	}
	require.NoError(t, err, "Failed to connect to test RabbitMQ after retries")

	// --- Initialize Dependencies ---
	authRepo := repository.NewAuthRepository(testDbPool)
	// Use the RabbitMQ publisher for local integration tests
	eventPublisher := events.NewRabbitMqPublisher(testRabbitConn)
	require.NotNil(t, eventPublisher, "Event publisher should not be nil")

	testAuthHandler = handlers.NewAuthHandler(authRepo, eventPublisher)

	// --- Teardown Function ---
	// Return a function to close connections after tests
	return func() {
		log.Println("Tearing down integration test connections...")
		if testDbPool != nil {
			testDbPool.Close()
		}
		if testRabbitConn != nil && !testRabbitConn.IsClosed() {
			testRabbitConn.Close()
		}
	}
}

// Helper to clear users table (use with caution)
func clearUsersTable(t *testing.T) {
	_, err := testDbPool.Exec(context.Background(), "DELETE FROM users")
	require.NoError(t, err, "Failed to clear users table")
	// Reset sequence if needed (optional, depends on ID generation)
	// _, err = testDbPool.Exec(context.Background(), "ALTER SEQUENCE users_id_seq RESTART WITH 1")
	// require.NoError(t, err, "Failed to reset users_id_seq")
}

// --- Integration Tests ---

func TestRegisterHandler_Integration(t *testing.T) {
	teardown := setupIntegrationTest(t)
	defer teardown()
	clearUsersTable(t) // Clear before test

	registerReq := models.RegisterRequest{
		Username: "integ_user",
		Password: "integ_password",
		Email:    "integ@example.com",
	}

	body, _ := json.Marshal(registerReq)
	req, _ := http.NewRequest("POST", "/register", bytes.NewBuffer(body))
	rr := httptest.NewRecorder()

	testAuthHandler.Register(rr, req)

	assert.Equal(t, http.StatusCreated, rr.Code)

	// Verify user exists in DB
	var count int
	err := testDbPool.QueryRow(context.Background(), "SELECT COUNT(*) FROM users WHERE email=$1", registerReq.Email).Scan(&count)
	require.NoError(t, err, "Failed to query DB for registered user")
	assert.Equal(t, 1, count, "User should exist in database after registration")

	// Optional: Verify event was published (requires consuming from RabbitMQ)
	// This adds complexity, often skipped in basic integration tests
}

func TestLoginHandler_Integration(t *testing.T) {
	teardown := setupIntegrationTest(t)
	defer teardown()
	clearUsersTable(t) // Clear before test

	// Setup: Create a user directly in the DB
	testEmail := "login_integ@example.com"
	testPassword := "login_password"
	// IMPORTANT: Hash the password before inserting, using the same logic as the handler
	// hashedPassword, err := utils.HashPassword(testPassword) // Assuming utils.HashPassword exists
	// require.NoError(t, err)
	// _, err = testDbPool.Exec(context.Background(),
	// 	"INSERT INTO users (username, email, password) VALUES ($1, $2, $3)",
	// 	"login_user", testEmail, hashedPassword)
	// require.NoError(t, err, "Failed to insert test user for login")
	// NOTE: Hashing requires importing utils, which might cause import cycles if utils imports repository/models.
	// For simplicity here, we'll skip direct insertion and rely on Register first, then Login.
	// This makes the test less isolated but simpler to implement initially.

	// Step 1: Register the user first
	registerReq := models.RegisterRequest{
		Username: "login_user",
		Password: testPassword,
		Email:    testEmail,
	}
	regBody, _ := json.Marshal(registerReq)
	regReq, _ := http.NewRequest("POST", "/register", bytes.NewBuffer(regBody))
	regRR := httptest.NewRecorder()
	testAuthHandler.Register(regRR, regReq)
	require.Equal(t, http.StatusCreated, regRR.Code, "Registration failed, cannot proceed with login test")

	// Step 2: Attempt Login
	loginReq := models.LoginRequest{
		Email:    testEmail,
		Password: testPassword, // Use the plain password for login request
	}
	body, _ := json.Marshal(loginReq)
	req, _ := http.NewRequest("POST", "/login", bytes.NewBuffer(body))
	rr := httptest.NewRecorder()

	testAuthHandler.Login(rr, req)

	assert.Equal(t, http.StatusOK, rr.Code)
	var response map[string]interface{}
	err := json.NewDecoder(rr.Body).Decode(&response)
	assert.NoError(t, err)
	assert.NotEmpty(t, response["token"])

	// Optional: Verify login event published
}

// Add more integration tests for error cases (e.g., duplicate registration, invalid login)
