import { MongoClient, Db } from 'mongodb';

let client: MongoClient | null = null;
let clientPromise: Promise<MongoClient> | null = null;

let lastFailureTime = 0;
const RETRY_COOLDOWN_MS = 30000;

declare global {
  // eslint-disable-next-line no-var
  var _mongoClientPromise: Promise<MongoClient> | undefined;
  // eslint-disable-next-line no-var
  var _mongoLastFailureTime: number | undefined;
  // eslint-disable-next-line no-var
  var _mongoConnectingPromise: Promise<MongoClient | null> | undefined;
}

function getSanitizedUri(): string {
  return process.env.MONGODB_URI?.trim() || '';
}

export async function getMongoClient(): Promise<MongoClient | null> {
  const uri = getSanitizedUri();
  if (!uri) {
    return null;
  }

  // If connection failed recently, respect cooldown to prevent request stalling
  const lastFail = global._mongoLastFailureTime || lastFailureTime;
  if (lastFail && Date.now() - lastFail < RETRY_COOLDOWN_MS) {
    return null;
  }

  // Deduplicate concurrent connection attempts
  if (global._mongoConnectingPromise) {
    return await global._mongoConnectingPromise;
  }

  const doConnect = async (): Promise<MongoClient | null> => {
    try {
      if (process.env.NODE_ENV === 'development') {
        if (!global._mongoClientPromise) {
          client = new MongoClient(uri, {
            serverSelectionTimeoutMS: 4000,
            connectTimeoutMS: 6000,
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
            serverSelectionTimeoutMS: 2500,
            connectTimeoutMS: 5000,
          });
          clientPromise = client.connect().catch((err: unknown) => {
            clientPromise = null;
            throw err;
          });
        }
        return await clientPromise;
      }
    } catch (error: any) {
      const now = Date.now();
      global._mongoLastFailureTime = now;
      lastFailureTime = now;
      global._mongoClientPromise = undefined;
      clientPromise = null;

      const errMsg = error?.message || String(error);
      const isSslAlert = errMsg.includes('alert number 80') || errMsg.includes('tlsv1 alert') || errMsg.includes('ERR_SSL_TLSV1_ALERT_INTERNAL_ERROR');

      if (isSslAlert) {
        console.warn(
          '\n⚠️  [MongoDB Atlas Connection Notice]\n' +
          'TLS Handshake rejected (SSL alert 80): Current public IP is not in MongoDB Atlas Network Access whitelist.\n' +
          '👉 Fix: Add your IP or 0.0.0.0/0 in MongoDB Atlas dashboard -> Security -> Network Access.\n' +
          '⚡ Running with seamless local file storage fallback in the meantime.\n'
        );
      } else {
        console.warn('[MongoDB] Connection unavailable:', errMsg);
      }
      return null;
    } finally {
      global._mongoConnectingPromise = undefined;
    }
  };

  global._mongoConnectingPromise = doConnect();
  return await global._mongoConnectingPromise;
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
