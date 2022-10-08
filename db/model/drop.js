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
      createdAt: "created_at",
      updatedAt: "updated_at",
    },
  }
);

const dropModel = mongoose.model("drop", dropSchema);

module.exports = dropModel;
