const mongoose = require("mongoose");

const StarEntrySchema = new mongoose.Schema(
  {
    userId: { type: String, required: true, index: true },
    fileId: { type: String, required: true, index: true },
  },
  { timestamps: true }
);

// ensure a user has only one star entry per file
StarEntrySchema.index({ userId: 1, fileId: 1 }, { unique: true });

module.exports = mongoose.model("StarEntry", StarEntrySchema);