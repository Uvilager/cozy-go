# Cozy-Go

Cozy-Go is a personal organization suite designed with a microservices architecture. It aims to provide features like calendar management, task tracking, event scheduling, and notifications.

## Architecture

The project follows a microservices pattern, primarily using Go for backend services and Next.js for the frontend. Key components include:

- **Backend Services (Go):**
  - `auth-service`: Handles user authentication and JWT generation.
  - `calendar-service`: Manages calendars.
  - `event-service`: Manages events associated with calendars.
  - `task-service`: Manages tasks.
  - `notification-service`: Handles asynchronous notifications (e.g., via RabbitMQ).
- **Frontend Service (Next.js):**
  - `frontend`: Provides the user interface. _(Note: Currently commented out in `docker-compose.yaml`)_
- **Databases:** Each primary backend service utilizes its own PostgreSQL database instance for data isolation.
- **Messaging:** RabbitMQ is used for inter-service communication and asynchronous tasks.
- **Supporting Tools:** Includes pgAdmin for database management and MailHog for email testing during development.

## Getting Started / Running Locally

### Prerequisites

- Docker
- Docker Compose

### Running the Application

1.  **Clone the repository:**
    ```bash
    git clone <your-repo-url>
    cd cozy-go
    ```
2.  **(Optional) Environment Variables:** Review `.env.example`. If specific configurations like external service keys are needed (though most are set in `docker-compose.yaml`), create a `.env` file based on the example. Ensure the `JWT_SECRET` is consistent across services that require it.
3.  **Start Services:**
    ```bash
    docker-compose up -d
    ```
    This command will build the images (if not already built) and start all the services defined in `docker-compose.yaml` in detached mode.

### Access Points

Once the services are running, you can access them at:

- **Auth Service:** `http://localhost:8080`
- **Calendar Service:** `http://localhost:8082`
- **Event Service:** `http://localhost:8083`
- **Task Service:** `http://localhost:8084`
- **Frontend:** `http://localhost:3000` (If uncommented and running)
- **pgAdmin:** `http://localhost:5050` (Login: `admin@admin.com` / `admin`)
- **RabbitMQ Management:** `http://localhost:15672` (Login: `guest` / `guest`)
- **MailHog Web UI:** `http://localhost:8025`

## Services

Here's a summary of the services and their default host ports as configured in `docker-compose.yaml`:

| Service                | Host Port | Container Port | Notes                                      |
| ---------------------- | --------- | -------------- | ------------------------------------------ |
| `auth-service`         | 8080      | 8080           | Authentication                             |
| `calendar-service`     | 8082      | 8082           | Calendar management                        |
| `event-service`        | 8083      | 8083           | Event management                           |
| `task-service`         | 8084      | 8083           | Task management                            |
| `frontend`             | 3000      | 3000           | Next.js UI (Currently commented out)       |
| `db` (Auth DB)         | 5432      | 5432           | PostgreSQL for auth-service                |
| `calendardb`           | 5435      | 5432           | PostgreSQL for calendar-service            |
| `eventdb`              | 5436      | 5432           | PostgreSQL for event-service               |
| `taskdb`               | 5434      | 5432           | PostgreSQL for task-service                |
| `pgadmin`              | 5050      | 80             | Database admin UI                          |
| `rabbitmq`             | 5672      | 5672           | AMQP port                                  |
| `rabbitmq` (Mgmt)      | 15672     | 15672          | Management UI port                         |
| `mailhog` (SMTP)       | 1025      | 1025           | SMTP server port                           |
| `mailhog` (Web UI)     | 8025      | 8025           | Web interface port                         |
| `notification-service` | N/A       | N/A            | Internal service, consumes RabbitMQ events |

## Documentation

More detailed documentation for specific services or features can be found in the `/docs` directory.

- [Frontend Calendar Docs](./docs/frontend/calendar/calendar.md)
- _(Add links to other service docs as they are created)_

## Contributing

_(Placeholder for contribution guidelines)_

## License

_(Placeholder for license information)_
