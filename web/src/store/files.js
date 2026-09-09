const { randomUUID } = require("crypto");
const File = require("../models/files");

// Returns all items under a given parent (root = null)
async function list(parentId = null) {
  return await File.find({ parentId }).lean();
}

// Returns all descendants (recursively) including nested folders/files
async function getDescendants(rootId) {
  const result = [];
  const stack = [rootId];

  while (stack.length) {
    const currentParent = stack.pop();
    const kids = await list(currentParent);
    for (const kid of kids) {
      result.push(kid);
      if (kid.type === "folder") {
        stack.push(kid.id);
      }
    }
  }
  return result;
}

// Returns item by id or null
async function get(id) {
  return await File.findOne({ id }).lean();
}

// Adds a new item (name can duplicate)
async function add({ name, type = "file", parentId = null, ownerId = null }) {
  const id = randomUUID();

  const item = new File({
    id,
    name,
    type,
    parentId,
    ownerId,
  });

  await item.save();
  return item.toObject();
}

// Updates fields of an existing item
async function update(id, fields) {
  const item = await File.findOne({ id });
  if (!item) return null;

  // Update only if the property exists in the patch object
  if (Object.prototype.hasOwnProperty.call(fields, "name")) {
    item.name = fields.name;
  }
  if (Object.prototype.hasOwnProperty.call(fields, "type")) {
    item.type = fields.type;
  }
  if (Object.prototype.hasOwnProperty.call(fields, "parentId")) {
    item.parentId = fields.parentId;
  }
  if (Object.prototype.hasOwnProperty.call(fields, "ownerId")) {
    item.ownerId = fields.ownerId;
  }

  await item.save();
  return item.toObject();
}

// Removes item by id (returns removed item or null)
async function remove(id) {
  const item = await File.findOneAndDelete({ id });
  return item ? item.toObject() : null;
}

function escapeRegex(s) {
  return String(s).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}
  
// Finds all items whose logical name contains the given query
async function searchByName(query) {
  const q = String(query || "").trim();
  if (!q) return [];

  const safe = escapeRegex(q);
  return await File.find({ name: { $regex: safe, $options: 'i' } }).lean();
}

// Lists all items
async function listAll() {
  return await File.find({}).lean();
}

// Gets the full path from root to the item with given id
async function getPath(id) {
  const path = [];
  let current = await get(id);

  while (current) {
    path.push({
      id: current.id,
      name: current.name,
      parentId: current.parentId,
    });

    if (current.parentId == null) break;
    current = await get(current.parentId);
  }

  // Now path is [child, parent, ..., root] -> reverse to get [root, ..., child]
  return path.reverse();
}

async function listByOwnerAndParent(ownerId, parentId = null) {
  return await File.find({ ownerId: String(ownerId), parentId: parentId ?? null }).lean();
}

// Touch updatedAt timestamp
async function touch(id) {
  const doc = await File.findOneAndUpdate(
    { id: String(id) },
    { $currentDate: { updatedAt: true } },
    { new: true }
  ).lean();

  return doc;
}


module.exports = {
  list,
  get,
  add,
  update,
  remove,
  searchByName,
  getDescendants,
  listAll,
  getPath,
  listByOwnerAndParent,
  touch,
};
