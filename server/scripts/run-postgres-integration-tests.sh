#!/usr/bin/env bash

set -Eeuo pipefail

SERVER_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
COMPOSE_FILE="$SERVER_ROOT/compose.integration.yaml"
RUN_ID="$(node -e "process.stdout.write(require('node:crypto').randomBytes(16).toString('hex'))")"

export COMPOSE_PROJECT_NAME="budget-integration-${RUN_ID:0:12}"
export POSTGRES_TEST_DATABASE_NAME="budget_integration_${RUN_ID}_test"
export POSTGRES_TEST_DATABASE_USER="budget_test"
export POSTGRES_TEST_DATABASE_PASSWORD="$(node -e "process.stdout.write(require('node:crypto').randomBytes(24).toString('hex'))")"

COMPOSE_STARTED=false

cleanup() {
  local exit_code=$?
  trap - EXIT INT TERM
  if [ "$COMPOSE_STARTED" = true ]; then
    if ! docker compose --file "$COMPOSE_FILE" down --volumes --remove-orphans; then
      echo "Failed to remove the PostgreSQL integration environment" >&2
      if [ "$exit_code" -eq 0 ]; then exit_code=1; fi
    fi
  fi
  exit "$exit_code"
}

trap cleanup EXIT INT TERM

if ! command -v docker >/dev/null 2>&1; then
  echo "Docker is required for PostgreSQL integration tests" >&2
  exit 1
fi

if ! docker info >/dev/null 2>&1; then
  echo "Docker is installed but its daemon is unavailable" >&2
  exit 1
fi

cd "$SERVER_ROOT"
COMPOSE_STARTED=true
docker compose --file "$COMPOSE_FILE" up --detach --wait

DATABASE_ENDPOINT="$(docker compose --file "$COMPOSE_FILE" port postgres 5432)"
export POSTGRES_TEST_DATABASE_PORT="${DATABASE_ENDPOINT##*:}"
if ! [[ "$POSTGRES_TEST_DATABASE_PORT" =~ ^[0-9]+$ ]]; then
  echo "Could not resolve the ephemeral PostgreSQL port" >&2
  exit 1
fi

DB_HOST=127.0.0.1 \
DB_PORT="$POSTGRES_TEST_DATABASE_PORT" \
DB_NAME="$POSTGRES_TEST_DATABASE_NAME" \
DB_USER="$POSTGRES_TEST_DATABASE_USER" \
DB_PASSWORD="$POSTGRES_TEST_DATABASE_PASSWORD" \
DB_SSL=false \
npm run db:migrate

export JWT_SECRET="${JWT_SECRET:-ci-test-secret-with-at-least-32-characters}"
export JWT_REFRESH_SECRET="${JWT_REFRESH_SECRET:-ci-refresh-secret-with-at-least-32-characters}"
export VAULT_INFRASTRUCTURE_KEY_BASE64="${VAULT_INFRASTRUCTURE_KEY_BASE64:-KioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKio=}"

npx jest \
  --runInBand \
  --globalSetup='<rootDir>/../test/postgres-integration-global-setup.ts' \
  --testRegex='.*\.integration\.spec\.ts$'
