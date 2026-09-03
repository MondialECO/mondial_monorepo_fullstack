async function checkRegressions() {
  const routes = [
    '/login',
    '/signup',
    '/signup/role',
    '/forgot-password',
    '/onboarding',
    '/marketplace/services',
  ];

  for (const r of routes) {
    try {
      const res = await fetch(`http://localhost:3000${r}`);
      console.log(`Route ${r}: status ${res.status} ${res.statusText}`);
      const text = await res.text();
      const hasFooter = text.includes('data-testid="public-footer"');
      if (hasFooter) {
        console.warn(`⚠️ Warning: Public footer unexpectedly present on ${r}`);
      } else {
        console.log(`✓ Route ${r} correctly isolated (no public footer)`);
      }
    } catch (e) {
      console.error(`Error fetching ${r}:`, e.message);
    }
  }
}

checkRegressions();
