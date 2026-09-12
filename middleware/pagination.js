const DEFAULT_PAGE = 1;
const DEFAULT_LIMIT = 20;
const MAX_LIMIT = 100;

const parsePagination = (req, res, next) => {
  let page = Math.max(1, parseInt(req.query.page, 10) || DEFAULT_PAGE);
  let limit = Math.min(
    MAX_LIMIT,
    Math.max(1, parseInt(req.query.limit, 10) || DEFAULT_LIMIT)
  );
  const sortBy =
    typeof req.query.sortBy === "string" ? req.query.sortBy : "createdAt";
  const sortOrder = req.query.sortOrder === "asc" ? 1 : -1;

  req.pagination = { page, limit, sortBy, sortOrder };
  next();
};

module.exports = parsePagination;
