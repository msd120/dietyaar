#!/bin/sh
set -e

echo "==> Starting application on :${PORT:-3000}"
exec node server.js
