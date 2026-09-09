const mongoose = require("mongoose");

const permissionSchema = new mongoose.Schema(
  {
    pId: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    fileId: {
      type: String,
      required: true,
      index: true,
    },
    userId: {
      type: String,
      required: true,
      index: true,
    },
    read: { type: Boolean, default: false },
    write: { type: Boolean, default: false },
    manage: { type: Boolean, default: false },
  },
  { timestamps: true }
);

// ensure a user has only one permission entry per file
permissionSchema.index({ fileId: 1, userId: 1 }, { unique: true });

module.exports = mongoose.model("Permission", permissionSchema);
