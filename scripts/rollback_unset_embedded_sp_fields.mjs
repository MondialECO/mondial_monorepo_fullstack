import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

function getMongoUri() {
  if (process.env.MONGODB_URI) return process.env.MONGODB_URI;
  try {
    const appSettingsPath = path.resolve(__dirname, '../backend/appsettings.Development.json');
    const settings = JSON.parse(fs.readFileSync(appSettingsPath, 'utf8'));
    return settings?.MongoDbSettings?.ConnectionString;
  } catch {
    return null;
  }
}

const URI = getMongoUri();
if (!URI) {
  console.error('Missing MONGODB_URI environment variable or backend/appsettings.Development.json configuration.');
  process.exit(1);
}
const DB_NAME = 'MondialEcoDev';

async function main() {
  const client = new MongoClient(URI);
  try {
    await client.connect();
    console.log('Connected to MongoDB.');
    const db = client.db(DB_NAME);

    // Find the latest snapshot collection
    const collections = await db.listCollections().toArray();
    const backupCols = collections
      .map(c => c.name)
      .filter(n => n.startsWith('applicationUsers_backup_sp_'))
      .sort()
      .reverse();

    if (backupCols.length === 0) {
      throw new Error('No backup collections found to restore from!');
    }

    const latestBackup = backupCols[0];
    console.log(`Restoring from latest snapshot: ${latestBackup}`);

    const backupCol = db.collection(latestBackup);
    const usersCol = db.collection('applicationUsers');

    const backupDocs = await backupCol.find().toArray();
    console.log(`Found ${backupDocs.length} documents in snapshot.`);

    let restoredCount = 0;
    for (const doc of backupDocs) {
      const res = await usersCol.updateOne(
        { _id: doc._id },
        { $set: { ServiceProviderProfile: doc.ServiceProviderProfile } }
      );
      if (res.modifiedCount > 0 || res.matchedCount > 0) {
        restoredCount++;
      }
    }

    console.log(`Restored ServiceProviderProfile for ${restoredCount} documents.`);
    console.log('Rollback complete.');
  } finally {
    await client.close();
  }
}

main().catch(err => {
  console.error('Rollback failed:', err);
  process.exit(1);
});
