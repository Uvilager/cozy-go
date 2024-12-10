package utils

import (
	"log"
	"os"
	"time"

	"auth-service/internal/models"

	"github.com/golang-jwt/jwt/v5"
)

func GenerateJWT(user models.User) (string, error) {
	secretKey := os.Getenv("JWT_SECRET_KEY")
	if secretKey == "" {
		secretKey = "default_secret_key" // Fallback to a default key for development
	}

	claims := jwt.MapClaims{
		"username": user.Username,
		"exp":      time.Now().Add(time.Hour * 72).Unix(),
	}
	token := jwt.NewWithClaims(jwt.SigningMethodHS256, claims)
	tokenString, err := token.SignedString([]byte(secretKey))
	if err != nil {
		return "", err
	}
	log.Println("Generated Token:", tokenString)
	return tokenString, nil
}
