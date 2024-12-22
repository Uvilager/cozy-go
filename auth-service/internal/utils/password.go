package utils

import (
	"golang.org/x/crypto/bcrypt"
)

// HashPassword hashes a plain text password using bcrypt.
func HashPassword(password string) (string, error) {
	bytes, err := bcrypt.GenerateFromPassword([]byte(password), bcrypt.DefaultCost)
	return string(bytes), err
}
