async function verifyCreatorPathCleanRoute() {
  console.log('--- TESTING CLEAN /for-creators ON LOCALHOST:3000 (NO ID) ---');
  try {
    const res = await fetch('http://localhost:3000/for-creators');
    console.log('Status:', res.status, res.statusText);
    if (!res.ok) {
      console.error('Failed to load /for-creators');
      return;
    }
    const html = await res.text();

    const assertions = [
      { name: 'Creator Path container', pattern: 'data-testid="creator-path-page"' },
      { name: 'Public header bar', pattern: 'data-testid="public-header-bar"' },
      { name: 'Hero Headline', pattern: 'Turn an idea into a project worth building' },
      { name: 'NOVA SPACE Control Card', pattern: 'NOVA SPACE' },
      { name: 'Hero CTA -> /signup', pattern: 'Start Your Creator Journey' },
      { name: 'Raw Idea vs Structured comparison', pattern: 'An idea becomes useful when it becomes structured.' },
      { name: 'Quote banner 1', pattern: 'Mondial does not replace the creator' },
      { name: 'Six Phases Section', pattern: 'Six phases. One project getting stronger.' },
      { name: 'Six phases summary bar', pattern: 'One Project' },
      { name: 'Phase 01 Section', pattern: 'First build trust. Then define the project.' },
      { name: 'Henry profile card & verification', pattern: 'VERIFIED CREATOR BADGE ACTIVE' },
      { name: 'Phase 03 Intelligence', pattern: 'Challenge the project before building around assumptions.' },
      { name: 'AI Business Plan & Forecast', pattern: 'INTELLIGENCE ACTIVE' },
      { name: 'Phase 04 Resource Setup', pattern: 'Know what the project needs before choosing what happens next.' },
      { name: 'Resource Needs & Skills Gaps', pattern: 'RESOURCE NEEDS' },
      { name: 'Phase 05 Three Paths', pattern: 'One project. Three ways forward.' },
      { name: 'Full Buyout Section', pattern: 'AVAILABLE FOR FULL BUYOUT' },
      { name: 'Co-founder Match Alex Martin', pattern: 'Alex Martin' },
      { name: 'Become the Entrepreneur checklist', pattern: 'BECOME THE ENTREPRENEUR' },
      { name: 'The Mondial Difference hub', pattern: 'Build once. Strengthen continuously.' },
      { name: 'Level Up Section', pattern: 'Do not restart when the project becomes a company.' },
      { name: 'Creator Path Stepper (6 steps)', pattern: 'From idea to your next move.' },
      { name: 'FAQ Accordion', pattern: 'Questions before you start?' },
      { name: 'Final CTA', pattern: 'Your idea does not need to be finished.' },
      { name: 'Footer present', pattern: 'data-testid="public-footer"' },
    ];

    let allPassed = true;
    for (const a of assertions) {
      const passed = html.includes(a.pattern);
      console.log(`${passed ? '✓' : '✗'} ${a.name}: ${passed ? 'PASS' : 'FAIL'}`);
      if (!passed) allPassed = false;
    }

    // Ensure no section id anchors
    const noIdAssertions = [
      { name: 'No id="phases"', condition: !html.includes('id="phases"') },
      { name: 'No id="phase-1"', condition: !html.includes('id="phase-1"') },
      { name: 'No id="concept"', condition: !html.includes('id="concept"') },
      { name: 'No id="branding"', condition: !html.includes('id="branding"') },
    ];

    console.log('\n--- VERIFYING NO ID FRAGMENTS ---');
    for (const n of noIdAssertions) {
      console.log(`${n.condition ? '✓' : '✗'} ${n.name}: ${n.condition ? 'PASS' : 'FAIL'}`);
      if (!n.condition) allPassed = false;
    }

    if (allPassed) {
      console.log('\n🎉 ALL CHECKS PASSED: /for-creators is clean without id fragments!');
    } else {
      console.error('\n⚠️ Some checks failed.');
    }
  } catch (err) {
    console.error('Error during verification:', err);
  }
}

verifyCreatorPathCleanRoute();
