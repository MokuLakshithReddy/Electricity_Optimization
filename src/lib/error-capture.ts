import * as Sentry from "@sentry/cloudflare";

let lastCapturedError: Error | unknown | null = null;

/**
 * Capture error safely to Sentry or console with PII scrubbing.
 */
export function captureError(error: Error | unknown, context?: Record<string, unknown>): void {
  lastCapturedError = error;
  const scrubbedContext = context ? scrubPii(context) : {};

  if (typeof Sentry !== "undefined" && typeof Sentry.captureException === "function") {
    Sentry.captureException(error, { extra: scrubbedContext });
  } else {
    console.error("[IntelliGrid Error]", error, scrubbedContext);
  }
}

/**
 * Consume and reset the last captured error for SSR failure reporting.
 */
export function consumeLastCapturedError(): Error | unknown | null {
  const err = lastCapturedError;
  lastCapturedError = null;
  return err;
}

/**
 * Scrub PII from context data before logging/sending.
 */
function scrubPii(obj: Record<string, unknown>): Record<string, unknown> {
  const scrubbed: Record<string, unknown> = {};
  for (const [key, val] of Object.entries(obj)) {
    if (/password|secret|token|cookie|auth|ip/i.test(key)) {
      scrubbed[key] = "[REDACTED]";
    } else if (val && typeof val === "object" && !Array.isArray(val)) {
      scrubbed[key] = scrubPii(val as Record<string, unknown>);
    } else {
      scrubbed[key] = val;
    }
  }
  return scrubbed;
}

/**
 * Global unhandled rejection handler.
 */
export function setupErrorHandling(): void {
  if (typeof window !== "undefined") {
    window.addEventListener("unhandledrejection", (event: PromiseRejectionEvent) => {
      captureError(event.reason, { type: "unhandledrejection" });
    });

    window.addEventListener("error", (event: ErrorEvent) => {
      captureError(event.error || event.message, {
        type: "uncaughtError",
        filename: event.filename,
        lineno: event.lineno,
      });
    });
  }
}
