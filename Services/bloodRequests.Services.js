const bloodRequests = require("../models/bloodRequests");
const { sendBloodRequestEmail } = require("../utils/sendmail/mailer");

const MAX_LIST_RESULTS = 14;

exports.makeBloodRequestsService = async (newRequest) => {
  // Persist first: an admin must not be notified about a request that failed
  // validation. The mail is fire-and-forget so SMTP latency never delays the
  // API response, and the shared mailer swallows its own errors.
  const result = await bloodRequests.create(newRequest);

  sendBloodRequestEmail(result);

  return result;
};

exports.getBloodRequestsService = async (queries) =>
  bloodRequests
    .find(queries)
    .sort({ _id: -1 })
    .limit(MAX_LIST_RESULTS)
    // .lean() skips building Mongoose documents. The serialised JSON is
    // unchanged, but it is noticeably cheaper per row.
    .lean();

exports.getBloodRequestByIdService = async (id) =>
  // findById() is the indexed equivalent of find({ _id: id }).
  bloodRequests.findById(id).lean();
