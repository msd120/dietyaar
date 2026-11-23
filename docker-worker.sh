#!/bin/sh
set -eu

if [ "${WORKER_ENABLED:-false}" != "true" ]; then
  echo "WORKER_ENABLED=true is required to start the optional worker." >&2
  exit 1
fi

echo "==> Starting optional worker"
exec node .next/worker.cjs
