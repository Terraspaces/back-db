const mongoose = require("mongoose");
const { Schema } = mongoose;

const trendingCollectionSchema = new mongoose.Schema({
  name: String,
  value: [
    {
      total_items: Number,
      total_listed: Number,
      total_owners: Number,
      floor_price: Number,
      floor_price_24: Number,
      floor_price_7: Number,
      total_volume: Number,
      instant_volume: Number,
      day_volume: Number,
    },
  ],
});

const trendingCollectionModel = mongoose.model(
  "trendingCollection",
  trendingCollectionSchema
);

module.exports = trendingCollectionModel;
