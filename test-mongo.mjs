import { MongoClient } from 'mongodb';
import fs from 'fs';
import path from 'path';

// Parse .env or .env.local if present
function loadEnv() {
  for (const file of ['.env.local', '.env']) {
    const fullPath = path.resolve(process.cwd(), file);
    if (fs.existsSync(fullPath)) {
      const content = fs.readFileSync(fullPath, 'utf8');
      content.split('\n').forEach(line => {
        const trimmed = line.trim();
        if (trimmed && !trimmed.startsWith('#')) {
          const eqIdx = trimmed.indexOf('=');
          if (eqIdx !== -1) {
            const key = trimmed.slice(0, eqIdx).trim();
            let val = trimmed.slice(eqIdx + 1).trim();
            if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
              val = val.slice(1, -1);
            }
            if (!process.env[key]) {
              process.env[key] = val;
            }
          }
        }
      });
      break;
    }
  }
}

loadEnv();

const uri = process.env.MONGODB_URI || 'mongodb+srv://tasknera:tasknera%402003@cluster0.2ba7uww.mongodb.net/tasknera?retryWrites=true&w=majority';

console.log('----------------------------------------------------');
console.log('📡 Testing MongoDB Atlas Connectivity...');
console.log('----------------------------------------------------');
console.log('URI:', uri.replace(/:([^:@]+)@/, ':****@'));

const client = new MongoClient(uri, {
  serverSelectionTimeoutMS: 5000,
  connectTimeoutMS: 10000,
});

async function main() {
  const startTime = Date.now();
  try {
    console.log('⏳ Connecting to MongoDB cluster...');
    await client.connect();
    const latency = Date.now() - startTime;
    console.log(`✅ Connected successfully in ${latency}ms!`);

    const db = client.db('tasknera');

    // 1. Ping database
    console.log('⏳ Pinging database "tasknera"...');
    const pingResult = await db.command({ ping: 1 });
    console.log('✅ Ping response:', pingResult);

    // 2. List collections
    console.log('⏳ Listing collections...');
    const collections = await db.listCollections().toArray();
    console.log(`📋 Found ${collections.length} collection(s):`, collections.map(c => c.name));

    // 3. Inspect campaigns collection
    const campaignsCol = db.collection('campaigns');
    const campaignsCount = await campaignsCol.countDocuments();
    console.log(`📊 "campaigns" count: ${campaignsCount}`);

    // 4. Inspect settings collection
    const settingsCol = db.collection('settings');
    const settingsCount = await settingsCol.countDocuments();
    console.log(`⚙️ "settings" count: ${settingsCount}`);

    // 5. Test write and read validation
    console.log('⏳ Testing read/write operations...');
    const testCol = db.collection('connectivity_test');
    const testDoc = { testId: 'conn-' + Date.now(), createdAt: new Date() };
    await testCol.insertOne(testDoc);
    const foundDoc = await testCol.findOne({ testId: testDoc.testId });
    if (foundDoc) {
      console.log('✅ Write & Read test verified successfully!');
      await testCol.deleteOne({ testId: testDoc.testId });
    }

    console.log('----------------------------------------------------');
    console.log('🎉 ALL DATABASE CONNECTIVITY CHECKS PASSED!');
    console.log(`📡 Cluster: Atlas (tasknera) | Campaigns: ${campaignsCount} | Settings: ${settingsCount}`);
    console.log('----------------------------------------------------');
  } catch (error) {
    console.error('❌ MongoDB Connectivity Error:', error.message);
    if (error.cause) {
      console.error('Cause:', error.cause);
    }
    process.exit(1);
  } finally {
    await client.close();
  }
}

main();
