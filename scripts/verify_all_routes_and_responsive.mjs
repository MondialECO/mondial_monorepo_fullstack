import fetch from 'node-fetch';

async function runFullVerification() {
  console.log('--- COMPREHENSIVE ROUTE & RESPONSIVE VALIDATION ---');
  
  const routes = [
    { path: '/', name: 'Homepage (Figma Locked)' },
    { path: '/for-creators', name: 'Creator Path' },
    { path: '/for-creators/identity-verification', name: 'Identity & Verification' },
    { path: '/for-creators/project-identity-concept', name: 'Project Identity & Concept' },
    { path: '/for-creators/positioning-branding', name: 'Positioning & Branding' },
    { path: '/for-entrepreneurs', name: 'Company & Verification' },
    { path: '/for-entrepreneurs/build-execute', name: 'Build & Execute' },
    { path: '/for-entrepreneurs/equity-readiness', name: 'Equity & Readiness' },
    { path: '/for-entrepreneurs/funding-deals', name: 'Funding & Deals' },
    { path: '/for-service-providers', name: 'Service Provider Verify & Profile' },
    { path: '/for-service-providers/service-opportunities', name: 'Service Provider Services & Opportunities' },
    { path: '/for-service-providers/project-delivery', name: 'Service Provider Project & Delivery' },
    { path: '/for-service-providers/earnings-growth', name: 'Service Provider Earnings & Growth' },
    { path: '/for-investors', name: 'Investor Profile & Thesis' },
    { path: '/for-investors/discover-match', name: 'Investor Discover & Match' },
    { path: '/for-investors/diligence-invest', name: 'Investor Diligence & Invest' },
    { path: '/for-investors/pipeline-portfolio', name: 'Investor Pipeline & Portfolio' },
    { path: '/login', name: 'Login' },
    { path: '/signup', name: 'Signup' },
    { path: '/onboarding', name: 'Onboarding' },
    { path: '/marketplace/services', name: 'Marketplace Services' },
    { path: '/mondial-marketplace', name: 'Public Mondial Marketplace' },
    { path: '/pricing', name: 'Public Pricing' },
  ];

  let allOk = true;

  for (const r of routes) {
    try {
      const res = await fetch(`http://localhost:3000${r.path}`);
      console.log(`Route ${r.path} (${r.name}): status ${res.status} ${res.statusText}`);
      if (!res.ok) {
        allOk = false;
      }
    } catch (err) {
      console.error(`Route ${r.path} error:`, err.message);
      allOk = false;
    }
  }

  if (allOk) {
    console.log('\n🎉 ALL PUBLIC AND LOCKED ROUTES RESPOND WITH 200 OK!');
  } else {
    console.error('\n⚠️ Some routes failed.');
  }
}

runFullVerification();
