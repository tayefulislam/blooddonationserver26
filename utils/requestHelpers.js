/**
 * Small, dependency-free helpers shared by controllers/services.
 */

/**
 * Express uses the "extended" query parser, so `?district[$ne]=x` arrives as an
 * object. Those values used to be forwarded straight into Mongoose filters,
 * which allows query-operator injection. Coerce everything to a trimmed string
 * so only plain equality matching can reach the database.
 *
 * @returns {string|undefined} the string value, or undefined if unusable
 */
const toQueryString = (value) => {
  if (typeof value === "string") {
    const trimmed = value.trim();
    return trimmed.length ? trimmed : undefined;
  }

  if (typeof value === "number" || typeof value === "boolean") {
    return String(value);
  }

  // `?group=A&group=B` produces an array - keep the first scalar entry.
  if (Array.isArray(value)) {
    for (const entry of value) {
      const parsed = toQueryString(entry);
      if (parsed !== undefined) return parsed;
    }
  }

  // Objects (operator injection) are rejected outright.
  return undefined;
};

/**
 * Builds a filter object from whitelisted query parameters, skipping any value
 * that is missing or not a plain string.
 *
 * @param {Record<string, any>} query req.query
 * @param {string[]} fields names to copy across
 */
const pickQueryStrings = (query = {}, fields = []) => {
  const filters = {};
  for (const field of fields) {
    const value = toQueryString(query[field]);
    if (value !== undefined) {
      filters[field] = value;
    }
  }
  return filters;
};

/**
 * Copies only the allowed keys from `source`. Used to stop clients from writing
 * fields they should not control (notably `role`).
 */
const pick = (source, allowedKeys) => {
  const out = {};
  if (!source || typeof source !== "object") return out;

  for (const key of allowedKeys) {
    if (source[key] !== undefined) {
      out[key] = source[key];
    }
  }
  return out;
};

module.exports = { toQueryString, pickQueryStrings, pick };
