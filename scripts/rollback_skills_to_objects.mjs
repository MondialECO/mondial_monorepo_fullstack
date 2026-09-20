import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { MongoClient } from 'mongodb';

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
  const snapshotName = process.argv[2];
  if (!snapshotName) {
    console.error('Usage: node rollback_skills_to_objects.mjs <snapshot_collection_name>');
    process.exit(1);
  }

  console.log(`Connecting to MongoDB...`);
  const client = new MongoClient(URI);
  await client.connect();
  const db = client.db(DB_NAME);

  const backupCol = db.collection(snapshotName);
  const backupCount = await backupCol.countDocuments();
  if (backupCount === 0) {
    console.error(`Snapshot collection ${snapshotName} is empty or does not exist.`);
    await client.close();
    process.exit(1);
  }

  console.log(`Found ${backupCount} documents in snapshot ${snapshotName}. Restoring ProfessionalProfiles...`);
  const backupDocs = await backupCol.find({}).toArray();

  const targetCol = db.collection('ProfessionalProfiles');
  for (const doc of backupDocs) {
    const { _id, ...fields } = doc;
    await targetCol.replaceOne({ _id }, doc, { upsert: true });
  }

  console.log(`Rollback completed. Restored ${backupDocs.length} documents to ProfessionalProfiles.`);
  await client.close();
}

main().catch(err => {
  console.error('Rollback failed:', err);
  process.exit(1);
});
