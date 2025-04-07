package utils

import (
	"errors" // Ensure errors package is imported
	"log"
	"os"
	"time"

	"auth-service/internal/models"

	"strconv" // Import strconv to convert user ID

	"github.com/golang-jwt/jwt/v5"
)

func GenerateJWT(user models.User) (string, error) {
	// Use the correct environment variable name and handle missing secret properly
	secretKey := os.Getenv("JWT_SECRET")
	if secretKey == "" {
		log.Println("Error: JWT_SECRET environment variable not set.")
		// Return an error instead of using a default key
		return "", errors.New("JWT secret key is not configured")
	}

	// Use RegisteredClaims and include Subject (user ID)
	claims := &jwt.RegisteredClaims{
		Subject:   strconv.Itoa(user.ID), // Use user ID as Subject
		ExpiresAt: jwt.NewNumericDate(time.Now().Add(time.Hour * 72)), // Standard expiry claim
		IssuedAt:  jwt.NewNumericDate(time.Now()),
		NotBefore: jwt.NewNumericDate(time.Now()),
		// You can add custom claims here if needed, e.g.,
		// "username": user.Username,
	}

	token := jwt.NewWithClaims(jwt.SigningMethodHS256, claims)
	tokenString, err := token.SignedString([]byte(secretKey))
	if err != nil {
		log.Printf("Error signing JWT token: %v", err)
		return "", err
	}
	log.Println("Generated Token:", tokenString)
	return tokenString, nil
}
