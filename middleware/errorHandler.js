const errorHandler = (err, req, res, next) => {
  const statusCode = err.statusCode || err.status || 500;

  // 4xx are expected client mistakes; 5xx deserve the full stack in the log.
  if (statusCode >= 500) {
    console.error(
      `[ERROR] ${req.method} ${req.originalUrl}:`,
      err.stack || err.message,
    );
  } else {
    console.error(`[ERROR] ${req.method} ${req.originalUrl}: ${err.message}`);
  }

  // Response already started - hand back to Express so it can destroy the socket.
  if (res.headersSent) {
    return next(err);
  }

  const message = err.message || "Internal Server Error";

  res.status(statusCode).json({
    status: "failed",
    message,
    ...(process.env.NODE_ENV === "development" && { stack: err.stack }),
  });
};

const notFound = (req, res, next) => {
  const error = new Error(`Not Found - ${req.originalUrl}`);
  error.statusCode = 404;
  next(error);
};

module.exports = { errorHandler, notFound };
