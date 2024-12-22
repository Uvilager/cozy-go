package repository

import (
	"context"
	"errors"

	"auth-service/internal/models"

	"github.com/jackc/pgx"
	"github.com/jackc/pgx/v5/pgxpool"
	"golang.org/x/crypto/bcrypt"
)

type AuthRepository interface {
	Authenticate(user models.User) (bool, error)
	Register(user models.User) (int, error)
}

type authRepository struct {
	db *pgxpool.Pool
}

func NewAuthRepository(db *pgxpool.Pool) AuthRepository {
	return &authRepository{db: db}
}

func (r *authRepository) Authenticate(user models.User) (bool, error) {
	var storedPassword string
	err := r.db.QueryRow(context.Background(), "SELECT password FROM users WHERE username=$1", user.Username).Scan(&storedPassword)
	if err != nil {
		if err == pgx.ErrNoRows {
			return false, errors.New("user not found")
		}
		return false, err
	}

	// Compare the hashed password
	err = bcrypt.CompareHashAndPassword([]byte(storedPassword), []byte(user.Password))
	if err != nil {
		return false, errors.New("invalid password")
	}

	return true, nil
}

func (r *authRepository) Register(user models.User) (int, error) {
	query := `INSERT INTO users (username, password, email) VALUES ($1, $2, $3) RETURNING id`
	var userID int
	err := r.db.QueryRow(context.Background(), query, user.Username, user.Password, user.Email).Scan(&userID)
	if err != nil {
		return 0, err
	}
	return userID, nil
}
