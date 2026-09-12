require("dotenv").config();
const mongoose = require("mongoose");
const connectDB = require("../db/connectDB");

const run = async () => {
  await connectDB();

  const db = mongoose.connection.db;

  // Public Donors indexes
  await db.collection("PublicDonors").createIndex({ name: 1 });
  await db.collection("PublicDonors").createIndex({ district: 1, status: 1 });
  await db.collection("PublicDonors").createIndex({ group: 1, status: 1 });
  await db.collection("PublicDonors").createIndex({ status: 1, createdAt: -1 });

  // Donors indexes
  await db.collection("donors").createIndex({ status: 1, createdAt: -1 });
  await db.collection("donors").createIndex({ name: 1 });
  await db.collection("donors").createIndex({ district: 1, status: 1 });

  // Blood Requests indexes
  await db.collection("bloodRequests").createIndex({ status: 1 });
  await db.collection("bloodRequests").createIndex({ group: 1, status: 1 });
  await db.collection("bloodRequests").createIndex({ createdAt: -1 });

  console.log("All indexes created successfully");
  process.exit(0);
};

run().catch((err) => {
  console.error("Failed to create indexes:", err.message);
  process.exit(1);
});
