/**
 * Tiny in-process TTL store. Nothing is persisted and nothing leaves the
 * machine - entries simply expire and are dropped.
 *
 * Used for request de-duplication. If the API is ever scaled to more than one
 * instance, each instance keeps its own copy (so a retry that lands on a
 * different instance would not be recognised).
 */
class LocalStore {
  constructor({ ttlMs, maxEntries = 1000, label = "localStore" } = {}) {
    if (!Number.isFinite(ttlMs) || ttlMs <= 0) {
      throw new Error("LocalStore requires a positive ttlMs");
    }

    this.ttlMs = ttlMs;
    this.maxEntries = maxEntries;
    this.label = label;
    this.entries = new Map(); // key -> { value, expiresAt }

    this.hits = 0;
    this.misses = 0;
    this.writes = 0;
    this.evictions = 0;
  }

  /** Drops every expired entry. Cheap because the map stays small. */
  prune(now = Date.now()) {
    for (const [key, entry] of this.entries) {
      if (entry.expiresAt <= now) this.entries.delete(key);
    }
    return this.entries.size;
  }

  /** Returns the stored value, or undefined when missing or expired. */
  get(key) {
    const now = Date.now();
    const entry = this.entries.get(key);

    if (!entry) {
      this.misses += 1;
      return undefined;
    }

    if (entry.expiresAt <= now) {
      this.entries.delete(key);
      this.misses += 1;
      return undefined;
    }

    this.hits += 1;

    // Amortised clean-up: no timers, so nothing keeps the process alive.
    if (this.hits % 100 === 0) this.prune(now);

    return entry.value;
  }

  set(key, value, now = Date.now()) {
    this.writes += 1;
    this.entries.set(key, { value, expiresAt: now + this.ttlMs });

    if (this.entries.size > this.maxEntries) {
      this.prune(now);

      // Still over the limit -> drop the oldest insertions (Map keeps order).
      while (this.entries.size > this.maxEntries) {
        this.entries.delete(this.entries.keys().next().value);
        this.evictions += 1;
      }
    }
  }

  clear() {
    this.entries.clear();
  }

  get size() {
    return this.entries.size;
  }

  stats() {
    return {
      label: this.label,
      size: this.entries.size,
      ttlMs: this.ttlMs,
      maxEntries: this.maxEntries,
      hits: this.hits,
      misses: this.misses,
      writes: this.writes,
      evictions: this.evictions,
    };
  }
}

module.exports = LocalStore;
