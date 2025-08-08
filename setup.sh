#!/bin/bash

# MeetingBot Docker Compose Setup Script
echo "Setting up MeetingBot for Docker Compose deployment..."

# Check if Docker and Docker Compose are installed
if ! command -v docker &> /dev/null; then
    echo "Error: Docker is not installed. Please install Docker first."
    exit 1
fi

if ! command -v docker-compose &> /dev/null && ! docker compose version &> /dev/null; then
    echo "Error: Docker Compose is not installed. Please install Docker Compose first."
    exit 1
fi

# Create .env file if it doesn't exist
if [ ! -f .env ]; then
    echo "Creating .env file from .env.example..."
    cp .env.example .env
    echo ""
    echo "⚠️  Please edit the .env file with your GitHub OAuth credentials:"
    echo "   - AUTH_GITHUB_ID: Your GitHub App ID"
    echo "   - AUTH_GITHUB_SECRET: Your GitHub App Secret"
    echo "   - GITHUB_TOKEN: Your GitHub Personal Access Token"
    echo ""
    echo "Optional environment variables:"
    echo "   - OPENAI_API_KEY: For transcription features in the example app"
    echo ""
    read -p "Press Enter to continue after editing .env file..."
fi

# Build bot Docker images
echo "Building bot Docker images..."
chmod +x build-bots.sh
./build-bots.sh

# Create necessary directories
echo "Creating necessary directories..."
mkdir -p recordings

echo ""
echo "✅ Setup complete!"
echo ""
echo "To start MeetingBot:"
echo "  docker-compose up -d"
echo ""
echo "To stop MeetingBot:"
echo "  docker-compose down"
echo ""
echo "To view logs:"
echo "  docker-compose logs -f"
echo ""
echo "Services will be available at:"
echo "  - MeetingBot Server: http://localhost:3000"
echo "  - MinIO Console: http://localhost:9001 (minioadmin/minioadmin123)"