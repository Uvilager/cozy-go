#!/bin/bash

echo "Starting required services for auth-service integration tests (test-db, rabbitmq)..."
docker-compose up -d test-db rabbitmq

# Wait briefly for services to initialize (adjust sleep time if needed)
echo "Waiting for services to initialize..."
sleep 5

# Check the status of the services
docker-compose ps

# Change to the auth-service directory
cd auth-service

# Run the integration tests using the 'integration' build tag
echo "Running auth-service integration tests..."
# Optional: Set environment variables if not using defaults in the test code
# export TEST_DB_URL="postgres://username:password@localhost:5433/testdb?sslmode=disable"
# export TEST_RABBITMQ_URL="amqp://guest:guest@localhost:5672/"
go test -v -tags=integration ./internal/tests/...

# Store the exit code of the tests
TEST_EXIT_CODE=$?

# Change back to the root directory
cd ..

# Stop the services, regardless of test outcome
echo "Stopping test services..."
docker-compose down

# Exit with the test exit code
exit $TEST_EXIT_CODE
