const express = require("express");
const cors = require("cors");
const { errorHandler, notFound } = require("./middleware/errorHandler");
const requestLogger = require("./middleware/requestLogger");
const { dedupeRequest } = require("./middleware/dedupeRequest");

const app = express();

// Don't advertise the framework in every response.
app.disable("x-powered-by");

app.use(cors());
app.use(express.json());
app.use(requestLogger);

// Must sit after express.json(): the body fingerprint is built from req.body.
// Ignores a repeat POST/PATCH/PUT and replays the first response.
app.use(dedupeRequest);

const bloodRequestsRoute = require("./routes/bloodRequests.route");
const donorsRoute = require("./routes/donors.route");
const publicDonorsRoute = require("./routes/publicDonors.route");
const DonorQueryRoute = require("./routes/donorQuery.route");

app.get("/", (req, res) => {
  res.send("Blue Space Api Public API Services");
});

app.use("/api/v1/bloodRequest", bloodRequestsRoute);
app.use("/api/v1/donors", donorsRoute);
app.use("/api/v2/publicDonors", publicDonorsRoute);
app.use("/api/v1/DonorQueryTotalHit", DonorQueryRoute);

app.use(notFound);
app.use(errorHandler);

module.exports = app;
