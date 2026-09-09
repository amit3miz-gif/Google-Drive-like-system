const Picture = require("../models/pictures");

// Add picture and return pictureId
async function addPicture(pictureId, data, contentType) {
  // Upsert is safe in case the id already exists
  await Picture.updateOne(
    { pictureId },
    { $set: { pictureId, data, contentType } },
    { upsert: true }
  );
  return pictureId;
}

// Get picture object: { data, contentType } or null
async function getPicture(pictureId) {
  if (!pictureId) return null;
  const doc = await Picture.findOne({ pictureId }).lean();
  if (!doc) return null;
  return { data: doc.data, contentType: doc.contentType };
}

module.exports = {
  addPicture,
  getPicture,
};
