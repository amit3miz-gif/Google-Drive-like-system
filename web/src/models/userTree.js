const mongoose = require("mongoose");

const userTreeSchema = new mongoose.Schema(
  {
    userId: {
      type: String,
      required: true,
      index: true,
    },
    fileId: {
      type: String,
      required: true,
      index: true,
    },
    parentId: {
      type: String,
      default: null,
    },
  },
  { timestamps: true }
);

// ensure a user has only one entry per file
userTreeSchema.index({ userId: 1, fileId: 1 }, { unique: true });

module.exports = mongoose.model("UserTree", userTreeSchema);
