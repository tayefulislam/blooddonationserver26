const mongoose = require("mongoose");

const connectDB = async () => {
  try {
    const uri = process.env.URI || "mongodb://127.0.0.1:27017/bloodDonation1";

    const conn = await mongoose.connect(uri, {
      serverSelectionTimeoutMS: 15000,
      socketTimeoutMS: 45000,
      connectTimeoutMS: 15000,
      // Small, steady concurrency on this API - a tight pool avoids burning
      // through Atlas connection limits.
      maxPoolSize: 10,
    });

    console.log(`✅ MongoDB Connected: ${conn.connection.host}`);

    mongoose.connection.on("error", (err) => {
      console.error(`❌ MongoDB connection error: ${err.message}`);
    });

    mongoose.connection.on("disconnected", () => {
      console.warn("⚠️ MongoDB disconnected. Attempting to reconnect...");
    });

    mongoose.connection.on("reconnected", () => {
      console.log("✅ MongoDB reconnected");
    });

    // NOTE: signal handling now lives in index.js so the HTTP server and the
    // database connection are torn down together in one place.

    return conn;
  } catch (err) {
    console.error(`❌ MongoDB Connection Failed`);
    console.error(`Error: ${err.message}`);
    console.error("");

    const uri = process.env.URI || "";
    const usesSrv = /^mongodb\+srv:\/\//i.test(uri);
    const isDnsError =
      /querySrv|queryTxt|ECONNREFUSED|ENOTFOUND|EAI_AGAIN/i.test(err.message);

    console.error("Troubleshooting steps:");

    if (usesSrv && isDnsError) {
      console.error(
        "  ➜ Your URI uses mongodb+srv:// which needs a DNS SRV lookup.",
      );
      console.error(
        "    Node's resolver (c-ares) could not reach / was refused by the DNS server.",
      );
      console.error("    Options:");
      console.error(
        "      a) Use the standard mongodb:// seed-list URI from Atlas",
      );
      console.error(
        "         (Atlas > Connect > Drivers > 'driver 2.2.12 or earlier').",
      );
      console.error(
        "      b) Change your OS DNS to 8.8.8.8 / 1.1.1.1 (fixes all SRV clients).",
      );
      console.error(
        "      c) Confirm the cluster is not paused or deleted in Atlas.",
      );
    } else {
      console.error("  1. Make sure MongoDB is installed and running locally");
      console.error("  2. Start MongoDB with: mongod --dbpath /path/to/data");
      console.error(
        "  3. Or update URI in .env to point to your MongoDB instance",
      );
    }

    console.error(
      "  4. Verify the host in URI is reachable and credentials are correct.",
    );
    process.exit(1);
  }
};

module.exports = connectDB;
