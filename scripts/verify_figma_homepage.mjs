async function verifyFigmaHomepage() {
  console.log('Testing http://localhost:3000/ ...');
  try {
    const res = await fetch('http://localhost:3000/');
    console.log('Status:', res.status, res.statusText);
    if (res.status !== 200) {
      console.error('Failed to load homepage');
      return;
    }
    const html = await res.text();

    const checks = [
      { name: 'Navbar Mondial.eco', pattern: 'Mondial.eco' },
      { name: 'Section 1 (Hero Title)', pattern: 'guided path from raw idea to funded company' },
      { name: 'Section 1 (Role Cards)', pattern: 'Turn an idea into proof.' },
      { name: 'Section 2 (System in numbers)', pattern: 'Structure you can count.' },
      { name: 'Section 2 (Transparency card)', pattern: 'No user counts here.' },
      { name: 'Section 3 (Pain Points)', pattern: 'fail at ideas. They fail at proof.' },
      { name: 'Section 4 (Before/After)', pattern: 'Without Mondial &amp; With Mondial' },
      { name: 'Section 5 (Inside product)', pattern: 'Connecting creators, founders, providers and investors' },
      { name: 'Section 6 (Service Providers)', pattern: 'Scope · Deliver · Get paid' },
      { name: 'Section 7 (Why Mondial)', pattern: 'One path. Four roles. Nothing skipped.' },
      { name: 'Section 8 (Legal Roadmap)', pattern: 'Legal wired into every phase — not bolted on at the end.' },
      { name: 'Section 9 (Alpha Status)', pattern: 'closed alpha. Here' },
      { name: 'Section 10 (Role Gateway)', pattern: 'Ready to build the proof, not the pitch?' },
      { name: 'Section 11 (Newsletter)', pattern: 'The Mondial Brief' },
      { name: 'Footer (Locked)', pattern: 'data-testid="public-footer"' },
    ];

    console.log('\n--- VERIFYING HOMEPAGE SECTIONS ---');
    let allPassed = true;
    for (const c of checks) {
      const passed = html.includes(c.pattern);
      console.log(`${passed ? '✓' : '✗'} ${c.name}: ${passed ? 'PASS' : 'FAIL'}`);
      if (!passed) allPassed = false;
    }

    if (allPassed) {
      console.log('\n🎉 ALL 11 HOMEPAGE SECTIONS + NAVBAR + FOOTER VERIFIED SUCCESSFULLY!');
    } else {
      console.error('\n⚠️ Some section checks failed.');
    }
  } catch (err) {
    console.error('Fetch error:', err.message);
  }
}

verifyFigmaHomepage();
