const { createTcpClientFromEnv } = require('../tcp/tcpClient'); // TCP client wrapper talking to Exercise 2 server
const store = require('../store/files');
const { canRead } = require('./permissions');

const CONTENT_PREFIX = 'b64:';

// Decode content stored with 'b64:' prefix
function decodeContent(maybeEncoded) {
  if (typeof maybeEncoded !== 'string') return '';
  if (!maybeEncoded.startsWith(CONTENT_PREFIX)) return maybeEncoded;

  const b64 = maybeEncoded.slice(CONTENT_PREFIX.length);
  try {
    return Buffer.from(b64, 'base64').toString('utf8');
  } catch {
    return '';
  }
}

// Helper function to get file content from Exercise 2 server by ID
async function getFileContent(client, id) {
  const { statusCode, bodyLines } = await client.sendCommand(`get ${id}`);

  if (statusCode === 404) return null;

  if (statusCode !== 200) {
    const err = new Error('500 Internal Server Error');
    err.status = 500;
    throw err;
  }

  const raw = (bodyLines && bodyLines.length > 0) ? bodyLines.join('\n') : '';
  return decodeContent(raw);
}

// Check if the file name indicates a text file
function isTxtFileName(name) {
  return String(name || '').toLowerCase().endsWith('.txt');
}

// Performs a search by delegating to the Exercise 2 TCP server
async function searchFiles(userId, query) {
  if (!userId) {
    const err = new Error('Unauthorized');
    err.status = 401;
    throw err;
  }

  const q = String(query ?? '').trim();
  if (!q) {
    const err = new Error('Query is required');
    err.status = 400;
    throw err;
  }

  const client = createTcpClientFromEnv();

  try {
    await client.connect();

    // Search by name (Mongo) and keep only readable items
    const itemsByName = await store.searchByName(q);
    const resultsById = new Map();

    for (const item of itemsByName) {
      if (await canRead(userId, item)) {
        resultsById.set(item.id, item);
      }
    }

    // Search by content: iterate readable FILES and check decoded content from Ex2
    const allItems = await store.listAll();

    for (const item of allItems) {
      if (item.type !== 'file') continue;
      if (resultsById.has(item.id)) continue;

      // Only search inside text files
      if (!isTxtFileName(item.name)) continue;

      if (!(await canRead(userId, item))) continue;

      const content = await getFileContent(client, item.id);
      if (content && String(content).toLowerCase().includes(q.toLowerCase())) {
        resultsById.set(item.id, item);
      }
    }

    return Array.from(resultsById.values());
  } catch (err) {
    if (!err.status) err.status = 500;
    throw err;
  } finally {
    client.close();
  }
}

module.exports = {
  searchFiles,
};
