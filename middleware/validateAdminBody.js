const validateAdminBody = (allowedFields) => (req, res, next) => {
  if (!req.body || typeof req.body !== "object") {
    return res
      .status(400)
      .json({ status: "failed", message: "Request body must be a JSON object" });
  }

  const sanitized = {};
  for (const field of allowedFields) {
    if (req.body[field] !== undefined) {
      sanitized[field] = req.body[field];
    }
  }
  req.body = sanitized;
  next();
};

module.exports = validateAdminBody;
