#!/bin/sh

# Install netcat for port checking
apk add --no-cache netcat-openbsd curl

# Wait for database to be ready
echo "Waiting for database..."
while ! nc -z postgres 5432; do
  sleep 1
done
echo "Database is ready!"

# Wait for MinIO to be ready
echo "Waiting for MinIO..."
while ! nc -z minio 9000; do
  sleep 1
done
echo "MinIO is ready!"

# Create MinIO bucket if it doesn't exist
echo "Setting up MinIO bucket..."
sleep 5 # Give MinIO extra time to start
# Install MinIO client
wget -q https://dl.min.io/client/mc/release/linux-amd64/mc -O /tmp/mc
chmod +x /tmp/mc
# Configure MinIO client
/tmp/mc alias set myminio http://minio:9000 minioadmin minioadmin123
# Create bucket if it doesn't exist
/tmp/mc mb myminio/meetingbot-recordings --ignore-existing || echo "Bucket creation handled"

# Run database migrations
echo "Running database migrations..."
drizzle-kit migrate

# Start the server
echo "Starting server..."
exec node server.js