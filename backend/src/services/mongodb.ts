import { MongoClient, Db } from 'mongodb';

let client: MongoClient | null = null;
let db: Db | null = null;

function getSanitizedUri(): string {
  let uri = process.env.MONGODB_URI || '';
  if (!uri) return '';
  if (uri.includes('Tasknera%402003')) {
    uri = uri.replace('Tasknera%402003', 'tasknera%402003');
  }
  return uri;
}

export async function getMongoDb(dbName = 'tasknera'): Promise<Db | null> {
  const uri = getSanitizedUri();
  if (!uri) return null;

  if (db) return db;

  try {
    if (!client) {
      client = new MongoClient(uri, {
        serverSelectionTimeoutMS: 5000,
        connectTimeoutMS: 10000,
      });
      await client.connect();
      console.log(' Connected to MongoDB Atlas (tasknera)');
    }
    db = client.db(dbName);
    return db;
  } catch (error) {
    console.error(' MongoDB Connection Error:', error);
    client = null;
    db = null;
    return null;
  }
}

export async function checkBackendDbHealth(dbName = 'tasknera'): Promise<{
  connected: boolean;
  latencyMs?: number;
  database: string;
  collections?: string[];
  error?: string;
}> {
  const startTime = Date.now();
  try {
    const database = await getMongoDb(dbName);
    if (!database) {
      return {
        connected: false,
        database: dbName,
        error: 'Unable to connect to MongoDB cluster'
      };
    }
    await database.command({ ping: 1 });
    const cols = await database.listCollections().toArray();
    return {
      connected: true,
      latencyMs: Date.now() - startTime,
      database: dbName,
      collections: cols.map(c => c.name)
    };
  } catch (err: any) {
    return {
      connected: false,
      database: dbName,
      error: err?.message || 'MongoDB health check ping failed'
    };
  }
}
