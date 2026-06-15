const SERVICES = [
  "api-gateway",
  "auth-service",
  "user-service",
  "payment-service",
  "notification",
];

const ERROR_MESSAGES = [
  "Connection timeout after 30000ms waiting for database response",
  "HTTP 500 Internal Server Error: /api/v2/orders endpoint",
  "Authentication failed: JWT token expired",
  "Null pointer exception in UserController.getProfile() at line 142",
  "Rate limit exceeded: 429 Too Many Requests from 192.168.1.100",
  "Database connection pool exhausted: all 20 connections in use",
  "ECONNRESET: read ECONNRESET connection reset by peer",
  "Slow query detected: SELECT * FROM orders WHERE user_id = ? took 4521ms",
  "SSL certificate verification failed: self signed certificate",
  "Out of memory: heap space exhausted, current usage 98%%",
];

const INFO_MESSAGES = [
  "User 12345 logged in successfully",
  "Order #98765 processed and confirmed",
  "Cache warmed for region us-east-1",
  'Background job "cleanup-expired-sessions" completed in 120ms',
  "Health check passed for all 5 upstream services",
  "New deployment v2.4.1 detected, reloading configuration",
  "Metrics flushed to monitoring service",
];

function randInt(min: number, max: number) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function pick<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

export function generateDemoLogs(count = 500): string {
  const base = Date.now() - 3600_000 * 3; // 3 hours ago
  const logs = [];

  for (let i = 0; i < count; i++) {
    const ts = base + i * randInt(100, 2000);
    const service = pick(SERVICES);
    const isError = Math.random() < 0.3;
    const level = isError
      ? pick(["ERROR", "WARN", "CRITICAL"] as const)
      : pick(["DEBUG", "INFO", "INFO"] as const);
    const message = isError ? pick(ERROR_MESSAGES) : pick(INFO_MESSAGES);

    logs.push(
      JSON.stringify({
        timestamp: new Date(ts).toISOString(),
        level,
        message,
        service,
        traceId: Math.random().toString(36).slice(2, 18),
        duration: randInt(1, 5000),
      }),
    );
  }

  return logs.join("\n");
}
