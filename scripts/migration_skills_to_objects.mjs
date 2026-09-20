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

function transformSkill(item, docId, pathName) {
  if (item === null || item === undefined) return null;
  if (typeof item === 'string') {
    return {
      name: item,
      level: null,
      source: 'legacy',
      verification: null,
    };
  }
  if (typeof item === 'object' && item.name) {
    // Already an object, preserve untouched
    return item;
  }
  console.warn(`[WARN] Unexpected item in ${pathName} on doc ${docId}:`, item);
  return item;
}

function transformSkillsArray(arr, docId, pathName) {
  if (!Array.isArray(arr)) return { changed: false, result: arr, stringsTransformed: 0, objectsUntouched: 0 };
  let changed = false;
  let stringsTransformed = 0;
  let objectsUntouched = 0;

  const result = arr.map((item) => {
    if (typeof item === 'string') {
      changed = true;
      stringsTransformed++;
      return transformSkill(item, docId, pathName);
    }
    if (typeof item === 'object' && item !== null) {
      objectsUntouched++;
      return item;
    }
    return item;
  });

  return { changed, result, stringsTransformed, objectsUntouched };
}

async function runMigrationOnCollection(col, isDryRun = false) {
  const allDocs = await col.find({}).toArray();
  let docsModified = 0;
  let totalStringsTransformed = 0;
  let totalDraftStringsTransformed = 0;
  let totalObjectsUntouched = 0;

  for (const doc of allDocs) {
    const skillsTransform = transformSkillsArray(doc.Skills, doc._id, 'Skills');
    let draftSkillsTransform = { changed: false, result: null, stringsTransformed: 0, objectsUntouched: 0 };

    if (doc.EditorDraft && Array.isArray(doc.EditorDraft.Skills)) {
      draftSkillsTransform = transformSkillsArray(doc.EditorDraft.Skills, doc._id, 'EditorDraft.Skills');
    }

    if (skillsTransform.changed || draftSkillsTransform.changed) {
      docsModified++;
      totalStringsTransformed += skillsTransform.stringsTransformed;
      totalDraftStringsTransformed += draftSkillsTransform.stringsTransformed;
      totalObjectsUntouched += skillsTransform.objectsUntouched + draftSkillsTransform.objectsUntouched;

      if (!isDryRun) {
        const update = {};
        if (skillsTransform.changed) {
          update['Skills'] = skillsTransform.result;
        }
        if (draftSkillsTransform.changed) {
          update['EditorDraft.Skills'] = draftSkillsTransform.result;
        }
        await col.updateOne({ _id: doc._id }, { $set: update });
      }
    }
  }

  return {
    totalDocs: allDocs.length,
    docsModified,
    totalStringsTransformed,
    totalDraftStringsTransformed,
    totalObjectsUntouched,
  };
}

async function main() {
  console.log('=== STARTING SKILLS-TO-OBJECTS MIGRATION ===\n');

  const client = new MongoClient(URI);
  await client.connect();
  const db = client.db(DB_NAME);

  const mainCol = db.collection('ProfessionalProfiles');
  const count = await mainCol.countDocuments();
  console.log(`1. Connected to ${DB_NAME}. Total ProfessionalProfiles documents: ${count}`);

  // 1. Create Snapshot
  const timestamp = new Date().toISOString().replace(/[-:T]/g, '').slice(0, 14);
  const snapshotName = `professionalProfiles_backup_skills_${timestamp}`;
  console.log(`\n2. Creating pre-migration snapshot: ${snapshotName}...`);

  const originalDocs = await mainCol.find({}).toArray();
  const snapshotCol = db.collection(snapshotName);
  await snapshotCol.insertMany(originalDocs.map(d => ({ ...d })));
  const snapshotCount = await snapshotCol.countDocuments();
  console.log(`   Snapshot created successfully with ${snapshotCount} documents.`);

  // 2. Test run against scratch copy
  console.log('\n3. Running dry-run validation on scratch collection...');
  const testColName = `scratch_test_skills_migration_${timestamp}`;
  const testCol = db.collection(testColName);
  await testCol.insertMany(originalDocs.map(d => ({ ...d })));

  const testResult = await runMigrationOnCollection(testCol, false);
  console.log(`   Scratch Test Result:`, testResult);

  // Verify idempotency on scratch
  const idempotencyTest = await runMigrationOnCollection(testCol, false);
  console.log(`   Scratch Idempotency Run:`, idempotencyTest);
  if (idempotencyTest.docsModified !== 0) {
    throw new Error('Idempotency check failed on scratch collection!');
  }
  await testCol.drop();
  console.log(`   Scratch collection cleaned up.`);

  // 3. Run on production collection
  console.log('\n4. Executing migration on live ProfessionalProfiles collection...');
  const liveResult = await runMigrationOnCollection(mainCol, false);
  console.log(`   Live Migration Execution Result:`);
  console.log(`     - Total Documents: ${liveResult.totalDocs}`);
  console.log(`     - Documents Modified: ${liveResult.docsModified}`);
  console.log(`     - Published Skill Strings Transformed: ${liveResult.totalStringsTransformed}`);
  console.log(`     - Draft Skill Strings Transformed: ${liveResult.totalDraftStringsTransformed}`);

  // 4. Verify live idempotency
  console.log('\n5. Verifying live idempotency...');
  const liveIdempotency = await runMigrationOnCollection(mainCol, false);
  console.log(`     - Second Run Documents Modified: ${liveIdempotency.docsModified} (Expected: 0)`);
  if (liveIdempotency.docsModified !== 0) {
    throw new Error('Live idempotency verification failed!');
  }

  // 5. Inspect and display samples
  console.log('\n6. Inspecting migrated document samples:');
  const sampleSlugs = ['sirajul9550gmail-com', 'providermondial-com', 'system-404fightersgmail-com-2'];
  for (const slug of sampleSlugs) {
    const doc = await mainCol.findOne({ PublicSlug: slug });
    if (doc) {
      console.log(`\nSample: ${slug} (${doc.UserId}):`);
      console.log('  Published Skills:', JSON.stringify(doc.Skills, null, 2));
      if (doc.EditorDraft) {
        console.log('  EditorDraft Skills:', JSON.stringify(doc.EditorDraft.Skills, null, 2));
      }
    }
  }

  console.log('\n=== MIGRATION COMPLETED SUCCESSFULLY ===');
  console.log(`Snapshot Collection: ${snapshotName}`);
  console.log(`Safe Drop Date: 30 days from today`);

  await client.close();
}

main().catch(err => {
  console.error('Migration failed:', err);
  process.exit(1);
});
