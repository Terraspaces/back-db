require("dotenv").config();

const cron = require("node-cron");
const db = require("./db/db");
const { getObserveCollections } = require("./transaction");

let executionCount = 0;
const task = cron.schedule("*/10 * * * *", async (d) => {
  console.log("date: ", d.toISOString());

  const collections = await getObserveCollections();
  await db.bulkInsertCollectionData(collections);
  executionCount++;
  console.log("executionCount: ", executionCount);
});

const init = async () => {
  await db.init();
  task.start();
};

init();
