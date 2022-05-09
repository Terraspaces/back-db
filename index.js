require("dotenv").config();

const cron = require("node-cron");
const db = require("./db/db");
const transaction = require("./transaction");

let executionCount = 0;
const task = cron.schedule("*/2 * * * *", async (d) => {
  console.log("date: ", d.toISOString());

  const trendingCollectionData = await transaction.getTrendingCollectionData();
  await db.bulkInsertTrendingCollectionData(trendingCollectionData);
  executionCount++;
  console.log("executionCount: ", executionCount);
});

const init = async () => {
  await db.init();
  task.start();
};

init();
