const analyticsEventService = require("../Services/analyticsEventService");

const trackEvent = (eventType, extractData = () => ({})) => {
  return (req, res, next) => {
    res.on("finish", () => {
      try {
        if (res.statusCode >= 400) return;
        const extra = extractData(req);
        analyticsEventService.recordEvent({
          eventType,
          userId: req.user?.email || "",
          ip: req.ip || req.connection?.remoteAddress || "",
          deviceInfo: req.headers["user-agent"] || "",
          ...extra,
        });
      } catch (_) {
        // Event tracking must never break the app
      }
    });
    next();
  };
};

module.exports = trackEvent;
