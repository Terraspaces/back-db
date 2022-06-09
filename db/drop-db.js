const mongoose = require("mongoose");
const dropModel = require("./model/drop");

const fetch = (...args) =>
  import("node-fetch").then(({ default: fetch }) => fetch(...args));

const apiEndpoint = process.env.DEGENWHALE_API;
const cron_upcomingevents = async () => {
  try {
    const url = `${apiEndpoint}//upcoming-projects`;
    const dropResults = await fetch(url);
    const drops = await dropResults.json();

    console.log("drops", drops);

    const dropsToSave = [];
    for (const drop of drops) {
      dropsToSave.push(new dropModel(drop));
    }

    const result = await dropModel.bulkSave(dropsToSave);

    console.log("result", result);
    console.log("done dropModel.bulkSave");
  } catch (error) {
    console.error(`${cron_upcomingevents.name} error:`, error);
  }
};

module.exports = { cron_upcomingevents };
