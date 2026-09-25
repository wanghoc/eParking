#!/bin/sh
set -e

echo "Waiting for database to be ready..."
until nc -z "${DB_HOST:-postgres}" "${DB_PORT:-5432}"; do
  echo "Database is unavailable - sleeping"
  sleep 2
done

echo "Syncing database schema..."
# Prefer versioned migrations. A DB created earlier via `db push` has no migration
# history (P3005), so fall back to `db push`; --accept-data-loss is required because
# the edge/cloud re-architecture intentionally drops the obsolete "cameras" table.
if ! npx prisma migrate deploy; then
  echo "migrate deploy failed - falling back to prisma db push"
  npx prisma db push --skip-generate --accept-data-loss
fi

echo "Seeding database..."
npx prisma db seed

exec "$@"
