/**
 * Wraps an async Express handler so any rejected promise (or thrown error) is
 * converted into this project's standard error payload instead of producing an
 * unhandled rejection.
 *
 * The response contract is intentionally identical to the previous inline
 * try/catch blocks used by every controller:
 *
 *   400 { status, message, error }
 *
 * @param {(req, res, next) => any} handler the async controller body
 * @param {{ message: string, status?: "failed"|"Failed" }} options
 */
const catchAsync = (handler, { message, status = "failed" }) => {
  return async function wrappedController(req, res, next) {
    try {
      await handler(req, res, next);
    } catch (error) {
      console.error(
        `[ERROR] ${req.method} ${req.originalUrl}: ${error.message}`,
      );

      // Guard against responding twice if the handler already started sending.
      if (res.headersSent) {
        return next(error);
      }

      res.status(400).json({
        status,
        message,
        error: error.message,
      });
    }
  };
};

module.exports = catchAsync;
