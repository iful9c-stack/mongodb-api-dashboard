const { MongoClient } = require('mongodb');

const MONGO_URI = process.env.MONGO_URI;
const API_SECRET = process.env.API_SECRET || 'dashboard-fo-secret';
const DB_NAME = 'dashboard_fo';

let cachedClient = null;
let cachedDb = null;

async function getDb() {
  if (cachedDb) return cachedDb;
  cachedClient = await MongoClient.connect(MONGO_URI);
  cachedDb = cachedClient.db(DB_NAME);
  return cachedDb;
}

module.exports = async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  try {
    const { action, collection, filter = {}, document = {}, replacement = {}, documents = [], projection = {}, sort = {}, limit = 0, secret } = req.body;

    if (secret !== API_SECRET) return res.status(401).json({ error: 'Unauthorized' });

    const db = await getDb();
    const coll = db.collection(collection);
    let result;

    switch (action) {
      case 'findOne':
        result = await coll.findOne(filter, { projection });
        return res.status(200).json({ document: result || null });

      case 'find':
        result = await coll.find(filter).project(projection).sort(sort).limit(limit).toArray();
        return res.status(200).json({ documents: result });

      case 'insertOne':
        result = await coll.insertOne(document);
        return res.status(200).json({ insertedId: result.insertedId });

      case 'insertMany':
        result = await coll.insertMany(documents);
        return res.status(200).json({ insertedIds: result.insertedIds });

      case 'replaceOne':
        result = await coll.replaceOne(filter, replacement, { upsert: true });
        return res.status(200).json({
          matchedCount: result.matchedCount,
          modifiedCount: result.modifiedCount,
          upsertedCount: result.upsertedCount || 0
        });

      default:
        return res.status(400).json({ error: 'Unknown action: ' + action });
    }
  } catch (e) {
    console.error('Error:', e);
    return res.status(500).json({ error: e.message });
  }
};
