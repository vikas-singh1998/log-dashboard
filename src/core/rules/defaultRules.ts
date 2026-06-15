import type { Rule } from "@/types/rules.types";

export const DEFAULT_RULES: Rule[] = [
  {
    id: "timeout",
    name: "Connection Timeout",
    description: "Log message contains timeout-related keywords",
    severity: "high",
    condition: (log) =>
      /timeout|timed.?out|ETIMEDOUT|connection timed/i.test(log.message),
    suggestion:
      "Check API/service latency, network stability, and timeout configuration. Consider increasing timeouts or adding retry logic.",
  },
  {
    id: "http-5xx",
    name: "HTTP 5xx Server Error",
    description: "HTTP 500+ status code detected",
    severity: "critical",
    condition: (log) =>
      /\b5\d{2}\b/.test(log.message) ||
      /status.?5\d{2}|internal.?server.?error/i.test(log.message),
    suggestion:
      "Backend is returning 5xx errors. Check server logs, resource exhaustion, and unhandled exceptions.",
  },
  {
    id: "oom",
    name: "Out of Memory",
    description: "Memory-related errors detected",
    severity: "critical",
    condition: (log) =>
      /out.?of.?memory|OutOfMemory|heap.?space|memory.?limit|ENOMEM|malloc failed/i.test(
        log.message,
      ),
    suggestion:
      "Memory exhaustion detected. Increase heap size, check for memory leaks, or optimize data structures.",
  },
  {
    id: "db-connection",
    name: "Database Connection Error",
    description: "Database connection failure",
    severity: "critical",
    condition: (log) =>
      /db.?connect(ion)?|database.?error|connection.?refused|ECONNREFUSED|pool.?exhausted|too.?many.?connections/i.test(
        log.message,
      ),
    suggestion:
      "Database connection failure. Check DB host/port, connection pool limits, firewall rules, and DB server health.",
  },
  {
    id: "null-ref",
    name: "Null Reference / Undefined",
    description: "Null or undefined access error",
    severity: "high",
    condition: (log) =>
      /NullPointerException|TypeError.*null|TypeError.*undefined|Cannot read prop|undefined is not|null is not/i.test(
        log.message,
      ),
    suggestion:
      "Null/undefined reference error. Add null checks, optional chaining, or fix the upstream data source.",
  },
  {
    id: "auth-failure",
    name: "Authentication Failure",
    description: "Auth/authorization failures detected",
    severity: "medium",
    condition: (log) =>
      /auth(entication)?.?fail|unauthorized|403|401|invalid.?token|jwt.?expired|permission.?denied/i.test(
        log.message,
      ),
    suggestion:
      "Auth failures occurring. Check token expiry, secret rotation, and session management.",
  },
  {
    id: "rate-limit",
    name: "Rate Limit Hit",
    description: "API rate limiting detected",
    severity: "medium",
    condition: (log) =>
      /rate.?limit|429|too.?many.?requests|throttl/i.test(log.message),
    suggestion:
      "Rate limits being hit. Implement request throttling, caching, or request batching. Consider upgrading API tier.",
  },
  {
    id: "disk-full",
    name: "Disk / Storage Full",
    description: "Storage capacity issues",
    severity: "critical",
    condition: (log) =>
      /disk.?full|no.?space.?left|ENOSPC|storage.?full|quota.?exceeded/i.test(
        log.message,
      ),
    suggestion:
      "Storage is full. Clean up logs/temp files, expand disk, or enable log rotation immediately.",
  },
  {
    id: "slow-query",
    name: "Slow Database Query",
    description: "Slow query warnings detected",
    severity: "medium",
    condition: (log) =>
      /slow.?quer|query.?took|execution.?time|long.?running.?query/i.test(
        log.message,
      ),
    suggestion:
      "Slow database queries detected. Add indexes, optimize query plans, or enable query caching.",
  },
  {
    id: "repeated-100",
    name: "High Frequency Error",
    description: "Same error repeating more than 100 times",
    severity: "critical",
    condition: (_log, _analysis, groups) => groups.some((g) => g.count > 100),
    suggestion: (log, analysis) => {
      const topGroup = analysis.errorGroups[0];
      const count = topGroup?.count ?? 0;
      return `Critical: "${topGroup?.message?.slice(0, 80) ?? log.message}" has occurred ${count} times. This requires immediate investigation.`;
    },
  },
  {
    id: "ssl-cert",
    name: "SSL/TLS Certificate Issue",
    description: "Certificate errors detected",
    severity: "high",
    condition: (log) =>
      /ssl|tls|certificate|CERT_|UNABLE_TO_VERIFY|self.?signed|cert.?expired/i.test(
        log.message,
      ),
    suggestion:
      "SSL/TLS certificate issue. Renew certificates, check certificate chain, or verify CA configuration.",
  },
  {
    id: "file-not-found",
    name: "File Not Found",
    description: "File or resource not found errors",
    severity: "low",
    condition: (log) =>
      /ENOENT|file.?not.?found|no.?such.?file|404|module.?not.?found/i.test(
        log.message,
      ),
    suggestion:
      "Missing file or resource. Verify file paths, deployment packages, and static asset URLs.",
  },
  {
    id: "serialization",
    name: "Serialization Error",
    description: "JSON parse or serialization failures",
    severity: "medium",
    condition: (log) =>
      /SyntaxError|JSON.?parse|deserializ|unmarshal|invalid.?json|parse.?error/i.test(
        log.message,
      ),
    suggestion:
      "Data serialization/deserialization failure. Check data contracts, API response formats, and schema versions.",
  },
  {
    id: "network",
    name: "Network Connectivity Issue",
    description: "Network or socket errors",
    severity: "high",
    condition: (log) =>
      /ECONNRESET|ECONNABORTED|network.?error|socket.?closed|broken.?pipe|connection.?reset/i.test(
        log.message,
      ),
    suggestion:
      "Network connectivity issue. Check load balancers, service mesh config, and inter-service communication.",
  },
  {
    id: "cpu-high",
    name: "High CPU / Thread Lock",
    description: "CPU saturation or thread contention",
    severity: "high",
    condition: (log) =>
      /deadlock|thread.?starvation|cpu.?high|high.?load|event.?loop.?blocked|thread.?blocked/i.test(
        log.message,
      ),
    suggestion:
      "CPU saturation or thread contention. Profile the application, check for deadlocks, and review concurrency patterns.",
  },

  // --- Structured field rules (use typed ParsedLog fields instead of regex) ---

  {
    id: "http-5xx-status",
    name: "HTTP 5xx (Structured)",
    description: "HTTP 5xx detected via parsed httpStatus field",
    severity: "critical",
    condition: (log) =>
      log.httpStatus !== undefined &&
      log.httpStatus >= 500 &&
      log.httpStatus < 600,
    suggestion: (log) =>
      `Server returned HTTP ${log.httpStatus ?? "5xx"} on ${log.httpMethod ?? "?"} ${log.httpPath ?? "unknown path"}. Investigate backend errors for this endpoint.`,
  },
  {
    id: "http-4xx-status",
    name: "HTTP 4xx Client Error (Structured)",
    description: "HTTP 4xx detected via parsed httpStatus field",
    severity: "medium",
    condition: (log) =>
      log.httpStatus !== undefined &&
      log.httpStatus >= 400 &&
      log.httpStatus < 500,
    suggestion: (log) =>
      `Client error HTTP ${log.httpStatus ?? "4xx"} on ${log.httpMethod ?? "?"} ${log.httpPath ?? "unknown path"}. Check request parameters, auth tokens, and API contracts.`,
  },

  // --- Stack trace / exception rules ---

  {
    id: "stack-overflow",
    name: "Stack Overflow / Recursion",
    description: "Stack overflow or infinite recursion detected",
    severity: "critical",
    condition: (log) =>
      /stack.?overflow|maximum.?call.?stack|too.?much.?recursion|StackOverflowError/i.test(
        log.message,
      ) || /stack.?overflow|maximum.?call.?stack/i.test(log.stackTrace ?? ""),
    suggestion:
      "Stack overflow detected — likely infinite recursion. Review recursive functions and add proper base-case termination.",
  },
  {
    id: "unhandled-exception",
    name: "Unhandled Exception / Rejection",
    description: "Unhandled exceptions or promise rejections",
    severity: "high",
    condition: (log) =>
      /unhandled.?exception|uncaught.?exception|unhandled.?rejection|UnhandledPromiseRejection|FATAL ERROR/i.test(
        log.message,
      ),
    suggestion:
      "Unhandled exception detected. Add global error handlers, try/catch blocks, or .catch() on promises.",
  },
  {
    id: "deprecation-warning",
    name: "Deprecation Warning",
    description: "Usage of deprecated APIs or features",
    severity: "low",
    condition: (log) =>
      /deprecat(ed|ion)|will.?be.?removed|no.?longer.?supported|obsolete/i.test(
        log.message,
      ),
    suggestion:
      "Deprecated API usage detected. Plan a migration before the feature is removed in a future release.",
  },

  // --- Infrastructure / deployment rules ---

  {
    id: "dns-failure",
    name: "DNS Resolution Failure",
    description: "DNS lookup or resolution errors",
    severity: "high",
    condition: (log) =>
      /ENOTFOUND|dns.?resol|getaddrinfo|name.?resolution|dns.?lookup.?fail/i.test(
        log.message,
      ),
    suggestion:
      "DNS resolution failure. Check DNS servers, service hostnames, and network configuration.",
  },
  {
    id: "container-crash",
    name: "Container / Process Crash",
    description: "Container restart, OOM kill, or process crash",
    severity: "critical",
    condition: (log) =>
      /OOMKill|CrashLoopBackOff|container.?restart|segfault|SIGSEGV|SIGKILL|SIGABRT|core.?dump|exit.?code.?[^0]/i.test(
        log.message,
      ),
    suggestion:
      "Process or container crash detected. Check memory limits, signal handlers, and container health probes.",
  },
  {
    id: "config-error",
    name: "Configuration Error",
    description: "Missing or invalid configuration",
    severity: "high",
    condition: (log) =>
      /config(uration)?.?(error|missing|invalid|not.?found)|env.?var.*(missing|not.?set|undefined)|missing.?env|required.?field/i.test(
        log.message,
      ),
    suggestion:
      "Configuration error. Verify environment variables, config files, and required secrets are set correctly.",
  },
  {
    id: "queue-overflow",
    name: "Queue / Buffer Overflow",
    description: "Message queue or buffer capacity exceeded",
    severity: "high",
    condition: (log) =>
      /queue.?full|queue.?overflow|buffer.?overflow|backpressure|message.?rejected|consumer.?lag/i.test(
        log.message,
      ),
    suggestion:
      "Queue or buffer overflow. Scale consumers, increase buffer size, or implement backpressure handling.",
  },
  {
    id: "latency-spike",
    name: "High Latency / Slow Response",
    description: "High response time or latency spikes",
    severity: "medium",
    condition: (log) =>
      /latency.?spike|high.?latency|slow.?response|response.?time.?exceed|p99.?exceeded|SLA.?breach/i.test(
        log.message,
      ),
    suggestion:
      "High latency detected. Profile slow paths, check downstream dependencies, and review caching strategy.",
  },
  {
    id: "service-unavailable",
    name: "Service Unavailable / Down",
    description: "Upstream service unreachable",
    severity: "critical",
    condition: (log) =>
      /service.?unavailable|503|upstream.?down|circuit.?breaker.?open|health.?check.?fail/i.test(
        log.message,
      ),
    suggestion:
      "Service unavailable. Check upstream service health, circuit breaker state, and load balancer configuration.",
  },
  {
    id: "data-corruption",
    name: "Data Integrity / Corruption",
    description: "Data corruption or integrity check failures",
    severity: "critical",
    condition: (log) =>
      /corrupt(ed|ion)?|checksum.?mismatch|integrity.?fail|data.?inconsisten|CRC.?error/i.test(
        log.message,
      ),
    suggestion:
      "Data corruption or integrity failure. Verify data pipelines, check storage health, and restore from backup if needed.",
  },

  // --- Aggregate / analysis-aware rules ---

  {
    id: "high-error-rate",
    name: "High Error Rate",
    description: "Error logs exceed 50% of total log volume",
    severity: "critical",
    condition: (_log, analysis) => {
      if (analysis.totalCount < 10) return false;
      const errorRatio =
        (analysis.errorCount + analysis.criticalCount) / analysis.totalCount;
      return errorRatio > 0.5;
    },
    suggestion: (_log, analysis) => {
      const pct = (
        ((analysis.errorCount + analysis.criticalCount) / analysis.totalCount) *
        100
      ).toFixed(1);
      return `${pct}% of logs are errors/critical. The system is in a degraded state — investigate the most frequent error groups immediately.`;
    },
  },
  {
    id: "single-service-hotspot",
    name: "Single Service Error Hotspot",
    description: "One service produces >70% of all errors",
    severity: "high",
    condition: (_log, analysis) => {
      if (analysis.topServices.length < 2) return false;
      const top = analysis.topServices[0];
      return top.count / analysis.totalCount > 0.7;
    },
    suggestion: (_log, analysis) => {
      const svc = analysis.topServices[0]?.service ?? "unknown";
      return `Service "${svc}" is producing the majority of log entries. Focus debugging efforts on this service.`;
    },
  },
  {
    id: "critical-level-log",
    name: "Critical Level Log Entry",
    description: "Log entry with CRITICAL severity level",
    severity: "critical",
    condition: (log) => log.level === "CRITICAL",
    suggestion:
      "CRITICAL-level log detected. These typically indicate system-level failures requiring immediate attention.",
  },

  // --- Security-related rules ---

  {
    id: "security-injection",
    name: "Potential Injection Attack",
    description: "SQL injection or XSS patterns in logs",
    severity: "critical",
    condition: (log) =>
      /SQL.?injection|XSS|<script|UNION.?SELECT|DROP.?TABLE|eval\(|exec\(.*shell/i.test(
        log.message,
      ),
    suggestion:
      "Potential injection attack detected in logs. Review input validation, parameterized queries, and WAF rules.",
  },
  {
    id: "brute-force",
    name: "Brute Force / Login Spam",
    description: "Repeated failed login or access attempts",
    severity: "high",
    condition: (log) =>
      /brute.?force|login.?fail|failed.?login|invalid.?password|account.?locked|too.?many.?attempts/i.test(
        log.message,
      ),
    suggestion:
      "Brute-force or repeated login failures detected. Enable rate limiting, CAPTCHAs, or IP blocking on auth endpoints.",
  },

  // --- Retry / circuit pattern rules ---

  {
    id: "retry-exhausted",
    name: "Retries Exhausted",
    description: "All retry attempts failed",
    severity: "high",
    condition: (log) =>
      /retr(y|ies).?(exhaust|fail|limit|exceeded)|max.?retries|no.?more.?retries|giving.?up/i.test(
        log.message,
      ),
    suggestion:
      "All retries exhausted. The target service may be down. Check circuit breaker state and consider fallback logic.",
  },
  {
    id: "graceful-shutdown",
    name: "Shutdown / Restart Signal",
    description: "Application shutdown or restart detected",
    severity: "medium",
    condition: (log) =>
      /shutting.?down|graceful.?shutdown|SIGTERM|SIGINT|restarting|application.?stop/i.test(
        log.message,
      ),
    suggestion:
      "Application shutdown/restart detected. Verify this was intentional (deploy, scaling) and not caused by a crash.",
  },
];
