#!/bin/sh
set -e

echo "🔄 Starting eParking Backend..."

# Wait for database to be ready (Postgres)
echo "⏳ Waiting for database..."
while ! nc -z postgres 5432; do
  sleep 1
done
echo "✅ Database is ready!"

# Check if we want to use Prisma
if [ "$USE_PRISMA" = "true" ]; then
  echo "🗄️ Setting up Prisma database schema..."
  npx prisma db push --skip-generate
  
  echo "🌱 Seeding database with initial data..."
  npx prisma db seed || echo "⚠️ Seed failed - continuing anyway"
  
  echo "🚀 Starting eParking Backend with Prisma ORM..."
  exec node server-prisma.js
else
  echo "🚀 Starting eParking Backend with Legacy SQL..."
  exec "$@"
fi
