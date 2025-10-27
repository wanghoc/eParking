#!/bin/sh

# Wait for database to be ready
echo "Waiting for database to be ready..."
until nc -z postgres 5432; do
  echo "Database is unavailable - sleeping"
  sleep 2
done

echo "Database is ready - continuing"

# Generate Prisma client
echo "Generating Prisma client..."
npx prisma generate

# Run database migrations
echo "Running database migrations..."
npx prisma db push

# Seed database with demo data
echo "Seeding database with demo data..."
npx prisma db seed

# Start the application
echo "Starting application..."
exec "$@"
