require("dotenv").config();

const cron = require("node-cron");
const db = require("./db/db");
const { bulkInsertCollectionData } = require("./db/collections-db");
const { cron_upcomingevents } = require("./db/drop-db");
const { getObserveCollections } = require("./integration/transaction");

const fillObserveCollectionsTask = cron.schedule("*/1 * * * *", async (d) => {
  console.log("date: ", d.toISOString());
  const collections = await getObserveCollections();
  await db.bulkInsertCollectionData(collections);
});

const dropTask = cron.schedule("*/2 * * * *", async (d) => {
  console.log("date: ", d.toISOString());
  await cron_upcomingevents();
});

const init = async () => {
  await db.init();
  fillObserveCollectionsTask.start();
  // dropTask.start();
  await cron_upcomingevents();
};

init();
