#!/bin/sh
set -e

echo "Waiting for database to be ready..."
until nc -z "${DB_HOST:-postgres}" "${DB_PORT:-5432}"; do
  echo "Database is unavailable - sleeping"
  sleep 2
done

echo "Syncing database schema..."
npx prisma db push --skip-generate

echo "Seeding database..."
npx prisma db seed

exec "$@"
