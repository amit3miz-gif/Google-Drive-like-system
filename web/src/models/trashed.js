const mongoose = require("mongoose");

const TrashEntrySchema = new mongoose.Schema(
  {
    userId: { type: String, required: true, index: true },
    fileId: { type: String, required: true, index: true },

    // Keep ms timestamp like your current trashStore
    trashedAt: { type: Number, required: true },
  },
  { timestamps: true }
);

TrashEntrySchema.index({ userId: 1, fileId: 1 }, { unique: true });
TrashEntrySchema.index({ userId: 1, trashedAt: -1 });

module.exports = mongoose.model("TrashEntry", TrashEntrySchema);