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
    created_at_date: String,
    instant_volume: Number,
    day_volume: Number,
  },
  {
    _id: true,
    timestamps: {
      createdAt: "created_at",
      updatedAt: "updated_at",
    },
  }
);

const tempStatisticsSchema = new mongoose.Schema(
  {
    name: String,
    statistics: [statisticsSchema],
  },
  {
    timestamps: {
      createdAt: "created_at",
      updatedAt: "updated_at",
    },
  }
);

const tempStatisticsModel = mongoose.model(
  "tempStatistics",
  tempStatisticsSchema
);

module.exports = tempStatisticsModel;
