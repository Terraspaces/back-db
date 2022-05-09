const dbConnection = `mongodb://${process.env.MONGODB_USER}:${process.env.MONGODB_PASS}@${process.env.MONGODB_HOST}/${process.env.MONGODB_DB}?authSource=admin`;
const mongoose = require("mongoose");
const trendingCollectionModel = require("./model/trendingCollection");

const bulkInsertTrendingCollectionData = async (collections) => {
  try {
    const transactions = [];
    let trx = {};
    let m;

    for (const key in collections) {
      if (Object.hasOwnProperty.call(collections, key)) {
        const value = collections[key];
        trx = {
          updateOne: {
            filter: { name: key },
            update: {
              $set: { name: key, value: value },
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
