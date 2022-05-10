const dbConnection = `mongodb://${process.env.MONGODB_USER}:${process.env.MONGODB_PASS}@${process.env.MONGODB_HOST}:${process.env.MONGODB_PORT}/${process.env.MONGODB_DB}?authSource=admin`;
console.log("dbConnection", dbConnection);
const mongoose = require("mongoose");
const trendingCollectionModel = require("./model/trendingCollection");
var fetchUrl = require("fetch").fetchUrl;
const FETCH_URL = process.env.FETCH_URL;

const bulkInsertTrendingCollectionData = async (collections) => {
  try {
    const transactions = [];
    let trx = {};

    for (const key in collections) {
      if (Object.hasOwnProperty.call(collections, key)) {
        fetchUrl(FETCH_URL + key, async (error, meta, body) => {
          const trendingC = await trendingCollectionModel.findOne({
            name: key,
          });

          const current_data = trendingC ? trendingC.value : [];
          if (error == undefined) {
            const stats = JSON.parse(body.toString());
            if (stats.data.results._id != undefined) {
              current_data.push({
                total_items: stats.data.results.total_cards,
                total_listed: stats.data.results.total_card_sale,
                total_owners: stats.data.results.total_owners,
                floor_price: Number.parseFloat(
                  formatNearAmount(stats.data.results.floor_price).replace(
                    ",",
                    ""
                  )
                ),
                floor_price_24:
                  current_data.length > 143
                    ? current_data[current_data.length - 144].floor_price
                    : 0,
                floor_price_7:
                  current_data.length > 1007
                    ? current_data[current_data.length - 1008].floor_price
                    : 0,
                total_volume: Number.parseFloat(
                  formatNearAmount(stats.data.results.volume).replace(",", "")
                ),
                instant_volume:
                  current_data.length > 0
                    ? Number.parseFloat(
                        formatNearAmount(stats.data.results.volume).replace(
                          ",",
                          ""
                        )
                      ) - current_data[current_data.length - 1].total_volume
                    : 0,
                day_volume:
                  current_data.length > 143
                    ? Number.parseFloat(
                        formatNearAmount(stats.data.results.volume).replace(
                          ",",
                          ""
                        )
                      ) - current_data[current_data.length - 143].total_volume
                    : 0,
              });
            } else {
              if (current_data.length == 0) {
                current_data.push({
                  total_items: 0,
                  total_listed: 0,
                  total_owners: 0,
                  floor_price: 0,
                  floor_price_24: 0,
                  floor_price_7: 0,
                  total_volume: 0,
                  instant_volume: 0,
                  day_volume: 0,
                });
              } else current_data.push(current_data[current_data.length - 1]);
            }
          } else {
            if (current_data.length == 0) {
              current_data.push({
                total_items: 0,
                total_listed: 0,
                total_owners: 0,
                floor_price: 0,
                floor_price_24: 0,
                floor_price_7: 0,
                total_volume: 0,
                instant_volume: 0,
                day_volume: 0,
              });
            } else current_data.push(current_data[current_data.length - 1]);
            console.log(error);
          }
        });

        const value = collections[key];
        trx = {
          updateOne: {
            filter: { name: key },
            update: {
              $set: { name: key, value: current_data },
            },
            upsert: true,
          },
        };

        transactions.push(trx);
      }
    }
    const result = await trendingCollectionModel.bulkWrite(transactions);

    console.log("result", result);
    console.log("done bulkInsertTrendingCollectionData");
  } catch (error) {
    console.error(`${bulkInsertTrendingCollectionData.name} error:`, error);
  }
};

const init = () =>
  mongoose
    .connect(dbConnection)
    .then((v) => {
      console.log("mongodb database connected");
    })
    .catch((e) => {
      console.error(`mongodb error ${e}`);
    });

module.exports = {
  init,
  bulkInsertTrendingCollectionData,
};
