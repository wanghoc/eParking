#!/bin/sh
set -e

echo "🔄 Starting eParking Backend..."

# Wait for PostgreSQL database to be ready with better timeout
echo "⏳ Waiting for PostgreSQL database at ${DB_HOST:-database}:${DB_PORT:-5432}..."
timeout=60
DB_WAIT_HOST="${DB_HOST:-database}"
DB_WAIT_PORT="${DB_PORT:-5432}"

# Wait for PostgreSQL port to be available
while ! nc -z "$DB_WAIT_HOST" "$DB_WAIT_PORT"; do
  timeout=$((timeout - 1))
  if [ $timeout -le 0 ]; then
    echo "❌ Database connection timeout after 60 seconds"
    exit 1
  fi
  echo "⏳ Waiting for PostgreSQL... (${timeout}s remaining)"
  sleep 2
done

# Additional wait to ensure PostgreSQL is fully ready to accept connections
echo "🔄 PostgreSQL port is open, waiting for service to be ready..."
sleep 5
echo "✅ PostgreSQL Database is ready!"

# Check if we want to use Prisma
if [ "$USE_PRISMA" = "true" ]; then
  echo "🔄 Generating Prisma client..."
  npx prisma generate
  
  echo "🗄️ Setting up Prisma database schema..."
  # Use db push for development, migrate for production
  npx prisma db push --skip-generate --accept-data-loss
  
  echo "🌱 Seeding database with initial data..."
  npx prisma db seed || echo "⚠️ Seed failed or already exists - continuing anyway"
  
  echo "🚀 Starting eParking Backend with Prisma ORM..."
  exec node server-prisma.js
else
  echo "🗄️ Setting up legacy PostgreSQL schema..."
  # Wait a bit more for PostgreSQL to be fully ready
  sleep 5
  
  # Import schema if not using Prisma (fallback)
  if [ -f "schema-postgres.sql" ]; then
    echo "📥 Importing PostgreSQL schema..."
    PGPASSWORD=${DB_PASSWORD} psql -h "$DB_WAIT_HOST" -U ${DB_USER} -d ${DB_DATABASE_NAME} -f schema-postgres.sql || echo "⚠️ Schema import failed - continuing anyway"
  fi
  
  echo "🚀 Starting eParking Backend with Legacy SQL..."
  exec "$@"
fi
