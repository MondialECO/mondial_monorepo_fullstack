import axios from 'axios';

async function checkBackend() {
  console.log('Connecting to backend at http://localhost:5093/api...');
  
  // Login to get cookie/token
  const loginRes = await axios.post('http://localhost:5093/api/auth/login', {
    email: 'demo.creator@mondial.local',
    password: 'DemoP@ss1'
  }, { withCredentials: true });

  const cookie = loginRes.headers['set-cookie'];
  const token = loginRes.data?.data?.token || loginRes.data?.token;
  console.log('Login success. Token:', token ? 'Bearer present' : 'None', 'Cookies:', cookie ? cookie.length : 0);

  const headers = {};
  if (token) headers['Authorization'] = `Bearer ${token}`;
  if (cookie) headers['Cookie'] = cookie.join('; ');

  // 1. Get journey
  const journeyRes = await axios.get('http://localhost:5093/api/creator/journey', { headers });
  const activeIdeaId = journeyRes.data?.data?.journey?.activeIdeaId;
  console.log('Active idea ID:', activeIdeaId);

  // 2. Get brand kit
  const brandKitRes = await axios.get('http://localhost:5093/api/creator/journey/phase2/brand-kit', {
    headers,
    params: activeIdeaId ? { ideaId: activeIdeaId } : {}
  });

  const kit = brandKitRes.data?.data;
  console.log('\n=== REAL BRAND KIT OBJECT ===');
  console.log('Brand Name:', kit?.strategy?.businessName || kit?.strategy?.nameDisplayForm);
  console.log('Status:', kit?.status);
  console.log('Version:', kit?.version);
  console.log('Selected Concept Key:', kit?.logo?.selectedConceptKey);
  console.log('Concepts:', kit?.logo?.concepts?.map(c => ({
    key: c.key,
    markAssetUri: c.markAssetUri,
    lockupAssetUri: c.lockupAssetUri
  })));
  console.log('Variations in kit.logo.variations:', JSON.stringify(kit?.logo?.variations, null, 2));

  // 3. Test fetching each asset URI
  console.log('\n=== TESTING ASSET URI FETCHES ===');
  const testUris = [];
  if (kit?.logo?.concepts) {
    for (const c of kit.logo.concepts) {
      if (c.markAssetUri) testUris.push({ label: `concept-${c.key}-mark`, uri: c.markAssetUri });
      if (c.lockupAssetUri) testUris.push({ label: `concept-${c.key}-lockup`, uri: c.lockupAssetUri });
    }
  }
  if (kit?.logo?.variations) {
    for (const [k, v] of Object.entries(kit.logo.variations)) {
      if (v.svgUri) testUris.push({ label: `variation-${k}-svg`, uri: v.svgUri });
      if (v.pngUri) testUris.push({ label: `variation-${k}-png`, uri: v.pngUri });
    }
  }

  for (const item of testUris) {
    console.log(`\nTesting ${item.label} (raw uri: "${item.uri}"):`);
    
    // Test 1: Fetching raw uri
    try {
      const res = await axios.get(item.uri);
      console.log(`  [Direct Raw URI] Status: ${res.status}, Type: ${res.headers['content-type']}, Length: ${res.data?.length}`);
    } catch (e) {
      console.log(`  [Direct Raw URI] Failed: ${e.message} (status: ${e.response?.status})`);
    }

    // Test 2: Fetching with http://localhost:5093
    const url5093 = item.uri.startsWith('http') ? item.uri : `http://localhost:5093${item.uri.startsWith('/') ? '' : '/'}${item.uri}`;
    try {
      const res = await axios.get(url5093);
      console.log(`  [http://localhost:5093] Status: ${res.status}, Type: ${res.headers['content-type']}, Length: ${res.data?.length}`);
      if (typeof res.data === 'string' && res.data.includes('<svg')) {
        console.log(`  [http://localhost:5093] Valid SVG content found! Starts with: ${res.data.slice(0, 50)}...`);
      }
    } catch (e) {
      console.log(`  [http://localhost:5093] Failed: ${e.message} (status: ${e.response?.status})`);
    }

    // Test 3: Fetching with http://localhost:3000
    const url3000 = item.uri.startsWith('http') ? item.uri : `http://localhost:3000${item.uri.startsWith('/') ? '' : '/'}${item.uri}`;
    try {
      const res = await axios.get(url3000);
      console.log(`  [http://localhost:3000] Status: ${res.status}, Type: ${res.headers['content-type']}, Length: ${res.data?.length}`);
    } catch (e) {
      console.log(`  [http://localhost:3000] Failed: ${e.message} (status: ${e.response?.status})`);
    }
  }
}

checkBackend().catch(console.error);
