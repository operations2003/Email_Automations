import { MongoClient, Db } from 'mongodb';

let client: MongoClient | null = null;
let clientPromise: Promise<MongoClient> | null = null;

declare global {
  // eslint-disable-next-line no-var
  var _mongoClientPromise: Promise<MongoClient> | undefined;
}

function getSanitizedUri(): string {
  let uri = process.env.MONGODB_URI || '';
  if (!uri) return '';
  // If the user provided unencoded @ in password or uppercase Tasknera%402003, ensure it resolves properly
  if (uri.includes('Tasknera%402003')) {
    uri = uri.replace('Tasknera%402003', 'tasknera%402003');
  }
  return uri;
}

export async function getMongoClient(): Promise<MongoClient | null> {
  const uri = getSanitizedUri();
  if (!uri) {
    return null;
  }

  try {
    if (process.env.NODE_ENV === 'development') {
      if (!global._mongoClientPromise) {
        client = new MongoClient(uri, {
          serverSelectionTimeoutMS: 5000,
          connectTimeoutMS: 10000,
        });
        global._mongoClientPromise = client.connect().catch((err: unknown) => {
          global._mongoClientPromise = undefined;
          throw err;
        });
      }
      return await global._mongoClientPromise;
    } else {
      if (!clientPromise) {
        client = new MongoClient(uri, {
          serverSelectionTimeoutMS: 5000,
          connectTimeoutMS: 10000,
        });
        clientPromise = client.connect().catch((err: unknown) => {
          clientPromise = null;
          throw err;
        });
      }
      return await clientPromise;
    }
  } catch (error) {
    console.error('[MongoDB] Connection error:', error);
    global._mongoClientPromise = undefined;
    clientPromise = null;
    return null;
  }
}

export async function getDb(dbName = 'tasknera'): Promise<Db | null> {
  try {
    const mongoClient = await getMongoClient();
    if (!mongoClient) return null;
    return mongoClient.db(dbName);
  } catch (error) {
    console.error('[MongoDB] Failed to acquire database handle:', error);
    return null;
  }
}

export async function checkDbHealth(dbName = 'tasknera'): Promise<{
  connected: boolean;
  latencyMs?: number;
  database: string;
  collections?: string[];
  error?: string;
}> {
  const startTime = Date.now();
  try {
    const db = await getDb(dbName);
    if (!db) {
      return {
        connected: false,
        database: dbName,
        error: 'Unable to connect to MongoDB instance. Fallback in effect.'
      };
    }

    await db.command({ ping: 1 });
    const cols = await db.listCollections().toArray();
    return {
      connected: true,
      latencyMs: Date.now() - startTime,
      database: dbName,
      collections: cols.map((c: { name: string }) => c.name)
    };
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Database ping failed';
    return {
      connected: false,
      database: dbName,
      error: message
    };
  }
}
