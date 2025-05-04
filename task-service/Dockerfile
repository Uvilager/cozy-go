# Build stage
FROM golang:1.23.4-alpine AS builder
RUN apk add --no-cache git
WORKDIR /app

# Copy module files first to leverage Docker cache
COPY go.mod go.sum ./
RUN go mod download

# Copy the rest of the application source code
COPY . .

# Build the Go app within the task-service directory context
RUN go build -o main ./cmd/main.go

# Final stage
FROM alpine:latest
RUN apk --no-cache add ca-certificates
WORKDIR /root/

# Copy the Pre-built binary file from the previous stage
COPY --from=builder /app/main .

# Expose port for task-service (default is 8083)
EXPOSE 8083

# Command to run the executable
CMD ["./main"]
