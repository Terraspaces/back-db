const mongoose = require("mongoose");
const { Schema } = mongoose;

const dropSchema = new mongoose.Schema(
  {
    discord: String,
    has_near_grant: Boolean,
    id: String,
    image_link: String,
    info: String,
    mint_date: Number,
    name: String,
    price: Number,
    supply: Number,
    twitter: String,
    user_vote: [],
    vote_count: Number,
    website: String,
    likes: [String],
  },
  {
    timestamps: {
      createdAt: "created_at", // Use `created_at` to store the created date
      updatedAt: "updated_at", // and `updated_at` to store the last updated date
    },
  }
);

const dropModel = mongoose.model("drop", dropSchema);

module.exports = dropModel;
