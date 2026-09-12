require("dotenv").config();
const mongoose = require("mongoose");
mongoose.set("strictQuery", true);

const connectDB = require("./db/connectDB");
const app = require("./app");
const { closeMailer } = require("./utils/sendmail/mailer");
const { startAggregationJob, stopAggregationJob } = require("./jobs/aggregationJob");

const PORT = process.env.PORT || 5000;

// Without a URI the app cannot serve anything - fail fast with a clear message.
const REQUIRED_ENV = ["URI"];
// The app still runs without these, but notification emails will be skipped.
const RECOMMENDED_ENV = [
  "Email_Host",
  "Email_Address",
  "Email_Password",
  "Admin_Emails",
];

const checkEnv = () => {
  const missing = REQUIRED_ENV.filter((key) => !process.env[key]);
  if (missing.length) {
    console.error(
      `❌ Missing required environment variable(s): ${missing.join(", ")}`,
    );
    console.error("   Add them to your .env file and restart the server.");
    process.exit(1);
  }

  const missingOptional = RECOMMENDED_ENV.filter((key) => !process.env[key]);
  if (missingOptional.length) {
    console.warn(
      `⚠️  Missing email setting(s): ${missingOptional.join(", ")} - notifications will fail.`,
    );
  }
};

const shutdown = (server) => async (signal) => {
  console.log(`\n${signal} received. Shutting down gracefully...`);

  // Force-exit if keep-alive connections refuse to drain.
  const timer = setTimeout(() => {
    console.error("⚠️  Forced shutdown after timeout.");
    process.exit(1);
  }, 10_000);
  timer.unref();

  stopAggregationJob();

  server.close(async () => {
    // Let any queued notifications drain before dropping the SMTP connection.
    await closeMailer();
    await mongoose.connection.close();
    console.log("HTTP server, mail queue and MongoDB connection closed.");
    process.exit(0);
  });
};

const startServer = async () => {
  checkEnv();

  await connectDB();

  startAggregationJob();

  const server = app.listen(PORT, () => {
    console.log(`🚀 Server running on port ${PORT}`);
  });

  // Previously an occupied port produced an unhandled 'error' event crash.
  server.on("error", (error) => {
    if (error.code === "EADDRINUSE") {
      console.error(
        `❌ Port ${PORT} is already in use. Stop the other process or set PORT in .env.`,
      );
    } else {
      console.error(`❌ Server error: ${error.message}`);
    }
    process.exit(1);
  });

  for (const signal of ["SIGINT", "SIGTERM"]) {
    process.once(signal, shutdown(server));
  }
};

process.on("unhandledRejection", (reason) => {
  console.error("❌ Unhandled promise rejection:", reason);
});

process.on("uncaughtException", (error) => {
  console.error("❌ Uncaught exception:", error);
  process.exit(1);
});

startServer().catch((err) => {
  console.error(`❌ Failed to start server: ${err.message}`);
  process.exit(1);
});
