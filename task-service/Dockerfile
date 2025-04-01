# Build stage
FROM golang:1.23.4-alpine AS builder
RUN apk add --no-cache git
WORKDIR /app
COPY go.mod go.sum ./
RUN go mod download
COPY . .
# Build the Go app
RUN go build -o main ./cmd/main.go

# Final stage
FROM alpine:latest
RUN apk --no-cache add ca-certificates
WORKDIR /root/
# Copy the Pre-built binary file from the previous stage
COPY --from=builder /app/main .
# Expose port (this should match the port the service listens on, e.g., 8081)
# The actual port mapping happens in docker-compose.yaml
EXPOSE 8081
# Command to run the executable
CMD ["./main"]
