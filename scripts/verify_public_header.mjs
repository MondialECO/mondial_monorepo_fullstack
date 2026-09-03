async function verifyPublicHeader() {
  console.log('--- TESTING PUBLIC HEADER ON LOCALHOST:3000 ---');
  try {
    const res = await fetch('http://localhost:3000/');
    if (!res.ok) {
      console.error('Failed to fetch homepage:', res.status, res.statusText);
      return;
    }
    const html = await res.text();

    const assertions = [
      { name: 'Public header bar', pattern: 'data-testid="public-header-bar"' },
      { name: 'Creators menu trigger', pattern: 'Creators' },
      { name: 'Entrepreneurs menu trigger', pattern: 'Entrepreneurs' },
      { name: 'Providers menu trigger', pattern: 'Providers' },
      { name: 'Investors menu trigger', pattern: 'Investors' },
      { name: 'Marketplace direct link', pattern: 'Marketplace' },
      { name: 'Pricing direct link', pattern: 'Pricing' },
      { name: 'Resources link', pattern: 'Resources' },
      { name: 'Login CTA button', pattern: 'Login' },
      { name: 'Get Started CTA button', pattern: 'Get Started' },
      { name: 'Brand logo present', pattern: 'brand-logo-footer.png' },
    ];

    let allPassed = true;
    for (const a of assertions) {
      const passed = html.includes(a.pattern);
      console.log(`${passed ? '✓' : '✗'} ${a.name}: ${passed ? 'PASS' : 'FAIL'}`);
      if (!passed) allPassed = false;
    }

    if (allPassed) {
      console.log('\n🎉 ALL PUBLIC HEADER VERIFICATION CHECKS PASSED!');
    } else {
      console.error('\n⚠️ Some header checks failed.');
    }
  } catch (err) {
    console.error('Error during verification:', err);
  }
}

verifyPublicHeader();
