#!/bin/bash

# Start the test-db and pgadmin services
docker-compose up -d test-db pgadmin

# Wait for the test-db to be ready
echo "Waiting for test-db to be ready..."
sleep 10

# Check the status of the services
docker-compose ps

# Run migrations
echo "Running migrations..."
goose -dir auth-service/migrations postgres "postgres://username:password@localhost:5433/testdb?sslmode=disable" up

echo "pgAdmin is available at http://localhost:5050"
echo "Use the credentials specified in the docker-compose.yaml file to log in."

# Change to the auth-service directory to run the tests from go.mod root directory
cd auth-service

# Run the tests
echo "Running tests..."
go test ./internal/tests/

# Stop the test-db and pgadmin services
docker-compose down