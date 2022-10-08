const mongoose = require("mongoose");
const dropModel = require("./model/drop");

const fetch = (...args) =>
  import("node-fetch").then(({ default: fetch }) => fetch(...args));

const apiEndpoint = process.env.DEGENWHALE_API;
const cron_upcomingevents = async () => {
  try {
    const url = `${apiEndpoint}/upcoming-projects`;
    const dropResults = await fetch(url);
    const drops = await dropResults.json();

    const existingDrops = await get_existing_drops();

    const dropsToSave = [];
    const dropsToUpdate = [];
    let existingDrop;
    for (const drop of drops) {
      existingDrop = existingDrops.find((d) => d.id === drop.id);
      if (existingDrop) {
        dropsToUpdate.push({
          updateOne: {
            filter: { id: existingDrop.id },
            update: {
              $set: existingDrop,
            },
            upsert: false,
          },
        });
        continue;
      }

      dropsToSave.push(new dropModel(drop));
    }

    const saveResult = await dropModel.bulkSave(dropsToSave);
    console.log("done dropModel.bulkSave");

    const updateResult = await dropModel.bulkWrite(dropsToUpdate);
    console.log("done dropModel.bulkWrite");
  } catch (error) {
    console.error(`${cron_upcomingevents.name} error:`, error);
  }
};

const get_existing_drops = async () => {
  let drops = [];
  try {
    drops = await dropModel.find({}, { id: 1 });
  } catch (error) {
    console.error(`${get_existing_drops.name} error:`, error);
  }
  return drops;
};

module.exports = { cron_upcomingevents };
