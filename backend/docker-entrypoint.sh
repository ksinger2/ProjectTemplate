#!/bin/sh
set -e
echo "[entrypoint] Running database migration..."
node /app/backend/dist/db/migrate.js
echo "[entrypoint] Starting backend..."
exec "$@"
