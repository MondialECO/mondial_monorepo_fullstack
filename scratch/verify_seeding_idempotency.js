const http = require('http');

const BASE_URL = 'http://localhost:5093';

function request(options, data = null) {
  return new Promise((resolve, reject) => {
    const url = new URL(options.path, BASE_URL);
    const reqOptions = {
      hostname: url.hostname,
      port: url.port,
      path: url.pathname + url.search,
      method: options.method || 'GET',
      headers: {
        'Content-Type': 'application/json',
        ...(options.headers || {})
      }
    };

    const req = http.request(reqOptions, (res) => {
      let body = '';
      res.on('data', chunk => body += chunk);
      res.on('end', () => {
        let parsed = null;
        try {
          parsed = body ? JSON.parse(body) : null;
        } catch (e) {
          parsed = body;
        }
        resolve({
          statusCode: res.statusCode,
          headers: res.headers,
          data: parsed
        });
      });
    });

    req.on('error', reject);
    if (data) {
      req.write(typeof data === 'string' ? data : JSON.stringify(data));
    }
    req.end();
  });
}

async function main() {
  console.log('--- Idempotency & Role State Verification ---');
  const superLogin = await request({ method: 'POST', path: '/api/auth/login' }, {
    email: 'demo.superadmin@mondial.local',
    password: 'DemoP@ss1'
  });
  const superToken = superLogin.data?.data?.token || superLogin.data?.token;
  const superHeaders = { 'Authorization': `Bearer ${superToken}` };

  const adminSearch = await request({ path: `/api/admin/users?search=${encodeURIComponent('demo.admin@mondial.local')}`, headers: superHeaders });
  const adminItems = adminSearch.data?.items || adminSearch.data?.data?.items || [];

  const superSearch = await request({ path: `/api/admin/users?search=${encodeURIComponent('demo.superadmin@mondial.local')}`, headers: superHeaders });
  const superItems = superSearch.data?.items || superSearch.data?.data?.items || [];

  console.log(`  demo.admin matches: ${adminItems.length}, roles: [${adminItems[0]?.roles?.join(', ')}]`);
  console.log(`  demo.superadmin matches: ${superItems.length}, roles: [${superItems[0]?.roles?.join(', ')}]`);

  if (adminItems.length !== 1 || superItems.length !== 1) {
    console.error('Duplicate users detected!');
    process.exit(1);
  }

  if (adminItems[0].roles.includes('SuperAdmin') || !adminItems[0].roles.includes('Admin')) {
    console.error('demo.admin roles invalid!');
    process.exit(1);
  }

  if (superItems[0].roles.includes('Admin') || !superItems[0].roles.includes('SuperAdmin')) {
    console.error('demo.superadmin roles invalid!');
    process.exit(1);
  }

  console.log('Idempotency check PASSED cleanly.');
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
