# Concert Assignment

A full-stack concert booking application built with NestJS (backend) and Next.js (frontend), featuring real-time seat reservations with Redis-based distributed locking.

## Architecture

- **Backend**: NestJS API with TypeScript, Prisma ORM
- **Frontend**: Next.js 15 with TypeScript, Tailwind CSS, shadcn/ui components
- **Database**: PostgreSQL with Prisma migrations
- **Distributed Locking**: Redis for distributed locking
- **Reverse Proxy**: Nginx for load balancing and routing
- **Containerization**: Docker & Docker Compose

## Prerequisites

- Docker & Docker Compose
- Node.js 18+ or Bun.js (still needs Node.js runtime) for local development
- Make (optional, for using Makefile commands)

## Development Setup

### Quick Start

1. **Clone and start the development environment:**

   ```bash
   # Start all services (PostgreSQL, Redis, API, Frontend)
   make dev

   # Or manually with docker-compose
   docker-compose -f docker-compose.dev.yaml up -d
   ```

2. **Access the application:**
   - Frontend: http://localhost:3000
   - API: http://localhost:3001
   - PostgreSQL: localhost:5432
   - Redis: localhost:6379

### Development Commands

```bash
# Start all services
make up

# Stop all services
make down

# View logs from all services
make logs

# Rebuild services
make rebuild

# Clean restart (remove volumes and rebuild)
make fresh

# Connect to PostgreSQL
make db-connect

# Connect to Redis CLI
make redis-cli

# Show service status
make status

# Show all available commands
make help
```

## Environment Configuration

### Development

The development environment uses default values defined in `docker-compose.dev.yaml`.

### Production Serve (No SSL)

For production deployment without SSL:

1. **Setup environment (optional):**
   You can pass each env to the shell command before running the next step

2. **Serve using Make:**

   ```bash
   make prod-no-ssl-up
   ```

3. **Access the application:**
   - Application: http://localhost:8080

### Production Features

- **Load Balancing**: Nginx distributes traffic across multiple API/App instances
- **Health Checks**: All services include health monitoring
- **Resource Limits**: CPU and memory limits configured for each service
- **Auto-restart**: Services automatically restart on failure
- **Backup Support**: Database backup commands included

## Project Structure

```
concert-assignment/
├── api/                    # NestJS Backend
│   ├── src/
│   │   ├── auth/          # Authentication module
│   │   ├── concerts/      # Concert management
│   │   ├── prisma/        # Database service
│   │   └── redis-lock/    # Distributed locking
│   └── prisma/            # Database schema & migrations
├── app/                   # Next.js Frontend
│   ├── app/               # App router pages
│   ├── components/        # Reusable components
│   └── lib/               # Utilities and configurations
├── nginx/                 # Nginx configuration
├── docker-compose.dev.yaml      # Development environment
├── docker-compose.prod-no-ssl.yaml  # Production environment
└── Makefile              # Development commands
```

## Database Management

### Seeding

```bash
# Seed database with sample data
cd api
npx prisma db seed
```

## Testing

### Backend Tests

```bash
cd api
npm run test          # Unit tests
npm run test:e2e      # End-to-end tests
```

## Security Considerations

- Change default passwords in production
- Use strong JWT secrets
- Configure CORS properly
- Enable rate limiting
- Consider adding SSL/TLS for production
- Regular security updates for dependencies
- No public API exposed
