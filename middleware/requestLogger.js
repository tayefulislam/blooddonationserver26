/**
 * Minimal request logger - no external dependency.
 * Writes one line per request once the response has been flushed.
 */
const requestLogger = (req, res, next) => {
  const startedAt = process.hrtime.bigint();

  res.on("finish", () => {
    const durationMs = Number(process.hrtime.bigint() - startedAt) / 1e6;
    console.log(
      `${req.method} ${req.originalUrl} ${res.statusCode} ${durationMs.toFixed(1)}ms`,
    );
  });

  next();
};

module.exports = requestLogger;
