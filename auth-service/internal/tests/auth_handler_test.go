package tests

import (
	"bytes"
	"context"
	"encoding/json"
	"fmt"
	"log"
	"net/http"
	"net/http/httptest"
	"testing"

	"auth-service/internal/handlers"
	"auth-service/internal/models"
	"auth-service/repository"

	"github.com/jackc/pgx/v5/pgxpool"
	"github.com/stretchr/testify/assert"
)

func setupTestDB() *pgxpool.Pool {
	log.Println("Attempting to connect to Postgres...")
	connString := "postgres://username:password@localhost:5433/testdb?sslmode=disable"
	config, err := pgxpool.ParseConfig(connString)
	if err != nil {
		panic(fmt.Sprintf("Unable to parse connection string: %v\n", err))
	}

	dbpool, err := pgxpool.NewWithConfig(context.Background(), config)
	if err != nil {
		panic(fmt.Sprintf("Unable to create connection pool: %v\n", err))
	}

	return dbpool
}

func TestRegisterHandler(t *testing.T) {
	db := setupTestDB()
	repo := repository.NewAuthRepository(db)
	handler := handlers.NewAuthHandler(repo)

	user := models.User{
		Username: "newuser",
		Password: "newpassword",
		Email:    "newuser@example.com",
	}

	body, _ := json.Marshal(user)
	req, _ := http.NewRequest("POST", "/register", bytes.NewBuffer(body))
	rr := httptest.NewRecorder()

	handler.Register(rr, req)

	if rr.Code != http.StatusCreated {
		log.Printf("Error: %v", rr.Body.String())
	}

	assert.Equal(t, http.StatusCreated, rr.Code)
}

func TestLoginHandler(t *testing.T) {
	db := setupTestDB()
	repo := repository.NewAuthRepository(db)
	handler := handlers.NewAuthHandler(repo)

	user := models.User{
		Username: "newuser",
		Password: "newpassword",
		Email:    "newuser@example.com",
	}

	body, _ := json.Marshal(user)
	req, _ := http.NewRequest("POST", "/login", bytes.NewBuffer(body))
	rr := httptest.NewRecorder()

	handler.Login(rr, req)

	if rr.Code != http.StatusOK {
		log.Printf("Error: %v", rr.Body.String())
	}

	assert.Equal(t, http.StatusOK, rr.Code)
	var response map[string]string
	json.NewDecoder(rr.Body).Decode(&response)
	assert.NotEmpty(t, response["token"])
}
