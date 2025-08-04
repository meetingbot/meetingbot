#!/bin/bash

# MeetingBot Health Check Script
echo "🔍 MeetingBot Health Check"
echo "=========================="

# Check if Docker is running
if ! docker info >/dev/null 2>&1; then
    echo "❌ Docker is not running"
    exit 1
fi
echo "✅ Docker is running"

# Check if containers are running
CONTAINERS=("meetingbot_postgres" "meetingbot_minio" "meetingbot_server")
for container in "${CONTAINERS[@]}"; do
    if docker ps --format "table {{.Names}}" | grep -q "$container"; then
        echo "✅ $container is running"
    else
        echo "❌ $container is not running"
        echo "   Run 'make start' to start services"
        exit 1
    fi
done

# Check if services are responding
echo ""
echo "🌐 Checking service endpoints..."

# Check server
if curl -s http://localhost:3000 >/dev/null 2>&1; then
    echo "✅ MeetingBot Server (http://localhost:3000) is responding"
else
    echo "❌ MeetingBot Server (http://localhost:3000) is not responding"
fi

# Check MinIO
if curl -s http://localhost:9000/minio/health/live >/dev/null 2>&1; then
    echo "✅ MinIO (http://localhost:9000) is responding"
else
    echo "❌ MinIO (http://localhost:9000) is not responding"
fi

# Check PostgreSQL
if docker exec meetingbot_postgres pg_isready -U postgres >/dev/null 2>&1; then
    echo "✅ PostgreSQL is accepting connections"
else
    echo "❌ PostgreSQL is not accepting connections"
fi

# Check bot images
echo ""
echo "🤖 Checking bot images..."
BOT_IMAGES=("meetingbot-meet:latest" "meetingbot-teams:latest" "meetingbot-zoom:latest")
for image in "${BOT_IMAGES[@]}"; do
    if docker images --format "table {{.Repository}}:{{.Tag}}" | grep -q "$image"; then
        echo "✅ $image is available"
    else
        echo "❌ $image is missing"
        echo "   Run 'make build-bots' to build bot images"
    fi
done

echo ""
echo "🎉 Health check complete!"
echo ""
echo "If all checks passed, MeetingBot should be working correctly."
echo "Access the MeetingBot API/Dashboard at: http://localhost:3000"