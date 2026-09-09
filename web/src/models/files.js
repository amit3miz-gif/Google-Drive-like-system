const mongoose = require("mongoose");

const fileSchema = new mongoose.Schema(
  {
    id: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    name: {
      type: String,
      required: true,
    },
    type: {
      type: String,
      required: true,
      enum: ["file", "folder"],
      default: "file",
    },
    parentId: {
      type: String,
      default: null,
      index: true,
    },
    ownerId: {
      type: String,
      required: true,
      index: true,
    },
  },
  { timestamps: true }
);

// listing children quickly
fileSchema.index({ ownerId: 1, parentId: 1 });

module.exports = mongoose.model("File", fileSchema);