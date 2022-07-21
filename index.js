require("dotenv").config();

const cron = require("node-cron");
const db = require("./db/db");
const { bulkInsertCollectionData } = require("./db/collections-db");
const { cron_upcomingevents } = require("./db/drop-db");
const { getObserveCollections } = require("./integration/transaction");

const { feed_temp_statistics } = require("./db/temp-statistics-db");

const fillObserveCollectionsTask = cron.schedule("*/10 * * * *", async (d) => {
  console.log("date: ", d.toISOString());
  const collections = await getObserveCollections();
  await bulkInsertCollectionData(collections);
});

const feedTempStatisticsTask = cron.schedule("0 0 * * *", async (d) => {
  console.log("date: ", d.toISOString());
  await feed_temp_statistics();
});

const dropTask = cron.schedule("*/2 * * * *", async (d) => {
  console.log("date: ", d.toISOString());
  await cron_upcomingevents();
});

const init = async () => {
  await db.init();
  fillObserveCollectionsTask.start();
  dropTask.start();
  feedTempStatisticsTask.start();
};

init();
