#!/bin/sh
set -eu

if [ -z "${DATABASE_URL:-}" ]; then
  echo "DATABASE_URL is required for migrations." >&2
  exit 1
fi

# Prisma requires DIRECT_URL because the schema declares it. A deployment may
# provide a dedicated migration connection; local rehearsal safely falls back
# to the already explicit DATABASE_URL.
export DIRECT_URL="${DIRECT_URL:-$DATABASE_URL}"

echo "==> Applying database migrations as a one-off command..."
node /opt/prisma-cli/node_modules/prisma/build/index.js migrate deploy --schema=./prisma/schema.prisma
echo "==> Migrations applied."
