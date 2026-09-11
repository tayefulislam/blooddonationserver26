const crypto = require("crypto");
const LocalStore = require("../utils/localStore");

/* ---------------------------------------------------------------------------
 * Configuration (overridable through .env)
 * ------------------------------------------------------------------------- */

// How long a finished write is remembered. A repeat of the same request inside
// this window is ignored and answered with the first response.
const WINDOW_MS = Number(process.env.DEDUPE_WINDOW_MS) || 2 * 60 * 1000;

// Upper bound on remembered requests, so memory cannot grow without limit.
const MAX_ENTRIES = Number(process.env.DEDUPE_MAX_ENTRIES) || 1000;

// Responses bigger than this are not cached (they are never big in this API).
const MAX_BODY_BYTES = Number(process.env.DEDUPE_MAX_BODY_BYTES) || 64 * 1024;

const ENABLED = process.env.DEDUPE_ENABLED !== "false";

// Only writes are de-duplicated; reads must always run.
const DEDUPED_METHODS = new Set(["POST", "PATCH", "PUT"]);

const store = new LocalStore({
  ttlMs: WINDOW_MS,
  maxEntries: MAX_ENTRIES,
  label: "request-dedupe",
});

/* ---------------------------------------------------------------------------
 * Fingerprinting
 * ------------------------------------------------------------------------- */

/**
 * Deterministic serialisation so `{"a":1,"b":2}` and `{"b":2,"a":1}` produce the
 * same fingerprint.
 */
const stableStringify = (value) => {
  if (value === null || typeof value !== "object") {
    return JSON.stringify(value) ?? "null";
  }

  if (Array.isArray(value)) {
    return `[${value.map(stableStringify).join(",")}]`;
  }

  return `{${Object.keys(value)
    .sort()
    .map((key) => `${JSON.stringify(key)}:${stableStringify(value[key])}`)
    .join(",")}}`;
};

const buildKey = (req) =>
  crypto
    .createHash("sha1")
    .update(
      `${req.method} ${req.originalUrl} ${stableStringify(req.body ?? {})}`,
    )
    .digest("hex");

const byteLength = (chunk) => {
  if (chunk === undefined || chunk === null) return 0;
  if (Buffer.isBuffer(chunk)) return chunk.length;
  return Buffer.byteLength(String(chunk));
};

/* ---------------------------------------------------------------------------
 * Middleware
 * ------------------------------------------------------------------------- */

/**
 * Content-based request de-duplication.
 *
 * The first successful write for a given (method, url, body) is remembered for
 * WINDOW_MS. Any identical request inside that window is skipped entirely: the
 * handler never runs, so no second database row and no second notification
 * email is produced, and the caller receives the original response unchanged.
 *
 * The store lives in this process only. If the API is ever run as more than one
 * instance, each instance keeps its own window.
 *
 * Note: the fingerprint is content-only, so two *different* people submitting a
 * byte-identical payload within the window would be treated as one. For this API
 * that is safe because the phone number is part of every write payload.
 */
const dedupeRequest = (req, res, next) => {
  if (!ENABLED || !DEDUPED_METHODS.has(req.method)) {
    return next();
  }

  const key = buildKey(req);
  const cached = store.get(key);

  if (cached) {
    console.log(
      `[DEDUPE] duplicate ${req.method} ${req.originalUrl} ignored ` +
        `(within ${WINDOW_MS / 1000}s) - replaying the first response`,
    );

    res.status(cached.status);
    if (cached.contentType) res.set("Content-Type", cached.contentType);
    res.send(cached.body);
    return;
  }

  // Capture the outgoing bytes, then remember them.
  let streamed = false;
  let stored = false;

  const originalWrite = res.write.bind(res);
  const originalEnd = res.end.bind(res);

  res.write = (...args) => {
    streamed = true;
    return originalWrite(...args);
  };

  res.end = (chunk, encoding, callback) => {
    // Only successful, non-streamed responses are remembered, so a failed
    // attempt can still be retried by the client.
    if (!stored && !streamed && res.statusCode === 200) {
      const size = byteLength(chunk);

      if (size > 0 && size <= MAX_BODY_BYTES) {
        stored = true;
        store.set(key, {
          status: res.statusCode,
          contentType: res.get("Content-Type"),
          body: chunk,
        });
      }
    }

    return originalEnd(chunk, encoding, callback);
  };

  return next();
};

module.exports = {
  dedupeRequest,
  getDedupeStats: () => store.stats(),
  resetDedupeStore: () => store.clear(),
  DEDUPE_WINDOW_MS: WINDOW_MS,
  DEDUPE_ENABLED: ENABLED,
};
