package repository

import (
	"context"
	"errors"
	"log" // Ensure log is imported

	"auth-service/internal/models"

	"github.com/jackc/pgx"
	"github.com/jackc/pgx/v5/pgxpool"
	"golang.org/x/crypto/bcrypt"
)

type AuthRepository interface {
	Authenticate(user models.User) (bool, error)
	Register(user models.User) (int, error)
	GetUserByEmail(ctx context.Context, email string) (*models.User, error)
	GetUserByID(ctx context.Context, id int) (*models.User, error) // Added for /me endpoint
}

type authRepository struct {
	db *pgxpool.Pool
}

func NewAuthRepository(db *pgxpool.Pool) AuthRepository {
	return &authRepository{db: db}
}

func (r *authRepository) Authenticate(user models.User) (bool, error) {
	var storedPassword string
	err := r.db.QueryRow(context.Background(), "SELECT password FROM users WHERE email=$1", user.Email).Scan(&storedPassword)
	if (err != nil) {
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

// GetUserByEmail retrieves a user by their email address.
// Returns the full User struct (including password hash).
func (r *authRepository) GetUserByEmail(ctx context.Context, email string) (*models.User, error) {
	query := `SELECT id, username, email, password FROM users WHERE email = $1`
	user := &models.User{} // Pointer to hold the result

	err := r.db.QueryRow(ctx, query, email).Scan(
		&user.ID,
		&user.Username,
		&user.Email,
		&user.Password, // Scan the password hash as well
	)

	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			// User not found is not necessarily an application error in some contexts,
			// but here it likely means the email provided doesn't exist.
			return nil, nil // Return nil user and nil error to indicate not found
		}
		// For other errors (DB connection issues, etc.), return the error
		return nil, err
	}

	// User found, return the user struct
	return user, nil
}

// GetUserByID retrieves a user by their ID.
// Excludes the password hash for security.
func (r *authRepository) GetUserByID(ctx context.Context, id int) (*models.User, error) {
	query := `SELECT id, username, email FROM users WHERE id = $1`
	user := &models.User{}

	err := r.db.QueryRow(ctx, query, id).Scan(
		&user.ID,
		&user.Username,
		&user.Email,
		// Do NOT scan password here
	)

	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return nil, nil // Return nil user and nil error to indicate not found
		}
		log.Printf("Error fetching user by ID %d: %v", id, err)
		return nil, err
	}

	return user, nil
}
