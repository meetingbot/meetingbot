# MeetingBot Docker Compose Setup

This guide explains how to run MeetingBot locally using Docker Compose instead of AWS infrastructure. This is perfect for development, testing, or self-hosting on your own hardware.

## Overview

The Docker Compose setup includes:
- **PostgreSQL**: Database for storing bot configurations and logs
- **MinIO**: S3-compatible storage for meeting recordings
- **MeetingBot Server**: Next.js application with tRPC API
- **Bot Containers**: Dynamically created containers for each meeting

## Prerequisites

- [Docker](https://docs.docker.com/get-docker/) (20.10 or later)
- [Docker Compose](https://docs.docker.com/compose/install/) (2.0 or later)
- At least 4GB RAM available for Docker
- GitHub App for authentication (see setup below)

## Quick Start

1. **Clone the repository**
   ```bash
   git clone https://github.com/meetingbot/meetingbot.git
   cd meetingbot
   ```

2. **Run the setup script**
   ```bash
   ./setup.sh
   ```
   This will:
   - Create a `.env` file from the template
   - Build the required bot Docker images
   - Set up necessary directories

3. **Configure GitHub OAuth**
   
   Edit the `.env` file and add your GitHub App credentials:
   ```env
   AUTH_GITHUB_ID=your_github_app_id
   AUTH_GITHUB_SECRET=your_github_app_secret
   GITHUB_TOKEN=your_github_token
   ```

   To create a GitHub App:
   - Go to GitHub Settings > Developer settings > GitHub Apps
   - Create a new GitHub App
   - Set Authorization callback URL to: `http://localhost:3000/api/auth/callback/github`
   - Generate a client secret and note the App ID

4. **Start the services**
   ```bash
   make start
   # or
   docker-compose up -d
   ```

5. **Access the applications**
   - MeetingBot Server: http://localhost:3000
   - MinIO Console: http://localhost:9001 (minioadmin/minioadmin123)

## Using the Makefile

The included Makefile provides convenient commands:

```bash
make setup          # Initial setup
make start           # Start all services
make stop            # Stop all services
make restart         # Restart all services
make logs            # View all logs
make logs-server     # View server logs only
make build-bots      # Rebuild bot images
make clean           # Clean up containers and volumes
make db-migrate      # Run database migrations
```

## How It Works

### Bot Deployment

When you create a bot through the web interface, the server:

1. **Development Mode**: Spawns bot processes directly using `pnpm start`
2. **Docker Compose Mode**: Creates a new Docker container for the bot using the appropriate image:
   - `meetingbot-meet:latest` for Google Meet
   - `meetingbot-teams:latest` for Microsoft Teams
   - `meetingbot-zoom:latest` for Zoom

The bot containers are automatically removed when the meeting ends.

### Storage

Instead of AWS S3, the setup uses MinIO (S3-compatible) running locally:
- Recordings are stored in the `meetingbot-recordings` bucket
- Data persists in the `minio_data` Docker volume
- Access via web console at http://localhost:9001

### Database

PostgreSQL runs in a container with data persisted in the `postgres_data` volume.

## Configuration

### Environment Variables

The `.env` file supports these variables:

**Required:**
- `AUTH_GITHUB_ID` - GitHub App ID
- `AUTH_GITHUB_SECRET` - GitHub App Secret
- `GITHUB_TOKEN` - GitHub Personal Access Token

**Optional:**
- `DEBUG_MODE` - Set to 'true' for additional logging

### Platform-Specific Meeting Info

Each platform requires different meeting information:

**Zoom:**
```json
{
  "platform": "zoom",
  "meetingId": "123456789",
  "meetingPassword": "password123"
}
```

**Google Meet:**
```json
{
  "platform": "google",
  "meetingUrl": "https://meet.google.com/xxx-xxxx-xxx"
}
```

**Microsoft Teams:**
```json
{
  "platform": "teams",
  "meetingId": "meeting_id",
  "organizerId": "organizer_id",
  "tenantId": "tenant_id"
}
```

## Troubleshooting

### Logs and Debugging

View logs for different components:
```bash
# All services
make logs

# Server only
make logs-server

# Specific service
docker-compose logs [service-name]

# Bot containers (if running)
docker ps --filter "name=meetingbot-bot-"
docker logs [container-name]
```

### Resetting the Environment

To completely reset:
```bash
make clean  # Removes containers, images, and volumes
./setup.sh  # Re-run setup
```

## Development Mode

For development with live reloading:
```bash
make dev
```

This uses `docker-compose.dev.yml` overlay for development-specific configurations.

## Scaling and Production

This Docker Compose setup is designed for development and small-scale deployments. For production:

1. **Use external PostgreSQL and MinIO/S3** instead of containers
2. **Set up proper backup strategies** for data volumes
3. **Configure reverse proxy** (nginx/traefik) for HTTPS
4. **Use Docker Swarm or Kubernetes** for multi-node deployment
5. **Set resource limits** in docker-compose.yml

For production AWS deployment, use the original Terraform-based approach documented in the main README.

## Switching Between Deployment Methods

You can switch between Docker Compose and AWS deployments by changing the `DEPLOYMENT_MODE` environment variable in the server:

- `docker-compose`: Uses local Docker containers for bots
- `aws`: Uses AWS ECS for bot deployment (default)

The server will automatically detect the deployment mode and use the appropriate bot deployment strategy.