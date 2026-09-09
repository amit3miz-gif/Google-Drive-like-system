const mongoose = require("mongoose");

const pictureSchema = new mongoose.Schema(
  {
    pictureId: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    data: {
      type: String,      // base64
      required: true,
    },
    contentType: {
      type: String,      // image/png / image/jpeg ...
      required: true,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("pictures", pictureSchema);
