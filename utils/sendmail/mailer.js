const nodemailer = require("nodemailer");
const crypto = require("crypto");

/* ---------------------------------------------------------------------------
 * Tunables
 * ------------------------------------------------------------------------- */

// A second notification about the *same event* inside this window is dropped.
// This is what stops double-clicks and client-side retries from spamming admins.
const DEDUPE_WINDOW_MS = 10 * 60 * 1000;

// Hard cap on the backlog. Past this, notifications are dropped instead of
// letting an unbounded queue pile up in memory.
const MAX_QUEUE_SIZE = 50;

// Safety valve so the dedupe map cannot grow without bound.
const MAX_DEDUPE_ENTRIES = 2000;

/* ---------------------------------------------------------------------------
 * Counters - handy when diagnosing "did it send or not?"
 * ------------------------------------------------------------------------- */
const stats = {
  sent: 0,
  failed: 0,
  suppressedDuplicates: 0,
  droppedQueueFull: 0,
};

/* ---------------------------------------------------------------------------
 * Duplicate suppression
 * ------------------------------------------------------------------------- */
const recentNotifications = new Map(); // fingerprint -> expiry epoch ms

/** Records the fingerprint and reports whether it was already seen recently. */
const isDuplicate = (fingerprint) => {
  const now = Date.now();

  // Drop expired entries so the map stays small.
  for (const [key, expiresAt] of recentNotifications) {
    if (expiresAt <= now) recentNotifications.delete(key);
  }

  const expiresAt = recentNotifications.get(fingerprint);
  if (expiresAt && expiresAt > now) return true;

  recentNotifications.set(fingerprint, now + DEDUPE_WINDOW_MS);

  // Failsafe cap for a pathological burst of unique events.
  if (recentNotifications.size > MAX_DEDUPE_ENTRIES) {
    recentNotifications.delete(recentNotifications.keys().next().value);
  }

  return false;
};

/**
 * Message-ID derived from the fingerprint plus a coarse time bucket, so the same
 * event always yields the same id. Even if a duplicate escapes the dedupe
 * window, the receiving mail server can collapse it.
 */
const buildMessageId = (fingerprint) => {
  const bucket = Math.floor(Date.now() / DEDUPE_WINDOW_MS);
  const hash = crypto
    .createHash("sha1")
    .update(`${fingerprint}|${bucket}`)
    .digest("hex")
    .slice(0, 24);
  return `<${hash}@roktokhujun.local>`;
};

/* ---------------------------------------------------------------------------
 * Serial queue - exactly one SMTP conversation in flight at a time
 * ------------------------------------------------------------------------- */
let queueTail = Promise.resolve();
let queueLength = 0;

/**
 * Runs `job` after every previously queued job, so a sudden burst of
 * registrations cannot open a pile of simultaneous SMTP connections.
 */
const enqueue = (job) => {
  if (queueLength >= MAX_QUEUE_SIZE) {
    stats.droppedQueueFull += 1;
    console.warn(
      `[MAIL] queue is full (${MAX_QUEUE_SIZE}); dropping a notification`,
    );
    return Promise.resolve(null);
  }

  queueLength += 1;

  const run = queueTail.then(job, job);

  // The tail must never reject, otherwise every later job would be skipped.
  queueTail = run.then(
    () => undefined,
    () => undefined,
  );

  return run
    .catch((error) => {
      console.error(`[MAIL] unexpected queue error: ${error.message}`);
      return null;
    })
    .finally(() => {
      queueLength -= 1;
    });
};

/* ---------------------------------------------------------------------------
 * Transporter - created lazily, one message at a time
 * ------------------------------------------------------------------------- */
let transporter = null;

const getTransporter = () => {
  if (!transporter) {
    transporter = nodemailer.createTransport({
      host: process.env.Email_Host,
      port: 465,
      secure: true,
      // No connection pooling on purpose: the serial queue below already
      // guarantees only one SMTP conversation is ever in flight, and not holding
      // idle sockets open keeps shutdown clean and predictable.
      connectionTimeout: 10_000,
      greetingTimeout: 10_000,
      socketTimeout: 20_000,
      auth: {
        user: process.env.Email_Address,
        pass: process.env.Email_Password,
      },
    });
  }
  return transporter;
};

/** Waits for the backlog to drain, then releases the SMTP connection. */
const closeMailer = async () => {
  try {
    await queueTail;
  } catch {
    /* individual job errors are already handled inside enqueue() */
  }

  if (transporter) {
    transporter.close();
    transporter = null;
  }
};

const getMailStats = () => ({ ...stats, queueLength });

const escapeHtml = (value) =>
  String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");

/** Escape helper for the HTML part of the templates. */
const h = (value) => escapeHtml(value);

/** Raw helper for plain-text/subject parts. */
const t = (value) => String(value ?? "");

/**
 * Queues one notification.
 *
 * Deliberately never retries: when SMTP accepts a message but the reply is lost,
 * resending is exactly what delivers the same email twice. Failures are logged
 * and counted instead.
 */
const deliver = async ({ subject, text, html, context, fingerprint }) => {
  if (!process.env.Admin_Emails || !process.env.Email_Address) {
    console.warn(`[MAIL] ${context} skipped: email settings are missing`);
    return null;
  }

  if (isDuplicate(fingerprint)) {
    stats.suppressedDuplicates += 1;
    console.log(`[MAIL] duplicate ${context} notification suppressed`);
    return null;
  }

  return enqueue(async () => {
    try {
      const info = await getTransporter().sendMail({
        from: `"Rokto Khujun" ${process.env.Email_Address}`,
        to: `${process.env.Admin_Emails}`,
        subject,
        text,
        html,
        messageId: buildMessageId(fingerprint),
      });

      stats.sent += 1;
      console.log(`✉️  ${context} notification sent: ${info.messageId}`);
      return info;
    } catch (error) {
      stats.failed += 1;
      // Notification failures must never fail the API request.
      console.error(`[MAIL] ${context} notification failed: ${error.message}`);
      return null;
    }
  });
};

const sendBloodRequestEmail = (request) =>
  deliver({
    context: "Blood request",
    // Same patient + contact + group + slot means the same request, so a
    // double-submit or a client retry collapses into a single notification.
    fingerprint: `request:${t(request?.patient)}|${t(request?.number)}|${t(
      request?.group,
    )}|${t(request?.date)}|${t(request?.unit)}`,
    subject: `${t(request?.group)} ( ${t(request?.district)} )  New Blood Request`,
    text: `New Blood Request of ${t(request?.group)} - ${t(request?.district)}`,
    html: `
      <b>New Blood Request of ${h(request?.group)} - ${h(request?.district)}</b> <br/>
      <h3>Details</h3> <br/>
      <p>
      Name : ${h(request?.patient)} <br/>
      Blood Group : ${h(request?.group)} <br/>
      District : ${h(request?.district)}<br/>
      Area : ${h(request?.area)}<br/>
      date: ${h(request?.date)}<br/>
      Contact Number : ${h(request?.number)}<br/>
      Medical Name : ${h(request?.medical)}<br/>
      Bag (Unit) : ${h(request?.unit)}<br/>
      Comment : ${h(request?.comment)}
    `,
  });

const sendNewDonorEmail = (donor) =>
  deliver({
    context: "New donor",
    // `number` is unique per donor, so it identifies the registration.
    fingerprint: `donor:${t(donor?.number)}`,
    subject: `New Donor -  ${t(donor?.name)} - ${t(donor?.group)} (${t(donor?.district)})`,
    text: `New Donor -  ${t(donor?.name)} - ${t(donor?.group)} (${t(donor?.district)})`,
    html: `
      <b>New Blood Donor Register ${h(donor?.group)} (${h(donor?.district)})</b> <br/>
      <p>
      <h4>Details</h4> <br/>
      Name        : ${h(donor?.name)} <br/>
      Blood Group : ${h(donor?.group)} <br/>
      Gender      : ${h(donor?.gender)} <br/>
      District    : ${h(donor?.district)}<br/>
      Area        : ${h(donor?.area)}<br/>
      date        : ${h(donor?.lastDonation)}<br/>
      Number      : ${h(donor?.number)}<br/>
    `,
  });

module.exports = {
  sendBloodRequestEmail,
  sendNewDonorEmail,
  closeMailer,
  getMailStats,
};
