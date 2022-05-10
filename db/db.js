const fetch = (...args) =>
  import("node-fetch").then(({ default: fetch }) => fetch(...args));

const { formatNearAmount } = require("near-api-js/lib/utils/format");
const FETCH_URL = process.env.FETCH_URL;
const mongoose = require("mongoose");
const collectionModel = require("./model/collection");
const DB_CONNECTION = `mongodb://${process.env.MONGODB_USER}:${process.env.MONGODB_PASS}@${process.env.MONGODB_HOST}:${process.env.MONGODB_PORT}/${process.env.MONGODB_DB}?authSource=admin`;

const bulkInsertCollectionData = async (collections) => {
  try {
    const transactions = [];
    let trx = {};
    for (const collectionName of collections) {
      let stat = {
        total_items: 0,
        total_listed: 0,
        total_owners: 0,
        floor_price: 0,
        floor_price_24: 0,
        floor_price_7: 0,
        total_volume: 0,
        instant_volume: 0,
        day_volume: 0,
      };

      const collectionResults = await fetch(`${FETCH_URL}${collectionName}`);
      const collectionStats = await collectionResults.json();

      if (collectionStats.data.results._id != undefined) {
        stat = {
          total_items: collectionStats.data.results.total_cards,
          total_listed: collectionStats.data.results.total_card_sale,
          total_owners: collectionStats.data.results.total_owners,
          floor_price: Number.parseFloat(
            formatNearAmount(collectionStats.data.results.floor_price).replace(
              ",",
              ""
            )
          ),
          floor_price_24: 0,
          // current_data.length > 143
          //   ? current_data[current_data.length - 144].floor_price
          //   : 0,
          floor_price_7: 0,
          // current_data.length > 1007
          //   ? current_data[current_data.length - 1008].floor_price
          //   : 0,
          total_volume: Number.parseFloat(
            formatNearAmount(collectionStats.data.results.volume).replace(
              ",",
              ""
            )
          ),
          instant_volume: 0,
          // current_data.length > 0
          //   ? Number.parseFloat(
          //       formatNearAmount(stats.data.results.volume).replace(
          //         ",",
          //         ""
          //       )
          //     ) - current_data[current_data.length - 1].total_volume
          //   : 0,
          day_volume: 0,
          // current_data.length > 143
          //   ? Number.parseFloat(
          //       formatNearAmount(stats.data.results.volume).replace(
          //         ",",
          //         ""
          //       )
          //     ) - current_data[current_data.length - 143].total_volume
          //   : 0,
        };
      }

      trx = {
        updateOne: {
          filter: { name: collectionName },
          update: {
            $push: { statistics: stat },
          },
          upsert: true,
        },
      };
      transactions.push(trx);
    }

    const result = await collectionModel.bulkWrite(transactions);

    console.log("result", result);
    console.log("done bulkInsertTrendingCollectionData");
  } catch (error) {
    console.error(`${bulkInsertCollectionData.name} error:`, error);
  }
};

const init = () =>
  mongoose
    .connect(DB_CONNECTION)
    .then((v) => {
      console.log(`mongodb database connected`);
    })
    .catch((e) => {
      console.error(`mongodb error ${e}`);
    });

module.exports = {
  init,
  bulkInsertCollectionData,
};
