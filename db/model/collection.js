const mongoose = require("mongoose");
const { Schema } = mongoose;

const statisticsSchema = new mongoose.Schema(
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
  {
    _id: false,
    timestamps: {
      createdAt: "created_at", // Use `created_at` to store the created date
      // updatedAt: "updated_at", // and `updated_at` to store the last updated date
    },
  }
);

const collectionSchema = new mongoose.Schema(
  {
    name: String,
    statistics: [statisticsSchema],
  },
  {
    timestamps: {
      createdAt: "created_at", // Use `created_at` to store the created date
      updatedAt: "updated_at", // and `updated_at` to store the last updated date
    },
  }
);

const collectionModel = mongoose.model("collection", collectionSchema);

module.exports = collectionModel;
