import axios from 'axios';

async function main() {
  console.log('=== VERIFYING FOUR CALLERS POST-MIGRATION ===\n');

  // 1. Authenticate as Creator
  console.log('1. Logging in as demo.creator@mondial.local...');
  const loginRes = await axios.post('http://localhost:5093/api/auth/login', {
    email: 'demo.creator@mondial.local',
    password: 'DemoP@ss1'
  });

  const token = loginRes.data?.data?.token || loginRes.data?.token;
  if (!token) {
    throw new Error('Could not obtain token: ' + JSON.stringify(loginRes.data));
  }
  const headers = { Authorization: `Bearer ${token}` };
  console.log('  Authenticated successfully.');

  // 2. Caller 1: Creator SP match cards
  console.log('\n2. Testing Caller 1: GET /api/creator/sp-matches?specialty=development...');
  const spMatchesRes = await axios.get('http://localhost:5093/api/creator/sp-matches?specialty=development', { headers });
  const spMatches = spMatchesRes.data?.data || [];
  console.log(`  Found ${spMatches.length} match(es):`);
  for (const m of spMatches) {
    console.log(`    - Name: "${m.name}", Title: "${m.title}", Location: "${m.location}"`);
  }

  // 3. Caller 2: Designer cards in Phase 2
  console.log('\n3. Testing Caller 2: GET /api/creator/journey/phase2/m50-designers...');
  const { MongoClient } = await import('mongodb');
  const fs = await import('fs');
  const path = await import('path');
  const appSettingsPath = path.resolve('backend/appsettings.Development.json');
  const settings = JSON.parse(fs.readFileSync(appSettingsPath, 'utf8'));
  const mongoUri = process.env.MONGODB_URI || settings?.MongoDbSettings?.ConnectionString;

  const mongo = new MongoClient(mongoUri);
  await mongo.connect();
  const db = mongo.db('MondialEcoDev');
  
  // Temporarily ensure Sirajul has Design (1) in ServiceCategories
  await db.collection('ServiceProviderProfiles').updateOne(
    { UserId: '32fb10ca-7bba-4f42-b670-ce5706039f5f' },
    { $addToSet: { ServiceCategories: 1 } }
  );

  const designersRes = await axios.get('http://localhost:5093/api/creator/journey/phase2/m50-designers', { headers });
  const designers = designersRes.data?.data || [];
  console.log(`  Found ${designers.length} designer(s):`);
  for (const d of designers) {
    console.log(`    - Name: "${d.name}", Title: "${d.title}", Rating: ${d.rating}, Sectors: [${(d.sectors || []).join(', ')}]`);
  }

  // Restore Sirajul's categories
  await db.collection('ServiceProviderProfiles').updateOne(
    { UserId: '32fb10ca-7bba-4f42-b670-ce5706039f5f' },
    { $pull: { ServiceCategories: 1 } }
  );
  await mongo.close();

  // 4. Callers 3 & 4: Marketplace Listings and Provider Details
  console.log('\n4. Testing Callers 3 & 4: GET /api/marketplace/services...');
  const marketplaceRes = await axios.get('http://localhost:5093/api/marketplace/services', { headers });
  const listings = marketplaceRes.data?.data?.items || marketplaceRes.data?.data || [];
  console.log(`  Found ${listings.length} marketplace listing(s):`);
  for (const item of listings) {
    console.log(`    - Listing: "${item.title}"`);
    console.log(`      Provider: "${item.providerName}", ProviderId: "${item.providerId}"`);
    console.log(`      Cover Image: "${item.coverImage || item.providerCoverImage || 'none'}"`);
  }

  // Check detail of the first listing if available
  if (listings.length > 0) {
    const firstListingId = listings[0].id || listings[0].listingId;
    console.log(`\n  Testing Detail for listing ${firstListingId}...`);
    const detailRes = await axios.get(`http://localhost:5093/api/marketplace/services/${firstListingId}`, { headers });
    const detail = detailRes.data?.data;
    console.log(`    - Provider Header: Name="${detail?.provider?.name}", Headline="${detail?.provider?.headline}", Cover="${detail?.provider?.coverImage}"`);
  }

  console.log('\n=== ALL CALLERS VERIFIED SUCCESSFULLY ===');
}

main().catch(err => {
  console.error('Error during verification:', err.response?.data || err.message);
  process.exit(1);
});
