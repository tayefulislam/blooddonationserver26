const predictionService = require("../Services/predictionService");

const INTERVAL_MS = 6 * 60 * 60 * 1000;
let timer = null;

exports.startAggregationJob = () => {
  console.log("[AGGREGATION] Background prediction refresh job started (every 6h)");
  setTimeout(() => runJob().catch(console.error), 30000);
  timer = setInterval(() => {
    runJob().catch((err) =>
      console.error(`[AGGREGATION] Job failed: ${err.message}`)
    );
  }, INTERVAL_MS);
};

exports.stopAggregationJob = () => {
  if (timer) {
    clearInterval(timer);
    timer = null;
    console.log("[AGGREGATION] Background job stopped");
  }
};

async function runJob() {
  console.log("[AGGREGATION] Running prediction refresh...");
  const start = Date.now();
  await predictionService.refreshAll();
  console.log(`[AGGREGATION] Done in ${Date.now() - start}ms`);
}
