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

const FIELDS_TO_UNSET = [
  'ServiceProviderProfile.Skills',
  'ServiceProviderProfile.Headline',
  'ServiceProviderProfile.Bio',
  'ServiceProviderProfile.ProfileImage',
  'ServiceProviderProfile.CoverImage',
  'ServiceProviderProfile.ProfessionalOverview',
  'ServiceProviderProfile.Industries',
  'ServiceProviderProfile.Languages',
  'ServiceProviderProfile.LanguageProficiencies',
  'ServiceProviderProfile.Experiences',
  'ServiceProviderProfile.Education',
  'ServiceProviderProfile.Credentials',
  'ServiceProviderProfile.EditorDraft',
  'ServiceProviderProfile.ProfileVersion',
  'ServiceProviderProfile.SocialLinks'
];

const BUSINESS_FIELDS = [
  'ProviderId',
  'CurrentPhase',
  'VerificationStatus',
  'VerificationSubmittedAt',
  'VerifiedAt',
  'RejectionReason',
  'TrustScore',
  'TrustBreakdown',
  'HasEnoughTrustData',
  'SkillsTestAttempts',
  'ServiceCategories',
  'PricingModels',
  'PortfolioItems',
  'MaximumConcurrentOrders',
  'CurrentActiveOrders',
  'NewOrderAvailability',
  'ManualApprovalWhenCapacityLow',
  'FinancialSettings',
  'CreatedAt',
  'UpdatedAt'
];

async function main() {
  const client = new MongoClient(URI);
  try {
    await client.connect();
    console.log('Connected to MongoDB.');
    const db = client.db(DB_NAME);
    const usersCol = db.collection('applicationUsers');

    // 1. Pre-migration state
    const totalUsersWithSp = await usersCol.countDocuments({ ServiceProviderProfile: { $ne: null } });
    console.log(`\n=== 1. PRE-MIGRATION AUDIT ===`);
    console.log(`Total users with non-null ServiceProviderProfile: ${totalUsersWithSp}`);

    const fieldCounts = {};
    for (const f of FIELDS_TO_UNSET) {
      const shortName = f.replace('ServiceProviderProfile.', '');
      const count = await usersCol.countDocuments({ [f]: { $exists: true } });
      fieldCounts[shortName] = count;
    }
    console.log('Field occurrences on embedded ServiceProviderProfile:');
    console.table(fieldCounts);

    // 2. Create snapshot
    const timestamp = new Date().toISOString().replace(/[-:T.]/g, '').slice(0, 14);
    const snapshotColName = `applicationUsers_backup_sp_${timestamp}`;
    console.log(`\n=== 2. CREATING SNAPSHOT: ${snapshotColName} ===`);

    const spUsers = await usersCol.find({ ServiceProviderProfile: { $ne: null } }).toArray();
    const backupCol = db.collection(snapshotColName);
    if (spUsers.length > 0) {
      await backupCol.insertMany(spUsers);
    }
    const backupCount = await backupCol.countDocuments();
    console.log(`Snapshot created with ${backupCount} documents.`);
    if (backupCount !== totalUsersWithSp) {
      throw new Error(`Snapshot count mismatch: expected ${totalUsersWithSp}, got ${backupCount}. Aborting.`);
    }

    // 3. Perform idempotent $unset
    console.log(`\n=== 3. EXECUTING IDEMPOTENT $UNSET ===`);
    const unsetObj = {};
    for (const f of FIELDS_TO_UNSET) {
      unsetObj[f] = '';
    }

    const updateResult = await usersCol.updateMany(
      { ServiceProviderProfile: { $ne: null } },
      { $unset: unsetObj }
    );
    console.log(`Matched documents: ${updateResult.matchedCount}`);
    console.log(`Modified documents: ${updateResult.modifiedCount}`);

    // 4. Post-migration verification
    console.log(`\n=== 4. POST-MIGRATION VERIFICATION ===`);
    let lingeringFieldCount = 0;
    for (const f of FIELDS_TO_UNSET) {
      const shortName = f.replace('ServiceProviderProfile.', '');
      const remaining = await usersCol.countDocuments({ [f]: { $exists: true } });
      if (remaining > 0) {
        console.error(`WARNING: ${shortName} still exists in ${remaining} documents!`);
        lingeringFieldCount += remaining;
      }
    }

    if (lingeringFieldCount === 0) {
      console.log('All 15 professional fields successfully unset from ALL documents.');
    } else {
      throw new Error(`Failed to unset all fields: ${lingeringFieldCount} occurrences remaining.`);
    }

    // 5. Verify business fields intact
    console.log(`\n=== 5. VERIFYING BUSINESS FIELDS INTACT ===`);
    const postSpUsers = await usersCol.find({ ServiceProviderProfile: { $ne: null } }).toArray();
    let businessFieldLossCount = 0;

    for (const postUser of postSpUsers) {
      const backupUser = spUsers.find(u => u._id.toString() === postUser._id.toString());
      if (!backupUser) continue;

      const postSp = postUser.ServiceProviderProfile;
      const backupSp = backupUser.ServiceProviderProfile;

      for (const bf of BUSINESS_FIELDS) {
        if (backupSp[bf] !== undefined && postSp[bf] === undefined) {
          console.error(`ERROR: User ${postUser._id} lost business field: ${bf}`);
          businessFieldLossCount++;
        }
      }
    }

    if (businessFieldLossCount === 0) {
      console.log(`CONFIRMED: Zero business fields were removed from any of the ${postSpUsers.length} documents.`);
    } else {
      throw new Error(`Business field loss detected: ${businessFieldLossCount} missing fields!`);
    }

    console.log(`\n=== MIGRATION SUMMARY ===`);
    console.log(`Documents matched: ${updateResult.matchedCount}`);
    console.log(`Documents modified: ${updateResult.modifiedCount}`);
    console.log(`Fields unset: 15 professional fields`);
    console.log(`Snapshot collection: ${snapshotColName}`);
    console.log(`Business fields preserved: ALL (${BUSINESS_FIELDS.length} fields verified)`);
    console.log(`Status: SUCCESS`);

  } finally {
    await client.close();
    console.log('MongoDB connection closed.');
  }
}

main().catch(err => {
  console.error('Migration failed:', err);
  process.exit(1);
});
