const express = require("express");
const cors = require("cors");
const { errorHandler, notFound } = require("./middleware/errorHandler");
const requestLogger = require("./middleware/requestLogger");
const trackRequest = require("./middleware/trackRequest");
const { dedupeRequest } = require("./middleware/dedupeRequest");

const app = express();

// Don't advertise the framework in every response.
app.disable("x-powered-by");

app.use(
  cors({
    origin: [
      "https://blooddonationen1.web.app",
      "http://localhost:3000",
    ],
    credentials: true,
  })
);
app.use(express.json());
app.use(requestLogger);
app.use(trackRequest);

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

const adminRoute = require("./routes/admin.route");
app.use("/api/admin", adminRoute);

app.use(notFound);
app.use(errorHandler);

module.exports = app;
