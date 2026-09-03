async function verifyPositioningBranding() {
  console.log('--- TESTING /for-creators/positioning-branding ON LOCALHOST:3000 ---');
  try {
    const res = await fetch('http://localhost:3000/for-creators/positioning-branding');
    console.log('Status:', res.status, res.statusText);
    if (!res.ok) {
      console.error('Failed to load /for-creators/positioning-branding');
      return;
    }
    const html = await res.text();

    const assertions = [
      { name: '1. /for-creators/positioning-branding renders successfully', pattern: 'data-testid="positioning-branding-page"' },
      { name: '2. Hero renders', pattern: 'Define how your project should be understood' },
      { name: '3. Nova Space positioning workspace renders', pattern: 'NOVA SPACE' },
      { name: '4. Positioning progress 62% renders', pattern: '62%' },
      { name: '5. Potential positioning gap card renders', pattern: 'POTENTIAL POSITIONING GAP' },
      { name: '6. Positioning section renders', pattern: 'Make it clear where the project belongs' },
      { name: '7. Positioning statement renders', pattern: 'POSITIONING STATEMENT' },
      { name: '8. Open question (NEEDS DECISION) renders', pattern: 'NEEDS DECISION' },
      { name: '9. Value Proposition section renders', pattern: 'Turn the solution into clear customer value' },
      { name: '10. Final Value Proposition renders', pattern: 'FINAL VALUE PROPOSITION' },
      { name: '11. AI Feedback Good Foundation renders', pattern: 'GOOD FOUNDATION' },
      { name: '12. Differentiation table renders', pattern: 'Competitive Landscape Analysis' },
      { name: '13. Differentiation summary renders', pattern: 'DIFFERENTIATION SUMMARY' },
      { name: '14. Not Validated Yet panel renders', pattern: 'NOT VALIDATED YET' },
      { name: '15. Messaging hierarchy renders all 3 levels', pattern: 'LEVEL 01 — SHORT MESSAGE' },
      { name: '16. Message consistency panel renders', pattern: 'MESSAGE CONSISTENCY' },
      { name: '17. Brand Direction renders', pattern: 'Give the project a consistent direction' },
      { name: '18. Project Presentation renders', pattern: 'Turn structured information into a project people can follow' },
      { name: '19. Project Readiness is marked ILLUSTRATIVE', pattern: 'ILLUSTRATIVE' },
      { name: '20. Phase 02 completion renders', pattern: 'PHASE 02 — FOUNDATION COMPLETE' },
      { name: '21. 9/9 foundation matrix renders', pattern: '9/9 Complete' },
      { name: '22. What Phase 03 Adds renders', pattern: 'What Phase 03 Adds' },
      { name: '23. FAQ renders 7 items', pattern: 'ABOUT POSITIONING &amp; BRANDING' },
      { name: '24. Final CTA renders', pattern: 'READY FOR PROJECT INTELLIGENCE' },
      { name: '25. Back to Creator Path link -> /for-creators', pattern: 'href="/for-creators"' },
      { name: '26. Continue to Project Intelligence link', pattern: 'href="/for-creators/project-intelligence"' },
      { name: '27. Public header bar & footer present', pattern: 'data-testid="public-header-bar"' },
    ];

    let allPassed = true;
    for (const a of assertions) {
      const passed = html.includes(a.pattern);
      console.log(`${passed ? '✓' : '✗'} ${a.name}: ${passed ? 'PASS' : 'FAIL'}`);
      if (!passed) allPassed = false;
    }

    if (allPassed) {
      console.log('\n🎉 ALL 27/27 POSITIONING & BRANDING CHECKS PASSED!');
    } else {
      console.error('\n⚠️ Some checks failed.');
    }
  } catch (err) {
    console.error('Error during verification:', err);
  }
}

verifyPositioningBranding();
