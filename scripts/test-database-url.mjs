const LOOPBACK_HOSTS = new Set(['localhost', '127.0.0.1', '::1', 'postgres', 'db-test']);

/**
 * Refuse any database that is not explicitly named for tests. Local runs are
 * additionally limited to loopback/Compose hosts; CI may use its service host.
 */
export function requireTestDatabaseUrl(rawUrl, { ci = false } = {}) {
  if (!rawUrl) {
    throw new Error(
      'TEST_DATABASE_URL is required; the integration harness never falls back to DATABASE_URL.',
    );
  }

  let url;
  try {
    url = new URL(rawUrl);
  } catch {
    throw new Error('TEST_DATABASE_URL must be a valid PostgreSQL URL.');
  }

  if (!['postgresql:', 'postgres:'].includes(url.protocol)) {
    throw new Error('TEST_DATABASE_URL must use the postgresql:// protocol.');
  }

  const databaseName = decodeURIComponent(url.pathname.replace(/^\//, '')).toLowerCase();
  if (!/(^|[_-])test($|[_-])/.test(databaseName)) {
    throw new Error(
      `Refusing database "${databaseName || '(missing)'}": its name must contain a standalone test marker.`,
    );
  }

  if (!ci && !LOOPBACK_HOSTS.has(url.hostname.toLowerCase())) {
    throw new Error(`Refusing non-local test database host "${url.hostname}" outside CI.`);
  }

  return url.toString();
}
