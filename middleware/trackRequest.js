const ApiRequest = require("../models/ApiRequest");

const SKIP_PATHS = ["/favicon.ico", "/health"];

const trackRequest = (req, res, next) => {
  if (SKIP_PATHS.some((p) => req.path.startsWith(p))) return next();

  const startedAt = process.hrtime.bigint();

  res.on("finish", () => {
    const durationMs = Number(process.hrtime.bigint() - startedAt) / 1e6;

    ApiRequest.create({
      method: req.method,
      path: req.originalUrl.split("?")[0],
      statusCode: res.statusCode,
      durationMs: Math.round(durationMs),
      ip: req.ip || "",
      userEmail: req.user?.email || "",
    }).catch(() => {});
  });

  next();
};

module.exports = trackRequest;
