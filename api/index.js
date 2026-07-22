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
        if (filter.customer_number !== undefined) {
          const val = String(filter.customer_number).trim();
          result = await coll.findOne({ $expr: { $eq: [{ $toString: "$customer_number" }, val] } }, { projection });
          if (!result) {
            result = await coll.findOne({ customer_number: val }, { projection });
          }
          if (!result) {
            const numVal = Number(val);
            if (!isNaN(numVal)) result = await coll.findOne({ customer_number: numVal }, { projection });
          }
        } else {
          result = await coll.findOne(filter, { projection });
        }
        return res.status(200).json({ document: result || null });

      case 'find':
        result = await coll.find(filter).project(projection).sort(sort).limit(limit).toArray();
        return res.status(200).json({ documents: result });

      case 'updateMany':
        result = await coll.updateMany(filter, document);
        return res.status(200).json({ matchedCount: result.matchedCount, modifiedCount: result.modifiedCount });

      case 'aggregate':
        result = await coll.aggregate(filter).toArray();
        return res.status(200).json({ documents: result });

      case 'deleteMany':
        result = await coll.deleteMany(filter);
        return res.status(200).json({ deletedCount: result.deletedCount });

      case 'insertOne':
        result = await coll.insertOne(document);
        return res.status(200).json({ insertedId: result.insertedId });

      case 'insertMany':
        result = await coll.insertMany(documents);
        return res.status(200).json({ insertedIds: result.insertedIds });

      case 'replaceOne':
        if (filter.customer_number !== undefined) {
          const cnVal = String(filter.customer_number).trim();
          let existing = await coll.findOne({ $expr: { $eq: [{ $toString: "$customer_number" }, cnVal] } });
          if (!existing) existing = await coll.findOne({ customer_number: cnVal });
          if (!existing) {
            const cnNum = Number(cnVal);
            if (!isNaN(cnNum)) existing = await coll.findOne({ customer_number: cnNum });
          }
          if (existing) {
            const { _id, ...rest } = replacement;
            result = await coll.replaceOne({ _id: existing._id }, { ...rest, customer_number: cnVal });
            return res.status(200).json({ matchedCount: 1, modifiedCount: result.modifiedCount, upsertedCount: 0 });
          } else {
            await coll.insertOne({ ...replacement, customer_number: cnVal });
            return res.status(200).json({ matchedCount: 0, modifiedCount: 0, upsertedCount: 1 });
          }
        } else {
          result = await coll.replaceOne(filter, replacement, { upsert: true });
        }
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
