const mongoose = require("mongoose");

const userSchema = new mongoose.Schema(
  {
    id: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    username: {
      type: String,
      required: true,
      unique: true,         
      index: true,
    },

    name: {
      type: String,
      required: true,
    },

    passwordHash: {
      type: String,
      required: true,
    },
    passwordSalt: {
      type: String,
      required: true,
    },
    passwordIterations: {
      type: Number,
      required: true,
    },
    passwordDigest: {
      type: String,
      required: true,
    },

    pictureId: {
      type: String,
      required: true,
    },
  },
  {
    timestamps: true, // createdAt, updatedAt
  }
);

module.exports = mongoose.model("users", userSchema);
